"""Headroom Stage 3: content and voice.

Single source for docs/stage-3-content.md and site/content.html.
All names, merchants and amounts are synthetic.
"""

VOICE = {
    "summary": "Headroom sounds like a calm friend who's good with money: someone who tells you where you stand, never makes you feel bad about it, and always points to the next small thing you can do.",
    "pillars": [
        ("Calm", "not alarming", "State facts before feelings. A crossed limit is information with a next step, never an emergency.", "₹740 over in Shopping. Your other budgets still have ₹6,200 of room.", "⚠️ You've BLOWN your Shopping budget!"),
        ("Friendly", "not cutesy", "Warm, plain words. No jokes about money, no emoji in system copy, no fake excitement.", "Nice. ₹5,000 moved to Goa trip.", "Woohoo! 🎉 You're a savings superstar!!"),
        ("Clear", "not clever", "Lead with the number or the action. Short sentences. One idea per message.", "₹1,800 left for food this month.", "Your culinary allocation is approaching its threshold."),
        ("Trustworthy", "not corporate", "Specific, honest about limits and what we can't do. No legalese in the UI; link to it.", "We can see your transactions, but we can never move your money.", "Headroom leverages bank-grade security to empower your financial journey."),
    ],
    "never": [
        "Moral words about spending: bad, guilty, failed, blew, splurge, wasted, damage, naughty, treat yourself.",
        "Alarm words: warning, alert, danger, urgent, critical (in user-facing text), and ALL CAPS.",
        "Exclamation marks, except the single 'Goal reached!' moment.",
        "Emoji in system copy. Icons do that job.",
        "'Oops', 'Uh-oh', 'Whoops'. Errors aren't cute when they're about money.",
        "'Simply', 'just', 'easy', 'quick'. They make people who struggle feel worse.",
        "Comparisons to other people ('You spend more than 80% of users').",
        "Blaming the user ('You entered an invalid amount').",
    ],
}

TONE = [
    # moment, how it feels, dial (0 calm-neutral .. 3 warm), example
    ("Routine (balances, lists)", "Neutral, almost invisible. Numbers do the talking.", "Food and dining · ₹8,200 of ₹10,000"),
    ("Success", "Quiet confirmation in past tense. No celebration for ordinary tasks.", "Expense added"),
    ("Close to a limit", "Informative and forward-looking: what's left and what it means per day.", "₹1,800 left for food. That's about ₹138 a day until 31 Oct."),
    ("Over a limit", "Matter-of-fact, never shaming. Show the size, then the room elsewhere, then one option.", "₹740 over in Shopping. You still have ₹6,200 across other budgets."),
    ("Error we caused", "Own it, say what's safe, say what happens next.", "We couldn't sync with HDFC. Your data is safe, and we'll try again in a few minutes."),
    ("Error in input", "Point at the field, say how to fix it, no blame.", "Enter an amount above ₹0"),
    ("Empty", "Inviting, specific, small first step.", "Add your first expense. It takes about five seconds."),
    ("Money is tight", "Gentlest register. No streaks, no nudges to 'do better', options over advice.", "This month's been heavier than usual. Want to move ₹2,000 from Fun to Food?"),
    ("Goal reached", "The one warm, celebratory moment. One exclamation allowed.", "Goal reached! You saved ₹45,000 for your new phone."),
]

MECHANICS = [
    ("Case", "Sentence case for everything: buttons, titles, tabs, labels. Proper nouns keep their capitals (HDFC, UPI, Swiggy)."),
    ("Person", "Talk to the user as 'you'. The product speaks as 'we' only when owning something ('We couldn't sync'). Never 'I'. Never 'my' in labels ('Your goals', not 'My goals')."),
    ("Contractions", "Use them: you're, it's, can't, we'll. They're what calm, friendly sounds like."),
    ("Length", "Titles ≤ 5 words. Messages ≤ 2 short sentences. Buttons 1–3 words, verb first."),
    ("Buttons", "Name the outcome: 'Add expense', 'Set limit', 'Delete goal'. Never 'OK', 'Submit', 'Yes'. Include the amount when it's the confirmation: 'Add ₹386 expense'."),
    ("Punctuation", "No full stop on titles, buttons, labels or single-sentence toasts. Full stops in body text. Serial comma. Spell out 'and'; no ampersands. Ellipsis only for in-progress states ('Saving…')."),
    ("Spelling", "Indian English: cheque, programme, organise, colour, centre. 'Salary', not 'paycheck'. 'Account', not 'checking'."),
    ("Numbers in text", "Numerals for all amounts, counts and dates ('3 bills', not 'three bills'). Spell out only to start a sentence, and rewrite to avoid it."),
    ("Hinglish", "Not in product UI by default, so screen readers and translation stay reliable. Marketing may use it."),
]

