"""Headroom Stage 4: patterns.

Single source for docs/stage-4-patterns.md and site/patterns.html.
Patterns compose Stage 2 components and follow Stage 3 content rules.
All data is synthetic.
"""

PATTERNS = [
{
 "id": "add-transaction", "name": "Adding a transaction",
 "goal": "Log an expense in under 8 seconds with 3 taps, so tracking survives a busy day.",
 "measure": "Median time from tap to saved < 8s · ≥ 80% of manual adds use the default path (no 'More details').",
 "entry": [
  "Add button floating above the nav bar on Home and Activity: the most frequent action gets the most reachable spot.",
  "Notification after a detected payment: 'Paid ₹386 to Swiggy? Choose a category' (bank import or SMS, with consent).",
  "Home-screen widget and long-press app-icon shortcut 'Add expense'.",
 ],
 "steps": [
  ("Amount first", "The sheet opens with the keypad already active and Expense selected. The last-used account is preselected and today is the date. The context line shows the budget it will land in."),
  ("Category in one tap", "Typing reveals 3 suggested categories (from merchant, time of day and history). One tap selects; 'More' opens the full picker."),
  ("Consequence before commitment", "The context line updates live: '₹1,414 left in Food after this'. If it would cross a limit, it says so in words ('₹186 over Food after this'). It's information, not a block."),
  ("Save with the amount in the button", "'Add ₹386 expense'. The sheet closes, the row slides into Activity, the gauge fill rises (cause → effect), and a snackbar offers Undo for 8 seconds."),
 ],
 "rules": [
  "Optimistic save: the UI updates immediately; sync happens in the background.",
  "Every optional field (merchant, note, date, account, split, repeat) lives behind 'More details' and keeps its last-used default.",
  "Expense / Income is a segmented control at the top; the keypad and flow are identical.",
  "Never block saving on a category: uncategorised transactions get 'Needs a category' and appear in a review list.",
 ],
 "edges": [
  ("Amount is ₹0 or empty", "Button stays enabled; tapping focuses the keypad and shows 'Enter an amount first'."),
  ("Offline", "Saved locally with a 'Not synced' tag; syncs automatically. No error shown."),
  ("Looks like a duplicate", "Before saving: 'This looks like the ₹386 Swiggy expense from today. Add it anyway?' with Add anyway / Cancel."),
  ("Bank import arrives later for a manual entry", "Auto-matched by amount ±₹1 and date ±1 day; the two merge and a quiet note shows on the row ('Matched with HDFC')."),
  ("Very large amount", "Soft warning above ₹10,00,000 ('Check the number?'), never a block."),
  ("User swipes the sheet down with an amount entered", "'Discard this expense?' with Keep editing as the default."),
  ("Future date chosen", "Becomes a scheduled expense with a 'Scheduled' tag; it doesn't affect headroom until that day."),
 ],
 "components": ["Bottom sheet", "Segmented control", "Amount input (hero)", "Number keypad", "Chips (choice)", "Category picker", "Button (lg)", "Toast / snackbar", "Transaction row", "Balance card"],
 "a11y": ["Focus starts on the amount; the keypad works with a hardware keyboard.", "The context line is a polite live region, so screen-reader users hear the consequence as they type.", "Undo is reachable by keyboard and stays for 8s, longer when a screen reader is on."],
},
{
 "id": "create-budget", "name": "Creating a budget",
 "goal": "Go from no budget to a live clearance gauge in under a minute, with numbers that come from the user's real spending rather than guesses.",
 "measure": "≥ 70% of users who start finish · ≥ 60% keep the suggested limits (a signal that the suggestions are realistic).",
 "entry": ["Budgets tab empty state: 'Set a monthly limit'.", "Onboarding step 5.", "Category detail: 'Set limit' on a category with no limit."],
 "steps": [
  ("Monthly limit", "One number first. The suggestion is based on the last 3 months ('You spent about ₹48,200 a month'), and a live gauge preview fills as you type."),
  ("Split into categories", "Categories are pre-filled from history and editable inline. Unallocated money shows as headroom ('₹6,200 not assigned. That's fine, it stays as headroom')."),
  ("Month start and alerts", "Choose payday or calendar month (radio cards). Alerts default on at 80% and at the limit, each with a toggle and the exact wording previewed."),
  ("Review and start", "One summary card. 'Start budget' shows the gauge immediately. Mid-month starts ask whether to count spending since the 1st."),
 ],
 "rules": [
  "Every number is a suggestion with its source visible; nothing is pre-filled without saying why.",
  "Category limits may add up to more than the monthly limit; show it as information ('₹2,000 more than your monthly limit'), not an error.",
  "Fewer categories is fine: anything without a limit rolls into 'Everything else'.",
  "Edits apply from today and history is kept; changing a limit never rewrites past months.",
 ],
 "edges": [
  ("No history yet (new user, no bank)", "Ask for monthly take-home pay and suggest 70% as a starting limit, labelled as a starting point."),
  ("Started mid-month", "'Count spending since 1 Oct (₹21,300)?' Yes / Start fresh from today."),
  ("Irregular income (freelance)", "Option for a weekly limit; the gauge period changes to the week."),
  ("Limit set below what's already spent this month", "Allowed; the gauge opens in the over state with the standard calm copy."),
 ],
 "components": ["Amount input (inline)", "Balance card (preview)", "Budget progress bar", "Radio (card)", "Toggle", "Card", "Button", "Inline alert"],
 "a11y": ["Each step is its own screen with a heading and a step indicator ('Step 2 of 4').", "The live gauge preview is decorative; the number and status line carry meaning."],
},
{
 "id": "onboarding", "name": "Onboarding",
 "goal": "Show the user their own headroom within 2 minutes, while earning trust before asking for financial data.",
 "measure": "Time to first headroom < 2 min · bank-connect opt-in tracked separately (manual-only users still activate).",
 "entry": ["First launch after install."],
 "steps": [
  ("Promise", "One screen, one sentence ('See how much room you have left this month'), a preview of the gauge with sample data labelled 'Example', and Get started / I have an account."),
  ("Sign in", "Phone number with OTP, or Google / Apple. Nothing else is asked here."),
  ("App lock", "Face ID / fingerprint, recommended and on by default, with 'Not now' visible. Explains why in one line."),
  ("Month start", "Payday or calendar month (radio cards). This decides when headroom resets."),
  ("Connect a bank (optional)", "Explains the Account Aggregator consent in plain words: read-only, you choose the accounts and duration, revoke any time. 'Connect bank' and the equal-weight 'Add expenses myself' both continue."),
  ("Set your limit", "The create-budget flow, compressed to one screen: a suggested monthly limit from imported data or salary."),
  ("Your headroom", "Home with a one-time coach mark on the gauge: 'This is your headroom: money left under your limit.' Categories and goals are introduced later by their empty states."),
 ],
 "rules": [
  "A progress indicator shows where you are; every step after sign-in can be skipped and revisited from Settings.",
  "Ask for permissions in context, never upfront: notifications when you turn on alerts, camera when you first scan a receipt.",
  "Show what Headroom can and can't see before any connection: 'We can read transactions. We can never move money.'",
  "No account creation wall before value: the promise screen shows a sample gauge, clearly marked as an example.",
 ],
 "edges": [
  ("Bank connection fails or is declined", "Continue with manual entry; Home shows a quiet card later: 'Connect a bank to import automatically'."),
  ("User skips everything after sign-in", "Lands on Home with the gauge empty state ('Set a monthly limit to see your headroom')."),
  ("Returning user on a new phone", "Sign in → restore → straight to Home; app lock setup only."),
  ("OTP doesn't arrive", "Resend after 30s with a visible timer; fallback to a call."),
 ],
 "components": ["Button", "Text input", "Radio (card)", "Toggle", "Inline alert", "Balance card", "Empty state", "Tooltip (coach mark)"],
 "a11y": ["Sample data is labelled as an example, visually and for screen readers.", "OTP fields support autofill (one-time-code) and paste.", "Step changes move focus to the new step's heading."],
},
{
 "id": "sensitive-data", "name": "Handling sensitive data",
 "goal": "Make money private by default in public places, and make friction proportional to how hard an action is to undo.",
 "measure": "Zero support tickets for 'deleted by accident' that Undo or Recently deleted couldn't solve.",
 "entry": ["Eye icon in the Home app bar.", "Settings → Privacy.", "Any delete, disconnect or erase action."],
 "steps": [
  ("Hide balances", "One tap on the eye icon masks every amount app-wide as '₹ •••••' (five dots regardless of length). It persists across launches and covers widgets and notifications too. The gauge keeps its shape, so 'roughly how am I doing' survives without numbers."),
  ("Peek", "Press and hold any masked amount to reveal it for 3 seconds with a light haptic, then it re-masks. Screen readers announce 'hidden, double-tap and hold to reveal'."),
  ("Leaving the app", "The app-switcher snapshot is blurred (iOS privacy overlay / Android secure flag), and app lock asks for biometrics after 1 minute in the background (configurable)."),
  ("Destructive actions, by tier", "Reversible actions get Undo; scoped irreversible ones get a confirm dialog that names the consequence; account-level ones get re-authentication and a grace period."),
 ],
 "tiers": [
  ("Reversible", "Delete a transaction, archive a budget, remove a tag", "Do it immediately. Snackbar with Undo (8s). Kept in 'Recently deleted' for 30 days."),
  ("Irreversible, scoped", "Delete a goal and its history, disconnect a bank, delete a category with transactions", "Modal dialog: title as a question, body names exactly what's lost and what's kept, destructive button named for the action, Cancel focused by default."),
  ("Irreversible, account-wide", "Delete account, erase all data", "Re-authenticate (biometric or OTP), type the account's phone number's last 4 digits to confirm, then a 7-day grace period with email/SMS and one-tap restore."),
 ],
 "rules": [
  "Notifications never show amounts on the lock screen by default ('New expense in Food'); users can opt in to amounts.",
  "Screenshots are allowed (people share splits); the app-switcher snapshot is not.",
  "Exports (CSV/PDF) require app lock and are named without amounts in the filename.",
  "A 'What Headroom can see' page lists every connected account, consent expiry and a revoke button.",
 ],
 "edges": [
  ("Biometrics fail or aren't set up", "Fall back to the device passcode, then OTP."),
  ("Hide balances on, user adds an expense", "The keypad shows what you type (you're entering it), and the saved row is masked."),
  ("Undo pressed after the snackbar is gone", "'Recently deleted' in Settings restores anything from the last 30 days."),
  ("User deletes the account, then signs in within 7 days", "Banner: 'Your account is scheduled for deletion on 25 Oct' with Restore."),
 ],
 "components": ["Icon button (toggle)", "Toast / snackbar", "Modal dialog", "Text input", "Banner", "List item", "Toggle"],
 "a11y": ["The mask is announced as 'hidden', never as dots.", "Destructive dialogs use role=alertdialog and focus Cancel first.", "Peek also works with a long-press accessibility action."],
},
{
 "id": "offline-errors", "name": "Offline and error states",
 "goal": "Never lose what the user typed, never show a blank screen, and say plainly what still works.",
 "measure": "Zero lost manual entries · < 1% of sessions see a full-screen error.",
 "entry": ["Any screen, any time the network, the bank or the server fails."],
 "steps": [
  ("Offline", "A neutral banner under the app bar: 'You're offline. Changes will sync when you're back.' Everything reads from the local copy; adds and edits queue with a 'Not synced' tag."),
  ("Back online", "Sync runs silently. The banner disappears, tags clear, and nothing is announced unless there's a conflict."),
  ("Stale data", "Below the gauge: 'Updated 2h ago'. Pull to refresh. Last known values are always shown, never a spinner over blank."),
  ("Bank connection problem", "Per-account status in Accounts ('Connection expired · Reconnect'), a warning banner on Home if it affects headroom, and manual entry still works."),
 ],
 "levels": [
  ("Field", "Input can't be accepted", "Inline error under the field (Text input / Amount input). Focus moves to the first error."),
  ("Action", "A save, delete or sync failed", "Snackbar with Retry; the item keeps a 'Not synced' tag until it succeeds."),
  ("Section", "One card or list can't load", "Inline alert inside that card with Retry; the rest of the screen works. Last known data stays visible."),
  ("Screen", "Nothing for this screen can be shown (first load, no cache)", "Empty-state layout with a clear message, Retry and 'Contact support' (error code in small text for support)."),
  ("App", "Offline, bank consent expired, update required", "Banner, one at a time, most severe first."),
 ],
 "rules": [
  "Local-first: every list and the gauge render from the on-device copy, then refresh.",
  "Optimistic writes with a visible 'Not synced' tag; automatic retry with backoff (5s, 30s, 2min, then on next launch).",
  "Drafts are saved continuously: a half-entered expense survives the app closing.",
  "Errors follow Stage 3: say what happened, say what's safe, say what happens next. No codes alone, no blame.",
  "Skeletons appear only after 300ms; anything faster just appears.",
 ],
 "edges": [
  ("Same transaction edited on two devices offline", "Last edit wins per field; if both changed the amount, ask: 'This changed on another device. Keep ₹386 or ₹420?'"),
  ("Sync fails for 24 hours", "The 'Not synced' items get an inline alert in Activity with Retry and 'Contact support'."),
  ("Server down", "Read-only mode banner; adds still queue locally."),
  ("Bank returns partial data", "Import what arrived; account row says 'Imported up to 16 Oct'."),
 ],
 "components": ["Banner", "Inline alert", "Toast / snackbar", "Skeleton loader", "Empty state", "Transaction row (Not synced)", "Balance card (error state)"],
 "a11y": ["Connectivity changes are announced once, politely.", "Retry buttons say what they retry: 'Retry sync', 'Retry loading budgets'."],
},
]

