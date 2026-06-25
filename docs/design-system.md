# Clarion Design System

## Brand tokens

All tokens are CSS custom properties defined in `src/app/globals.css` and exposed to Tailwind via `@theme inline`. Use the Tailwind utility name (e.g. `bg-accent`, `text-muted`) — never the raw hex.

| Token | Tailwind utility | Value | Use |
|---|---|---|---|
| `--accent` | `accent` | `#2a3e62` | Navy primary — buttons, links, focus rings |
| `--accent-soft` | `accent-soft` | `#1b2c4a` | Darker navy — hover, emphasis text |
| `--accent-warm` | `accent-warm` | `#e0922f` | Amber secondary — warnings, highlights |
| `--accent-warm-soft` | `accent-warm-soft` | `#c47d22` | Darker amber — warning text, hover |
| `--accent-clay` | `accent-clay` | `#c2613c` | Terracotta — danger states, destructive actions |
| `--accent-sage` | `accent-sage` | `#4f7a68` | Sage — positive/advance actions |
| `--background` | `background` | `#fcfbf8` | Warm white page background |
| `--foreground` | `foreground` | `#15181e` | Warm ink — primary text |
| `--muted` | `muted` | `#6e6a60` | Warm gray — secondary text |
| `--card` | `card` | `#f4f1ea` | Warm card surface |
| `--border` | `border` | `#e6e2da` | Warm gray border |

### Shadow tokens

| Token | CSS var | Use |
|---|---|---|
| Button primary glow | `--shadow-button-primary` | `shadow-[var(--shadow-button-primary)]` on `Button variant="primary"` |
| Dashboard preview | `--shadow-dashboard` | Frosted-glass dashboard card in the landing hero |

## Radius hierarchy

| Context | Radius | Class |
|---|---|---|
| Buttons, badges, pills | Full | `rounded-full` |
| Major card (default) | 2xl | `rounded-2xl` |
| Form container card | xl | `rounded-xl` |
| Input, Textarea | lg | `rounded-lg` |
| Quote bubble, small accent | md | `rounded-md` |

Never drift from this hierarchy without a stated reason.

## Border convention

| State | Class |
|---|---|
| Default card border | `border-border` |
| Divider line | `border-border/60` |
| Interactive focus | `border-accent` (via `focus:border-accent`) |
| Dashed empty state | `border-dashed border-border` |
| Accent tinted card | `border-accent/30` |
| Warning tinted card | `border-accent-warm/40` |

## Typography

Two fonts, set on `<html>` via CSS vars:

- **`--font-hanken`** (`font-sans`) — body, UI labels, all prose
- **`--font-fraunces`** (`font-display`) — headings (h1/h2/h3 in globals.css), hero display, editorial moments

`letter-spacing: -0.012em` is applied globally to h1/h2/h3. Don't override unless intentional.

---

## Component API

### `Button` — `src/components/ui/Button.tsx`

For every authenticated app screen and candidate-facing form. Renders `<button>` only — never a `<Link>`.

```tsx
<Button
  variant="primary" | "secondary" | "danger" | "positive" | "ghost"
  size="sm" | "md"           // default: md
  loading={boolean}          // shows Spinner + disables
  loadingText="Saving…"      // text while loading (falls back to children)
  disabled={boolean}
>
  Label
</Button>
```

| Variant | Use | Color |
|---|---|---|
| `primary` | Default CTA | Navy bg, white text, glow shadow |
| `secondary` | Secondary action | Border only, hover navy border |
| `danger` | Destructive hover state | Border only, hover terracotta |
| `positive` | Advance candidate | Sage bg, white text |
| `ghost` | Inline text action | Text-only, no padding/border/ring |

`ghost` skips `rounded-full`, padding, and ring chrome — it's a text link, not a pill.

**Never use `Button` for Link-based navigation** — styled `<Link>` or `MagneticButton` (marketing) for those.

---

### `IconButton` — `src/components/ui/IconButton.tsx`

Standardized icon-only action (close, copy, sign-out). Always requires `aria-label`.

```tsx
<IconButton aria-label="Close" size="sm" | "md" onClick={…}>
  <XIcon className="h-4 w-4" />
</IconButton>
```

`size="md"` → `h-9 w-9` (default). `size="sm"` → `h-7 w-7`.

**Not for**: MCQ radio circles, calibration score buttons, landing play button — those are custom selection widgets.

---

### `Card` — `src/components/ui/Card.tsx`

Replaces the copy-pasted `rounded-2xl border border-border bg-card/50 p-6` pattern.

```tsx
<Card
  padding="sm" | "md" | "lg"    // p-4 / p-6 / p-8 — default: md
  tint={30|40|50|60|70|"accent"|"warning"}  // bg-card/N or tinted — default: 50
  radius="xl" | "2xl"           // default: 2xl
  lifted={boolean}              // appends .lift hover effect
  border="solid" | "dashed"     // default: solid
  className="…"                 // merged last (layout, margin, etc.)
>
  …
</Card>
```

`tint="accent"` → navy-tinted card (`border-accent/30 bg-accent/5`).  
`tint="warning"` → amber-tinted card (`border-accent-warm/40 bg-accent-warm/10`).  
`border="dashed"` → empty-state placeholder (uses `border-border`, no tint override).