GUIDES = [
    {
        "id": "overspend", "title": "Overspending warnings",
        "rules": [
            "Order: where you stand → what it means → one optional action. Never lead with the problem word.",
            "Warn at 80% of a limit ('close to limit') and when the limit is crossed. Nothing more often, no daily nagging.",
            "Always show the size of the overspend as a number, not an adjective.",
            "Point to room elsewhere when it exists. It turns a dead end into a choice.",
            "Never suggest the user was wrong. The limit is a plan, and plans change.",
        ],
        "examples": [
            ("Close to limit (in-app)", "₹1,800 left for food. That's about ₹138 a day until 31 Oct.", "Careful! You've almost used up your Food budget."),
            ("Close to limit (push)", "Food: ₹1,800 left for 13 days", "⚠️ Food budget warning!"),
            ("Over limit (in-app)", "₹740 over in Shopping. You still have ₹6,200 across other budgets. Move some over?", "You overspent on Shopping by ₹740. Try to cut back."),
            ("Over limit (push)", "Shopping is ₹740 over its limit", "You've blown your Shopping budget 😬"),
            ("Over the monthly limit", "October is ₹1,240 over your monthly limit. Next month's limit stays the same unless you change it.", "You failed to stay within budget this month."),
            ("Same category over again", "Shopping has gone over its limit 3 months in a row. Raise the limit to ₹7,500?", "You keep overspending on Shopping."),
        ],
    },
    {
        "id": "errors", "title": "Errors",
        "rules": [
            "Say what happened, in plain words, then what to do. One or two sentences.",
            "Reassure about money first when it's at stake: nothing was charged, nothing was lost.",
            "Own system errors with 'we'. Never blame the user for input; tell them what works.",
            "Never show codes alone. A code goes after the message for support ('Code 504').",
        ],
        "examples": [
            ("Network", "You're offline. Changes are saved on your phone and will sync when you're back.", "Network error. Please try again."),
            ("Bank sync", "We couldn't reach HDFC right now. Your data is safe. We'll try again in a few minutes.", "Sync failed (ERR_AA_504)."),
            ("Bank consent expired", "Your HDFC connection expired after 12 months. Reconnect to keep transactions coming in.", "Consent revoked. Action required."),
            ("Amount input", "Enter an amount above ₹0", "Invalid amount!"),
            ("Duplicate", "This looks like the ₹386 Swiggy expense from today. Add it anyway?", "Duplicate transaction detected."),
            ("Permission", "To scan receipts, allow camera access in Settings.", "Camera permission denied."),
        ],
    },
    {
        "id": "empty", "title": "Empty states",
        "rules": [
            "Headline names the space or the first action. Body says why it's worth it in one line. One button.",
            "Never apologise ('Nothing here yet!'), never guilt ('You haven't saved anything').",
            "No-results states say what was searched and offer the way out (Clear filters).",
        ],
        "examples": [
            ("Transactions, first use", "Add your first expense · Track one thing you bought today. It takes about five seconds.", "No transactions yet!"),
            ("Goals, first use", "Save for something · A trip, an emergency fund, a new phone. Start with any amount.", "You have no goals."),
            ("Budgets, first use", "Set a monthly limit · We'll show how much room you have left as the month goes on.", "Create a budget to start budgeting."),
            ("Search, no results", "No results for “zomatto” · Check the spelling or search all time.", "0 results found."),
            ("Bills, nothing due", "No bills due this week · Next up: rent on 1 Nov.", "Empty."),
        ],
    },
    {
        "id": "success", "title": "Success messages",
        "rules": [
            "Past tense, noun first, no 'successfully': 'Expense added'.",
            "Include the number when it helps: 'Saved ₹5,000 to Goa trip'.",
            "Offer Undo for reversible actions instead of asking first.",
            "Celebrate once, only for goals reached. Everything else is a quiet confirmation.",
        ],
        "examples": [
            ("Add expense", "Expense added", "Your expense was successfully added!"),
            ("Move to goal", "Saved ₹5,000 to Goa trip · 63% there", "Awesome!! Money moved 🎉"),
            ("Delete transaction", "Transaction deleted · Undo", "Are you sure? This action is permanent."),
            ("Limit changed", "Food limit is now ₹12,000 from November", "Budget updated successfully."),
            ("Goal reached", "Goal reached! You saved ₹45,000 for your new phone.", "Congratulations, financial wizard!!!"),
        ],
    },
]

