"""Guides that help people use Headroom: getting started, component status, choosing a component,
accessibility and FAQ. Modelled on what Razorpay's Blade provides (blade.razorpay.com), scaled down
to what a one-product system actually needs. Read by tools/build_tokens.py.
"""

GETTING_STARTED = {
    "designers": [
        ("Use the library", "Open the Headroom Figma file and enable it as a library. Variables live in Color (light), Color · Dark, Spacing, Radius and Size; text and effect styles carry the type scale and elevation."),
        ("Pick by purpose", "Choose semantic variables (color/text/secondary, space/text/heading-to-body), never primitives. If you can't name the purpose, the design isn't settled yet."),
        ("Start from a component", "Every screen starts from the 35 components. Detach only to explore; a detached component in a handoff file is a review comment."),
        ("Check both modes", "Switch the frame to Color · Dark before handoff. The variables do the work, but crops, images and illustrations don't."),
        ("Write with the voice", "Copy follows Stage 3: plain words, sentence case, amounts formatted ₹1,24,500 with a true minus sign."),
    ],
    "developers": [
        ("Take the tokens", "tokens/tokens.json is in the W3C design-token format. Feed it to Style Dictionary (or your build) to emit CSS variables, Swift and Kotlin constants. On the web, the generated CSS variables are --color-text-primary, --space-inset-lg and so on."),
        ("Use semantic names only", "Components read semantic tokens. Primitive paths (color/blue/600, space/400) appear only inside the token file; a lint rule should reject them elsewhere."),
        ("Let the parent own the gap", "Containers set gap (CSS gap, VStack spacing, Arrangement.spacedBy). Components ship with padding and no outer margin."),
        ("Format money once", "Use one shared formatter: en-IN grouping, U+2212 minus, tabular figures. Never build an amount string by hand."),
        ("Run the gates", "python tools/build_tokens.py fails below WCAG AA. Open site/proof.html to confirm every rendered colour and size resolves to a token."),
    ],
    "files": [
        ("tokens/tokens.json", "All tokens, light and dark, with deprecated aliases."),
        ("docs/stage-1…5", "The full written spec, generated from the same source as this site."),
        ("docs/governance.md", "Naming, versioning, deprecation and how to propose a change."),
        ("CHANGELOG.md", "What changed in each version and how to migrate."),
        ("figma-plugin/", "The plugin that rebuilds the Figma library from tokens.json."),
    ],
}

# Lifecycle shown on the components page. (stage, meaning)
LIFECYCLE = [
    ("Proposed", "Needed by a real screen, spec written, not yet built. Don't use in production."),
    ("Beta", "Built and usable. The API or visuals may still change in a minor release."),
    ("Stable", "Changes only through the governance process. Breaking changes need a major version."),
    ("Deprecated", "Still works, has a replacement, and will be removed in the next major."),
]