---

### `Badge` — `src/components/ui/Badge.tsx`

Single source of truth for status coloring. Three independent domains — never merge them.

```tsx
// Candidate lifecycle stage
<Badge domain="status" value={candidate.status} size="xs"|"sm"|"md">
  {localizedLabel}
</Badge>

// AI free-text recommendation
<Badge domain="recommendation" value={verdict.recommendation} size="md">
  {verdict.recommendation}
</Badge>

// Composite score band
<Badge domain="band" value={composite.band} size="md">
  {composite.band}
</Badge>

// Ad-hoc tone (no domain)
<Badge tone="neutral"|"info"|"positive"|"warning"|"negative">
  label
</Badge>
```

| Domain | Values |
|---|---|
| `status` | `invited` · `interviewing` · `completed` · `advanced` · `rejected` |
| `recommendation` | `advance` · `lean advance` · `lean reject` · `reject` · *(free text → neutral fallback)* |
| `band` | `Strong` · `Recommended` · `Borderline` · `Not recommended` · *(unscored → neutral fallback)* |

| Size | Class |
|---|---|
| `xs` | `px-2 py-0.5 text-xs` — compact inline |
| `sm` | `px-3 py-1 text-xs` — default |
| `md` | `px-3 py-1 text-sm` — prominent (composite band pill) |

Tone → color mapping:

| Tone | Background | Text |
|---|---|---|
| `neutral` | `bg-card` | `text-muted` |
| `info` | `bg-accent/15` | `text-accent-soft` |
| `positive` | `bg-accent-sage/15` | `text-accent-sage` |
| `warning` | `bg-accent-warm/15` | `text-accent-warm-soft` |
| `negative` | `bg-accent-clay/15` | `text-accent-clay` |

---

### `Input` — `src/components/ui/Input.tsx`

```tsx
<Input
  label="Label text"   // optional — renders uppercase tracking-wide label above
  error="Error msg"    // optional — renders terracotta error below
  className="mt-2"     // merged onto the <input> (or wrapper div when label/error present)
  // all native <input> props
/>
```

Base: `w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent disabled:opacity-50`.

---

### `Textarea` — `src/components/ui/Textarea.tsx`

```tsx
<Textarea
  size="sm" | "md" | "lg"   // min-h-16 / min-h-28 / min-h-40 — default: md
  label="…"
  error="…"
  className="mt-4"
/>
```

All sizes use `rounded-lg` (no drift to `rounded-xl`). `size="lg"` also uses `px-4 py-3` (larger padding for long-form answers).

---

### `Spinner` — `src/components/ui/Spinner.tsx`

The `orb-pulse` dot extracted as a standalone primitive. Used inside `Button loading`.

```tsx
<Spinner size="xs" | "sm" />   // h-2.5 w-2.5 / h-3 w-3
```

---

## Motion tier rule

**`motion.tsx` marketing buttons** (`MagneticButton`, `PrimaryButton`, `SecondaryButton`) — public landing page only. Link-based, shimmer/magnetic effects. Never use inside authenticated app screens.

**`ui/Button`** — every authenticated app screen and candidate-facing form. Button-based, supports `loading` state. Never use on the public landing page.

---

## Migration changelog

All raw Tailwind palette colors (`green-50`, `amber-50`, `red-500`, `slate-100`, etc.) have been replaced with brand tokens. The four independent `statusPill` / `recColor` / `bandStyle` / `scoreClasses` objects that previously lived in `VerdictView.tsx`, `CandidatePanel.tsx`, `CandidateStatus.tsx`, and `KanbanBoard.tsx` are deleted — `Badge` is now the single source of truth for all status coloring.

| File | What changed |
|---|---|
| `VerdictView.tsx` | `statusPill`, `recColor`, `bandStyle` → `Badge`; `bg-green-500` advance → `Button variant="positive"`; reject hover → `Button variant="danger"` |
| `CandidatePanel.tsx` | `statusPill` → `Badge`; share-code box → `Card tint="accent"` |
| `CandidateStatus.tsx` | `badgeClass` → `Badge` |
| `KanbanBoard.tsx` | `scoreClasses` → `Badge`; column dots → brand tokens |
| `AssessmentForm.tsx` | Local input/label strings → `Input`, `Textarea`, `Button` |
| `RolePicker.tsx`, `SkillsTest.tsx`, `TextInterview.tsx`, `SettingsForm.tsx`, `ResumeUpload.tsx` | → `Input`, `Textarea`, `Button` |
| `dashboard/page.tsx`, `roles/page.tsx`, `settings/page.tsx`, `roles/new/page.tsx` | → `Card`, `Badge` |
| `SignOutButton.tsx` | `rounded-lg` icon-only → `IconButton` (`rounded-full`) |
| `DeleteButton.tsx` | `red-500`/`red-400` → `accent-clay` |
| `page.tsx` (landing) | CTA section `#e0922f`/`#3a4f7a` hex → `accent-warm`/`accent` tokens |
| `motion.tsx` | 3× literal rgba shadow string → `var(--shadow-button-primary)` |