FORMAT_MONEY = [
    ("Symbol", "₹ before the number with no space: ₹1,250. Never 'Rs', 'INR' or '₹ 1,250' in the UI. Use 'INR' only in exports and next to other currencies."),
    ("Grouping", "Indian system: 1,250 · 12,500 · 1,25,000 · 12,50,000 · 1,25,00,000. Use Intl.NumberFormat('en-IN') / NumberFormatter with en_IN; never hand-roll commas."),
    ("Paise", "Hidden in lists, totals and charts (rounded to the rupee). Shown in transaction detail and while typing: ₹386.50. Always 2 digits when shown: ₹386.50, never ₹386.5."),
    ("Sign", "Expenses: U+2212 minus before the symbol: −₹386. Income: plus: +₹84,500. Balances and limits: no sign. Transfers to goals: no sign + 'Saved' tag."),
    ("Zero", "₹0. Not '–', not 'Nil', not 'None'."),
    ("Large amounts", "Write in full wherever there's room. Abbreviate only in chart axes and chips: ₹1.2L (lakh), ₹3.4Cr (crore), 1 decimal, no trailing .0 (₹2L). Thousands below a lakh: ₹52k on axes only."),
    ("Ranges", "En dash, symbol on both sides: ₹500–₹1,000."),
    ("Hidden", "₹ ••••• (five dots regardless of length, so length doesn't leak the amount)."),
    ("Screen readers", "Read as currency: '−₹386' → 'minus three hundred eighty-six rupees'. '₹1.2L' → 'one point two lakh rupees'. Set accessibility labels from the raw value, not the display string."),
    ("Alignment", "Right-aligned, tabular figures (type/amount/*) in lists and tables."),
]
FORMAT_PERCENT = [
    ("Default", "Whole numbers: 82%. No space before %."),
    ("Small values", "Below 1% shows '<1%', never '0%' for a non-zero share."),
    ("Rates", "Interest and returns keep up to 2 decimals as quoted: 7.25%."),
    ("Change", "Arrow + sign + words: '↓ 12% less than September', '↑ 8% more'. Never colour alone; never 'pp'."),
    ("Prefer amounts", "When a percentage hides the real size, lead with the amount: '₹1,800 left' beats '18% left'. Percentages support, they don't lead."),
    ("Over 100%", "Don't show 112% for a budget. Say '₹740 over'."),
]
FORMAT_DATE = [
    ("Default", "D MMM YYYY: 18 Oct 2026. No leading zero on the day, no ordinals (not 18th), no slashes (18/10 is ambiguous across locales)."),
    ("Current year", "Drop the year: 18 Oct."),
    ("Relative", "Today, Yesterday, then the weekday for the past 6 days (Monday), then the date. Never '2 days ago' for money (it changes while you look at it)."),
    ("Time", "12-hour with lowercase am/pm and a space: 1:42 pm. Midnight 12:00 am."),
    ("Months", "Full name in titles: October 2026. Short in tight spaces: Oct."),
    ("Ranges", "En dash, shared parts once: 1–31 Oct · 28 Sep – 4 Oct · Dec 2026 – Mar 2027."),
    ("Budget periods", "Name the period, not the dates, when it's the current one: 'This month', 'October'. Show dates when the period starts on payday: '1 Oct – 31 Oct'."),
    ("Countdown", "'13 days left'. 'Last day' on the final day. Never '0 days left'."),
]
GLOSSARY = [
    ("Headroom", "Money left under the monthly limit. The product's word for 'available to spend'.", "Balance, available, remaining budget"),
    ("Limit", "The amount the user plans to spend in a category or month.", "Budget amount, cap, allowance, threshold"),
    ("Spent", "Money out in the period.", "Expenses total, outflow, burn"),
    ("Left", "Limit minus spent, for a category.", "Remaining, available balance"),
    ("Over", "Spent beyond a limit, always with the amount: '₹740 over'.", "Overspent, exceeded, breach, deficit"),
    ("Close to limit", "80% or more of a limit used.", "Warning, almost out, danger zone"),
    ("Goal", "Something the user is saving toward.", "Pot, jar, vault, target"),
    ("Saved", "Money moved toward a goal.", "Invested, deposited, stashed"),
    ("Income", "Money in: salary, refunds, transfers in.", "Earnings, credits, inflow"),
    ("Expense", "Money out.", "Debit, spend, purchase"),
    ("Category", "The label on a transaction: Food and dining.", "Tag, bucket, envelope"),
]

DECISIONS = [
    ("Overspending is reported as a number and an option, never as a judgment",
     "Every over-limit message follows the same order: where you stand, what it means, one optional action ('₹740 over in Shopping. You still have ₹6,200 across other budgets. Move some over?'). "
     "Behavioural finance calls the avoidance pattern the ostrich effect (Karlsson, Loewenstein and Seppi, 2009): people look at their money less when the news is bad, which means they stop opening a finance app exactly when it's most useful. Judgmental copy makes the news feel worse; factual copy keeps Headroom openable on bad months. "
     "The banned-words list makes the rule testable in content review, not a matter of taste."),
    ("One product word for money left: 'headroom'",
     "Fintech apps use 'balance', 'available', 'remaining' and 'safe to spend' interchangeably, often for different calculations on the same screen. Headroom defines one term for one calculation (limit minus spent) and a glossary that bans the synonyms. "
     "The name, the visual signature (the clearance gauge) and the vocabulary now point at the same idea, so the brand becomes a mental model, not just a logo."),
    ("Absolute dates, no '2 days ago'; Indian grouping, no Western commas",
     "Relative times drift while you look at them and are ambiguous for money (when was the payment, exactly?). Headroom uses Today and Yesterday, then weekday names for the past week, then absolute dates in D MMM format that can't be misread across locales. "
     "Amounts use lakh/crore grouping because that's how users read their bank statements and salary slips; 1,00,000 written as 100,000 makes people re-count digits on the most important number on the screen."),
]