DECISIONS = [
 ("Adding an expense is keypad-first, 3 taps, with optimistic save and Undo",
  "Most money apps open a form: amount, category, date, account, note, save. Headroom opens a sheet with the keypad already live, suggests 3 categories after the first digit, and puts the amount in the button ('Add ₹386 expense'). "
  "Optional fields hide behind 'More details' with remembered defaults. Saving is optimistic with Undo instead of validation dialogs. "
  "Tracking only works if it's faster than forgetting; the measurable target (median under 8 seconds) makes the decision testable in usability sessions."),
 ("Friction is proportional to irreversibility",
  "A single confirmation dialog for everything trains people to tap through it. Headroom has three tiers: Undo for reversible actions, a consequence-naming dialog for scoped irreversible ones, and re-authentication with a 7-day grace period for account deletion. "
  "The rule is easy to apply to any new feature: ask how hard it is to undo, and pick the tier. Users get speed for everyday clean-up and real protection where it matters."),
 ("Offline-first: never block, never lose input",
  "Indian mobile networks drop in metros, lifts and on trains, which is exactly where people pay. Headroom renders from a local copy, queues writes with a visible 'Not synced' tag, retries automatically and only interrupts on a genuine conflict. "
  "The error hierarchy (field, action, section, screen, app) means each failure is shown at the smallest scope that explains it, so one broken card never blanks the whole screen."),
]