# component id or name -> (status, platforms, since, note). Platforms: i = iOS, a = Android, w = web.
STATUS = {
    "button": ("Stable", "iaw", "1.0.0", ""), "icon-button": ("Stable", "iaw", "1.0.0", ""),
    "text-input": ("Stable", "iaw", "1.0.0", ""), "amount-input": ("Stable", "iaw", "1.0.0", ""),
    "select": ("Stable", "iaw", "1.0.0", ""), "checkbox": ("Stable", "iaw", "1.0.0", ""),
    "radio": ("Stable", "iaw", "1.0.0", ""), "toggle": ("Stable", "iaw", "1.0.0", ""),
    "segmented": ("Stable", "iaw", "1.0.0", ""), "tabs": ("Stable", "iaw", "1.0.0", ""),
    "chip": ("Stable", "iaw", "1.0.0", ""), "avatar": ("Stable", "iaw", "1.0.0", ""),
    "badge": ("Stable", "iaw", "1.0.0", ""), "tooltip": ("Stable", "w", "1.0.0", "Web only. Touch uses long-press labels or inline help."),
    "card": ("Stable", "iaw", "1.0.0", ""), "list-item": ("Stable", "iaw", "1.0.0", ""),
    "bottom-sheet": ("Stable", "ia", "1.0.0", "Web uses Modal dialog or a side panel."),
    "modal": ("Stable", "iaw", "1.0.0", ""), "snackbar": ("Stable", "iaw", "1.0.0", ""),
    "inline-alert": ("Stable", "iaw", "1.0.0", ""), "banner": ("Stable", "iaw", "1.0.0", ""),
    "skeleton": ("Stable", "iaw", "1.0.0", ""), "empty-state": ("Stable", "iaw", "1.0.0", ""),
    "bottom-nav": ("Stable", "ia", "1.0.0", "Web uses Side navigation."), "app-bar": ("Stable", "iaw", "1.0.0", ""),
    "back-close": ("Stable", "iaw", "1.0.0", ""), "search": ("Beta", "iaw", "1.0.0", "Result grouping may change once search ranking is tested."),
    "balance-card": ("Stable", "iaw", "1.0.0", ""), "transaction-row": ("Stable", "iaw", "1.0.0", ""),
    "category-picker": ("Stable", "iaw", "1.0.0", ""), "budget-bar": ("Stable", "iaw", "1.0.0", ""),
    "goal-card": ("Stable", "iaw", "1.0.0", ""), "charts": ("Beta", "iaw", "1.0.0", "Chart types beyond bar, line and donut are not specified yet."),
    "date-range": ("Beta", "iaw", "1.0.0", "Custom ranges across financial years still need testing."),
    "keypad": ("Stable", "ia", "1.0.0", "Web uses the hardware keyboard with Amount input."),
}
PROPOSED = [
    ("Insight card", "iaw", "Found missing while building the Home screen (Stage 5)."),
    ("Upcoming bill row", "iaw", "Found missing on Home and Budget detail (Stage 5)."),
    ("Sync status line", "iaw", "Found missing on Home and Activity (Stage 5)."),
    ("Period summary", "iaw", "Found missing on the Transactions list (Stage 5)."),
    ("Side navigation", "w", "The web dashboard's replacement for the bottom nav bar."),
]

# "Which component should I use?" Each: (question, intro, decision steps, quick reference)
CHOOSERS = [
    {
        "id": "choose-selection", "title": "Picking from options",
        "intro": "Toggle, checkbox, radio, chips, segmented control, tabs and dropdown can all look like 'choose something'. Pick by how the choice behaves, not how it looks.",
        "steps": [
            ("Is it a single on/off that applies straight away?", "Toggle"),
            ("Is it a single yes/no that waits for a Save or Continue?", "Checkbox"),
            ("Can several be picked at once?", "Chips (short labels) or Checkboxes (long labels)"),
            ("Does picking switch to a different panel of content?", "Tabs"),
            ("Does picking re-filter or re-draw the same content (2–5 short options)?", "Segmented control"),
            ("Is it one value from 2–5 options submitted with a form?", "Radio (long labels) or Chips (short labels)"),
            ("More than 5 options?", "Dropdown / select. Add search above 10."),
        ],
        "reference": [
            ("Toggle", "Notifications on/off, hide balances. Applies instantly, no Save button."),
            ("Checkbox", "'Include transfers in spending' in a form; accepting terms."),
            ("Radio", "Budget period: monthly, every pay day, custom."),
            ("Chips", "Filter Activity by category; quick amounts ₹100 ₹500 ₹1,000."),
            ("Segmented control", "Chart view: week, month, year. Same data, different grouping."),
            ("Tabs", "Budgets / Goals: separate sections with their own content."),
            ("Dropdown / select", "Pick a bank account; pick a category from 20+."),
            ("Category picker", "Choosing a spending category. A finance component, use it instead of a generic dropdown."),
        ],
    },
    {
        "id": "choose-feedback", "title": "Telling people something",
        "intro": "Toast, inline alert, banner, dialog and bottom sheet all deliver messages. Pick by how urgent it is and how long it should stay.",
        "steps": [
            ("Is it confirming something the person just did?", "Toast / snackbar (with Undo if reversible)"),
            ("Is it about one part of the screen (a field, a card)?", "Inline alert, placed next to that part"),
            ("Does it affect the whole app until it's fixed (sync paused, KYC needed)?", "Banner at the top of the screen"),
            ("Must they decide before anything else can happen?", "Modal dialog (web) or bottom sheet (mobile)"),
            ("Is it a tip they can ignore?", "Insight card (proposed) in the feed, never a pop-up"),
        ],
        "reference": [
            ("Toast / snackbar", "'Expense added. Undo'. Leaves on its own after 4–6 seconds."),
            ("Inline alert", "'This budget is close to its limit.' Stays until the cause changes."),
            ("Banner", "'Bank sync paused. Reconnect HDFC.' Stays across screens until fixed."),
            ("Modal dialog", "'Delete this budget? Its history goes too.' Blocks until answered."),
            ("Bottom sheet", "Choose how to split a bill. Task-focused, dismissible by swipe."),
            ("Empty state", "Nothing to show yet. Explains the space and offers the first action."),
        ],
    },
    {
        "id": "choose-money", "title": "Showing an amount",
        "intro": "Amounts are the product. Each display has one job; using the wrong one changes what the number means.",
        "steps": [
            ("Is it the one number that answers 'am I okay?'", "Balance card with type/amount/hero"),
            ("Is it progress against a limit?", "Budget progress bar (fill + clearance line), never a plain progress bar"),
            ("Is it progress towards saving?", "Savings goal card"),
            ("Is it one transaction?", "Transaction row with type/amount/md"),
            ("Is it being typed?", "Amount input with the number keypad (mobile)"),
            ("Is it inside a sentence?", "type/amount/sm, same formatter, no colour"),
        ],
        "reference": [
            ("Balance card", "₹18,450 left to spend. One per screen."),
            ("Budget progress bar", "Food: ₹8,200 of ₹10,000."),
            ("Savings goal card", "Goa trip: ₹32,000 of ₹50,000."),
            ("Transaction row", "Swiggy −₹386."),
            ("Amount input", "Adding an expense or setting a limit."),
        ],
    },
]

