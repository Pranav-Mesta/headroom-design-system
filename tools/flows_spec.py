"""Headroom Stage 6: end-to-end user flows.

Single source for docs/stage-6-flows.md and the Flow pages in Figma (figma-plugin, buildFlows).
Each flow lists its screens in order. kind: "main" (happy path) or "edge" (a state the happy path
can fall into). links: (hotspot, target screen id) — the Figma builder turns these into prototype
connections, so the flows click through end to end.

Every screen follows Stage 4 patterns and Stage 3 voice. All data is synthetic:
Riya, salaried in Bengaluru, ₹84,500 take-home, monthly limit ₹52,000. Today is Sunday 18 Oct 2026.
"""

PERSONA = {
    "name": "Riya", "age": 27, "city": "Bengaluru", "job": "Product analyst",
    "income": "₹84,500 take-home, paid on the 1st",
    "limit": "₹52,000 monthly limit", "today": "Sunday 18 Oct 2026 (13 days left)",
    "spent": "₹33,550 spent · ₹18,450 headroom",
    "bank": "HDFC Savings ••4821", "phone": "+91 98765 43210",
}

FLOWS = [
# ------------------------------------------------------------------ 1
{
 "id": "F1", "name": "Welcome and sign in",
 "goal": "Get a new person from install to a secured account in under a minute, and a returning person back into their money in one glance.",
 "measure": "Install → signed in < 60s (median) · OTP success on first code ≥ 90% · returning unlock < 2s.",
 "entry": ["First launch after install", "Returning launch (app lock)", "Signed out on a new phone"],
 "screens": [
  ("1.01", "Welcome", "main", "One promise and a labelled example gauge. Value before any ask: no account wall.", [("primary", "1.02"), ("secondary", "1.02")]),
  ("1.02", "Phone number", "main", "+91 fixed prefix, numeric keypad, the reason for the number in one line. Google and Apple sign-in sit below as equals.", [("primary", "1.04")]),
  ("1.03", "Phone number · invalid", "edge", "Validated on Continue, not while typing. The message says what a valid number looks like.", [("primary", "1.04")]),
  ("1.04", "Enter code", "main", "Six boxes that accept autofill and paste. Resend unlocks after 30s with a visible timer; 'Change number' is always there.", [("primary", "1.07")]),
  ("1.05", "Enter code · wrong", "edge", "Says how many tries are left. Boxes clear and refocus so the next attempt is one motion.", [("primary", "1.07")]),
  ("1.06", "Enter code · locked", "edge", "After 5 wrong codes: a 10-minute wait with the exact time it lifts, plus a call-me fallback and help. No dead end.", [("primary", "1.04"), ("secondary", "1.02")]),
  ("1.07", "Your name", "main", "Optional and skippable. Used only for greetings; never shown in notifications.", [("primary", "1.08"), ("secondary", "1.08")]),
  ("1.08", "Lock Headroom", "main", "App lock recommended and preselected. One line of why. 'Not now' is visible, not hidden.", [("primary", "2.01"), ("secondary", "2.01")]),
  ("1.09", "Unlock (returning)", "main", "Returning launch: the system biometric prompt over a blurred app, so no money is visible until unlocked.", [("primary", "4.01"), ("secondary", "1.10")]),
  ("1.10", "PIN · wrong", "edge", "Biometrics failed or declined: 4-digit app PIN. Tries left are stated; after 5, sign in again with a code.", [("secondary", "1.02")]),
 ],
 "edges": [
  ("Number isn't 10 digits or doesn't start with 6–9", "1.03"),
  ("Wrong code", "1.05"),
  ("Five wrong codes in a row", "1.06"),
  ("Code never arrives", "1.04 (resend after 30s, then 'Call me with the code')"),
  ("Biometrics fail, are declined or not set up", "1.10"),
  ("Forgot app PIN", "1.10 → sign in again with a code (1.02); data is kept"),
  ("Offline when sending the code", "Inline alert on 1.02: 'You're offline. Connect to get your code.' Continue stays enabled and retries."),
 ],
 "a11y": ["The code field is one input with autocomplete=one-time-code, drawn as six boxes; screen readers hear 'Code, 6 digits'.", "The resend timer is announced once when it ends, not every second.", "Focus starts on the phone field; Continue is reachable without scrolling with the keyboard open."],
},
# ------------------------------------------------------------------ 2
{
 "id": "F2", "name": "Connect a bank",
 "goal": "Earn enough trust to connect a bank through India's Account Aggregator system, and make 'add by hand' an equal, guilt-free choice.",
 "measure": "Bank connect opt-in ≥ 55% · consent drop-off at the AA step < 25% · manual-only users still reach their first headroom.",
 "entry": ["Onboarding, after app lock", "Home card 'Connect a bank to import automatically'", "Settings → Connected banks → Add a bank"],
 "screens": [
  ("2.01", "Why connect", "main", "What we can see, what we can never do ('We can never move money'), and how to revoke. 'Add expenses myself' has equal weight.", [("primary", "2.02"), ("secondary", "3.01")]),
  ("2.02", "Choose your bank", "main", "Search first; the five most-used banks as one-tap tiles; everything else in a list.", [("primary", "2.03")]),
  ("2.03", "Review what you share", "main", "Headroom's side of the consent, in plain words: what data, how far back, how often, for how long, and why.", [("primary", "2.04"), ("secondary", "2.01")]),
  ("2.04", "Approve with your Account Aggregator", "main", "Shown as the AA's own screen (outside Headroom) so the hand-off is honest. Pick accounts, approve with the code sent by the AA.", [("primary", "2.05"), ("secondary", "2.08")]),
  ("2.05", "Importing", "main", "Three named steps with progress. Safe to leave: 'We'll let you know when it's ready.'", [("primary", "2.06")]),
  ("2.06", "Imported", "main", "What arrived, from which account, over what period. Leads straight into setting a budget from real numbers.", [("primary", "3.01")]),
  ("2.07", "Bank not responding", "edge", "The bank is down, not the user's fault. Retry, try another bank, or carry on by hand. Nothing typed is lost.", [("primary", "2.05"), ("secondary", "3.01")]),
  ("2.08", "No accounts shared", "edge", "Consent declined or no accounts found for this number. Explains both, offers to try again or continue by hand.", [("primary", "2.02"), ("secondary", "3.01")]),
 ],
 "edges": [
  ("Bank's servers are down or slow", "2.07"),
  ("User declines consent in the AA app", "2.08"),
  ("No accounts linked to this phone number", "2.08 (copy names the number used)"),
  ("Only some accounts imported", "2.06 lists each account with its own status; failed ones get Retry"),
  ("User leaves during import", "Import continues; a notification says when it's ready"),
  ("Consent expires after a year", "Banner on Home 30 days before, with Renew (F10 · Connected banks)"),
 ],
 "a11y": ["The 'what we can never do' line is real text, not an image, and read before the button.", "Bank tiles have names, not just logos.", "Import progress is a live region that announces each finished step."],
},
# ------------------------------------------------------------------ 3
{
 "id": "F3", "name": "Set up your month",
 "goal": "Turn real spending into a first monthly limit the person believes, and show their headroom within two minutes of install.",
 "measure": "≥ 70% finish setup · ≥ 60% keep the suggested limit (suggestions feel realistic) · time to first headroom < 2 min.",
 "entry": ["After a bank import (F2)", "After 'Add expenses myself' (no history)", "Budgets tab empty state"],
 "screens": [
  ("3.01", "Where your money went", "main", "Last 3 months by category, before asking anything. The suggestion on the next screen comes from this.", [("primary", "3.02")]),
  ("3.02", "When does your month start?", "main", "Payday or calendar month. Decides when headroom resets; can change later.", [("primary", "3.03")]),
  ("3.03", "Set your monthly limit", "main", "One number, with its source visible ('You spent about ₹48,200 a month'). A live gauge preview fills as you type.", [("primary", "3.05")]),
  ("3.04", "Limit above income", "edge", "Allowed, but said plainly: 'That's ₹3,500 more than you earn in a month.' Information, not a block.", [("primary", "3.05"), ("secondary", "3.03")]),
  ("3.05", "Split into categories", "main", "Pre-filled from history and editable. Unassigned money stays as headroom, and that's fine.", [("primary", "3.06")]),
  ("3.06", "Your headroom", "main", "First Home. A one-time coach mark explains the gauge. Everything else is introduced later by its empty state.", [("primary", "4.01")]),
 ],
 "edges": [
  ("No history (manual-only user)", "3.03 asks for monthly take-home pay and suggests 70% of it, labelled as a starting point"),
  ("Limit higher than income", "3.04"),
  ("Category limits add up to more than the monthly limit", "3.05 shows '₹2,000 more than your monthly limit' as information"),
  ("Setup starts mid-month", "3.06 asks whether to count spending since the 1st"),
  ("User skips setup", "Home shows the gauge empty state: 'Set a monthly limit to see your headroom'"),
 ],
 "a11y": ["Category chart has a table alternative.", "The live gauge preview is described in words: 'Limit ₹52,000, about ₹4,800 a week'."],
},
# ------------------------------------------------------------------ 4
{
 "id": "F4", "name": "Daily check-in",
 "goal": "Answer 'am I okay this month?' in one glance, every time, including when the data is old, hidden or offline.",
 "measure": "Median session < 15s (the glance works) · ≥ 4 opens a week in month 2 · zero sessions with a blank Home.",
 "entry": ["Opening the app", "Tapping a notification", "Home-screen widget"],
 "screens": [
  ("4.01", "Home", "main", "Headroom first, then what needs attention: closest budgets, upcoming bills, recent activity.", [("fab", "5.01"), ("budget", "6.02"), ("eye", "4.02")]),
  ("4.02", "Home · balances hidden", "main", "Every amount masked; the gauge keeps its shape so 'roughly okay' survives in public. Press and hold to peek.", [("eye", "4.01")]),
  ("4.03", "Home · offline", "edge", "Last known numbers with their age. Adds still work and queue. Nothing goes blank.", [("fab", "5.01")]),
  ("4.04", "Home · loading", "edge", "Skeleton in the exact shape of Home, shown only after 300ms. Fast loads just appear.", [("primary", "4.01")]),
  ("4.05", "Lock-screen notification", "main", "No amounts on the lock screen by default. Opens the budget it's about.", [("notif", "6.02")]),
 ],
 "edges": [
  ("No connection", "4.03"),
  ("Data older than 6 hours", "'Updated 7h ago' turns into a quiet prompt to refresh"),
  ("Bank consent expired", "Warning banner on Home with Reconnect (F10)"),
  ("Slow first load", "4.04"),
  ("Balances hidden in public", "4.02"),
 ],
 "a11y": ["The gauge is announced as a sentence: 'Headroom ₹18,450 of ₹52,000. On track.'", "Hidden amounts are announced as 'hidden', never as dots.", "Offline is announced once, politely."],
},
# ------------------------------------------------------------------ 5
{
 "id": "F5", "name": "Add and fix an expense",
 "goal": "Log an expense in under 8 seconds with 3 taps, see its consequence before saving, and fix mistakes without fear.",
 "measure": "Median tap → saved < 8s · Undo used on < 5% of adds (few mistakes) · zero lost entries offline.",
 "entry": ["Add button on Home and Activity", "Payment detected notification", "Widget or app-icon shortcut"],
 "screens": [
  ("5.01", "Add expense · empty", "main", "Keypad ready, Expense selected, today and the last account preset. The context line names the budget it lands in. Typing moves on; saving at ₹0 shows the hint.", [("keys", "5.02"), ("primary", "5.05")]),
  ("5.02", "Add expense · typed", "main", "Consequence before commitment: '₹1,414 left in Food after this'. Three suggested categories; one tap.", [("primary", "5.04"), ("secondary", "5.03")]),
  ("5.03", "More details", "main", "Merchant, note, date, account and repeat, each with its last-used default. Optional, never required.", [("primary", "5.04")]),
  ("5.04", "Saved", "main", "The row lands in Recent activity, the gauge moves, and Undo stays for 8 seconds.", [("primary", "4.01")]),
  ("5.05", "Enter an amount first", "edge", "Save was pressed at ₹0. The keypad gets focus and the hint says what to do; no dialog.", [("keys", "5.02")]),
  ("5.06", "Looks like a duplicate", "edge", "Same amount, same merchant, same day as an imported payment. Ask once; default to not adding twice.", [("primary", "5.04"), ("secondary", "4.01")]),
  ("5.07", "Saved offline", "edge", "Saved on the phone with a 'Not synced' tag. It syncs on its own; no error shown.", [("primary", "4.01")]),
  ("5.08", "Payment detected", "main", "From the bank import: 'Paid ₹386 to Swiggy?' Choose a category in one tap, right from the sheet.", [("primary", "5.04")]),
  ("5.09", "Expense detail", "main", "Everything about one expense, every field editable, delete at the bottom.", [("primary", "5.10")]),
  ("5.10", "Deleted · undo", "main", "Reversible, so no dialog: it's gone at once, with Undo for 8s and 30 days in Recently deleted.", [("primary", "5.09")]),
  ("5.11", "Pick a date", "main", "Calendar in a sheet. Today is preselected; future dates make it a scheduled expense.", [("primary", "5.03")]),
  ("5.12", "Pay from", "main", "Accounts and cash as one list. The last-used account stays the default next time.", [("primary", "5.03")]),
  ("5.13", "Repeat", "main", "For rent, subscriptions and EMIs. Repeating expenses show up in Coming up on Home.", [("primary", "5.03")]),
 ],
 "edges": [
  ("Amount is ₹0", "5.05"),
  ("Looks like a duplicate of an import", "5.06"),
  ("Offline", "5.07"),
  ("Over ₹10,00,000", "Soft check 'Check the number?' under the amount, never a block"),
  ("Swipe down with an amount entered", "'Discard this expense?' dialog with Keep editing focused"),
  ("Future date", "Becomes a scheduled expense; it doesn't touch headroom until that day"),
  ("Expense pushes a budget over", "Context line says '₹186 over Food after this' in words; saving is still allowed"),
 ],
 "a11y": ["Focus starts on the amount; the keypad also accepts a hardware keyboard.", "The consequence line is a polite live region.", "Undo stays longer when a screen reader is on."],
},
# ------------------------------------------------------------------ 6
{
 "id": "F6", "name": "Going over a budget",
 "goal": "Warn early, stay calm when a limit is crossed, and offer a fix in two taps without shaming.",
 "measure": "≥ 40% of over-budget moments end with a fix (move room or raise limit) within 24h · notification opt-out < 10%.",
 "entry": ["Notification at 80% and at the limit", "Budget card on Home", "Budgets tab"],
 "screens": [
  ("6.01", "Close to limit", "main", "At 80%: an inline warning on the budget, with a daily pace that would keep it under.", [("primary", "6.02")]),
  ("6.02", "Budget detail · close", "main", "Room left leads; the pace chart shows where the month is heading.", [("primary", "6.03")]),
  ("6.03", "Budget detail · over", "main", "Over by ₹740, said once in red words, and two fixes side by side. Other budgets still have room.", [("primary", "6.04"), ("secondary", "6.06")]),
  ("6.04", "Move room from another budget", "main", "Budgets with room listed with how much each can give. Amount pre-filled to cover the overspend exactly.", [("primary", "6.05")]),
  ("6.05", "Room moved", "main", "Both budgets update at once; Undo for 8 seconds. Overall headroom doesn't change, and the copy says so.", [("primary", "4.01")]),
  ("6.06", "Raise this limit", "main", "Raises this category and the monthly limit together, and shows the new overall headroom before saving.", [("primary", "6.05")]),
  ("6.07", "No room anywhere", "edge", "Every budget is close or over. No fake fixes: raise the monthly limit, or keep tracking and see it next month.", [("primary", "6.06"), ("secondary", "4.01")]),
 ],
 "edges": [
  ("No other budget has room", "6.07"),
  ("Over by a few rupees", "Same treatment; amounts under ₹50 over are worded 'just over'"),
  ("Over on the last day of the month", "The month-end review (F9) carries it; no extra nudge"),
  ("Limit lowered below what's already spent", "Shows over immediately with the reason: 'You lowered this limit'"),
 ],
 "a11y": ["'Over' is a word and an icon, never colour alone.", "The move-room sheet reads each option as 'Transport, ₹1,850 left, can give ₹740'."],
},
# ------------------------------------------------------------------ 7
{
 "id": "F7", "name": "Saving for a goal",
 "goal": "Turn a wish into a monthly number, keep it honest when life gets in the way, and celebrate once when it's done.",
 "measure": "≥ 50% of new goals get money added in the first month · goals reached ÷ goals created tracked per quarter.",
 "entry": ["Goals tab", "Month-end review: 'Move leftover headroom to a goal'"],
 "screens": [
  ("7.01", "Goals · empty", "main", "An invitation, not an apology. Example goals as quick starts.", [("primary", "7.02")]),
  ("7.02", "New goal", "main", "Name, target and a date. The monthly amount is calculated, not asked for.", [("primary", "7.03")]),
  ("7.03", "Your plan", "main", "'₹5,000 a month gets you there by Feb 2027', and how that fits this month's headroom.", [("primary", "7.04")]),
  ("7.04", "Goals", "main", "Each goal with its progress, pace and next step.", [("primary", "7.05")]),
  ("7.05", "Add money", "main", "Amount with the planned monthly figure as a chip; says where the money comes from and that it's set aside, not moved.", [("primary", "7.04")]),
  ("7.06", "Behind pace", "edge", "Honest and kind: what it now takes, and two choices (add more a month, or move the date).", [("primary", "7.05"), ("secondary", "7.02")]),
  ("7.07", "Goal reached", "main", "The one celebration in the product, shown once. Then: keep it, start another, or archive.", [("primary", "7.04")]),
  ("7.08", "Date too soon", "edge", "The plan needs more than this month's headroom. Suggests the earliest realistic date instead.", [("primary", "7.03"), ("secondary", "7.02")]),
 ],
 "edges": [
  ("Plan needs more than the headroom", "7.08"),
  ("Behind pace", "7.06"),
  ("Goal reached early", "7.07, with the leftover plan cancelled automatically"),
  ("Delete a goal with history", "Confirm dialog naming what's lost (Stage 4 · irreversible, scoped)"),
 ],
 "a11y": ["Progress is announced as 'Goa trip, ₹38,000 of ₹60,000, 63%'.", "The celebration respects Reduce Motion and is also a sentence."],
},
# ------------------------------------------------------------------ 8
{
 "id": "F8", "name": "Find and fix transactions",
 "goal": "Find any transaction in seconds and fix its category once, for good.",
 "measure": "Search → result tapped < 10s · repeat recategorisations of the same merchant fall month on month (rules work).",
 "entry": ["Activity tab", "Search in the Activity app bar", "'Needs a category' card on Home"],
 "screens": [
  ("8.01", "Activity", "main", "Grouped by day with daily totals; filters as chips; the period summary always matches what's listed.", [("search", "8.02"), ("row", "8.05"), ("filter", "8.04")]),
  ("8.02", "Search", "main", "Merchant, note, amount or category. Matches highlighted; totals for the results.", [("row", "8.05")]),
  ("8.03", "No results", "edge", "Says what was searched and offers to clear filters or search all time.", [("primary", "8.01")]),
  ("8.04", "Filters", "main", "Period, categories, accounts and type in one sheet; the count of results updates live.", [("primary", "8.01")]),
  ("8.05", "Transaction detail", "main", "Where it came from (imported or added), category, note, and the budget it counts against.", [("primary", "8.06")]),
  ("8.06", "Change category", "main", "Category picker, then one question: apply to all past and future Swiggy payments?", [("primary", "8.07")]),
  ("8.07", "Rule saved", "main", "Says exactly what changed and offers Undo.", [("primary", "8.01")]),
  ("8.08", "Marked as a transfer", "edge", "Moving money between your own accounts isn't spending. It stops counting against budgets, with Undo.", [("primary", "8.05")]),
 ],
 "edges": [
  ("Nothing matches", "8.03"),
  ("Search while offline", "Searches the on-device copy; a note says recent imports may be missing"),
  ("Transfer between own accounts", "8.08: 'Mark as transfer' and it stops counting as spending"),
  ("Refund arrives", "Shown as income on its own row and linked to the original"),
 ],
 "a11y": ["Search results count is announced.", "Highlighted matches are also bold, not only coloured."],
},
# ------------------------------------------------------------------ 9
{
 "id": "F9", "name": "Month-end review",
 "goal": "Close the month in a minute: what happened, what to carry forward, and a better plan for next month.",
 "measure": "≥ 50% of active users open the review · ≥ 30% act on it (move to a goal or adjust a budget).",
 "entry": ["Notification on the 1st", "Card on Home for the first 5 days of the month"],
 "screens": [
  ("9.01", "October, wrapped", "main", "One headline sentence, then the numbers that matter. Kind whether the month went well or not.", [("primary", "9.02")]),
  ("9.02", "Where it went", "main", "Categories against their limits, best and toughest first. Each with a one-line why.", [("primary", "9.03")]),
  ("9.03", "Use your leftover", "main", "₹4,120 left: move it to a goal, carry it into November, or leave it. No default pressure.", [("primary", "9.04")]),
  ("9.04", "Plan November", "main", "Suggested limits from October, with what changed and why. Accept all or edit one.", [("primary", "9.05")]),
  ("9.05", "November starts", "main", "Fresh headroom, the carried-over amount shown separately, and the goal update.", [("primary", "4.01")]),
  ("9.06", "A tough month", "edge", "Went over overall. No red headline: what happened, what helped, and one small change to try.", [("primary", "9.04")]),
 ],
 "edges": [
  ("Went over the monthly limit", "9.06"),
  ("Nothing left over", "9.03 is skipped"),
  ("Very little data (new user)", "Review waits until there's a full month"),
 ],
 "a11y": ["Charts have table alternatives.", "The headline is the page's first heading."],
},
# ------------------------------------------------------------------ 10
{
 "id": "F10", "name": "Privacy and your account",
 "goal": "Make privacy controls easy to find and match friction to how hard each action is to undo.",
 "measure": "Zero 'deleted by accident' tickets that Undo, Recently deleted or the grace period couldn't solve.",
 "entry": ["Profile in the Home app bar", "'What Headroom can see' links from consent screens"],
 "screens": [
  ("10.01", "Profile and settings", "main", "Privacy first: app lock, hide balances by default, notifications, connected banks. Sign out and delete at the bottom.", [("banks", "10.02"), ("export", "10.04"), ("delete", "10.06"), ("signout", "10.05")]),
  ("10.02", "Connected banks", "main", "Every account with what's shared, until when, and a Disconnect button.", [("primary", "10.03")]),
  ("10.03", "Disconnect a bank?", "main", "Irreversible but scoped: a dialog naming what stops and what's kept. Cancel is the default.", [("primary", "10.02"), ("secondary", "10.02")]),
  ("10.04", "Export your data", "main", "CSV or PDF for a period. Needs app lock; the file name never contains amounts.", [("primary", "10.01")]),
  ("10.05", "Sign out?", "main", "Reversible: says what stays on the phone and what doesn't.", [("primary", "1.01"), ("secondary", "10.01")]),
  ("10.06", "Delete your account", "main", "Account-wide and irreversible: what's deleted, the 7-day grace period, then confirm by typing the last 4 digits.", [("primary", "10.07")]),
  ("10.07", "Deletion scheduled", "main", "Exact date, how to restore, and confirmation sent by SMS and email.", [("primary", "1.01")]),
  ("10.08", "Restore during grace", "edge", "Signing in within 7 days shows a banner with one-tap restore.", [("primary", "4.01")]),
  ("10.09", "Notifications", "main", "Each alert on its own switch, with the exact wording previewed. Amounts stay off the lock screen unless you turn them on.", []),
  ("10.10", "Help and feedback", "main", "Answers first, a human second. Every contact option says how fast it replies.", []),
 ],
 "edges": [
  ("Last 4 digits typed wrong", "10.06 keeps the button disabled with 'Those aren't the last 4 digits of your number'"),
  ("Signs in during the grace period", "10.08"),
  ("Export without app lock on", "Asks to turn app lock on first"),
  ("Disconnecting the only bank", "Dialog adds: 'You'll add expenses by hand from now on'"),
 ],
 "a11y": ["Destructive dialogs use role=alertdialog with Cancel focused.", "The delete confirmation field says what it expects: 'Last 4 digits of +91 ••••• 43210'."],
},
]

