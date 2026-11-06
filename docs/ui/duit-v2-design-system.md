# Duit: product design system and experience map

**Status:** design direction and Vue implementation, 3 November 2026.
**Reference viewport:** 390 × 844 CSS pixels.
**Prototype:** [`public/duit-prototype.html`](../../public/duit-prototype.html). Its example values and progress are illustrative. The Vue screens use server-backed values and do not show invented XP.

This direction follows the supplied *Duit — Design Direction.html* as the visual and interaction specification. The Vue app now uses its paper, pandan, Inter, grouped lists, bottom navigation, and focused flows. The app has server-backed monthly spending, transactions, insights, receipt extraction, and bill splitting. Payday cycles, comparative insights, and persisted progress require backend contracts before production rollout.

## 1. UX strategy

### The user's mental model

The first question is **“What should I know about my money today?”** The next questions are “Does anything need my attention?” and “What can I do now?” The app should answer them in that order. It is a spending record and review tool, not a bank balance or financial verdict. A spending total must say which period and sources it covers; a comparison must identify its basis. If data is incomplete, show “Recorded in Duit” rather than implying a complete view of all accounts.

For a Malaysian student or early-career worker, money may be spread between a bank card, e-wallet, and cash. Transactions are recognized by merchant, date, and amount before a formal category. Shared meals are social events with a life beyond the receipt. Duit's language follows those facts: **Activity**, **Split**, **Unusual for you**, **Your share**.

### Mobile first

At 390 × 844, the top half is for reading and the lower half is for acting. Four persistent destinations and a central Add action use the bottom reach zone. Detail is a pushed screen; choices and single-field edits use a bottom sheet. The camera is never launched by an accidental tap on Add: Add first opens a choice sheet. Most flows ask for one decision at a time, with the primary action fixed above the bottom safe area. No essential action depends on swipe or long press.

### Home's first five seconds

1. **Spent so far**: one large RM amount on the paper canvas, with an explicit calendar-month label until cycle support exists.
2. **To review**: at most one high-value review item above the fold, with a visible route to the full queue.
3. **Where it went**: one labelled stacked bar, not a chart dashboard.

Below the fold: one weekly insight, a live split when available, three recent transactions, and a quiet link to money habits. If no item needs review, collapse that section to “All caught up” rather than reserving an empty card. The Home summary is not an income or remaining-balance claim. XP remains in the standalone illustrative prototype until it has a server source of truth.

### HCI principles

- **Recognition:** merchant monograms, category names, recent category choices, visible filters, and explicit bill steps.
- **Status:** “Reading receipt”, “Finding items”, and “Ready to review”; per-person split states; toasts after successful actions.
- **Control:** editable extracted fields, category corrections, Retake, Cancel, Undo where supported, and a nonjudgmental dismissal path for insights.
- **Error prevention:** check receipt totals before saving; show tax and service charge before a guest confirms; confirm destructive bill deletion; reconcile contested item claims from the server.
- **Consistency:** rows open detail, sheets present choices, one primary action per screen, and the same payment-status words for owner and guest.
- **Minimalism:** plain list groups with separators; a distinct surface only when information needs grouping or attention.

### AI and emotional tone

Automation appears as a suggested category, extracted fields, or a useful sentence. “Suggested” is an honest label, not a confidence percentage. When a field is uncertain, say “Check this” beside the field. An anomaly is an observation, never a fraud verdict. Copy is calm: “This is higher than your usual Shopee purchases” followed by the evidence and choices. Never shame a user for spending or reward cutting a necessary expense.

## 2. Information architecture

```text
Home
  Cycle summary · review queue · one insight · current split · recent activity
  Notifications → deep links into Activity or Split
Activity
  Search · source/category/date filters · grouped transactions
  Transaction detail → edit field · category sheet · unusual activity resolution
Add (central action, opens sheet)
  Scan receipt → processing → review → save expense or start split
  Add manually → short expense form
  Create split → receipt or manual items
Split
  Open splits · settled history · owner bill → invite/link QR · participants
  Guest link → join as name → choose items → review share → owner's payment image
You
  Progress → level/XP · challenges · badges · milestone history
  Goals/limits · preferences · data/privacy · account
Weekly review and insight detail live from Home and You history.
```

