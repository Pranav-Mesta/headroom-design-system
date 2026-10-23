# Headroom Design System · Stage 6: User flows

{{count}} end-to-end flows and {{screens}} screens, from first launch to deleting an account. Every screen is built in Figma from the Stage 2 library (plus the proposed components below), follows the Stage 4 patterns and Stage 3 voice, and is wired as a clickable prototype.

**Persona (synthetic):** {{persona}}

## Flows at a glance

{{overview}}

How to read each flow: **main** screens are the happy path in order; **edge** screens are states the path can fall into. Edge states are reached by a condition (a wrong code, a bank that's down), so in the prototype they are separate starting points, and each links back into the flow.

{{flows}}

## Components the flows needed

Built in Figma on the *Components · Flows (proposed)* page from existing tokens only. Each goes through the governance process (Proposed → Beta → Stable).

{{proposed}}

## Prototype

- **Every tap target works.** The builder finds every button, text link, back arrow, sheet close, Undo, refresh, tab, transaction row, budget bar and goal card on every screen and links it. The build report fails loudly if any button lacks a destination (currently none). Every transaction row opens the transaction-detail template; every budget bar opens budget detail.
- **Controls work in place.** Toggles, checkboxes, radios, filter and choice chips, tabs, segmented controls, bank tiles and category tiles are interactive components: tapping switches their state with a 120ms Smart animate, on every screen. Choice chips toggle independently (a Figma limitation; the coded app makes them single-select).
- **Motion follows the motion tokens.** Forward steps slide in from the right and back steps slide back (280ms, `motion/easing/standard`). Sheets rise from the bottom (280ms, `motion/easing/enter`). Dialogs, tab switches and sheet dismissals fade (120–200ms). Same-screen changes use Smart animate: hiding balances, typing an amount, close-to-limit becoming over.
- **Timed steps.** The bank import finishes on its own (2.5s), the loading skeleton resolves to Home (1.2s) and Face ID unlocks after 1.6s. Toasts stay until you act, so dismissing one never jumps to a screen with stale numbers.
- **Starting points** for every flow, plus Returning unlock, the lock-screen notification, Payment detected, Goals and Month-end, and every edge state.
- Frames are 390 × 844 (iPhone 15/16), with a fixed status bar and nav, and content that scrolls beneath them.

## Decisions to defend in a portfolio review

{{decisions}}
