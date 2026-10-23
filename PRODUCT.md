# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

One brand language shared across iOS, Android, and a responsive web dashboard. Navigation affordances (back gestures, sheets, system controls) follow each OS; the visual identity does not fork per OS.

## Stack

Design-system deliverable, not app code: a static HTML/CSS documentation site plus markdown source and a `tokens.json` export. The user will later ask for the whole system to be rebuilt in Figma, so every token name maps 1:1 to a Figma variable path (`color/text/primary`). Delegated: static HTML chosen because it is portable, shareable as a link, and needs no build step.

## Users

Young professionals in India, roughly 25–32. They earn a salary and pay for rent, UPI-heavy everyday spending, subscriptions, EMIs, and often SIPs. They are financially capable but busy, and most money apps make them feel judged or anxious. They use the app in short bursts on a phone (after a payment, on the commute, at month-end) and occasionally sit down with the web dashboard for a monthly review.

## Product Purpose

Track spending, set budgets, save toward goals, and understand where money goes. Success means the user opens the app without dread, knows in seconds whether they are on track this month, and makes one small better decision.

## Positioning

A money app whose job is to lower the user's stress. It shows clarity before alarm, uses no shame language, and keeps feedback proportionate: an overspend is information, not an emergency.

## Operating Context

- One-handed mobile use, often right after a UPI payment.
- Month-end and payday rituals: checking what's left, moving money to goals.
- Occasional desktop review of trends on the web dashboard.
- Indian locale: ₹ INR, lakh/crore grouping (1,00,000), DD MMM YYYY dates.

## Capabilities and Constraints

- Core: transactions (manual and imported), categories, monthly budgets per category, savings goals, spending insights and charts.
- Must support light and dark mode, and WCAG 2.2 AA for every text and UI pairing.
- Meaning never relies on color alone: signs (+/−), icons, and labels always accompany it.
- Undecided: bank sync mechanism (Account Aggregator or SMS parsing), monetisation.

## Brand Commitments

- Working name: **Headroom** (proposed by Claude and pending the user's approval). The double meaning is financial headroom (room left in the budget) and mental headroom (room to breathe).
- Personality: calm, friendly, trustworthy, not corporate. It makes money feel less stressful.
- Not overtly India-rooted in naming or iconography, though the locale is Indian.

## Evidence on Hand

None. All transaction data, merchants, and amounts in the system's examples are synthetic and must be labelled as such. There are no users, testimonials, or metrics, and none may be invented.

## Product Principles

1. **Clarity before alarm.** Show the state plainly before any warning; warnings are proportionate.
2. **No shame.** Language and color never moralise spending.
3. **Numbers are the interface.** Amounts must be legible, aligned, and unambiguous at a glance.
4. **Redundant meaning.** Every status is encoded at least twice (color plus sign, icon, or text).
5. **One system, three surfaces.** Tokens are platform-neutral and map directly to Figma variables.

## Accessibility & Inclusion

WCAG 2.2 AA minimum (4.5:1 body text, 3:1 large text and UI components). Supports Dynamic Type / font scaling to 200%, reduced motion, screen readers (amounts read as "minus four hundred fifty rupees", not "dash 450"), and color-vision deficiency, with red/green never the sole distinction.