A11Y = [
    ("Contrast", "Text 4.5:1, large text and UI 3:1, in both modes. Enforced by the build (180 pairings)."),
    ("Never colour alone", "Every colour change also changes a sign, icon or word: −₹386, ▲ ₹740 over, 'Close to limit'."),
    ("Tap targets", "48×48 minimum everywhere; targets may touch, small visuals keep space/200 between hit areas."),
    ("Focus", "2px color/border/focus ring with 2px offset on every interactive element, keyboard only (:focus-visible)."),
    ("Screen readers and money", "Amounts are announced as words a person would say: 'minus 386 rupees', '18 thousand 450 rupees left'. Never read '₹' as 'rupee sign'. Gauges expose their value as text."),
    ("Text size", "Supports Dynamic Type, Android font scale and 200% browser zoom. Text-to-text spacing scales; layouts reflow instead of truncating amounts."),
    ("Reduced motion", "Spatial motion becomes a crossfade; fills appear at their final value. Respects the OS setting, with an in-app override."),
    ("Skip link (web)", "The first focusable element on every page is 'Skip to content', visually hidden until focused."),
    ("Visually hidden text", "Use a visually-hidden class (not display:none) for labels that only screen readers need, like an icon button's name or a chart's summary."),
    ("Sensitive data", "Hidden balances are announced as 'Balance hidden', never as asterisks."),
]

FAQ = [
    ("Can I use a primitive colour or space directly?", "No. Use the semantic token for the purpose. If none fits, that's a missing token: propose it (see Governance)."),
    ("The colour I need doesn't exist. What now?", "Check whether an existing semantic token already means it. If not, open a proposal with two real uses. One-off colours stay out of the system."),
    ("Why aren't expenses red?", "Spending is normal. Red only appears when you go over a limit you set. The − sign carries the meaning."),
    ("iOS asks for 44pt targets, Android for 48dp. Which do we use?", "48 everywhere. It satisfies both and keeps one rule."),
    ("Why does the web use Anek Latin for body text but phones don't?", "Phones use SF Pro and Roboto for Dynamic Type and a native feel. The brand face appears where the brand lives: amounts and titles."),
    ("Can I change a token's value?", "Yes, as a patch, if every contrast pairing still passes. Renaming or changing its meaning is a major release."),
    ("How do I know if a component is ready?", "Check its status on the components page. Stable is safe; Beta may change in a minor release; Proposed isn't built."),
    ("Where do icons come from?", "Not Boring Icons. Missing ones are listed in docs/icon-inventory.md; stand-ins are marked until the real icon ships."),
]