The bottom navigation is **Home, Activity, Add, Split, You**. Add is an action, so it opens a sheet and never claims an active destination. Split deserves a tab because a bill can remain open for days. Insights are reached through a current Home sentence, weekly review, or past reviews in You; a separate tab would compete with the user's immediate jobs. Transaction detail and guest split have no bottom app navigation while completing their focused tasks. The guest web flow needs only a display name, not an account.

## 3. Design language

### Tokens

| Role | Light token | Use |
| --- | --- | --- |
| Canvas | `#F7F5F0` | Warm page ground |
| Surface | `#FFFFFF` | Grouped lists, sheets |
| Recessed | `#EFECE5` | Inputs, tracks, inactive areas |
| Divider | `#E4E0D7` | Row separators and boundaries |
| Primary text | `#1C1B19` | Amounts, headings, body |
| Secondary text | `#57534C` | Metadata and explanatory copy |
| Muted text | `#6E6A62` | Captions, checked for contrast |
| Brand/action | `#0E5A52` | Primary CTA, links, selection |
| Brand pressed | `#0A4540` | Pressed and focus context |
| Brand tint | `#E2EEEA` | Selected rows, helpful emphasis |
| Progress | `#D9A23A` | XP and badge detail only; never small text |
| Positive | `#2E7048` / `#E4F1E8` | Confirmed, paid, money in |
| Caution | `#8F5B00` / `#FAEFD6` | Due soon, needs checking |
| Unusual | `#A3421A` / `#F9E6DC` | Unusual for you |
| Error | `#B3261E` / `#FBE4E1` | Failed action and recovery |
| Information | `#2D5B85` / `#E2ECF5` | Suggested or explanatory |

The palette is intentionally restrained. Category chart colours have similar saturation and direct text labels. Status always combines colour with a word and, where useful, an icon. A future dark theme remaps these semantic roles; it is a user preference and must never be an unlockable reward.

### Type, grid, and shape

Use **Inter** with `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif` fallbacks. Financial figures use `font-variant-numeric: tabular-nums`; no novelty display face. At browser zoom and large text, money may wrap rather than truncate.

| Style | Size / line | Weight | Use |
| --- | --- | --- | --- |
| Display amount | 40 / 44 | 600 | One primary amount per screen |
| Page title | 24 / 30 | 600 | Root and detail title |
| Section heading | 17 / 24 | 600 | Group headings |
| Body | 15 / 22 | 400 | Narrative and form help |
| Label / button | 15 / 20 | 500–600 | Rows, controls |
| Secondary | 13 / 18 | 400 | Metadata |
| Caption | 12 / 16 | 500 | Smallest text, with verified contrast |

Spacing scale: **4, 8, 12, 16, 20, 24, 32, 40, 48**. Phone pages have 20px side margins. Tablet uses 32px, desktop content stays within 1040px. Radius: 8px avatars/inputs, 12px controls and groups, 16px featured surfaces, 24px sheet top corners. Pills are reserved for filters and statuses. Most surfaces are flat; only navigation, toasts, and sheets have subtle elevation. Lucide-style icons use 1.75px strokes, 24px in navigation and 20px in rows.

Use only three chart forms: directly labelled category bar, seven-day columns, and a cycle pace line. Each has a sentence summary in text and accessible markup. Avoid legends and decorative gradients. The wordmark can evolve into lowercase **duit** with a small saffron dot over the “i”; preserve its letterform and use it only on launch, authentication, onboarding, and the guest introduction.

## 4. Gamification model

XP acknowledges actions that leave the user more informed. It is granted **after a completed behaviour**, server-side and idempotently; never on a tap, a spending amount, a login, an invitation, or a claimed saving. The UI should show progress without interrupting the financial task. Challenges are optional, and missing a week does not produce a red failure state.

| Completed behaviour | XP | Guardrail |
| --- | ---: | --- |
| Read and finish weekly review | 15 | Once per report |
| Resolve unusual activity | 10 | Up to 3 per day |
| Confirm five suggested categories | 5 | Each transaction counts once |
| Check and save a scanned receipt | 5 | Up to 3 per day |
| Settle a shared bill | 10 | Once per bill, after owner confirmation |
| Finish monthly review | 25 | Once per report |
| Set first goal or limit | 10 | Once ever |
| Finish an opted-in challenge | 20–40 | Once per challenge |

Cap ordinary XP at 60 per day to limit farming; XP never resets. Levels are led by number and use quiet names: **1 Getting started (0), 2 Noticing (150), 3 In the habit (450), 4 Planner (900), 5 Steady (1500), 6 Clear view (2300), 7 Money-wise (3300)**. Later levels advance every 1500 XP. Progress copy reads “Level 4 · 1,280 of 1,500 XP”. The level does not imply financial worth.

