"""Headroom spacing system: every relationship between two things on screen has a named token.

Primitive steps live in build_tokens.SPACE (space/0 … space/2000). Components never use them
directly; they use the semantic tokens below, named for the relationship they measure
(what sits on each side of the gap), never for their size. Read by tools/build_tokens.py.

Each semantic entry: (path, primitive, axis, between, example)
  axis: "all" (inset), "block" (vertical), "inline" (horizontal), "both" (wrap gap)
"""

GROUPS = [
    {
        "id": "inset", "title": "Inset: padding inside a container",
        "intro": "Equal padding on all four sides. The bigger the container, the bigger the inset, so content never looks cramped in a large surface or lost in a small one.",
        "tokens": [
            ("space/inset/none", "space/0",   "all", "Container edge ↔ full-bleed content", "Edge-to-edge image at the top of a goal card; a list that runs to the card edge."),
            ("space/inset/xs",   "space/100", "all", "Badge edge ↔ its number",              "Count badge on the bell icon."),
            ("space/inset/sm",   "space/200", "all", "Small container ↔ content",             "Tooltip, category icon inside its tile."),
            ("space/inset/md",   "space/300", "all", "Compact container ↔ content",           "Snackbar, insight card in a dense grid."),
            ("space/inset/lg",   "space/400", "all", "Card ↔ content",                       "Balance card, budget card, alerts."),
            ("space/inset/xl",   "space/600", "all", "Sheet or modal ↔ content",              "Bottom sheet, dialog, onboarding panel, web dashboard card."),
            ("space/inset/2xl",  "space/1000", "all", "Spacious panel ↔ content",            "Empty states and onboarding panels: top and bottom breathing room."),
        ],
    },
    {
        "id": "squish", "title": "Squish and stretch: unequal padding",
        "intro": "Squish has less padding top and bottom than at the sides, for controls that sit in a row (buttons, chips). Stretch is the reverse, for things stacked in a narrow column. Each needs two values, so each has a block (top and bottom) token and an inline (left and right) token.",
        "tokens": [
            ("space/squish/sm/block",  "space/50",  "block",  "Tag edge ↔ label (top and bottom)",    "Status badge such as 'Paid'."),
            ("space/squish/sm/inline", "space/200", "inline", "Tag edge ↔ label (sides)",             "Status badge such as 'Paid'."),
            ("space/squish/md/block",  "space/200", "block",  "Chip edge ↔ label (top and bottom)",   "Filter chips, segmented control segments."),
            ("space/squish/md/inline", "space/300", "inline", "Chip edge ↔ label (sides)",            "Filter chips, segmented control segments."),
            ("space/squish/lg/block",  "space/300", "block",  "Row or input edge ↔ content (top and bottom)", "List rows, text inputs."),
            ("space/squish/lg/inline", "space/400", "inline", "Row or input edge ↔ content (sides)",  "List rows and text inputs."),
            ("space/squish/xl/block",  "space/300", "block",  "Button edge ↔ label (top and bottom)", "Primary and secondary buttons."),
            ("space/squish/xl/inline", "space/500", "inline", "Button edge ↔ label (sides)",          "Primary and secondary buttons; wider sides make the label easy to scan."),
            ("space/squish/2xl/inline", "space/600", "inline", "Large button edge ↔ label (sides)",   "56px full-width and onboarding buttons."),
            ("space/stretch/md/block",  "space/300", "block",  "Rail item edge ↔ icon and label (top and bottom)", "Web navigation rail items, keypad keys."),
            ("space/stretch/md/inline", "space/200", "inline", "Rail item edge ↔ icon and label (sides)",          "Web navigation rail items, keypad keys."),
        ],
    },
    {
        "id": "text", "title": "Text to text",
        "intro": "Measured from line box to line box, not baseline to baseline. Every line height is on the 4px grid, so text boxes always snap. The closer two pieces of text are in meaning, the closer they sit.",
        "tokens": [
            ("space/text/amount-to-caption",    "space/100", "block", "Big amount ↔ the line that explains it", "₹18,450 ↔ 'left to spend this month'."),
            ("space/text/eyebrow-to-title",     "space/100", "block", "Small label above ↔ title",            "'October' ↔ 'Your budget'."),
            ("space/text/title-to-subtitle",    "space/150", "block", "Title ↔ its supporting line",          "'Swiggy' ↔ 'Food and dining · Today' in a row."),
            ("space/text/label-to-field",       "space/150", "block", "Field label ↔ input",                  "'Amount' ↔ the amount field."),
            ("space/text/field-to-helper",      "space/150", "block", "Input ↔ helper or error text",          "Field ↔ 'Enter a UPI ID like name@bank'."),
            ("space/text/heading-to-body",      "space/200", "block", "Heading ↔ the paragraph it introduces", "Sheet title ↔ its explanation."),
            ("space/text/list-item",            "space/200", "block", "Bullet ↔ next bullet",                 "Steps in a help article."),
            ("space/text/paragraph",            "space/300", "block", "Paragraph ↔ paragraph",                "About 55% of body line height (22px), inside the 40–75% readability band."),
            ("space/text/body-to-action",       "space/400", "block", "Last line of text ↔ the button or link that acts on it", "Empty-state body ↔ 'Add a budget'."),
            ("space/text/section-heading-below","space/300", "block", "Section heading ↔ first item under it", "'Upcoming bills' ↔ first bill row."),
            ("space/text/section-heading-above","space/800", "block", "Previous content ↔ next section heading", "Last budget row ↔ 'Upcoming bills'. Always at least 1.5× the space below a heading."),
            ("space/text/inline",               "space/100", "inline", "Value ↔ inline qualifier",              "'₹740' ↔ 'over' badge; amount ↔ trend arrow."),
        ],
    },
    {
        "id": "icon", "title": "Text to icon and icon to icon",
        "intro": "Measured from the icon's 16, 20 or 24px box, not the visible glyph. Never nudge spacing by odd pixels to make up for a glyph's inner whitespace. If an icon looks off, the icon gets fixed, not the gap.",
        "tokens": [
            ("space/icon/to-text-sm", "space/150", "inline", "16px icon ↔ small text (13–14px)", "Warning icon ↔ 'Close to limit'; sync dot ↔ 'Updated 2 min ago'."),
            ("space/icon/to-text-md", "space/200", "inline", "20–24px icon ↔ label (14–17px)",   "Icon ↔ label in buttons, chips, menu items and nav."),
            ("space/icon/to-badge",   "space/50",  "both",   "Icon ↔ notification badge overlap", "Badge sits 2px inside the bell's top-right corner."),
            ("space/icon/to-icon",    "space/200", "inline", "Icon ↔ icon (not tappable)",        "Status icons in a row; card brand marks."),
            ("space/icon/control-to-label", "space/300", "inline", "Checkbox, radio, toggle or menu icon ↔ its label", "'Round to the rupee' beside its checkbox; menu item icon to text."),
            ("space/icon/target-to-target", "space/0", "inline", "48px tap target ↔ next 48px tap target", "App-bar actions. Targets touch; the 24px glyphs end up 24px apart."),
        ],
    },
    {
        "id": "media", "title": "Text to image and media",
        "intro": "Images, avatars, category tiles, charts and illustrations. The larger the visual, the more room it needs before text starts.",
        "tokens": [
            ("space/media/tile-to-text",        "space/300", "inline", "40px tile or avatar ↔ row text",   "Category tile ↔ 'Swiggy' in a transaction row."),
            ("space/media/thumb-to-text",       "space/400", "inline", "56px+ thumbnail ↔ text",          "Goal photo ↔ goal name and progress."),
            ("space/media/image-to-caption",    "space/200", "block",  "Image or chart ↔ its caption",    "Chart ↔ 'Last 6 months'."),
            ("space/media/chart-to-legend",     "space/400", "block",  "Chart ↔ legend",                  "Donut ↔ category legend."),
            ("space/media/card-image-to-content","space/400", "block", "Full-bleed card image ↔ card text", "Same as the card inset so text lines up with the card padding."),
            ("space/media/amount-to-visual",    "space/400", "block",  "Hero amount ↔ gauge or chart",    "₹18,450 caption ↔ clearance gauge."),
            ("space/media/illustration-to-headline", "space/600", "block", "Illustration ↔ headline", "Empty states, onboarding, goal reached."),
        ],
    },
    {
        "id": "stack", "title": "Component to component",
        "intro": "Space between whole components. The parent owns this space (flex/stack gap, Figma auto layout gap). Components never carry outer margins, so they can be dropped anywhere.",
        "tokens": [
            ("space/stack/row-to-row",          "space/0",   "block", "List row ↔ list row",          "Rows already have squish padding; a hairline divider separates them."),
            ("space/stack/control-inline",      "space/200", "both",  "Chip ↔ chip (wraps)",          "Filter chips, amount suggestion chips. Same gap across and down."),
            ("space/stack/button-group",        "space/300", "inline","Button ↔ button side by side", "'Cancel' ↔ 'Delete'."),
            ("space/stack/button-stack",        "space/300", "block", "Full-width button ↔ button",   "Primary over secondary in a sheet footer."),
            ("space/stack/card-to-card",        "space/300", "block", "Card ↔ card in a list",        "Goal cards on mobile. Grids use the layout gutter instead."),
            ("space/stack/field-to-field",      "space/400", "block", "Form field ↔ form field",      "Amount ↔ category ↔ note."),
            ("space/stack/alert-to-content",    "space/400", "block", "Inline alert ↔ content below", "'Bank sync paused' banner ↔ balance card."),
            ("space/stack/group-to-group",      "space/600", "block", "Group ↔ group within a section","Budget summary ↔ category budgets."),
            ("space/stack/fieldset-to-fieldset","space/800", "block", "Form section ↔ form section",  "'Limit' settings ↔ 'Alerts' settings."),
        ],
    },
]