# Components the flows needed that the library didn't have. Built as proposed components in Figma.
PROPOSED = [
 ("Phone field", "+91 prefix locked, 10-digit numeric field, inline error. Used on 1.02 and 1.03."),
 ("Code input", "Six boxes over one one-time-code field with autofill and paste; error and locked states. 1.04–1.06."),
 ("Progress steps", "Numbered steps with done, current and waiting states, for imports and onboarding. 2.05."),
 ("Consent summary", "Rows of what's shared, how far back, how often, for how long. 2.03 and 10.02."),
 ("Bank tile", "Bank initials in a tile with its name, for choosing a bank. 2.02."),
 ("System notification", "Lock-screen notification mock (no amounts by default) for prototypes. 4.05 and 5.08."),
 ("Biometric prompt", "System Face ID / fingerprint prompt mock over a blurred app. 1.09."),
 ("PIN pad", "4-digit app PIN with dots and keypad. 1.10."),
 ("Coach mark", "One-time callout pointing at a part of the screen with Got it. 3.06."),
 ("Celebration", "The single goal-reached moment: icon burst and message, Reduce Motion safe. 7.07."),
]

DECISIONS = [
 ("Ten flows, not five, because trust and recovery are the product",
  "A money app is judged on the moments that go wrong: a code that doesn't arrive, a bank that's down, a month that went over. Five happy paths would show the interface; ten flows with their edge states show that nobody gets stuck, which is what a reviewer actually needs to see in a finance product."),
 ("Every edge state is its own screen, not a footnote",
  "Edge cases written as bullet points never get built. Drawing 'bank not responding', 'no room anywhere' and 'a tough month' as real screens forces the copy, the recovery path and the components to exist, and the prototype can reach them."),
 ("The flows are wired, not just laid out",
  "Every screen's main and secondary actions link to their next screen, so the Figma file clicks through from install to deleting an account. That makes usability testing possible on day one and keeps the flow diagrams honest: a link that goes nowhere shows up immediately."),
]
