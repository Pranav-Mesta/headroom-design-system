"""Headroom governance: how the system is named, versioned, changed and retired.
Read by tools/build_tokens.py. The current version lives in VERSION; history in CHANGELOG.md.
"""

VERSION = "1.0.0"

NAMING = [
    ("Shape", "category/concept/role-state, all lowercase, words joined by hyphens, levels by slashes. Slashes become Figma variable groups and CSS custom properties (color/text/primary → --color-text-primary)."),
    ("Primitive colours", "color/{family}/{stop}. Families are plain colour words (neutral, blue, green, teal, yellow, red), never brand nicknames, so a new designer can guess them. Stops run 50–900 (neutral adds 0, 950, 1000)."),
    ("Colour names", "Every primitive also has a human name: family + tone (Blue Strong, Red Medium, Neutral Light Black). Use names when talking and in design reviews; use the path in code and Figma. A name never changes while its path exists."),
    ("Semantic tokens", "Named for purpose, never appearance: color/status/danger, not color/red-text. If a token's name would still be true after its colour changed, the name is right."),
    ("Spacing", "space/{relationship}/{a}-to-{b} or space/{type}/{size}. The name says what sits on each side of the gap."),
    ("States", "Suffixes in this order: -hover, -pressed, -selected, -disabled. No synonyms (active, down, on)."),
    ("Numbers over sizes", "Primitive scales are numeric (space/400, color/blue/600), so a new step (space/350) slots in without renaming anything."),
    ("Reserved words", "Never use new, old, v2, temp, test or a person's name in a token. They outlive the moment and stop meaning anything."),
]

TIERS = [
    ("Primitive", "Raw values: color/blue/600, space/400.", "Only the token file. Never in components, Figma layers or code."),
    ("Semantic", "Purpose: color/action/primary, space/text/heading-to-body.", "Everything that ships. Light and dark resolve here."),
    ("Component", "One component diverging on purpose: button/primary/padding-inline.", "Only when a component needs a value no semantic token describes. Must point at a semantic or primitive token, never a raw value."),
]

SEMVER = [
    ("Major (2.0.0)", "Something existing breaks: a token is renamed or removed, a token changes meaning (status/warning starts meaning info), or a value change makes an existing pairing fail contrast.", "Rename color/status/danger → color/status/critical."),
    ("Minor (1.1.0)", "Something is added and nothing breaks: a new token, a new component variant, a new breakpoint value.", "Add space/media/video-to-caption."),
    ("Patch (1.0.1)", "A value is tuned within the same intent and every contrast pairing still passes.", "red/400 shifts slightly in hue; over-fill still passes."),
]

DEPRECATION = [
    ("Mark first", "A token being retired gets $deprecated in tokens.json with the replacement path and the version it disappears in. Its value keeps working."),
    ("Keep it a full major", "Deprecated tokens stay for at least one full major version or six months, whichever is longer."),
    ("Warn loudly", "The build lists every use of a deprecated token. Figma descriptions start with 'Deprecated: use …'."),
    ("Ship a map", "Every major release has a migration table (old path → new path) in CHANGELOG.md, written so a find-and-replace can apply it."),
    ("Remove last", "Removal happens only in the next major, after usage reaches zero in code and Figma."),
]

CONTRIBUTION = [
    ("1. Check first", "Search existing tokens and components. Most requests are already solved under another name."),
    ("2. Show the need", "Open a proposal with the problem, two or more places it's needed, and screenshots. One-off needs stay local to that screen."),
    ("3. Propose", "Suggest the name (following the naming rules), the value for light and dark, and which tier it belongs in."),
    ("4. Pass the gates", "Contrast gate (AA in both modes), proof audit (no stray values), docs and Figma updated, a changelog line written."),
    ("5. Decide and record", "The design system owner and one engineer approve. The decision and its reason are logged, including rejections, so the same debate doesn't repeat."),
]

GATES = [
    ("Contrast gate", "tools/build_tokens.py measures every declared text and UI pairing in both modes and refuses to build below WCAG AA."),
    ("Proof audit", "site/proof.html reads back every rendered colour and font size and fails on any value that isn't a token."),
    ("Docs", "The markdown, the spec site and tokens.json regenerate from the same source, so they can't disagree."),
    ("Figma", "Variables and styles are rebuilt from tokens.json by the Headroom DS Builder plugin, never edited by hand."),
    ("Changelog", "Every release adds a dated entry with what changed, why, and how to migrate."),
]

CADENCE = [
    ("Patch", "Any time, once it passes the gates."),
    ("Minor", "Batched monthly."),
    ("Major", "At most twice a year, announced one cycle ahead with the migration map."),
]

DECISIONS = [
    ("Colours have names for people and numbers for machines",
     "Hex codes are unreadable in a review, and pure names ('Ocean', 'Sunset') age badly and hide the order of shades. Headroom keeps the numeric path as the contract (color/neutral/900) and adds a fixed plain-language name (Neutral Light Black). People can say 'swap it to Blue Strong'; code still sorts and scales by number."),
    ("Renames are the most expensive change, so they're major releases",
     "Changing a value is cheap: everything that points at it updates. Changing a name breaks every reference in code, Figma and docs. Treating any rename as a major version, with a deprecation period and a migration map, makes the cost visible before anyone pays it."),
    ("Every rule is enforced by the build, not by memory",
     "Contrast, stray values and doc drift are checked by scripts that fail the build. Teams change; guidelines that rely on someone remembering them don't survive a reorg. Rules that fail a build do."),
]

# What changed in this release, rendered into CHANGELOG.md.
CHANGELOG = [
    ("1.0.0", "2026-10-19", "First stable release. Renames and new spacing system.", [
        "Primitive colour families renamed to plain colour words (see migration map).",
        "Every primitive colour has a human name (Neutral Light Black, Blue Strong, Red Medium …).",
        "Near-limit and over-limit retuned: yellow is now saffron (hue 70), red is now a true red (hue 22). color/finance/near-fill → yellow/300 · yellow/600; color/finance/over-fill → red/400 · red/700.",
        "Added 52 semantic spacing tokens (inset, squish and stretch, text to text, text to icon, text to media, component to component) and 6 responsive layout tokens.",
        "Added governance: naming, tiers, SemVer, deprecation, contribution and gates.",
        "color/action/secondary moved from blue/50 to blue/100 in light mode: tonal buttons and selected chips were invisible against the canvas.",
        "Added space/squish/xl/block and /inline for button padding; every Figma padding and gap now binds to a semantic spacing token.",
    ], [("color/slate/*", "color/neutral/*"), ("color/sky/*", "color/blue/*"), ("color/leaf/*", "color/green/*"),
        ("color/lagoon/*", "color/teal/*"), ("color/signal/*", "color/yellow/*"), ("color/coral/*", "color/red/*")]),
]
