# Icon inventory

Every icon in the Headroom system now comes from **[Not Boring Icons](https://www.notboringicons.com)** (stroke style), fetched through their MCP API with `tools/nbi_fetch.py` and built into `site/icons.js` and the Figma plugin by `tools/build_icons.py`.

Headroom keeps its own icon names (left column) so page markup never changes; the middle column is the Not Boring Icons name it maps to.

## Missing from Not Boring Icons (4), please add

| Headroom name | What it needs to show | Stand-in used for now |
|---|---|---|
| `hand-heart` | a hand holding a heart (care / support), used for the gentle 'money is tight' message | `heart` |
| `signal-low` | cellular signal with one bar (weak connection), used in offline status bars | `wifi-low` |
| `split` | splitting a payment between people (a forking arrow or two coins), used for split expenses | `divide` |
| `tree-palm` | a palm tree (beach / holiday), used as the icon for a travel savings goal | `sun` |

## Full mapping (87 icons)

| Headroom name | Used in | Not Boring Icons | Notes |
|---|---|---|---|
| `arrow-down-left` | Components, Figma, Proof | `arrow-down-left` | |
| `arrow-left-right` | Components, Figma, Patterns, Proof | `arrows-left-right` | |
| `arrow-right` | Sidebar | `arrow-right` | |
| `arrow-up-right` | Components, Figma, Proof | `arrow-up-right` | |
| `ban` | Voice | `ban` | |
| `battery-full` | Figma, Patterns, Proof | `battery-full` | |
| `bell` | Components, Figma, Proof | `bell-01` | |
| `briefcase` | Components, Figma, Foundations, Patterns | `briefcase` | |
| `bus` | Components, Figma, Patterns | `bus` | |
| `calendar` | Components, Figma, Patterns | `calendar-01` | |
| `calendar-check` | Components, Figma | `calendar-check` | |
| `check` | Components, Figma, Foundations, Patterns, Proof, Voice | `check` | |
| `chevron-down` | Components, Figma | `chevron-down` | |
| `chevron-left` | Components, Figma, Proof | `chevron-left` | |
| `chevron-right` | Components, Figma, Patterns | `chevron-right` | |
| `chevron-up` | Components, Figma | `chevron-up` | |
| `chevrons-up` | Components, Figma, Foundations, Proof, Voice | `chevrons-up` | |
| `circle-alert` | Components, Figma, Voice | `alert-circle` | |
| `circle-check` | Components, Figma, Foundations, Patterns, Proof | `check-circle` | |
| `circle-x` | Components, Figma | `x-circle` | |
| `clapperboard` | Components, Figma | `clapperboard` | |
| `clock` | Components, Figma | `clock` | |
| `cloud-off` | Components, Figma, Patterns, Voice | `cloud-off` | |
| `coffee` | Components, Figma | `coffee` | |
| `contrast` | Foundations | `contrast` | |
| `credit-card` | Components, Figma | `credit-card` | |
| `delete` | Components, Figma, Patterns, Proof | `delete` | |
| `download` | Figma, Sidebar | `download` | |
| `ellipsis` | Components, Figma, Patterns, Proof | `more` | |
| `ellipsis-vertical` | Components, Figma | `more-vertical` | |
| `equal` | Figma, Foundations | `equal` | |
| `eye` | Components, Figma, Proof | `eye` | |
| `eye-off` | Figma | `eye-off` | |
| `gauge` | Components, Figma, Patterns, Proof | `gauge` | |
| `gift` | Components, Figma | `gift` | |
| `graduation-cap` | Components, Figma | `graduation-cap` | |
| `hand-heart` | Voice | **missing** | stand-in `heart` until added |
| `heart-pulse` | Components, Figma | `heart-pulse` | |
| `history` | Figma, Patterns, Proof | `history` | |
| `house` | Components, Figma, Patterns, Proof | `home-01` | |
| `indian-rupee` | Foundations | `rupee` | |
| `info` | Components, Figma, Patterns | `info` | |
| `landmark` | Components, Figma | `bank` | |
| `lightbulb` | Components, Figma | `lightbulb` | |
| `link-2-off` | Components, Figma, Patterns | `link-off` | |
| `list` | Components | `list` | |
| `list-checks` | Figma, Proof | `list-check` | |
| `lock` | Components, Figma | `lock-01` | |
| `log-in` | Patterns | `login` | |
| `menu` | Sidebar | `menu` | |
| `party-popper` | Components, Figma, Voice | `party-popper` | |
| `pencil` | Components, Figma, Proof | `pencil` | |
| `piggy-bank` | Figma, Foundations | `piggy-bank` | |
| `plane` | Components, Figma | `plane` | |
| `play` | Foundations | `play` | |
| `plus` | Components, Figma, Patterns, Proof | `plus` | |
| `receipt` | Components, Figma, Voice | `receipt` | |
| `refresh-cw` | Figma, Proof | `refresh` | |
| `repeat` | Components, Figma | `repeat` | |
| `rotate-ccw` | Figma, Foundations | `undo` | |
| `ruler` | Foundations | `ruler` | |
| `scan-face` | Figma, Patterns | `scan-face` | |
| `scan-search` | Proof | `scan-search` | |
| `search` | Components, Figma, Proof | `search-01` | |
| `search-x` | Components, Figma | `search-x` | |
| `share-2` | Components, Figma | `share-2` | |
| `shield` | Components, Figma | `shield` | |
| `shopping-bag` | Components, Figma, Patterns | `shopping-bag` | |
| `shopping-basket` | Components, Figma, Patterns, Proof | `basket` | |
| `signal` | Figma, Patterns, Proof | `signal` | |
| `signal-low` | Patterns | **missing** | stand-in `wifi-low` until added |
| `sliders-horizontal` | Figma, Proof | `sliders-horizontal` | |
| `split` | Components, Figma | **missing** | stand-in `divide` until added |
| `store` | Components, Figma | `store` | |
| `table` | Components | `table` | |
| `tag` | Components, Figma | `tag` | |
| `target` | Components, Figma, Foundations, Patterns, Proof | `target` | |
| `trash-2` | Components, Figma, Foundations, Patterns | `trash` | |
| `tree-palm` | Components, Figma | **missing** | stand-in `sun` until added |
| `triangle-alert` | Components, Figma, Foundations, Patterns, Proof, Voice | `alert` | |
| `users` | Components, Figma | `users` | |
| `utensils` | Components, Figma, Foundations, Patterns, Proof | `utensils` | |
| `wallet` | Components, Figma, Foundations | `wallet` | |
| `wifi` | Figma, Patterns, Proof | `wifi` | |
| `wifi-off` | Components, Figma, Patterns | `wifi-off` | |
| `x` | Components, Figma, Foundations, Patterns, Voice | `close` | |
| `zap` | Components, Figma, Patterns | `zap` | |