# Layout tokens are the only spacing that changes with screen size. (token, compact, medium, expanded, large, between)
LAYOUT = [
    ("space/layout/page-margin",    16, 24, 32, 40, "Screen edge ↔ content"),
    ("space/layout/gutter",         12, 16, 24, 24, "Grid column ↔ column; card ↔ card in a grid"),
    ("space/layout/screen-top",     16, 16, 24, 32, "App bar ↔ first content"),
    ("space/layout/content-bottom", 24, 24, 40, 64, "Last content ↔ bottom nav or page end"),
    ("space/layout/group",          24, 24, 32, 32, "Group ↔ group on a screen"),
    ("space/layout/section",        32, 40, 48, 64, "Section ↔ section"),
]
BREAKPOINT_KEYS = ["compact", "medium", "expanded", "large"]

TOUCH = [
    ("Minimum tap target", "48×48 on every platform (size/touch-target/min). Covers Android 48dp, exceeds iOS 44pt and WCAG 2.5.8 (24px)."),
    ("Small visuals", "A 36px button or 24px icon still gets a 48px hit area. The extra area is invisible padding, never a bigger visual."),
    ("Between targets", "Targets of 48px or more may touch (space/icon/target-to-target). Smaller visual controls keep at least space/200 between their hit areas so a thumb never lands on two."),
    ("Destructive spacing", "A destructive action never sits directly next to its opposite without space/stack/button-group between them, and never in the thumb's resting spot on the right of a bottom bar."),
]

