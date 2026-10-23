# Headroom design system

A complete design system for **Headroom**, a personal finance app for young professionals in India (₹ INR). Mobile-first on iOS and Android, with a responsive web dashboard.

**The idea:** money left is drawn as open space above a dashed limit line (the *clearance gauge*), so people read "room" before "spent". Every token, component, word and pattern follows from that.

All example data is synthetic. Icons by [Not Boring Icons](https://www.notboringicons.com).

## The six stages

| Stage | Read it | See it live |
|---|---|---|
| 1. Foundations: named colours, type, a complete spacing system, shape, grid, icons, motion, governance | [docs/stage-1-foundations.md](docs/stage-1-foundations.md) | `site/index.html` |
| 2. Components: 35 components, every state | [docs/stage-2-components.md](docs/stage-2-components.md) | `site/components.html` |
| 3. Content and voice: tone, writing guides, formatting | [docs/stage-3-content.md](docs/stage-3-content.md) | `site/content.html` (live formatter) |
| 4. Patterns: add transaction, budgets, onboarding, sensitive data, offline | [docs/stage-4-patterns.md](docs/stage-4-patterns.md) | `site/patterns.html` (storyboards) |
| 5. Proof: four key screens built only from the system | [docs/stage-5-proof.md](docs/stage-5-proof.md) | `site/proof.html` (live token audit) |
| 6. Flows: 10 end-to-end flows, 81 screens with edge states, a fully wired Figma prototype with motion | [docs/stage-6-flows.md](docs/stage-6-flows.md) | Figma · *Flows* page |

Each stage ends with the three decisions to defend in a portfolio review.

**Version 1.0.0.** How the system is named, versioned, changed and retired: [docs/governance.md](docs/governance.md) (also on `site/index.html#governance`). What changed and how to migrate: [CHANGELOG.md](CHANGELOG.md). Getting started, component status, which component to use, the accessibility checklist and FAQ: [docs/guides.md](docs/guides.md).

## What's measured, not claimed

- **Contrast:** 180 text/background and UI pairings measured in light and dark mode. The build fails if any falls below WCAG AA.
- **Type:** 20 typefaces audited with fontTools for a native ₹ glyph, tabular figures, a slashed zero and narrow tabular commas. Only Anek Latin passed all four.
- **Proof:** the four screens read back every rendered colour and font size. In both light and dark mode, 100% resolve to tokens and 100% sit on the type scale.

## Files

```
tokens/tokens.json            W3C design-token format; paths map 1:1 to Figma variables (color/text/primary)
tokens/contrast-report.json   every measured pairing
tools/build_tokens.py         generator: colour ramps (OKLCH), contrast gate, docs and site
tools/*_spec.py               single source for components, content, patterns and proof
site/headroom.css             the coded component library (hr-*), tokens only
site/nav.js + nav.css         the one sidebar on every page: stages, sections, other stages, theme, motion
site/motion.js                fills, bars and chart lines animate once on first view; honours reduced motion
docs/                         generated markdown for each stage (edit the .template.md or the spec, not the output)
PRODUCT.md                    product truth: users, principles, constraints
```

## Build

```bash
python tools/build_tokens.py
```

```bash
python -m http.server 8765
```

Then open http://localhost:8765/site/index.html. Add `?theme=dark` to any page for dark mode.

Motion follows the operating system's reduced-motion setting by default. Use **Motion: Full / Reduced** in the sidebar to preview either; the choice is remembered. Foundations → Motion → *Motion in use* has a replayable example for every duration and easing token.