Badges use five geometric families so shape, icon, and text all identify them: Awareness/circle, Consistency/diamond, Planning/shield, Splitting/paired forms, and Insight/hexagon. Tier I is an outline, Tier II a solid brand fill, Tier III adds a saffron ring. Locked badges state the next action and numerical progress, such as “Monthly check-in · 0 of 1”. No emoji or fake cash rewards.

Allow one weekly and one monthly challenge at a time. Examples: **Every transaction, seen** (review the week's entries), **Clear the unsure pile** (confirm suggested categories), and **Eyes on eating out** (check that total three times, with no spending target). A completed action updates in place first, then a polite `+10 XP` toast for four seconds. Level-ups use one quiet milestone sheet. Cosmetic themes and shareable recaps may unlock, but core features and accessibility settings never do.

## 5. Screen system and states

| Screen(s) | Layout and primary job | Primary action and interaction | Empty, loading, error |
| --- | --- | --- | --- |
| Splash / launch | Wordmark on warm canvas; session status text after 1s if needed | Continue to last valid destination | Offline offers Retry without looping |
| Login / sign up | One column, email and password or available identity method; honest privacy note | Sign in / Create account | Inline field errors; keep entered values |
| Short onboarding | Three compact steps: value, preferred currency and period, optional goal | Continue / Start using Duit; every optional step can skip | Defaults are MYR and calendar month until payday support exists |
| Home | Period and amount, one review item, category bar, one insight, split, recent rows, progress line | Review the one pending item; all sections link deeper | New user gets “Add your first expense”; stale cached data is marked; retry is inline |
| Activity list / category filters | Search, one scrollable chip row, grouped days, one transaction row per item | Tap row → detail; More opens category/source sheet | No match names active filters and offers Clear; loading mirrors rows |
| Transaction detail / edit | Merchant and amount, category, date, source, note, receipt; unusual explanation if present | Review unusual item or change category; one-field sheet for edits | Save failure keeps sheet and input; stale version prompts refresh |
| Scan / processing / review | Camera or file picker; named processing steps; extracted merchant/date/total/items | Review each questionable value, then Save expense or Split bill | Blurry image: Retake guidance. Total mismatch is explicit. Never imply certain extraction |
| Split creation | Receipt or manual line items, owner review before sharing | Create split | Missing items or inconsistent total block sharing with clear fix |
| Owner bill / invite / QR share | Total and amount to collect, participant rows with “Picking”, “Marked paid”, “Confirmed”; share link and QR | Share link; tap participant for detail/actions | Empty participant list offers Invite. QR is for the share link only. Payment image is user-provided |
| Guest join / item selection / payment summary / payment image | Name entry, item checkboxes, subtotal/tax/service, full total, owner's QR image | Continue, Save choices, then “I've paid” | Link expired asks owner; item conflict refreshes and preserves available choices; no account wall |
| Insights overview / detail | One short weekly narrative, labelled seven-day bars, evidence-backed insight rows | Finish review or inspect source transactions | Until enough history: “We're still learning your spending patterns” |
| Unusual activity / resolve | Factual reasons from transaction data, no fraud language | Expected / Wrong category / I don't recognise it / Ignore similar | “I don't recognise it” gives bank/e-wallet contact guidance; Duit does not freeze payment |
| Challenges / badges / XP | Level line, one active challenge, badge family collection, milestone history | Opt into or skip a challenge | No badges yet points to the first attainable milestone |
| Profile / settings | Progress above preferences, account and data/privacy grouped below | Open the relevant setting | Failure preserves previous server value and offers Retry |
| Notification centre | Today and Earlier, each item deep-links to its source | Open item | “Nothing new” rather than an empty card |

The prototype demonstrates Home, Activity, detail and editing, scan/processing/review, owner and guest split, insights, and progress. It also presents onboarding, notifications, and common state patterns. It does **not** create financial records or payment payloads.

## 6. Reusable components

| Component | Visual treatment and purpose | States / mobile behaviour |
| --- | --- | --- |
| Primary, secondary, destructive buttons | 52px height, 12px radius, text labels | Default, pressed, disabled, working; one primary per view, sticky when completing a flow |
| Icon button | 44×44 clear target, 20–24px icon | Accessible name, hover/focus/pressed; never sole label for a main action |
| Text, amount, date, search inputs | Label above; 44px minimum; quiet recessed fill | Focus, valid, inline error, disabled; decimal keypad for RM; keyboard keeps CTA visible |
| Filter chip | 44px touch height, horizontal row | Selected has tint, border and check; More opens a sheet |
| Transaction row and avatar | 64px minimum, monogram in category tint, merchant and metadata, tabular amount | Whole row opens detail; status is text; grows with larger type; no hidden swipe |
| Amount display | RM smaller than digits; tabular figures | Debit plain; credit includes `+`; never infer remaining balance |
| Status tag | Compact label with semantic tint | Paid, Waiting, Suggested, Unusual, Check; always words plus colour |
| Insight / anomaly surface | One sentence and one reason, minimal border | Dismiss, detail, source transactions; anomaly uses warm tint, not alarm red |
| Badge / XP / challenge | Geometric badge; thin continuous XP track; segmented challenge steps | Locked, in progress, earned; animation optional and reduced-motion aware |
| Bottom navigation / top bar | Five slots with persistent labels; pushed view has back and centred title | Active page announced; Add opens a sheet; safe-area padding |
| Bottom sheet / dialog | 24px top radius and scrim; dialog only for destructive confirmation | Focus trapped and restored, Close visible, Esc closes; sheet can expand with keyboard |
| Toast / skeleton | Small elevated notice; loading placeholders match actual rows | `aria-live=polite`; Undo lasts six seconds; skeleton motion stops for reduced motion |
| Receipt item / participant row | Plain separators and direct amounts | Check uncertain lines; tap participant opens status/action sheet |
| Payment state | “Items picked → Marked paid → Confirmed by owner” | Guest can mark intent; owner confirms; never claims a real payment was processed |

## 7. Interaction, accessibility, and HCI audit

Navigation targets are at least **44×44px** with 8px separation. The touch target covers the whole row. Pull to refresh may supplement an explicit refresh control, never replace it. Sheets are for choices; pushed screens are places; dialogs are reserved for destructive confirmation. A scan can be cancelled or retaken. Receipt review must allow changing every extracted value that affects money. On a concurrent item claim, return the server's current allocation and ask the guest to choose again; never silently overwrite another participant.

Text contrast aims for WCAG AA (4.5:1 normal, 3:1 large). Non-text controls and focus indicators reach 3:1. The smallest text is 12px and should not contain critical instructions. System status is in text as well as colour. Accessible row names speak merchant, amount, category, and status in that order. Charts have written summaries. Focus follows reading order; sheets trap and restore focus; live updates use polite announcements. At 200% text zoom, rows grow and amounts can move below labels. Reduced motion removes pulsing and sliding without hiding status.

The HCI check for each major journey is simple: the current state is visible; the language matches what the user would say; corrections are available before money-affecting confirmation; similar actions behave similarly; the next action is visible; and failures explain recovery. A fraud claim, a fabricated comparison, a payment confirmation inferred from a QR view, or an XP reward for simply spending would fail this check.

## 8. Tablet and desktop

At **600–1023px**, retain a single column with a 640px reading width and a wider bottom navigation. A bottom sheet may become a centred 480px panel. At **1024px+**, replace the bottom bar with a 240px sidebar, put Add at its top, and constrain content to 1040px. Home may use a 60/40 split after the primary summary; Activity can show the selected transaction in a right detail pane. The same components and wording remain. Desktop does not stretch a 390px screen into a wall of cards.

## 9. Engineering boundary and rollout

The HTML prototype is an interaction and visual specification with fictional sample data. The current production contracts do not support persisted XP, levels, challenges, badges, payday-cycle settings, weekly comparisons, or a full transaction history search; those elements must remain sample-only until the backend has explicit DTOs and persistence. The real Vue app should continue to reconcile from Postgres-backed APIs on reconnect and after mutations. A split's item selections and payment status need server-authoritative concurrency handling. Duit may display a bank-provided payment QR image but must not generate or validate payment payloads.

Before shipping a production implementation, manually review the Kotlin DTOs and TypeScript interfaces together. No shared code generation step currently guarantees that they match.

## 10. Final quality check

This system passes the intended direction when a first-time user can read Home's amount and next action in five seconds, complete capture and split tasks with one hand, correct an extracted mistake, understand why something was marked unusual, and see progress without being pushed to spend less. A review of the prototype should reject any screen with more than one competing primary action, unsupported totals, nested decorative cards, or a status communicated only by colour.