SAFE_AREA = [
    ("Add, never replace", "Layout margins are added on top of the device safe-area insets (notch, home indicator, rounded corners), never instead of them. Web: padding: max(margin, env(safe-area-inset-*)) for edges, margin + env() for the bottom."),
    ("Sticky bottom CTA", "space/400 above the button, space/400 + bottom safe-area inset below it. On devices with no inset, space/400."),
    ("Bottom nav", "size/nav-bar (64) + bottom inset. Scroll content ends space/layout/content-bottom above the nav, so the last row is never hidden."),
    ("Keyboard", "When the keyboard is up, the focused field plus space/layout/content-bottom stays visible above it."),
    ("Landscape phones", "Side insets grow in landscape; page margins are added to them, so content never touches the notch."),
]

DENSITY = [
    ("Comfortable (default)", "All mobile screens and every touch device. Values as listed."),
    ("Compact", "Web dashboard tables and power-user lists, pointer devices only. Inset and squish tokens step down one primitive step (16→12, 12→8, 8→4). Row height 56→44. Text-to-text, text-to-media and layout tokens do not change."),
    ("Never compress", "Tap targets, text-to-text spacing and the space around amounts. Density changes how much fits on screen, not how readable it is."),
]

RULES = [
    ("Inside is tighter than outside", "Things in a group sit closer to each other than to anything outside the group. Each level out is at least one step bigger, and section spacing is at least twice group spacing."),
    ("More space above a heading than below", "A heading belongs to what follows it. Space above ≥ 1.5× space below (we use 32 above, 12 below)."),
    ("The parent owns the gap", "Components have padding, never outer margin. Spacing between siblings comes from the container's gap: CSS gap, SwiftUI VStack(spacing:), Compose Arrangement.spacedBy, Figma auto layout."),
    ("Name the relationship, not the size", "Use space/text/heading-to-body, not space/200. If the scale ever shifts, every heading moves together and nothing else does."),
    ("Primitives are for tokens only", "space/100…space/2000 appear in the token file and nowhere else. A component that uses a primitive directly fails review."),
    ("Text spacing grows with text size", "When the user raises their text size (Dynamic Type, Android font scale, browser zoom), text-to-text spacing scales with it (UIFontMetrics.scaledValue, sp, rem). Container insets and layout spacing stay fixed so more fits on screen."),
    ("Only layout is responsive", "Components keep the same spacing at every screen size so they feel the same everywhere. Only space/layout/* changes between breakpoints."),
    ("Logical sides", "Use start/end and block/inline, not left/right and top/bottom. Spacing mirrors automatically in right-to-left languages."),
    ("No off-scale values", "If no token fits, the design is asking for a new relationship. Propose it (see Governance) instead of typing 10px. Optical exceptions are allowed only inside a component spec, written down with the reason."),
    ("Measure box to box", "Spacing is measured between bounding boxes: line boxes for text, the 16/20/24 box for icons, the frame for images. Never to the glyph or the baseline."),
]

DECISIONS = [
    ("Every gap is named for what it separates",
     "T-shirt sizes (sm, md, lg) tell you how big a gap is, not why it exists. Two designers can both pick 'md' for different reasons, and when one needs to change, both move. Relationship names (text/heading-to-body, media/tile-to-text) record the intent, so a change touches exactly the places that share it. That's the difference between a system that lasts years and one that drifts in a quarter."),
    ("Only layout spacing responds to screen size",
     "Carbon and Material both step spacing down on small screens. Headroom does this only for page margins, gutters and section gaps. Components keep identical spacing everywhere, so a budget row feels the same on a phone and on the web, and engineers never ship breakpoint logic inside a component."),
    ("Text spacing scales with the reader's text size; containers don't",
     "Young professionals skew toward small default text, but a share of users run at the largest accessibility sizes. If text grows but the gap between a heading and its body doesn't, the hierarchy collapses. If container padding also grows, a single row stops fitting on the screen. Splitting the two keeps both the hierarchy and the layout intact at 200% text."),
]
