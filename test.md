# CategoryPicker — portable two-level "choose a category → pick items" picker

Lifted from ApplyLah's onboarding job-type step. A two-level guided picker: pick a
**category** (grid of icon tiles), then **multi-select the items** inside it, then
Continue. No Framer Motion — just React state + Tailwind, so it drops into any
Next.js + React + Tailwind project.

**Deps:** `react`, `lucide-react`, Tailwind (with the tokens in §2). Nothing else.

---

## 1. The component — `CategoryPicker.tsx`

```tsx
"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

// One category: a label, any lucide icon, and the items inside it.
export type PickerCategory = {
  label: string;
  Icon: LucideIcon;
  items: string[];
};

export default function CategoryPicker({
  categories,
  onComplete,
  heading = "What are you into?",
  subheading = "Pick the area closest to you — you'll choose specifics next.",
  itemsHeading = (c) => `Pick from ${c}`,
}: {
  categories: PickerCategory[];
  onComplete: (selected: string[]) => void;
  heading?: string;
  subheading?: string;
  itemsHeading?: (category: string) => string;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const current = categories.find((c) => c.label === category);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-surface p-6 ring-1 ring-line">
      {!category ? (
        /* ---- Level 1: pick a category ---- */
        <>
          <h1 className="text-xl font-bold text-ink">{heading}</h1>
          <p className="mt-1 text-sm text-ink-muted">{subheading}</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {categories.map((c) => (
              <button
                key={c.label}
                onClick={() => {
                  setCategory(c.label);
                  setSelected([]);
                }}
                className="flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-center text-sm font-semibold text-ink-muted ring-1 ring-line transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-ink hover:ring-ink-faint active:scale-[0.98]"
              >
                <c.Icon size={22} strokeWidth={1.8} className="text-sage-deep" />
                {c.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* ---- Level 2: multi-select the items ---- */
        <>
          <button
            onClick={() => {
              setCategory(null);
              setSelected([]);
            }}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            ← All categories
          </button>
          <h1 className="text-xl font-bold text-ink">{itemsHeading(category)}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pick one or more — tap to select.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {current?.items.map((item) => {
              const on = selected.includes(item);
              return (
                <button
                  key={item}
                  onClick={() =>
                    setSelected(
                      on ? selected.filter((x) => x !== item) : [...selected, item],
                    )
                  }
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                    on
                      ? "bg-ink text-surface ring-ink"
                      : "bg-surface text-ink-muted ring-line hover:ring-ink-faint"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {item}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => onComplete(selected)}
            disabled={selected.length === 0}
            className="mt-8 w-full rounded-xl bg-ink px-4 py-3 font-semibold text-surface transition hover:bg-ink-strong disabled:opacity-50"
          >
            Continue →
          </button>
        </>
      )}
    </div>
  );
}
```

---

## 2. Design tokens (required for the exact ApplyLah look)

The `ink` / `surface` / `line` / `sage-deep` classes are custom tokens. Add them or the
colours won't render.

**`globals.css` (inside `:root`):**
```css
:root {
  --canvas:     #FAF8F4;
  --surface:    #FFFFFF;
  --ink:        #16314E;  /* primary text + buttons (deep navy) */
  --ink-strong: #112539;  /* button hover */
  --ink-muted:  #6B6862;  /* secondary text */
  --ink-faint:  #9A958C;  /* captions / hover ring */
  --line:       #E4DFD6;  /* borders */
  --sage-deep:  #16314E;  /* icon colour */
}
```

**`tailwind.config.ts` (`theme.extend.colors`):**
```ts
colors: {
  canvas: "var(--canvas)",
  surface: "var(--surface)",
  ink: "var(--ink)",
  "ink-strong": "var(--ink-strong)",
  "ink-muted": "var(--ink-muted)",
  "ink-faint": "var(--ink-faint)",
  line: "var(--line)",
  "sage-deep": "var(--sage-deep)",
},
```

---

## 3. Usage (swap in your own domain)

```tsx
import { Palette, Code, Music } from "lucide-react";
import CategoryPicker, { type PickerCategory } from "./CategoryPicker";

// 👇 replace with YOUR categories → items
const CATEGORIES: PickerCategory[] = [
  { label: "Design", Icon: Palette, items: ["Logos", "Posters", "UI / UX"] },
  { label: "Code",   Icon: Code,    items: ["Web", "Mobile", "Scripts"] },
  { label: "Music",  Icon: Music,   items: ["Lo-fi", "Rock", "Jazz"] },
];

export default function Page() {
  return (
    <CategoryPicker
      categories={CATEGORIES}
      heading="What are you into?"
      itemsHeading={(c) => `Which ${c.toLowerCase()}?`}
      onComplete={(picked) => {
        console.log("user selected:", picked); // do your next step here
      }}
    />
  );
}
```

---

## How it works (30-second version)

- **State:** `category` (which tile is open, or `null`) + `selected` (chosen items).
- **Level 1** renders when `category === null` — a grid of category tiles; tapping one
  sets `category` and clears the selection.
- **Level 2** renders once a category is picked — a back button, the category's `items`
  as toggle-pills (tap to add/remove), then a **Continue** disabled until ≥1 is picked,
  which fires `onComplete(selected)`.
- **It returns, it doesn't decide** — `onComplete` hands you the selected array; the
  parent does whatever's next.

## Tweaks

- **Single-select** at level 2 instead of multi: change the toggle to `setSelected([item])`.
- **Different theme** (dark, other palette): change the token hex values in §2, or
  find-and-replace the class names (`text-ink` → `text-slate-900`, etc.).
- **3 levels** (category → subcategory → items): ask and I'll give you a recursive version.
