"""Headroom token generator.

Single source of truth for Stage 1 colour. Builds OKLCH ramps, maps semantic
tokens for light and dark, measures WCAG 2.x contrast for every declared
pairing, and fails loudly if any pairing misses its target.

Outputs:
  tokens/tokens.json            W3C design-token format (Figma-variable paths)
  tokens/contrast-report.json   every measured pairing
  site/index.html               spec site with tokens injected
"""
import json, math, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- colour math
def oklch_to_srgb(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s_ = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    lin = (
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
    )
    return lin

def in_gamut(lin):
    return all(-1e-4 <= c <= 1 + 1e-4 for c in lin)

def encode(c):
    c = min(max(c, 0.0), 1.0)
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055

def to_hex(L, C, h):
    while C > 0 and not in_gamut(oklch_to_srgb(L, C, h)):
        C -= 0.002  # reduce chroma until the colour fits sRGB
    r, g, b = (round(encode(c) * 255) for c in oklch_to_srgb(L, C, h))
    return f"#{r:02X}{g:02X}{b:02X}"

def luminance(hex_):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (int(hex_[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return round((la + 0.05) / (lb + 0.05), 2)

# ---------------------------------------------------------------- primitives
STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
LIGHTNESS = [0.975, 0.945, 0.895, 0.83, 0.735, 0.635, 0.545, 0.455, 0.365, 0.275]
CHROMA_SHAPE = [0.14, 0.26, 0.46, 0.7, 0.9, 1.0, 1.0, 0.9, 0.76, 0.6]

# hue (OKLCH degrees), peak chroma, role
RAMPS = {
    "blue":    (258, 0.185, "Brand. Clearance blue: actions, focus, the today marker, headroom fill."),
    "neutral": (250, 0.022, "Greys and blacks with a faint blue cast, for text, surfaces and borders."),
    "yellow":  (70,  0.15,  "Saffron yellow. Warnings and near-limit only."),
    "red":     (22,  0.17,  "Over-limit, errors and destructive actions."),
    "green":   (150, 0.15,  "Income and success."),
    "teal":    (200, 0.11,  "Savings and goals."),
}
FAMILY = {"blue": "Blue", "neutral": "Neutral", "yellow": "Yellow", "red": "Red", "green": "Green", "teal": "Teal"}
# Every stop has a human name. Names are stable aliases for people; the numeric path stays the contract for code.
TONE = {"50": "Faint", "100": "Pale", "200": "Light", "300": "Soft", "400": "Medium", "500": "True",
        "600": "Strong", "700": "Deep", "800": "Dark", "900": "Darkest"}
NEUTRAL_TONE = {"0": "White", "50": "Off-White", "100": "Mist", "200": "Light Grey", "300": "Silver", "400": "Mid Grey",
                "500": "Grey", "600": "Dark Grey", "700": "Graphite", "800": "Charcoal", "900": "Light Black",
                "950": "Black", "1000": "Deep Black"}
def color_name(ramp, stop):
    return f"{FAMILY[ramp]} {(NEUTRAL_TONE if ramp == 'neutral' else TONE)[stop]}"

primitives = {}
for name, (hue, peak, _) in RAMPS.items():
    ramp = {}
    for stop, L, shape in zip(STOPS, LIGHTNESS, CHROMA_SHAPE):
        C = peak * shape
        if name == "neutral":
            C = 0.006 + 0.016 * shape  # neutrals keep a faint sky cast
        ramp[str(stop)] = to_hex(L, C, hue)
    primitives[name] = ramp

# Neutral needs both ends beyond 50/900: pure white for raised light surfaces,
# and a deep ground for dark mode (900 is too light to be a night canvas).
primitives["neutral"]["0"] = "#FFFFFF"
primitives["neutral"]["950"] = to_hex(0.19, 0.016, 250)
primitives["neutral"]["1000"] = to_hex(0.145, 0.012, 250)
primitives["neutral"] = {k: primitives["neutral"][k] for k in ["0"] + [str(s) for s in STOPS] + ["950", "1000"]}

P = lambda ref: primitives[ref.split("/")[0]][ref.split("/")[1]]

# ---------------------------------------------------------------- semantics
# (figma path, light ref, dark ref, usage)
SEMANTIC = [
    # surfaces
    ("color/surface/canvas",     "neutral/50",   "neutral/1000", "App background behind everything; the open sky."),
    ("color/surface/default",    "neutral/0",    "neutral/950",  "Default surface for lists, screens and sheets."),
    ("color/surface/raised",     "neutral/0",    "neutral/900",  "Cards, popovers and sheets lifted above default. In dark mode, raised is lighter (tonal elevation)."),
    ("color/surface/sunken",     "neutral/100",  "neutral/1000", "Inputs, wells and segmented-control tracks."),
    ("color/surface/inverse",    "neutral/900",  "neutral/50",   "Snackbars and tooltips."),
    # borders
    ("color/border/subtle",      "neutral/200",  "neutral/800",  "Dividers between list rows. Decorative; no contrast requirement."),
    ("color/border/default",     "neutral/600",  "neutral/500",  "Input outlines, checkbox and radio rings. Must reach 3:1 (UI component)."),
    ("color/border/focus",       "blue/600",    "blue/300",    "2px focus ring on every interactive element."),
    # text
    ("color/text/primary",       "neutral/900",  "neutral/50",   "Headings, body, amounts."),
    ("color/text/secondary",     "neutral/700",  "neutral/300",  "Supporting text, dates, metadata."),
    ("color/text/disabled",      "neutral/400",  "neutral/600",  "Disabled labels. Exempt from WCAG contrast; never the only signal of state."),
    ("color/text/inverse",       "neutral/50",   "neutral/900",  "Text on surface/inverse."),
    ("color/text/link",          "blue/600",    "blue/300",    "Inline links; always underlined."),
    # actions
    ("color/action/primary",         "blue/600", "blue/300", "Primary button fill, selected tab, active nav item."),
    ("color/action/primary-hover",   "blue/700", "blue/200", "Hover (web) on primary fills."),
    ("color/action/primary-pressed", "blue/800", "blue/100", "Pressed state on primary fills."),
    ("color/action/on-primary",      "neutral/0", "neutral/1000", "Text and icons on action/primary."),
    ("color/action/secondary",       "blue/100", "blue/900", "Tonal button fill and selected chip background. One step darker than the canvas so its edge is visible."),
    ("color/action/on-secondary",    "blue/700", "blue/100", "Text on action/secondary."),
    ("color/action/on-inverse",      "blue/300", "blue/700", "Action text on surface/inverse: the Undo in a snackbar."),
    # status
    ("color/status/success",     "green/700",   "green/300",   "Success text and icons."),
    ("color/status/success-bg",  "green/50",    "green/900",   "Success alert and badge background."),
    ("color/status/warning",     "yellow/800", "yellow/300", "Warning text and icons."),
    ("color/status/warning-bg",  "yellow/100", "yellow/900", "Warning alert and badge background."),
    ("color/status/danger",      "red/700",  "red/300",  "Error text, destructive actions."),
    ("color/status/danger-bg",   "red/50",   "red/900",  "Error alert background."),
    ("color/status/info",        "blue/700",    "blue/200",    "Informational text and icons."),
    ("color/status/info-bg",     "blue/50",     "blue/900",    "Informational alert background."),
    # finance
    ("color/finance/income",        "green/700",   "green/300",   "Money in. Always paired with a + sign."),
    ("color/finance/expense",       "neutral/900",  "neutral/50",   "Money out. Neutral ink, never red, with a − sign. Spending is normal, not a failure."),
    ("color/finance/over-budget",   "red/700",  "red/300",  "Amount past a limit. Paired with a ▲ icon and the word 'over'."),
    ("color/finance/near-limit",    "yellow/800", "yellow/300", "At 80% of a limit or more. Paired with an icon and 'close to limit'."),
    ("color/finance/savings",       "teal/700", "teal/300", "Money set aside for goals."),
    ("color/finance/neutral-change","neutral/700",  "neutral/300",  "No change month on month. Paired with '±0' or 'same as last month'."),
    ("color/finance/headroom",      "blue/100",    "blue/900",    "Signature: the open space left under a limit."),
    ("color/finance/spent",         "blue/300",    "blue/700",    "Signature: the filled base of a clearance gauge."),
    ("color/finance/clearance-line","neutral/900",  "neutral/100",  "Signature: the 2px dashed limit line."),
    ("color/finance/over-fill",     "red/400",  "red/700",  "Gauge fill past the clearance line."),
    ("color/finance/near-fill",     "yellow/300", "yellow/600", "Gauge fill at 80% of a limit or more."),
    ("color/finance/savings-fill",  "teal/300", "teal/700", "Savings goal progress fill."),
]

# (foreground token, background token, kind) kind: text (4.5), large (3), ui (3)
PAIRS = []
for bg in ["color/surface/canvas", "color/surface/default", "color/surface/raised"]:
    for fg in ["color/text/primary", "color/text/secondary", "color/text/link",
               "color/status/success", "color/status/warning", "color/status/danger", "color/status/info",
               "color/finance/income", "color/finance/expense", "color/finance/over-budget",
               "color/finance/near-limit", "color/finance/savings", "color/finance/neutral-change"]:
        PAIRS.append((fg, bg, "text"))
    PAIRS.append(("color/border/default", bg, "ui"))
    PAIRS.append(("color/border/focus", bg, "ui"))
    PAIRS.append(("color/action/primary", bg, "ui"))
    PAIRS.append(("color/finance/clearance-line", bg, "ui"))
PAIRS += [
    ("color/text/primary", "color/surface/sunken", "text"),
    ("color/text/secondary", "color/surface/sunken", "text"),
    ("color/border/default", "color/surface/sunken", "ui"),
    ("color/action/on-primary", "color/action/primary", "text"),
    ("color/action/on-primary", "color/action/primary-hover", "text"),
    ("color/action/on-primary", "color/action/primary-pressed", "text"),
    ("color/action/on-secondary", "color/action/secondary", "text"),
    ("color/action/on-inverse", "color/surface/inverse", "text"),
    ("color/action/on-primary", "color/status/danger", "text"),
    ("color/text/inverse", "color/surface/inverse", "text"),
    ("color/status/success", "color/status/success-bg", "text"),
    ("color/status/warning", "color/status/warning-bg", "text"),
    ("color/status/danger", "color/status/danger-bg", "text"),
    ("color/status/info", "color/status/info-bg", "text"),
    ("color/text/primary", "color/finance/headroom", "text"),
    ("color/text/secondary", "color/finance/headroom", "text"),
    ("color/text/primary", "color/finance/spent", "text"),
    ("color/text/primary", "color/finance/near-fill", "text"),
    ("color/text/primary", "color/finance/over-fill", "text"),
    ("color/finance/clearance-line", "color/finance/headroom", "ui"),
    ("color/finance/clearance-line", "color/finance/spent", "ui"),
]

# Stage 2: categorical chart palette. Ordered so neighbours differ in both hue
# and lightness; 'Other' is always neutral. Each must reach 3:1 (graphical object).
CHART = [
    ("color/chart/1", "blue/500",    "blue/400",    "Chart series 1 (largest category)."),
    ("color/chart/2", "teal/600", "teal/400", "Chart series 2."),
    ("color/chart/3", "yellow/500", "yellow/300", "Chart series 3."),
    ("color/chart/4", "red/500",  "red/400",  "Chart series 4."),
    ("color/chart/5", "green/600",   "green/400",   "Chart series 5."),
    ("color/chart/other", "neutral/500", "neutral/500", "'Other' bucket; always last, always neutral."),
]
SEMANTIC += CHART
for path, *_ in CHART:
    for bg in ("color/surface/default", "color/surface/raised", "color/surface/canvas"):
        PAIRS.append((path, bg, "ui"))
TARGET = {"text": 4.5, "large": 3.0, "ui": 3.0}

N = lambda ref: color_name(*ref.split("/"))
sem = {path: {"light": P(l), "dark": P(d), "lightRef": l, "darkRef": d, "lightName": N(l), "darkName": N(d), "usage": u}
       for path, l, d, u in SEMANTIC}

report, failures = [], []
for fg, bg, kind in PAIRS:
    for mode in ("light", "dark"):
        r = contrast(sem[fg][mode], sem[bg][mode])
        row = {"fg": fg, "bg": bg, "mode": mode, "kind": kind, "ratio": r,
               "target": TARGET[kind], "pass": r >= TARGET[kind]}
        report.append(row)
        if not row["pass"]:
            failures.append(row)

# ---------------------------------------------------------------- non-colour tokens
TYPE = [
    # figma path, family role, size, line, weight, tracking(em), usage
    ("type/display",      "brand", 40, 44, 700, -0.02, "Onboarding and empty-state headlines. One per screen at most."),
    ("type/title-lg",     "brand", 28, 34, 700, -0.015, "Screen titles (large title on iOS)."),
    ("type/title-md",     "brand", 22, 28, 600, -0.01, "Section headings, sheet titles."),
    ("type/title-sm",     "brand", 18, 24, 600, -0.005, "Card titles, list group headers."),
    ("type/body-lg",      "ui",    17, 24, 400, 0, "Primary reading text on mobile (matches iOS Body)."),
    ("type/body-md",      "ui",    15, 22, 400, 0, "Default body, list subtitles, web body."),
    ("type/body-sm",      "ui",    13, 18, 400, 0, "Helper text, metadata."),
    ("type/label-lg",     "ui",    16, 20, 600, 0, "Buttons, tabs, list titles."),
    ("type/label-md",     "ui",    14, 18, 600, 0.005, "Chips, segmented control, small buttons."),
    ("type/label-sm",     "ui",    12, 16, 600, 0.02, "Badges, nav labels."),
    ("type/caption",      "ui",    12, 16, 400, 0.01, "Chart axes, footnotes. 12 is the floor; nothing smaller ships."),
]
NUMERIC = [
    ("type/amount/hero",    48, 52, 700, -0.02, 100, "The one number that answers 'am I okay?' (headroom on Home)."),
    ("type/amount/lg",      28, 32, 700, -0.01, 100, "Budget and goal totals, balance-card secondary figures."),
    ("type/amount/md",      17, 22, 600, 0, 100, "Transaction row amounts."),
    ("type/amount/sm",      13, 18, 600, 0, 100, "Inline amounts in helper text."),
    ("type/amount/compact", 13, 18, 600, 0, 85, "Chart labels, chips, keypad history: condenses on the width axis instead of shrinking below the 12px floor."),
]
SPACE = [("space/0", 0), ("space/50", 2), ("space/100", 4), ("space/150", 6), ("space/200", 8),
         ("space/300", 12), ("space/400", 16), ("space/500", 20), ("space/600", 24),
         ("space/800", 32), ("space/1000", 40), ("space/1200", 48), ("space/1600", 64), ("space/2000", 80)]
SPACE_USAGE = {
    "space/0": "Flush edges, stacked segments.",
    "space/50": "Hairline offsets, icon-to-badge nudge.",
    "space/100": "Icon to label inside a chip; amount to its sign.",
    "space/150": "Title to subtitle in a list row.",
    "space/200": "Gap between inline controls; chip padding.",
    "space/300": "List row vertical padding; gap between cards in a grid.",
    "space/400": "Screen side margin (mobile); card inner padding.",
    "space/500": "Card inner padding (large); button horizontal padding.",
    "space/600": "Screen side margin (tablet/web); gap between groups.",
    "space/800": "Space above a section heading.",
    "space/1000": "Space between major sections.",
    "space/1200": "Empty-state vertical breathing room.",
    "space/1600": "Web dashboard section rhythm.",
    "space/2000": "Web landing and onboarding hero breathing room.",
}
RADIUS = [("radius/none", 0, "Full-bleed elements, the clearance line."),
          ("radius/xs", 4, "Badges, progress tracks, chart bars."),
          ("radius/sm", 8, "Chips (square), small buttons, tooltips."),
          ("radius/md", 12, "Inputs, buttons, category icon tiles."),
          ("radius/lg", 16, "Cards, the clearance gauge."),
          ("radius/xl", 24, "Bottom sheet and modal top corners."),
          ("radius/full", 9999, "Avatars, toggles, pill chips, FAB.")]

FONT_FAMILY = [
    # path, iOS, Android, Web, usage
    ("font/family/brand", "Anek Latin", "Anek Latin", "Anek Latin",
     "Display, titles and every amount. The brand lives in the numbers."),
    ("font/family/ui", "SF Pro", "Roboto", "Anek Latin",
     "Body, labels and controls. Native on phones (Dynamic Type, native feel); brand face on web."),
]
FONT_AUDIT = [  # measured with fontTools against the Google Fonts sources
    # name, rupee, tnum, zero, narrow tabular punctuation (None = not tested), verdict
    ("Anek Latin", True, True, True, True, "Chosen. Passes all four tests"),
    ("Schibsted Grotesk", True, True, True, False, "First pick, rejected while building: tabular , and . widen to figure width (543 → 1300 units)"),
    ("Figtree", True, True, False, True, "No slashed zero; soft geometric numerals"),
    ("Geist", True, True, False, True, "No slashed zero; developer-tool association"),
    ("Manrope", True, True, False, True, "No slashed zero; the current Indian-fintech default"),
    ("Bricolage Grotesque", True, True, False, True, "No slashed zero; quirky shapes fight calm"),
    ("Public Sans", True, True, False, False, "No slashed zero; tabular punctuation widens"),
    ("Mukta", True, True, False, True, "No slashed zero; static weights only"),
    ("Albert Sans", True, False, False, None, "No tabular figures"),
    ("Lexend", True, False, True, None, "No tabular figures"),
    ("Wix Madefor Text", True, False, False, None, "No tabular figures"),
    ("Onest", False, True, False, None, "No ₹ glyph"),
    ("Hanken Grotesk", False, False, False, None, "No ₹ glyph, no tabular figures"),
    ("Rethink Sans", False, False, False, None, "No ₹ glyph, no tabular figures"),
    ("Golos Text", False, True, False, None, "No ₹ glyph"),
    ("Red Hat Text", False, True, True, None, "No ₹ glyph"),
    ("Gantari", False, False, False, None, "No ₹ glyph, no tabular figures"),
    ("Sora", False, True, False, None, "No ₹ glyph"),
    ("Urbanist", False, False, False, None, "No ₹ glyph, no tabular figures"),
    ("Instrument Sans", False, True, False, None, "No ₹ glyph"),
]
SHADOW = "7,11,15"  # neutral/1000 as rgb; shadows are tinted with the night ground, never pure black
ELEVATION = [
    ("elevation/0", "none", "none", "Flat: list rows, screen content."),
    ("elevation/1", f"0 1px 2px rgba({SHADOW},.06), 0 2px 8px rgba({SHADOW},.06)",
     "none (surface/raised + border/subtle)", "Cards, balance card, goal cards."),
    ("elevation/2", f"0 2px 4px rgba({SHADOW},.06), 0 8px 24px rgba({SHADOW},.10)",
     f"0 8px 24px rgba(0,0,0,.40)", "Sticky bars on scroll, dropdowns, FAB, tooltips."),
    ("elevation/3", f"0 4px 8px rgba({SHADOW},.08), 0 16px 48px rgba({SHADOW},.16)",
     f"0 16px 48px rgba(0,0,0,.56)", "Bottom sheets, modals (always with color/overlay/scrim)."),
]
OVERLAY = [("color/overlay/scrim", f"rgba({SHADOW},.40)", f"rgba({SHADOW},.64)", "Behind sheets and modals."),
           ("color/overlay/pressed", f"rgba({SHADOW},.08)", "rgba(255,255,255,.10)", "Pressed wash on rows and ghost buttons."),
           ("color/overlay/hover", f"rgba({SHADOW},.04)", "rgba(255,255,255,.06)", "Hover wash (web only).")]
BORDER = [("border/width/hairline", "1px", "Dividers, card outlines in dark mode, input rest state."),
          ("border/width/strong", "2px", "Focus ring, selected chip or radio, error input."),
          ("border/width/clearance", "2px", "Signature clearance line."),
          ("border/dash/clearance", "6 4", "Dash pattern of the clearance line (6px dash, 4px gap).")]
BREAKPOINTS = [("breakpoint/compact", "0–599", 4, 16, 12, "Phones. Bottom nav bar, single column."),
               ("breakpoint/medium", "600–839", 8, 24, 16, "Large phones landscape, small tablets. Bottom nav, two-column cards."),
               ("breakpoint/expanded", "840–1199", 12, 32, 24, "Tablets, small laptops. Navigation rail, list and detail side by side."),
               ("breakpoint/large", "1200+", 12, 40, 24, "Web dashboard. Side navigation, content max width 1200.")]
ICON = [("icon/size/xs", 16, 1.5, "Inline with body-sm and caption; badge glyphs."),
        ("icon/size/sm", 20, 1.5, "Inside category tiles, chips, inputs."),
        ("icon/size/md", 24, 1.75, "Default: nav bar, app bar actions, list leading icons."),
        ("icon/size/lg", 32, 2, "Empty states and onboarding (inside a 64 tile).")]
MOTION_DUR = [("motion/duration/instant", 0, "Reduced-motion replacement for anything spatial."),
              ("motion/duration/fast", 120, "Press feedback, toggles, checkbox ticks, color changes."),
              ("motion/duration/base", 200, "Hover, tab indicator, chip selection, small reveals."),
              ("motion/duration/moderate", 280, "Bottom sheet and modal enter, page push."),
              ("motion/duration/slow", 400, "Gauge and progress fills, chart draw on first view."),
              ("motion/duration/deliberate", 640, "Goal reached. The only celebration, once per goal.")]
MOTION_EASE = [("motion/easing/standard", "cubic-bezier(0.2, 0, 0, 1)", "Most movement within the screen."),
               ("motion/easing/enter", "cubic-bezier(0.05, 0.7, 0.1, 1)", "Things arriving: sheets, toasts, fills."),
               ("motion/easing/exit", "cubic-bezier(0.3, 0, 0.8, 0.15)", "Things leaving: dismissals. Exits run at about 70% of enter duration."),
               ("motion/easing/linear", "linear", "Indeterminate loaders and skeleton shimmer only.")]

out = {
    "$description": "Headroom design tokens, Stage 1. Paths map 1:1 to Figma variables.",
    "fontFamily": [dict(zip(["path", "ios", "android", "web", "usage"], f)) for f in FONT_FAMILY],
    "fontAudit": [dict(zip(["name", "rupee", "tnum", "zero", "punct", "verdict"], f)) for f in FONT_AUDIT],
    "elevation": [dict(zip(["path", "light", "dark", "usage"], e)) for e in ELEVATION],
    "overlay": [dict(zip(["path", "light", "dark", "usage"], e)) for e in OVERLAY],
    "border": [dict(zip(["path", "value", "usage"], b)) for b in BORDER],
    "breakpoints": [dict(zip(["path", "range", "columns", "margin", "gutter", "usage"], b)) for b in BREAKPOINTS],
    "icon": [dict(zip(["path", "size", "stroke", "usage"], i)) for i in ICON],
    "motionDuration": [dict(zip(["path", "value", "usage"], m)) for m in MOTION_DUR],
    "motionEasing": [dict(zip(["path", "value", "usage"], m)) for m in MOTION_EASE],
    "primitives": primitives,
    "rampRoles": {k: v[2] for k, v in RAMPS.items()},
    "rampFamily": FAMILY,
    "primitiveNames": {r: {st: color_name(r, st) for st in stops} for r, stops in primitives.items()},
    "semantic": sem,
    "contrast": report,
    "type": [dict(zip(["path", "family", "size", "line", "weight", "tracking", "usage"], t)) for t in TYPE],
    "numeric": [dict(zip(["path", "size", "line", "weight", "tracking", "width", "usage"], t)) for t in NUMERIC],
    "space": [{"path": p, "value": v, "usage": SPACE_USAGE[p]} for p, v in SPACE],
    "radius": [{"path": p, "value": v, "usage": u} for p, v, u in RADIUS],
}

# W3C DTCG export (what Figma's variable importers and Tokens Studio read)
def nest(target, path, leaf):
    parts = path.split("/")
    for p in parts[:-1]:
        target = target.setdefault(p, {})
    target[parts[-1]] = leaf

dtcg = {"primitive": {}, "light": {}, "dark": {}, "type": {}, "space": {}, "radius": {}}
for ramp, stops in primitives.items():
    for stop, hx in stops.items():
        nest(dtcg["primitive"], f"color/{ramp}/{stop}", {"$type": "color", "$value": hx, "$description": color_name(ramp, stop),
             "$extensions": {"headroom": {"name": color_name(ramp, stop)}}})
for path, v in sem.items():
    for mode in ("light", "dark"):
        ref = v[f"{mode}Ref"].replace("/", ".")
        nest(dtcg[mode], path, {"$type": "color", "$value": "{primitive.color." + ref + "}",
                                 "$description": v["usage"]})
for t in out["type"]:
    nest(dtcg["type"], t["path"], {"$type": "typography", "$value": {
        "fontFamily": "{font.family." + t["family"] + "}", "fontSize": f"{t['size']}px",
        "lineHeight": f"{t['line']}px", "fontWeight": t["weight"], "letterSpacing": f"{t['tracking']}em"},
        "$description": t["usage"]})
for t in out["numeric"]:
    nest(dtcg["type"], t["path"], {"$type": "typography", "$value": {
        "fontFamily": "{font.family.brand}", "fontSize": f"{t['size']}px", "lineHeight": f"{t['line']}px",
        "fontWeight": t["weight"], "letterSpacing": f"{t['tracking']}em", "fontStretch": f"{t['width']}%",
        "fontFeatureSettings": "\"tnum\" 1, \"zero\" 1, \"lnum\" 1"}, "$description": t["usage"]})
for s in out["space"]:
    nest(dtcg["space"], s["path"], {"$type": "dimension", "$value": f"{s['value']}px", "$description": s["usage"]})
for r in out["radius"]:
    nest(dtcg["radius"], r["path"], {"$type": "dimension", "$value": f"{r['value']}px", "$description": r["usage"]})

dtcg["font"] = {}
for f in out["fontFamily"]:
    nest(dtcg["font"], f["path"].removeprefix("font/"), {"$type": "fontFamily", "$value": f["web"],
         "$extensions": {"platform": {"ios": f["ios"], "android": f["android"], "web": f["web"]}},
         "$description": f["usage"]})
dtcg["elevation"] = {}
for e in out["elevation"]:
    nest(dtcg["elevation"], e["path"].removeprefix("elevation/"), {"$type": "shadow",
         "$value": {"light": e["light"], "dark": e["dark"]}, "$description": e["usage"]})
for o in out["overlay"]:
    nest(dtcg["light"], o["path"], {"$type": "color", "$value": o["light"], "$description": o["usage"]})
    nest(dtcg["dark"], o["path"], {"$type": "color", "$value": o["dark"], "$description": o["usage"]})
dtcg["border"] = {}
for b in out["border"]:
    nest(dtcg["border"], b["path"].removeprefix("border/"), {"$type": "dimension", "$value": b["value"], "$description": b["usage"]})
dtcg["icon"] = {}
for i in out["icon"]:
    nest(dtcg["icon"], i["path"].removeprefix("icon/"), {"$type": "dimension", "$value": f"{i['size']}px",
         "$extensions": {"stroke": i["stroke"]}, "$description": i["usage"]})
dtcg["motion"] = {}
for m in out["motionDuration"]:
    nest(dtcg["motion"], m["path"].removeprefix("motion/"), {"$type": "duration", "$value": f"{m['value']}ms", "$description": m["usage"]})
for m in out["motionEasing"]:
    nest(dtcg["motion"], m["path"].removeprefix("motion/"), {"$type": "cubicBezier", "$value": m["value"], "$description": m["usage"]})
import importlib.util
_spec = importlib.util.spec_from_file_location("components_spec", ROOT / "tools" / "components_spec.py")
cs = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(cs)
out["size"] = [{"path": p, "value": v, "usage": u} for p, v, u in cs.SIZE_TOKENS]
out["components"] = cs.COMPONENTS
out["gaps"] = cs.GAPS
out["decisions"] = cs.DECISIONS
dtcg["size"] = {}
for s in out["size"]:
    nest(dtcg["size"], s["path"].removeprefix("size/"), {"$type": "dimension", "$value": f"{s['value']}px", "$description": s["usage"]})

dtcg["breakpoint"] = {}
for b in out["breakpoints"]:
    nest(dtcg["breakpoint"], b["path"].removeprefix("breakpoint/"), {"$type": "dimension", "$value": b["range"],
         "$extensions": {"columns": b["columns"], "margin": b["margin"], "gutter": b["gutter"]}, "$description": b["usage"]})

# ---------------------------------------------------------------- semantic spacing + governance
_sps = importlib.util.spec_from_file_location("spacing_spec", ROOT / "tools" / "spacing_spec.py")
spx = importlib.util.module_from_spec(_sps); _sps.loader.exec_module(spx)
_gvs = importlib.util.spec_from_file_location("governance_spec", ROOT / "tools" / "governance_spec.py")
gv = importlib.util.module_from_spec(_gvs); _gvs.loader.exec_module(gv)
SPACE_PX = dict(SPACE)
out["spacing"] = {
    "groups": [{**g, "tokens": [dict(zip(["path", "ref", "axis", "between", "example"], t), value=SPACE_PX[t[1]]) for t in g["tokens"]]} for g in spx.GROUPS],
    "layout": [dict(zip(["path", *spx.BREAKPOINT_KEYS, "between"], l)) for l in spx.LAYOUT],
    "touch": spx.TOUCH, "safeArea": spx.SAFE_AREA, "density": spx.DENSITY, "rules": spx.RULES, "decisions": spx.DECISIONS,
}
out["governance"] = {k.lower(): getattr(gv, k) for k in ("VERSION", "NAMING", "TIERS", "SEMVER", "DEPRECATION", "CONTRIBUTION", "GATES", "CADENCE", "DECISIONS")}
SEM_SPACE = [t for g in out["spacing"]["groups"] for t in g["tokens"]]
for t in SEM_SPACE:
    nest(dtcg["space"], t["path"], {"$type": "dimension", "$value": "{space." + t["ref"].replace("/", ".") + "}",
         "$description": f"{t['between']}. {t['example']}"})
for l in out["spacing"]["layout"]:
    for bp in spx.BREAKPOINT_KEYS:
        nest(dtcg["space"], f"{l['path']}/{bp}", {"$type": "dimension", "$value": f"{l[bp]}px", "$description": f"{l['between']} ({bp})."})
# Retired names stay resolvable for one major version (see governance: deprecation).
dtcg["deprecated"] = {}
OLD = {"slate": "neutral", "sky": "blue", "leaf": "green", "lagoon": "teal", "signal": "yellow", "coral": "red"}
for old, new in OLD.items():
    for stop in primitives[new]:
        nest(dtcg["deprecated"], f"color/{old}/{stop}", {"$type": "color", "$value": "{primitive.color." + new + "." + stop + "}",
             "$deprecated": f"Renamed in 1.0.0. Use color/{new}/{stop} ({color_name(new, stop)}). Removed in 2.0.0."})
dtcg["$extensions"] = {"headroom": {"version": gv.VERSION}}

(ROOT / "tokens").mkdir(exist_ok=True)
(ROOT / "tokens" / "tokens.json").write_text(json.dumps(dtcg, indent=2, ensure_ascii=False), encoding="utf-8")
(ROOT / "tokens" / "contrast-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

# ---------------------------------------------------------------- markdown
def table(head, rows):
    lines = ["| " + " | ".join(head) + " |", "|" + "---|" * len(head)]
    lines += ["| " + " | ".join(str(c) for c in r) + " |" for r in rows]
    return "\n".join(lines)

def best(fg, kind="text"):
    """Lowest ratio of a text token across the three surfaces, per mode."""
    rows = [r for r in report if r["fg"] == fg and r["bg"].startswith("color/surface/") and r["kind"] == kind]
    lo = lambda m: min((r["ratio"] for r in rows if r["mode"] == m), default=None)
    return lo("light"), lo("dark")

def sem_rows(prefix):
    rows = []
    for path, v in sem.items():
        if not path.startswith(prefix):
            continue
        l, d = best(path)
        if l is None:
            l, d = best(path, "ui")
        ratio = f"{l}:1 / {d}:1" if l else "see pairings"
        rows.append((f"`{path}`", f"**{v['lightName']}**<br>`{v['lightRef']}` `{v['light']}`", f"**{v['darkName']}**<br>`{v['darkRef']}` `{v['dark']}`", ratio, v["usage"]))
    return table(["Token", "Light", "Dark", "Worst contrast L / D", "Usage"], rows)

def by_pair(fgs_bgs):
    rows = []
    for fg, bg in fgs_bgs:
        cells = {r["mode"]: r for r in report if r["fg"] == fg and r["bg"] == bg}
        rows.append((f"`{fg}`", f"`{bg}`", f"{cells['light']['ratio']}:1", f"{cells['dark']['ratio']}:1",
                     f"{cells['light']['target']}:1", "AA ✓" if cells["light"]["pass"] and cells["dark"]["pass"] else "FAIL"))
    return table(["Foreground", "Background", "Light", "Dark", "Target", "Result"], rows)

seen, pair_list = set(), []
for r in report:
    if (r["fg"], r["bg"]) not in seen:
        seen.add((r["fg"], r["bg"])); pair_list.append((r["fg"], r["bg"]))

MD = {
    "primitives": "\n\n".join(f"**{FAMILY[n]}** (`color/{n}`): {RAMPS[n][2]}\n\n" + table(["Token", "Name", "Hex"],
        [(f"`color/{n}/{k}`", color_name(n, k), f"`{hx}`") for k, hx in primitives[n].items()]) for n in primitives),
    "surface": sem_rows("color/surface/") + "\n\n" + sem_rows("color/border/"),
    "text": sem_rows("color/text/"),
    "action": sem_rows("color/action/"),
    "status": sem_rows("color/status/"),
    "finance": sem_rows("color/finance/"),
    "overlay": table(["Token", "Light", "Dark", "Usage"], [(f"`{o['path']}`", f"`{o['light']}`", f"`{o['dark']}`", o["usage"]) for o in out["overlay"]]),
    "pairs": by_pair(pair_list),
    "pairsummary": f"{len(report)} pairings measured ({len(pair_list)} pairs × 2 modes), {len(failures)} below target.",
    "fontfamily": table(["Token", "iOS", "Android", "Web", "Usage"], [(f"`{f['path']}`", f["ios"], f["android"], f["web"], f["usage"]) for f in out["fontFamily"]]),
    "fontaudit": table(["Typeface", "₹ glyph", "Tabular figures", "Slashed zero", "Narrow tabular , .", "Verdict"],
        [(f"**{f['name']}**" if f["verdict"].startswith("Chosen") else f["name"], "✓" if f["rupee"] else "✗", "✓" if f["tnum"] else "✗", "✓" if f["zero"] else "✗",
          "—" if f["punct"] is None else ("✓" if f["punct"] else "✗"), f["verdict"]) for f in out["fontAudit"]]),
    "typescale": table(["Token", "Family", "Size / line", "Weight", "Tracking", "Usage"],
        [(f"`{t['path']}`", f"`font/family/{t['family']}`", f"{t['size']} / {t['line']}", t["weight"], f"{t['tracking']}em", t["usage"]) for t in out["type"]]),
    "numeric": table(["Token", "Size / line", "Weight", "Width", "Tracking", "Features", "Usage"],
        [(f"`{t['path']}`", f"{t['size']} / {t['line']}", t["weight"], f"{t['width']}%", f"{t['tracking']}em", "`tnum` `lnum` `zero`", t["usage"]) for t in out["numeric"]]),
    "space": table(["Token", "Value", "Usage"], [(f"`{s['path']}`", f"{s['value']}px", s["usage"]) for s in out["space"]]),
    "radius": table(["Token", "Value", "Usage"], [(f"`{r['path']}`", f"{r['value']}px" if r['value'] < 9999 else "9999px (pill)", r["usage"]) for r in out["radius"]]),
    "elevation": table(["Token", "Light", "Dark", "Usage"], [(f"`{e['path']}`", f"`{e['light']}`", f"`{e['dark']}`", e["usage"]) for e in out["elevation"]]),
    "border": table(["Token", "Value", "Usage"], [(f"`{b['path']}`", b["value"], b["usage"]) for b in out["border"]]),
    "breakpoints": table(["Token", "Width (px)", "Columns", "Margin", "Gutter", "Usage"],
        [(f"`{b['path']}`", b["range"], b["columns"], b["margin"], b["gutter"], b["usage"]) for b in out["breakpoints"]]),
    "icon": table(["Token", "Size", "Stroke", "Usage"], [(f"`{i['path']}`", f"{i['size']}px", i["stroke"], i["usage"]) for i in out["icon"]]),
    "duration": table(["Token", "Value", "Usage"], [(f"`{m['path']}`", f"{m['value']}ms", m["usage"]) for m in out["motionDuration"]]),
    "easing": table(["Token", "Value", "Usage"], [(f"`{m['path']}`", f"`{m['value']}`", m["usage"]) for m in out["motionEasing"]]),
}
def sp_group_md(g, n):
    return (f"### 3.{n} {g['title']}\n\n{g['intro']}\n\n" +
            table(["Token", "Value", "Axis", "Between", "Example"],
                  [(f"`{t['path']}`", f"{t['value']}px (`{t['ref']}`)", t["axis"], t["between"], t["example"]) for t in g["tokens"]]))
MD["spacing"] = "\n\n".join(sp_group_md(g, i) for i, g in enumerate(out["spacing"]["groups"], 2))
MD["layout"] = table(["Token", "Compact 0–599", "Medium 600–839", "Expanded 840–1199", "Large 1200+", "Between"],
    [(f"`{l['path']}`", *[f"{l[k]}px" for k in spx.BREAKPOINT_KEYS], l["between"]) for l in out["spacing"]["layout"]])
rules_md = lambda rows: "\n".join(f"- **{a}.** {b}" for a, b in rows)
MD["touch"] = rules_md(spx.TOUCH)
MD["safearea"] = rules_md(spx.SAFE_AREA)
MD["density"] = rules_md(spx.DENSITY)
MD["sprules"] = "\n".join(f"{i}. **{a}.** {b}" for i, (a, b) in enumerate(spx.RULES, 1))
MD["spdecisions"] = "\n".join(f"{i}. **{a}.** {b}" for i, (a, b) in enumerate(spx.DECISIONS, 1))
MD["spcount"] = str(len(SEM_SPACE))

GOV_MD = "\n".join([
    f"# Headroom Design System · Governance", "", f"**Current version: {gv.VERSION}.** History and migration maps live in [CHANGELOG.md](../CHANGELOG.md).", "",
    "This is how the system stays coherent for years: how things are named, how changes are versioned, how old tokens are retired, and how new ones get in. Every rule that can be checked by a script is.", "",
    "## 1. Naming", "", rules_md(gv.NAMING), "",
    "## 2. Token tiers", "", table(["Tier", "Holds", "Used in"], gv.TIERS), "",
    "## 3. Versioning (SemVer for tokens)", "", table(["Release", "When", "Example"], gv.SEMVER), "",
    "## 4. Deprecation", "", rules_md(gv.DEPRECATION), "",
    "## 5. Contributing a change", "", rules_md(gv.CONTRIBUTION), "",
    "## 6. Gates every change passes", "", rules_md(gv.GATES), "",
    "## 7. Release cadence", "", rules_md(gv.CADENCE), "",
    "## Decisions to defend in a portfolio review", "", "\n".join(f"{i}. **{a}.** {b}" for i, (a, b) in enumerate(gv.DECISIONS, 1)), "",
    "## Sources", "",
    "- [Atlassian: spacing](https://atlassian.design/foundations/spacing) · [EightShapes: space in design systems](https://medium.com/@nathanacurtis/space-in-design-systems-188bcbae0d62) · [Carbon: spacing](https://carbondesignsystem.com/elements/spacing/overview/)",
    "- [Adobe: naming colours in design systems](https://adobe.design/stories/design-for-scale/naming-colors-in-design-systems) · [Design Tokens Community Group format](https://www.designtokens.org/tr/drafts/format/) · [Semantic Versioning](https://semver.org/)",
    "- [CMS design system: spacing](https://design.cms.gov/foundation/spacing) · [WCAG 2.2: target size (2.5.8)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)", ""])
(ROOT / "docs" / "governance.md").write_text(GOV_MD, encoding="utf-8")
CL = ["# Changelog", "", "Headroom follows [Semantic Versioning](https://semver.org/) for tokens: renames and removals are major, additions are minor, value tweaks that keep contrast are patches. See [docs/governance.md](docs/governance.md).", ""]
for ver, date, summary, items, mig in gv.CHANGELOG:
    CL += [f"## {ver} · {date}", "", summary, ""] + [f"- {i}" for i in items] + [""]
    if mig:
        CL += ["**Migration map** (old paths keep working as `$deprecated` aliases until 2.0.0):", "", table(["Old", "New"], [(f"`{a}`", f"`{b}`") for a, b in mig]), ""]
(ROOT / "CHANGELOG.md").write_text("\n".join(CL), encoding="utf-8")

_gds = importlib.util.spec_from_file_location("guides_spec", ROOT / "tools" / "guides_spec.py")
gd = importlib.util.module_from_spec(_gds); _gds.loader.exec_module(gd)
PLAT = lambda code: " · ".join(n for c, n in (("i", "iOS"), ("a", "Android"), ("w", "Web")) if c in code)
status_rows = [{"name": c["name"], "id": c["id"], "group": c["group"], "status": gd.STATUS[c["id"]][0],
                "platforms": PLAT(gd.STATUS[c["id"]][1]), "since": gd.STATUS[c["id"]][2], "note": gd.STATUS[c["id"]][3]} for c in cs.COMPONENTS]
status_rows += [{"name": n, "id": "", "group": "Proposed", "status": "Proposed", "platforms": PLAT(pl), "since": "—", "note": note} for n, pl, note in gd.PROPOSED]
out["guides"] = {"start": gd.GETTING_STARTED, "lifecycle": gd.LIFECYCLE, "status": status_rows, "choosers": gd.CHOOSERS, "a11y": gd.A11Y, "faq": gd.FAQ}
GUIDES_MD = "\n".join([
    "# Headroom Design System · Guides", "",
    "How to use the system day to day. Modelled on the guides in Razorpay's [Blade](https://blade.razorpay.com/), scaled to one product.", "",
    "## 1. Getting started", "", "### For designers", "", rules_md(gd.GETTING_STARTED["designers"]), "",
    "### For developers", "", rules_md(gd.GETTING_STARTED["developers"]), "",
    "### What's where", "", table(["File", "What it holds"], [(f"`{a}`", b) for a, b in gd.GETTING_STARTED["files"]]), "",
    "## 2. Component status", "", table(["Stage", "Means"], [(f"**{a}**", b) for a, b in gd.LIFECYCLE]), "",
    table(["Component", "Status", "Platforms", "Since", "Note"], [(r["name"], r["status"], r["platforms"], r["since"], r["note"] or "—") for r in status_rows]), "",
    "## 3. Which component should I use?", "",
    "\n\n".join(f"### {c['title']}\n\n{c['intro']}\n\n" + "\n".join(f"{i}. {q} → **{a}**" for i, (q, a) in enumerate(c["steps"], 1)) + "\n\n" +
                table(["Component", "Use it for"], [(f"**{a}**", b) for a, b in c["reference"]]) for c in gd.CHOOSERS), "",
    "## 4. Accessibility checklist", "", rules_md(gd.A11Y), "",
    "## 5. FAQ", "", "\n\n".join(f"**{q}**  \n{a}" for q, a in gd.FAQ), ""])
(ROOT / "docs" / "guides.md").write_text(GUIDES_MD, encoding="utf-8")

md_tpl = ROOT / "docs" / "stage-1.template.md"
if md_tpl.exists():
    md = md_tpl.read_text(encoding="utf-8")
    for k, v in MD.items():
        md = md.replace("{{" + k + "}}", v)
    (ROOT / "docs" / "stage-1-foundations.md").write_text(md, encoding="utf-8")

# ---------------------------------------------------------------- stage 2 markdown
def comp_md(c):
    L = [f"### {c['name']}", "", c["purpose"], "", "**Anatomy**", ""]
    L += [f"{i}. {a}" for i, a in enumerate(c["anatomy"], 1)] + [""]
    L += ["**Variants**", "", table(["Variant", "Use"], c["variants"]), ""]
    L += ["**Sizes**", "", table(["Size", "Spec"], c["sizes"]), ""]
    L += ["**States**", "", table(["State", "Treatment"], [(s, "—" if t == "n/a" else t) for s, t in c["states"]]), ""]
    if c.get("decimal"):
        L += ["**Decimal handling and validation**", ""] + [f"- {d}" for d in c["decimal"]] + [""]
    L += ["**Accessibility**", ""] + [f"- {a}" for a in c["a11y"]] + [""]
    n = max(len(c["do"]), len(c["dont"]))
    rows = [(f"✅ {c['do'][i]}" if i < len(c["do"]) else "", f"❌ {c['dont'][i]}" if i < len(c["dont"]) else "") for i in range(n)]
    L += ["**Do and don't**", "", table(["Do", "Don't"], rows), ""]
    L += ["**Tokens:** " + " · ".join(f"`{t}`" for t in c["tokens"]), "", "---", ""]
    return "\n".join(L)

groups = []
for c in cs.COMPONENTS:
    if c["group"] not in groups:
        groups.append(c["group"])
toc = "\n".join(f"- **{g}:** " + ", ".join(f"[{c['name']}](#{c['name'].lower().replace(' ', '-').replace('/', '').replace('(', '').replace(')', '')})" for c in cs.COMPONENTS if c["group"] == g) for g in groups)
body = "\n".join(f"## {g}\n\n" + "\n".join(comp_md(c) for c in cs.COMPONENTS if c["group"] == g) for g in groups)
MD2 = {
    "toc": toc, "components": body,
    "sizes": table(["Token", "Value", "Usage"], [(f"`{s['path']}`", f"{s['value']}px", s["usage"]) for s in out["size"]]),
    "chart": table(["Token", "Light", "Dark", "Worst contrast L / D", "Usage"],
        [(f"`{p}`", f"`{sem[p]['light']}` {sem[p]['lightRef']}", f"`{sem[p]['dark']}` {sem[p]['darkRef']}",
          "{}:1 / {}:1".format(*best(p, "ui")), sem[p]["usage"]) for p, *_ in CHART]),
    "gaps": table(["Gap", "Why it's needed"], cs.GAPS),
    "decisions": "\n".join(f"{i}. **{t}.** {b}" for i, (t, b) in enumerate(cs.DECISIONS, 1)),
    "count": str(len(cs.COMPONENTS)),
}
md2_tpl = ROOT / "docs" / "stage-2.template.md"
if md2_tpl.exists():
    md = md2_tpl.read_text(encoding="utf-8")
    for k, v in MD2.items():
        md = md.replace("{{" + k + "}}", v)
    (ROOT / "docs" / "stage-2-components.md").write_text(md, encoding="utf-8")

# ---------------------------------------------------------------- stage 3 markdown
_spec3 = importlib.util.spec_from_file_location("content_spec", ROOT / "tools" / "content_spec.py")
cn = importlib.util.module_from_spec(_spec3); _spec3.loader.exec_module(cn)
out["content"] = {k: getattr(cn, k) for k in ("VOICE", "TONE", "MECHANICS", "GUIDES", "FORMAT_MONEY", "FORMAT_PERCENT", "FORMAT_DATE", "GLOSSARY", "DECISIONS")}
guides_md = []
for g in cn.GUIDES:
    guides_md.append(f"### {g['title']}\n\n" + "\n".join(f"- {r}" for r in g["rules"]) + "\n\n" +
                     table(["Moment", "✅ Write", "❌ Not"], [(m, f"“{a}”", f"“{b}”") for m, a, b in g["examples"]]))
MD3 = {
    "summary": cn.VOICE["summary"],
    "pillars": table(["We are", "Not", "What it means", "✅ Sounds like", "❌ Not like"], [(f"**{a}**", b, c, f"“{d}”", f"“{e}”") for a, b, c, d, e in cn.VOICE["pillars"]]),
    "never": "\n".join(f"- {n}" for n in cn.VOICE["never"]),
    "tone": table(["Moment", "Tone", "Example"], [(a, b, f"“{c}”") for a, b, c in cn.TONE]),
    "mechanics": table(["Rule", "Guideline"], [(f"**{a}**", b) for a, b in cn.MECHANICS]),
    "guides": "\n\n".join(guides_md),
    "money": table(["Rule", "Guideline"], [(f"**{a}**", b) for a, b in cn.FORMAT_MONEY]),
    "percent": table(["Rule", "Guideline"], [(f"**{a}**", b) for a, b in cn.FORMAT_PERCENT]),
    "date": table(["Rule", "Guideline"], [(f"**{a}**", b) for a, b in cn.FORMAT_DATE]),
    "glossary": table(["Term", "Means", "Don't use"], [(f"**{a}**", b, c) for a, b, c in cn.GLOSSARY]),
    "decisions": "\n".join(f"{i}. **{t}.** {b}" for i, (t, b) in enumerate(cn.DECISIONS, 1)),
}
md3_tpl = ROOT / "docs" / "stage-3.template.md"
if md3_tpl.exists():
    md = md3_tpl.read_text(encoding="utf-8")
    for k, v in MD3.items():
        md = md.replace("{{" + k + "}}", v)
    (ROOT / "docs" / "stage-3-content.md").write_text(md, encoding="utf-8")

# ---------------------------------------------------------------- stage 4 markdown
_spec4 = importlib.util.spec_from_file_location("patterns_spec", ROOT / "tools" / "patterns_spec.py")
pt = importlib.util.module_from_spec(_spec4); _spec4.loader.exec_module(pt)
out["patterns"] = pt.PATTERNS
out["patternDecisions"] = pt.DECISIONS
def pat_md(p):
    L = [f"## {p['name']}", "", f"**Goal:** {p['goal']}", "", f"**How we'll know it works:** {p['measure']}", "", "**Entry points**", ""]
    L += [f"- {e}" for e in p["entry"]] + ["", "**Flow**", ""]
    L += [f"{i}. **{t}.** {d}" for i, (t, d) in enumerate(p["steps"], 1)] + [""]
    if p.get("tiers"):
        L += ["**Destructive actions: friction matches irreversibility**", "", table(["Tier", "Examples", "Treatment"], p["tiers"]), ""]
    if p.get("levels"):
        L += ["**Error hierarchy: show each failure at the smallest scope that explains it**", "", table(["Level", "When", "Treatment"], p["levels"]), ""]
    L += ["**Rules**", ""] + [f"- {r}" for r in p["rules"]] + [""]
    L += ["**Edge cases**", "", table(["Case", "Behaviour"], p["edges"]), ""]
    L += ["**Accessibility**", ""] + [f"- {a}" for a in p["a11y"]] + [""]
    L += ["**Built from:** " + " · ".join(p["components"]), "", "---", ""]
    return "\n".join(L)
MD4 = {"patterns": "\n".join(pat_md(p) for p in pt.PATTERNS),
       "toc": "\n".join(f"- [{p['name']}](#{p['name'].lower().replace(' ', '-')})" for p in pt.PATTERNS),
       "decisions": "\n".join(f"{i}. **{t}.** {b}" for i, (t, b) in enumerate(pt.DECISIONS, 1))}
md4_tpl = ROOT / "docs" / "stage-4.template.md"
if md4_tpl.exists():
    md = md4_tpl.read_text(encoding="utf-8")
    for k, v in MD4.items():
        md = md.replace("{{" + k + "}}", v)
    (ROOT / "docs" / "stage-4-patterns.md").write_text(md, encoding="utf-8")

# ---------------------------------------------------------------- stage 5 markdown
_spec5 = importlib.util.spec_from_file_location("proof_spec", ROOT / "tools" / "proof_spec.py")
pf = importlib.util.module_from_spec(_spec5); _spec5.loader.exec_module(pf)
out["proof"] = {"screens": pf.SCREENS, "gaps": pf.GAPS, "decisions": pf.DECISIONS}
def screen_md(s):
    rows = [(str(i), c.replace(" (GAP)", " **· new (gap)**"), note, " ".join(f"`{t}`" for t in toks)) for i, (c, note, toks) in enumerate(s["pins"], 1)]
    return f"## {s['name']}\n\n**Job:** {s['job']}\n\nTop to bottom:\n\n" + table(["#", "Component", "What it does here", "Tokens"], rows) + "\n"
def gap_md(g):
    return (f"### {g['name']}\n\n**Needed on:** {g['screen']}. {g['why']}\n\n**Anatomy**\n\n" + "\n".join(f"{i}. {a}" for i, a in enumerate(g["anatomy"], 1)) +
            f"\n\n**States:** {g['states']}\n\n**Rule:** {g['rules']}\n")
audit = getattr(pf, "AUDIT", None)
MD5 = {"screens": "\n".join(screen_md(s) for s in pf.SCREENS), "gaps": "\n".join(gap_md(g) for g in pf.GAPS),
       "decisions": "\n".join(f"{i}. **{t}.** {b}" for i, (t, b) in enumerate(pf.DECISIONS, 1)),
       "audit": audit or "_Open `site/proof.html` to run the audit._"}
md5_tpl = ROOT / "docs" / "stage-5.template.md"
if md5_tpl.exists():
    md = md5_tpl.read_text(encoding="utf-8")
    for k, v in MD5.items():
        md = md.replace("{{" + k + "}}", v)
    (ROOT / "docs" / "stage-5-proof.md").write_text(md, encoding="utf-8")

# ---------------------------------------------------------------- stage 6 markdown (flows)
_spec6 = importlib.util.spec_from_file_location("flows_spec", ROOT / "tools" / "flows_spec.py")
fl = importlib.util.module_from_spec(_spec6); _spec6.loader.exec_module(fl)
out["flows"] = {"persona": fl.PERSONA, "flows": fl.FLOWS, "proposed": fl.PROPOSED, "decisions": fl.DECISIONS}
names = {sc[0]: sc[1] for f in fl.FLOWS for sc in f["screens"]}
def flow_md(f):
    rows = [(f"**{sid}**", t, k, n, " · ".join(f"{h} → {to} {names[to]}" for h, to in links) or "—") for sid, t, k, n, links in f["screens"]]
    L = [f"## {f['id']} · {f['name']}", "", f"**Goal:** {f['goal']}", "", f"**How we'll know it works:** {f['measure']}", "",
         "**Entry points:** " + " · ".join(f["entry"]), "", table(["Screen", "Name", "Type", "Why it looks like this", "Links to"], rows), "",
         "**Edge cases**", "", table(["When", "What the person sees"], f["edges"]), "",
         "**Accessibility**", ""] + [f"- {a}" for a in f["a11y"]] + ["", "---", ""]
    return "\n".join(L)
MD6 = {"count": str(len(fl.FLOWS)), "screens": str(len(names)),
       "persona": f"{fl.PERSONA['name']}, {fl.PERSONA['age']}, {fl.PERSONA['job'].lower()} in {fl.PERSONA['city']}. {fl.PERSONA['income']}; {fl.PERSONA['limit']}. Today is {fl.PERSONA['today']}: {fl.PERSONA['spent']}.",
       "overview": table(["Flow", "Goal", "Screens", "Edge states"], [(f"[{f['id']} · {f['name']}](#{f['id'].lower()}--{f['name'].lower().replace(' ', '-')})", f["goal"], len(f["screens"]), sum(1 for s_ in f["screens"] if s_[2] == "edge")) for f in fl.FLOWS]),
       "flows": "\n".join(flow_md(f) for f in fl.FLOWS),
       "proposed": table(["Component", "What it is and where it's used"], [(f"**{a}**", b) for a, b in fl.PROPOSED]),
       "decisions": "\n".join(f"{i}. **{t}.** {b}" for i, (t, b) in enumerate(fl.DECISIONS, 1))}
md6_tpl = ROOT / "docs" / "stage-6.template.md"
if md6_tpl.exists():
    md = md6_tpl.read_text(encoding="utf-8")
    for k, v in MD6.items():
        md = md.replace("{{" + k + "}}", v)
    (ROOT / "docs" / "stage-6-flows.md").write_text(md, encoding="utf-8")

tpl = ROOT / "site" / "template.html"
if tpl.exists():
    var = lambda p: "--" + p.replace("/", "-")
    def mode_vars(mode):
        v = [f"{var(p)}:{s[mode]};" for p, s in sem.items()]
        v += [f"{var(o['path'])}:{o[mode]};" for o in out["overlay"]]
        v += [f"{var(e['path'])}:{e[mode] if not e[mode].startswith('none (') else 'none'};" for e in out["elevation"]]
        return "".join(v)
    static = "".join([f"{var(s['path'])}:{s['value']}px;" for s in out["space"]] +
                     [f"{var(r['path'])}:{r['value']}px;" for r in out["radius"]] +
                     [f"{var(m['path'])}:{m['value']}ms;" for m in out["motionDuration"]] +
                     [f"{var(m['path'])}:{m['value']};" for m in out["motionEasing"]])
    static += "".join(f"{var(t['path'])}:var({var(t['ref'])});" for t in SEM_SPACE)
    lay = lambda bp: "".join(f"{var(l['path'])}:{l[bp]}px;" for l in out["spacing"]["layout"])
    static += lay("compact")
    responsive = "".join(f"@media (min-width:{w}px){{:root{{{lay(bp)}}}}}" for bp, w in (("medium", 600), ("expanded", 840), ("large", 1200)))
    css = (f":root{{{static}{mode_vars('light')}color-scheme:light}}{responsive}"
           f"@media (prefers-color-scheme:dark){{:root:not([data-theme=light]){{{mode_vars('dark')}color-scheme:dark}}}}"
           f":root[data-theme=dark]{{{mode_vars('dark')}color-scheme:dark}}")
    html = (tpl.read_text(encoding="utf-8")
            .replace("/*__TOKENS__*/null", json.dumps(out, ensure_ascii=False))
            .replace("/*__CSSVARS__*/", css))
    (ROOT / "site" / "index.html").write_text(html, encoding="utf-8")
    ctpl = ROOT / "site" / "components.template.html"
    if ctpl.exists():
        chtml = (ctpl.read_text(encoding="utf-8")
                 .replace("/*__TOKENS__*/null", json.dumps(out, ensure_ascii=False))
                 .replace("/*__CSSVARS__*/", css))
        (ROOT / "site" / "components.html").write_text(chtml, encoding="utf-8")
    for page in ("content", "patterns", "proof"):
        ptpl = ROOT / "site" / f"{page}.template.html"
        if ptpl.exists():
            phtml = (ptpl.read_text(encoding="utf-8")
                     .replace("/*__TOKENS__*/null", json.dumps(out, ensure_ascii=False))
                     .replace("/*__CSSVARS__*/", css))
            (ROOT / "site" / f"{page}.html").write_text(phtml, encoding="utf-8")

for name, stops in primitives.items():
    print(f"{name:7}", " ".join(stops.values()))
print(f"\n{len(report)} pairings measured, {len(failures)} below target")
for f in failures:
    print(f"  FAIL {f['mode']:5} {f['fg']} on {f['bg']}: {f['ratio']} < {f['target']}")
lo = sorted(report, key=lambda r: r["ratio"] - r["target"])[:6]
print("Tightest passes:")
for r in lo:
    print(f"  {r['mode']:5} {r['fg']} on {r['bg']}: {r['ratio']} (target {r['target']})")
sys.exit(1 if failures else 0)
