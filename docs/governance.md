# Headroom Design System · Governance

**Current version: 1.0.0.** History and migration maps live in [CHANGELOG.md](../CHANGELOG.md).

This is how the system stays coherent for years: how things are named, how changes are versioned, how old tokens are retired, and how new ones get in. Every rule that can be checked by a script is.

## 1. Naming

- **Shape.** category/concept/role-state, all lowercase, words joined by hyphens, levels by slashes. Slashes become Figma variable groups and CSS custom properties (color/text/primary → --color-text-primary).
- **Primitive colours.** color/{family}/{stop}. Families are plain colour words (neutral, blue, green, teal, yellow, red), never brand nicknames, so a new designer can guess them. Stops run 50–900 (neutral adds 0, 950, 1000).
- **Colour names.** Every primitive also has a human name: family + tone (Blue Strong, Red Medium, Neutral Light Black). Use names when talking and in design reviews; use the path in code and Figma. A name never changes while its path exists.
- **Semantic tokens.** Named for purpose, never appearance: color/status/danger, not color/red-text. If a token's name would still be true after its colour changed, the name is right.
- **Spacing.** space/{relationship}/{a}-to-{b} or space/{type}/{size}. The name says what sits on each side of the gap.
- **States.** Suffixes in this order: -hover, -pressed, -selected, -disabled. No synonyms (active, down, on).
- **Numbers over sizes.** Primitive scales are numeric (space/400, color/blue/600), so a new step (space/350) slots in without renaming anything.
- **Reserved words.** Never use new, old, v2, temp, test or a person's name in a token. They outlive the moment and stop meaning anything.

## 2. Token tiers

| Tier | Holds | Used in |
|---|---|---|
| Primitive | Raw values: color/blue/600, space/400. | Only the token file. Never in components, Figma layers or code. |
| Semantic | Purpose: color/action/primary, space/text/heading-to-body. | Everything that ships. Light and dark resolve here. |
| Component | One component diverging on purpose: button/primary/padding-inline. | Only when a component needs a value no semantic token describes. Must point at a semantic or primitive token, never a raw value. |

## 3. Versioning (SemVer for tokens)

| Release | When | Example |
|---|---|---|
| Major (2.0.0) | Something existing breaks: a token is renamed or removed, a token changes meaning (status/warning starts meaning info), or a value change makes an existing pairing fail contrast. | Rename color/status/danger → color/status/critical. |
| Minor (1.1.0) | Something is added and nothing breaks: a new token, a new component variant, a new breakpoint value. | Add space/media/video-to-caption. |
| Patch (1.0.1) | A value is tuned within the same intent and every contrast pairing still passes. | red/400 shifts slightly in hue; over-fill still passes. |

## 4. Deprecation

- **Mark first.** A token being retired gets $deprecated in tokens.json with the replacement path and the version it disappears in. Its value keeps working.
- **Keep it a full major.** Deprecated tokens stay for at least one full major version or six months, whichever is longer.
- **Warn loudly.** The build lists every use of a deprecated token. Figma descriptions start with 'Deprecated: use …'.
- **Ship a map.** Every major release has a migration table (old path → new path) in CHANGELOG.md, written so a find-and-replace can apply it.
- **Remove last.** Removal happens only in the next major, after usage reaches zero in code and Figma.

## 5. Contributing a change

- **1. Check first.** Search existing tokens and components. Most requests are already solved under another name.
- **2. Show the need.** Open a proposal with the problem, two or more places it's needed, and screenshots. One-off needs stay local to that screen.
- **3. Propose.** Suggest the name (following the naming rules), the value for light and dark, and which tier it belongs in.
- **4. Pass the gates.** Contrast gate (AA in both modes), proof audit (no stray values), docs and Figma updated, a changelog line written.
- **5. Decide and record.** The design system owner and one engineer approve. The decision and its reason are logged, including rejections, so the same debate doesn't repeat.

## 6. Gates every change passes

- **Contrast gate.** tools/build_tokens.py measures every declared text and UI pairing in both modes and refuses to build below WCAG AA.
- **Proof audit.** site/proof.html reads back every rendered colour and font size and fails on any value that isn't a token.
- **Docs.** The markdown, the spec site and tokens.json regenerate from the same source, so they can't disagree.
- **Figma.** Variables and styles are rebuilt from tokens.json by the Headroom DS Builder plugin, never edited by hand.
- **Changelog.** Every release adds a dated entry with what changed, why, and how to migrate.

## 7. Release cadence

- **Patch.** Any time, once it passes the gates.
- **Minor.** Batched monthly.
- **Major.** At most twice a year, announced one cycle ahead with the migration map.

## Decisions to defend in a portfolio review

1. **Colours have names for people and numbers for machines.** Hex codes are unreadable in a review, and pure names ('Ocean', 'Sunset') age badly and hide the order of shades. Headroom keeps the numeric path as the contract (color/neutral/900) and adds a fixed plain-language name (Neutral Light Black). People can say 'swap it to Blue Strong'; code still sorts and scales by number.
2. **Renames are the most expensive change, so they're major releases.** Changing a value is cheap: everything that points at it updates. Changing a name breaks every reference in code, Figma and docs. Treating any rename as a major version, with a deprecation period and a migration map, makes the cost visible before anyone pays it.
3. **Every rule is enforced by the build, not by memory.** Contrast, stray values and doc drift are checked by scripts that fail the build. Teams change; guidelines that rely on someone remembering them don't survive a reorg. Rules that fail a build do.

## Sources

- [Atlassian: spacing](https://atlassian.design/foundations/spacing) · [EightShapes: space in design systems](https://medium.com/@nathanacurtis/space-in-design-systems-188bcbae0d62) · [Carbon: spacing](https://carbondesignsystem.com/elements/spacing/overview/)
- [Adobe: naming colours in design systems](https://adobe.design/stories/design-for-scale/naming-colors-in-design-systems) · [Design Tokens Community Group format](https://www.designtokens.org/tr/drafts/format/) · [Semantic Versioning](https://semver.org/)
- [CMS design system: spacing](https://design.cms.gov/foundation/spacing) · [WCAG 2.2: target size (2.5.8)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
