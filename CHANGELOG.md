# Changelog

Headroom follows [Semantic Versioning](https://semver.org/) for tokens: renames and removals are major, additions are minor, value tweaks that keep contrast are patches. See [docs/governance.md](docs/governance.md).

## 1.0.0 · 2026-10-19

First stable release. Renames and new spacing system.

- Primitive colour families renamed to plain colour words (see migration map).
- Every primitive colour has a human name (Neutral Light Black, Blue Strong, Red Medium …).
- Near-limit and over-limit retuned: yellow is now saffron (hue 70), red is now a true red (hue 22). color/finance/near-fill → yellow/300 · yellow/600; color/finance/over-fill → red/400 · red/700.
- Added 52 semantic spacing tokens (inset, squish and stretch, text to text, text to icon, text to media, component to component) and 6 responsive layout tokens.
- Added governance: naming, tiers, SemVer, deprecation, contribution and gates.
- color/action/secondary moved from blue/50 to blue/100 in light mode: tonal buttons and selected chips were invisible against the canvas.
- Added space/squish/xl/block and /inline for button padding; every Figma padding and gap now binds to a semantic spacing token.

**Migration map** (old paths keep working as `$deprecated` aliases until 2.0.0):

| Old | New |
|---|---|
| `color/slate/*` | `color/neutral/*` |
| `color/sky/*` | `color/blue/*` |
| `color/leaf/*` | `color/green/*` |
| `color/lagoon/*` | `color/teal/*` |
| `color/signal/*` | `color/yellow/*` |
| `color/coral/*` | `color/red/*` |
