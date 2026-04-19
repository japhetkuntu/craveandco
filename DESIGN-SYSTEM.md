# Crave & Co — Design System Prompt

> **Purpose**: This document is the single source of truth for the visual design, component architecture, and UI/UX standards of the Crave & Co multi-portal restaurant platform. Every page, component, and interaction MUST conform to this system. No exceptions.

---

## Tech Stack Context

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS v4 (using `@theme inline` in globals.css — no tailwind.config file)
- **Icons**: Lucide React (outline style, consistent 24px default)
- **Charts**: Recharts
- **Fonts**: Geist Sans (primary), Geist Mono (monospace/data)
- **Utilities**: `clsx` via `cn()` helper at `@/lib/utils`
- **Path alias**: `@/*` → `./src/*`

---

## 1. Brand Identity

Crave & Co is a premium restaurant brand. The platform must feel like a **luxury product** — think Apple's restraint, Netflix's polish, and Google's usability. Every pixel should communicate quality, confidence, and clarity.

### Brand Personality
- **Elegant** — Not flashy, not corporate. Refined.
- **Confident** — Bold use of black and gold. No timidity.
- **Warm** — Gold brings warmth to the dark palette. The platform should feel inviting, not cold.
- **Effortless** — Complexity hidden behind simplicity. If the user has to think, the design has failed.

---

## 2. Color System

### 2.1 Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-gold` | `#C9A646` | Primary accent, CTAs, highlights, active states |
| `--color-gold-light` | `#D4B85C` | Hover states on gold elements |
| `--color-gold-dark` | `#A8882E` | Pressed/active states on gold elements |
| `--color-gold-muted` | `rgba(201, 166, 70, 0.15)` | Gold tinted backgrounds, subtle highlights |
| `--color-black` | `#0B0B0B` | Primary background (base layer) |
| `--color-white` | `#FFFFFF` | Primary text, icons on dark surfaces |

### 2.2 Surface Layers (Dark Mode — Default)

Dark mode uses **layered surfaces** to create depth. Never use flat pure black everywhere.

| Token | Hex | Usage |
|---|---|---|
| `--surface-base` | `#0B0B0B` | Page background, deepest layer |
| `--surface-raised` | `#141414` | Cards, panels, sidebar |
| `--surface-overlay` | `#1A1A1A` | Modals, dropdowns, popovers |
| `--surface-elevated` | `#222222` | Hover states on raised surfaces, nested cards |
| `--surface-input` | `#1A1A1A` | Input field backgrounds |
| `--surface-input-focus` | `#222222` | Input field backgrounds when focused |

### 2.3 Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Headings, primary content |
| `--text-secondary` | `#A0A0A0` | Labels, descriptions, secondary info |
| `--text-tertiary` | `#666666` | Placeholders, disabled text, timestamps |
| `--text-inverse` | `#0B0B0B` | Text on gold buttons or white surfaces |

### 2.4 Semantic / Functional Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#2ECC71` | Success states, positive trends, "Ready" |
| `--color-success-muted` | `rgba(46, 204, 113, 0.15)` | Success backgrounds |
| `--color-warning` | `#F39C12` | Warning states, "Pending", attention needed |
| `--color-warning-muted` | `rgba(243, 156, 18, 0.15)` | Warning backgrounds |
| `--color-error` | `#E74C3C` | Error states, destructive actions, "Delayed" |
| `--color-error-muted` | `rgba(231, 76, 60, 0.15)` | Error backgrounds |
| `--color-info` | `#3498DB` | Informational, "Cooking", in-progress |
| `--color-info-muted` | `rgba(52, 152, 219, 0.15)` | Info backgrounds |

### 2.5 Border Colors

| Token | Hex | Usage |
|---|---|---|
| `--border-default` | `#222222` | Default borders, dividers |
| `--border-subtle` | `#1A1A1A` | Subtle separators |
| `--border-strong` | `#333333` | Emphasized borders |
| `--border-gold` | `#C9A646` | Active/selected borders, focus rings |

### 2.6 Tailwind v4 Implementation

In `globals.css`, define all tokens inside `@theme inline {}`:

```css
@import "tailwindcss";

@theme inline {
  /* Core */
  --color-gold: #C9A646;
  --color-gold-light: #D4B85C;
  --color-gold-dark: #A8882E;
  --color-gold-muted: rgba(201, 166, 70, 0.15);

  /* Surfaces */
  --color-surface-base: #0B0B0B;
  --color-surface-raised: #141414;
  --color-surface-overlay: #1A1A1A;
  --color-surface-elevated: #222222;
  --color-surface-input: #1A1A1A;

  /* Text */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A0A0A0;
  --color-text-tertiary: #666666;
  --color-text-inverse: #0B0B0B;

  /* Semantic */
  --color-success: #2ECC71;
  --color-success-muted: rgba(46, 204, 113, 0.15);
  --color-warning: #F39C12;
  --color-warning-muted: rgba(243, 156, 18, 0.15);
  --color-error: #E74C3C;
  --color-error-muted: rgba(231, 76, 60, 0.15);
  --color-info: #3498DB;
  --color-info-muted: rgba(52, 152, 219, 0.15);

  /* Borders */
  --color-border-default: #222222;
  --color-border-subtle: #1A1A1A;
  --color-border-strong: #333333;

  /* Fonts */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-gold: 0 0 0 1px rgba(201, 166, 70, 0.3), 0 4px 12px rgba(201, 166, 70, 0.15);

  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}

/* Base styles */
body {
  background: var(--color-surface-base);
  color: var(--color-text-primary);
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Selection */
::selection {
  background: rgba(201, 166, 70, 0.3);
  color: #FFFFFF;
}

/* Scrollbar (webkit) */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #444444;
}

/* Focus ring utility */
.focus-ring {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-surface-base), 0 0 0 4px var(--color-gold);
}
```

### 2.7 Color Rules — MUST FOLLOW

1. **Gold is precious** — Use it sparingly. Only for: primary CTAs, active navigation, key highlights, focus rings. If gold is everywhere, it loses its power.
2. **Never use pure white backgrounds** — The platform is dark-mode-first. White is for text and icons, not surfaces.
3. **Semantic colors are for meaning** — Never use success green for decoration. Every colored element must communicate status or meaning.
4. **Surface hierarchy matters** — Base → Raised → Overlay → Elevated. Each layer is slightly lighter. This creates natural depth without borders.
5. **Text contrast**: Primary text (#FFF) on dark surfaces must maintain WCAG AA (4.5:1 minimum). Secondary text (#A0A0A0) must maintain 3:1 minimum.

---

## 3. Typography

### 3.1 Type Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| Display | 40px (2.5rem) | Bold (700) | 1.1 | -0.02em | Hero numbers, splash screens |
| H1 | 32px (2rem) | Bold (700) | 1.2 | -0.02em | Page titles |
| H2 | 24px (1.5rem) | SemiBold (600) | 1.3 | -0.01em | Section headings |
| H3 | 20px (1.25rem) | SemiBold (600) | 1.4 | -0.01em | Card titles, subsections |
| H4 | 16px (1rem) | SemiBold (600) | 1.4 | 0 | Labels, small headings |
| Body | 16px (1rem) | Regular (400) | 1.6 | 0 | Paragraphs, descriptions |
| Body Small | 14px (0.875rem) | Regular (400) | 1.5 | 0 | Secondary text, table cells |
| Caption | 12px (0.75rem) | Medium (500) | 1.4 | 0.02em | Timestamps, metadata, badges |
| Overline | 11px (0.6875rem) | SemiBold (600) | 1.4 | 0.08em | Section labels (uppercase) |

### 3.2 Typography Rules

1. **Geist Sans for everything** — One font family. Consistency is premium.
2. **Geist Mono only for data** — Order numbers, amounts, IDs, timestamps in tables.
3. **Never go below 12px** — Accessibility is non-negotiable.
4. **Headings are white (#FFF)**, body text can be secondary (#A0A0A0) when appropriate.
5. **Use font-weight hierarchy**: Bold for headings, SemiBold for emphasis, Regular for body. Never use Light or Thin.
6. **Maximum line length**: 65–75 characters for readability.
7. **Use uppercase + letter-spacing (0.08em) only for overline/label text** like section headers in sidebars and card category labels.

### 3.3 Tailwind Classes

```
Display:  text-[2.5rem] font-bold leading-[1.1] tracking-tight
H1:       text-[2rem] font-bold leading-[1.2] tracking-tight
H2:       text-2xl font-semibold leading-[1.3]
H3:       text-xl font-semibold leading-[1.4]
H4:       text-base font-semibold leading-[1.4]
Body:     text-base font-normal leading-relaxed
Body-sm:  text-sm font-normal leading-snug
Caption:  text-xs font-medium leading-[1.4] tracking-wide
Overline: text-[0.6875rem] font-semibold leading-[1.4] tracking-widest uppercase
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (8px base)

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight gaps (icon-text) |
| `space-2` | 8px | Inline spacing, small gaps |
| `space-3` | 12px | Compact component padding |
| `space-4` | 16px | Standard component padding, gap between related items |
| `space-5` | 20px | Medium gaps |
| `space-6` | 24px | Section padding, card padding |
| `space-8` | 32px | Large section gaps |
| `space-10` | 40px | Page-level padding |
| `space-12` | 48px | Major section separators |
| `space-16` | 64px | Page top/bottom margins |

### 4.2 Layout Grid

**Desktop (≥1024px)**:
- 12-column grid
- Max content width: 1440px (1280px for dense pages like owner dashboard)
- Sidebar: fixed 260px (collapsed: 72px)
- Main content: fluid with 32px padding
- Card grid: typically 2, 3, or 4 columns

**Tablet (768px–1023px)**:
- 8-column grid
- Sidebar: hidden → hamburger menu or sheet overlay
- Main content: 24px padding
- Card grid: 2 columns

**Mobile (<768px)**:
- 4-column grid
- Bottom navigation bar: fixed, 64px height
- Main content: 16px padding
- Card grid: 1 column (full width), scrollable horizontal for KPIs
- Bottom safe area: 16px extra padding above nav for iOS

### 4.3 Breakpoints

```css
/* Use in Tailwind classes */
sm:   640px    /* Large phones */
md:   768px    /* Tablets */
lg:   1024px   /* Desktop */
xl:   1280px   /* Large desktop */
2xl:  1536px   /* Ultra-wide */
```

### 4.4 Layout Rules

1. **Generous whitespace** — Premium products breathe. Never cram.
2. **Consistent gutters** — 16px between cards on mobile, 24px on tablet, 24–32px on desktop.
3. **Content hierarchy via spacing** — More space = more separation = different section.
4. **Cards fill their grid cell** — No fixed-width cards. They flex to fill the column.
5. **Sticky elements**: Page header, sidebar, bottom nav, kitchen order toolbar — these stay fixed/sticky.

---

## 5. Component Library

Every component must use the `cn()` utility from `@/lib/utils` for conditional classes. Every component must be in `src/components/ui/` and exported by name.

### 5.1 Button

**Variants**:

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| `primary` | `bg-gold` | `text-text-inverse` (#0B0B0B) | none | Primary actions: Save, Submit, Confirm |
| `secondary` | `transparent` | `text-white` | `border border-border-strong` | Secondary actions: Cancel, Back |
| `ghost` | `transparent` | `text-text-secondary` | none | Tertiary: filters, dismiss, inline actions |
| `danger` | `bg-error` | `text-white` | none | Destructive: Delete, Remove |
| `danger-ghost` | `transparent` | `text-error` | none | Subtle destructive: inline delete |

**Sizes**:

| Size | Height | Padding | Font Size | Icon Size |
|---|---|---|---|---|
| `sm` | 36px | 12px 16px | 13px | 16px |
| `md` | 44px | 12px 20px | 14px | 18px |
| `lg` | 52px | 16px 28px | 16px | 20px |

**States**:
- **Default**: As specified
- **Hover**: Primary → `bg-gold-light`, Secondary → `bg-surface-elevated`, Ghost → `bg-surface-raised`
- **Active/Pressed**: Primary → `bg-gold-dark`, scale(0.98)
- **Disabled**: `opacity-40 cursor-not-allowed` (no pointer events)
- **Loading**: Show a small spinner (16px) replacing icon or prepended, text remains, button disabled

**Rules**:
- Minimum touch target: 44px height on all devices
- Always use `font-semibold`
- Border-radius: `rounded-xl` (12px)
- Transition: `transition-all duration-[150ms]`
- Focus: `focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base`
- Full-width on mobile for primary actions: `w-full sm:w-auto`

```tsx
// Usage examples
<Button variant="primary" size="lg">Place Order</Button>
<Button variant="secondary" size="md" icon={<Filter />}>Filters</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="primary" loading>Saving...</Button>
```

### 5.2 Card

The card is the fundamental content container. Everything lives in cards.

**Structure**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardActions>{/* Buttons, links */}</CardActions>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Footer actions */}
  </CardFooter>
</Card>
```

**Styles**:
- Background: `bg-surface-raised`
- Border: `border border-border-default`
- Radius: `rounded-2xl` (16px)
- Padding: `p-6` (24px)
- No box-shadow by default (borders create depth in dark mode)
- Hover (if clickable): `hover:border-border-strong hover:bg-surface-elevated transition-all duration-[150ms]`

**Nested cards** (cards within cards): Use `bg-surface-overlay` and `rounded-xl` (12px).

### 5.3 KPI Card

Used on dashboards to display key metrics.

**Layout**:
```
┌──────────────────────────────┐
│ [Icon]                       │
│                              │
│ Revenue Today                │ ← Overline label (text-text-secondary, uppercase, 11px)
│ GH₵ 4,250.00                │ ← Display value (text-2xl or text-3xl font-bold font-mono)
│ ↑ 12.5% vs last week        │ ← Trend indicator (color-coded)
└──────────────────────────────┘
```

**Trend Colors**:
- Positive: `text-success` with `TrendingUp` icon
- Negative: `text-error` with `TrendingDown` icon
- Neutral: `text-text-tertiary` with `Minus` icon

**Severity Border** (optional left-accent):
- Healthy: `border-l-4 border-l-success`
- Warning: `border-l-4 border-l-warning`
- Critical: `border-l-4 border-l-error`

**Mobile**: KPI cards scroll horizontally in a snap-scroll container. Min-width: 260px per card.

### 5.4 Status Badge

Pill-shaped badge for order status, alert severity, campaign state.

**Style**: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold`

**Variants** — Use semantic background + strong text:

| Status | Background | Text | Dot Color |
|---|---|---|---|
| NEW / PENDING | `bg-warning-muted` | `text-warning` | `bg-warning` |
| PREPARING / COOKING | `bg-info-muted` | `text-info` | `bg-info` |
| READY | `bg-success-muted` | `text-success` | `bg-success` |
| COMPLETED | `bg-surface-elevated` | `text-text-secondary` | `bg-text-tertiary` |
| CANCELLED / DELAYED | `bg-error-muted` | `text-error` | `bg-error` |
| DRAFT | `bg-surface-elevated` | `text-text-tertiary` | `bg-text-tertiary` |
| RUNNING / ACTIVE | `bg-gold-muted` | `text-gold` | `bg-gold` |

Each badge includes a small 6px dot before the label for additional clarity (don't rely on color alone).

### 5.5 Input / Text Field

**Structure**:
```tsx
<FormField>
  <Label>Email Address</Label>
  <Input type="email" placeholder="you@example.com" />
  <HelperText>We'll never share your email</HelperText>
  <ErrorMessage>Please enter a valid email</ErrorMessage>
</FormField>
```

**Styles**:
- Height: `h-12` (48px) minimum — touch-friendly
- Background: `bg-surface-input`
- Border: `border border-border-default`
- Radius: `rounded-xl`
- Text: `text-base text-text-primary`
- Placeholder: `placeholder:text-text-tertiary`
- Focus: `focus:border-gold focus:ring-1 focus:ring-gold focus:bg-surface-input-focus`
- Error state: `border-error focus:ring-error`
- Disabled: `opacity-50 cursor-not-allowed bg-surface-base`

**Label**:
- Always visible above the input (never floating or placeholder-only)
- Style: `text-sm font-medium text-text-secondary mb-1.5`
- Required indicator: red asterisk `*` after label text

**Rules**:
1. Labels are ALWAYS visible. Never rely on placeholder as label.
2. Error messages appear below the input in `text-error text-sm`, with an `AlertCircle` icon.
3. Success validation shows a `Check` icon inside the input (right side).
4. Group related fields. Use `gap-5` between fields.

### 5.6 Select / Dropdown

Same height and styling as Input. Use a custom dropdown panel:
- Panel: `bg-surface-overlay border border-border-default rounded-xl shadow-lg`
- Options: `px-4 py-3 hover:bg-surface-elevated cursor-pointer`
- Selected option: `text-gold` with a `Check` icon
- Transition: `transform origin-top scale-y-0 → scale-y-100` with `duration-[150ms]`

### 5.7 Table

**Desktop**: Standard table with proper alignment.
- Header: `bg-surface-raised text-text-secondary text-xs font-semibold uppercase tracking-widest`
- Rows: `border-b border-border-subtle hover:bg-surface-elevated transition-colors`
- Cell padding: `px-4 py-4`
- Numbers/amounts: `font-mono text-right`
- Sortable columns: Gold underline on active sort, arrow icon

**Mobile (<768px)**: Tables MUST convert to a **card list**.
- Each row becomes a card with key-value pairs stacked vertically.
- The primary identifier (order #, customer name) becomes the card's bold header.
- Status badge and key metric are visible without expansion.
- Use `<details>` or expand button for secondary fields.

### 5.8 Navigation

#### Desktop Sidebar

```
┌──────────────────────────┐
│  🟡 CRAVE & CO           │ ← Logo + brand (gold accent)
│                          │
│  MAIN                    │ ← Section label (overline)
│  ▸ Dashboard             │ ← Active: gold text, gold-muted bg, gold left border
│    Orders                │ ← Default: text-secondary
│    Menu                  │ ← Each item: icon + label, 48px height
│    Inventory             │
│                          │
│  MANAGEMENT              │
│    Staff                 │
│    Finance               │
│                          │
│  ─────────────────────── │
│  ⚙ Settings              │
│  ⎋ Logout                │
└──────────────────────────┘
```

- Width: 260px expanded, 72px collapsed (icon-only)
- Background: `bg-surface-raised`
- Border right: `border-r border-border-subtle`
- Active item: `text-gold bg-gold-muted border-l-2 border-l-gold`
- Hover: `bg-surface-elevated text-text-primary`
- Each item height: 48px, `px-4`, `gap-3` between icon and label
- Collapse trigger: `ChevronLeft`/`ChevronRight` icon at bottom of sidebar
- On collapse: only icons visible, tooltip on hover showing label

#### Mobile Bottom Navigation

```
┌──────────────────────────────────────────┐
│  🏠      📋      📊      ⋯              │
│  Home   Orders  Reports  More           │
└──────────────────────────────────────────┘
```

- Fixed to bottom: `fixed bottom-0 left-0 right-0`
- Height: 64px + safe-area padding (`pb-safe` for iOS)
- Background: `bg-surface-raised border-t border-border-subtle`
- Max 4–5 visible items. Overflow → "More" with a sheet overlay
- Active: `text-gold`, inactive: `text-text-tertiary`
- Each item: icon (24px) + label (10px), stacked vertically, centered
- Touch target: full column width, minimum 44px

#### Mobile Top Bar

```
┌──────────────────────────────────────────┐
│  ☰    Dashboard                    🔔   │
└──────────────────────────────────────────┘
```

- Height: 56px
- Background: `bg-surface-raised border-b border-border-subtle`
- Left: hamburger menu (for secondary nav) or back arrow
- Center: page title (H4, semibold)
- Right: notification bell with badge count

### 5.9 Modal / Dialog

- Overlay: `bg-black/60 backdrop-blur-sm`
- Panel: `bg-surface-raised border border-border-default rounded-2xl shadow-lg`
- Max width: `max-w-md` (default), `max-w-lg`, `max-w-xl` variants
- Padding: `p-6`
- Header: Title (H3) + optional close button (X icon, top-right)
- Footer: Action buttons right-aligned, `gap-3`
- Animation: fade in + slide up (`translateY(8px) → 0` in 250ms)
- Mobile: Modal becomes a bottom sheet (slides up from bottom, `rounded-t-2xl`)

### 5.10 Toast Notifications

- Position: Top-right on desktop, top-center on mobile
- Background: `bg-surface-overlay border border-border-default`
- Left accent bar with semantic color (success/warning/error/info)
- Auto-dismiss: 5 seconds (with progress bar at bottom)
- Includes: icon + title + optional description + close button
- Animation: slide in from right (desktop), slide down from top (mobile)
- Stack: max 3 visible, newer pushes older down

### 5.11 Skeleton Loader

Use skeleton loaders for ALL loading states. Never use spinners for page-level loading.

- Background: `bg-surface-elevated`
- Animation: subtle pulse (`animate-pulse`) — a gentle opacity oscillation
- Shape: Match the content shape (rounded rectangles for text, circles for avatars, card shapes for cards)
- Duration: Pulse at 1.5s interval

Spinners are ONLY acceptable for:
- Button loading state (inline, 16px)
- Inline action feedback (refreshing a single card)

### 5.12 Empty State

When a list, table, or section has no data:

```
┌──────────────────────────────────────┐
│                                      │
│          [Illustration/Icon]         │ ← 48px lucide icon, text-text-tertiary
│                                      │
│        No orders yet today           │ ← H3, text-text-primary
│  Orders will appear here once        │ ← Body-sm, text-text-secondary
│  customers start placing them.       │
│                                      │
│       [ Create First Order ]         │ ← Primary CTA (optional)
│                                      │
└──────────────────────────────────────┘
```

### 5.13 Avatar / User Badge

- Size: 40px (default), 32px (compact), 48px (profile)
- Shape: Circle (`rounded-full`)
- Fallback: Gold background with white initials (font-semibold)
- Online indicator: 10px green dot, bottom-right, bordered with 2px surface-raised

### 5.14 Charts (Recharts)

All charts MUST follow the brand palette:

- Background: transparent (let the card surface show)
- Grid lines: `#222222` (border-default), dashed
- Axis labels: `#A0A0A0` (text-secondary), 12px, Geist Sans
- Primary data line/bar: `#C9A646` (gold)
- Secondary data: `#3498DB` (info)
- Tertiary data: `#A0A0A0` (text-secondary)
- Tooltip: `bg-surface-overlay border border-border-default rounded-lg p-3 shadow-lg`
- Area fill: Use gold with 10–15% opacity gradient (`rgba(201, 166, 70, 0.15)` → `transparent`)
- No unnecessary gridlines or chart junk. Keep it clean.

**Recharts theme config**:
```tsx
const chartColors = {
  primary: '#C9A646',
  secondary: '#3498DB',
  tertiary: '#A0A0A0',
  success: '#2ECC71',
  error: '#E74C3C',
  grid: '#222222',
  text: '#A0A0A0',
};
```

---

## 6. Interaction & Motion

### 6.1 Micro-interactions

| Interaction | Animation | Duration | Easing |
|---|---|---|---|
| Button hover | Background color shift | 150ms | ease-out |
| Button press | `scale(0.98)` | 100ms | ease-out |
| Card hover (clickable) | Border lighten, subtle lift | 150ms | ease-out |
| Modal open | Fade in + translateY(8px → 0) | 250ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Modal close | Fade out + translateY(0 → 8px) | 200ms | ease-in |
| Toast enter | Slide from right / top | 300ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Toast exit | Fade out + slide | 200ms | ease-in |
| Dropdown open | ScaleY(0 → 1), origin top | 150ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Page transition | Opacity 0→1, translateY(4px → 0) | 200ms | ease-out |
| Skeleton pulse | Opacity 0.5 ↔ 1 | 1500ms | ease-in-out (loop) |
| Status change | Brief gold flash/ripple | 300ms | ease-out |

### 6.2 Motion Rules

1. **Subtle over dramatic** — Animations should be felt, not watched. If the user notices the animation, it's too much.
2. **150ms for micro, 250ms for macro** — Button states are fast. Modals and page transitions are slightly slower.
3. **No animation on mobile if `prefers-reduced-motion`** — Respect accessibility.
4. **Gold flash for success** — When an action completes (order placed, status changed), a brief gold highlight emphasizes the change.
5. **No bouncy animations** — This is a luxury brand. Use ease-out and cubic-bezier, not spring physics.

---

## 7. Portal-Specific Adaptations

Each portal shares the exact same design system but adapts the layout density and emphasis.

### 7.1 Owner Portal (`/owner`)

**Personality**: CEO's command center. Clean, minimal, confidence-inspiring.

- **Layout**: Spacious. 2–3 column KPI grid at top, charts below, minimal scrolling.
- **Typography**: Favor large display numbers for KPIs. The owner wants to glance and know.
- **Content density**: Low. Each card shows one metric or insight. No data overload.
- **Charts**: Large, beautiful area/line charts for trends. Gold as primary data color.
- **Navigation**: Minimal items (Dashboard, Reports, Alerts, Settings). No operational noise.
- **Key interactions**: View-only with drill-down. Owner observes, doesn't manage.
- **Metric display**: Use `font-mono` for all numbers. Large (text-3xl or display size).
- **Mobile**: Vertical scroll of KPI cards → trend chart → alerts list.

### 7.2 Operations Portal (`/ops`)

**Personality**: Mission control. Dense but organized. Every filter and status at a glance.

- **Layout**: Denser grid. 3–4 column KPIs, tables with filters, workflow boards.
- **Typography**: Standard body size. Data-rich but readable.
- **Content density**: Medium-high. Ops managers need information, but organized with clear visual hierarchy.
- **Tables**: Heavy use of tables with sort, filter, search. Status badges everywhere.
- **Filters**: Prominent filter bar at top of data views. Active filters shown as dismissible pills.
- **Status workflows**: Use Kanban-style boards for order/task workflows where appropriate.
- **Real-time indicators**: Small pulsing dots for live data feeds.
- **Mobile**: Tab-based views (switching between Service, Staff, Inventory). Collapsible filter drawer.

### 7.3 Customer Growth Portal (`/growth`)

**Personality**: Marketing dashboard. Slightly warmer, story-driven, celebrates wins.

- **Layout**: Charts-first. Big trend visualizations, campaign performance, customer segments.
- **Typography**: Use slightly larger headings. Can use descriptive text more than other portals.
- **Content density**: Medium. Balance between metrics and narrative.
- **Visual storytelling**: Charts with annotations, trend arrows, comparison callouts.
- **Campaign cards**: Richer cards with status, date range, performance preview.
- **Color usage**: Can use more color variation in charts (gold, info, success for different metrics).
- **Celebrations**: When a campaign hits a milestone, show a subtle gold confetti or highlight.
- **Mobile**: Vertical scroll of metric highlights → engagement chart → campaign list.

### 7.4 Kitchen Portal (`/kitchen`)

**Personality**: War room. Maximum clarity, zero distraction, real-time everything.

- **Layout**: Single-purpose. Order board with columns (New → Cooking → Ready). No sidebar or complex navigation.
- **Typography**: LARGE. Order numbers in text-3xl or text-4xl. Item names in text-xl. Timestamps in text-lg.
- **Content density**: LOW per card, but many cards visible. Each order card shows: order number, items, time elapsed, status.
- **Color coding**: This is the ONE portal where color is used aggressively for status:

  | Status | Background | Text | Visual |
  |---|---|---|---|
  | NEW / PENDING | `bg-warning-muted` | `text-warning` | Pulsing gold border |
  | COOKING | `bg-info-muted` | `text-info` | Solid blue left border |
  | READY | `bg-success-muted` | `text-success` | Full green background tint |
  | DELAYED (>15 min) | `bg-error-muted` | `text-error` | Red pulsing border + sound alert badge |

- **Timer display**: Each order shows time since received. Changes color: green (<5min), yellow (5–10min), red (>10min).
- **Actions**: Big, tappable buttons. "Start Cooking" (blue), "Mark Ready" (green). Minimum 52px height.
- **No scrolling required for critical info** — Current orders fit above the fold.
- **Tablet optimized** — Kitchen uses tablets primarily. Optimize for 768px–1024px landscape.
- **Dark background essential** — Bright screens in a kitchen cause eye strain. Pure dark mode with high-contrast text.
- **Auto-refresh**: Every 10 seconds or via WebSocket. New orders animate in with a brief gold flash and optional sound.

---

## 8. Responsive Patterns

### 8.1 Responsive Component Behaviors

| Component | Desktop (≥1024px) | Tablet (768–1023px) | Mobile (<768px) |
|---|---|---|---|
| Navigation | Fixed sidebar (260px) | Hidden → sheet overlay | Fixed bottom bar (64px) |
| Page header | Inline with content | Inline with content | Fixed top bar (56px) |
| KPI cards | Grid (3–4 columns) | Grid (2 columns) | Horizontal scroll snap |
| Data tables | Full table | Compact table (hide columns) | Card list |
| Charts | Full width in cards | Full width in cards | Full width, reduce annotations |
| Forms | 2-column layout | 2-column layout | Single column, full-width inputs |
| Modals | Centered overlay | Centered overlay | Bottom sheet |
| Actions | Inline buttons | Inline buttons | Fixed bottom bar or FAB |
| Filters | Horizontal bar | Collapsible row | Bottom sheet drawer |

### 8.2 Mobile-Specific Patterns

1. **Pull-to-refresh** on data lists and dashboards.
2. **Swipe gestures** on cards for quick actions (e.g., swipe right to mark order ready).
3. **FAB (Floating Action Button)** for primary creation actions (e.g., "New Order" in POS). Gold circle, bottom-right, 56px, `shadow-gold`.
4. **Bottom sheets** for filters, modals, and secondary navigation. Drag handle at top.
5. **Horizontal scroll snap** for KPI cards: `overflow-x-auto snap-x snap-mandatory` with `snap-center` on children.
6. **Touch target enforcement**: All interactive elements minimum 44×44px hit area. Use padding, not just the visible element size.

### 8.3 Safe Areas

```css
/* iOS safe areas */
padding-bottom: env(safe-area-inset-bottom);
padding-top: env(safe-area-inset-top);
```

Apply on: fixed bottom nav, fixed top bar, bottom sheets.

---

## 9. Iconography

### 9.1 Rules

- **Library**: Lucide React only. No mixing icon libraries.
- **Default size**: 20px for navigation/UI, 24px for standalone icons, 16px for inline/table icons.
- **Stroke width**: 1.75 (Lucide default). Never change.
- **Color**: Inherit from parent text color. Icons should be `text-text-secondary` by default, `text-gold` when active, `text-text-primary` on hover.
- **Paired with text**: Every icon MUST have an adjacent text label OR a tooltip. Icons alone are ambiguous.
- **Consistency**: Once an icon is assigned to a concept (e.g., `ShoppingBag` for orders), use it everywhere. Never use two different icons for the same concept.

### 9.2 Standard Icon Mapping

| Concept | Lucide Icon |
|---|---|
| Dashboard/Home | `LayoutDashboard` |
| Orders | `ShoppingBag` |
| Menu | `UtensilsCrossed` |
| Inventory/Stock | `Package` |
| Staff | `Users` |
| Finance/Revenue | `DollarSign` or `Wallet` |
| Reports | `BarChart3` |
| Settings | `Settings` |
| Notifications/Alerts | `Bell` |
| Search | `Search` |
| Filter | `Filter` |
| Calendar/Date | `Calendar` |
| Clock/Time | `Clock` |
| Add/Create | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Close | `X` |
| Back | `ArrowLeft` |
| Expand/More | `ChevronDown` |
| Logout | `LogOut` |
| Kitchen/Cooking | `ChefHat` |
| Customer | `UserCircle` |
| Campaigns | `Megaphone` |
| Loyalty | `Heart` |
| Feedback | `MessageSquare` |
| Growth | `TrendingUp` |
| Purchasing | `ShoppingCart` |
| Success/Check | `CheckCircle` |
| Warning | `AlertTriangle` |
| Error | `AlertCircle` |
| Info | `Info` |

---

## 10. Accessibility Requirements

These are NOT optional. They are requirements.

1. **Color contrast**: All text meets WCAG AA — 4.5:1 for normal text, 3:1 for large text and UI elements. Gold (#C9A646) on black (#0B0B0B) = 5.8:1 ✓. White (#FFF) on black = 19.86:1 ✓.
2. **Never rely on color alone**: Every status communicated by color MUST also use text, icon, or pattern. Status badges have both color AND label.
3. **Focus indicators**: All interactive elements have a visible focus ring (gold, 2px offset). Use `focus-visible` so it only shows for keyboard navigation.
4. **Keyboard navigation**: All actions reachable by keyboard. Modals trap focus. Esc closes modals/dropdowns.
5. **ARIA labels**: All icon-only buttons have `aria-label`. Custom components use appropriate ARIA roles.
6. **Touch targets**: 44×44px minimum on all interactive elements. On kitchen portal: 52×52px minimum.
7. **Reduced motion**: Wrap all animations in `motion-safe:` or check `prefers-reduced-motion`.
8. **Error messages**: Linked to inputs with `aria-describedby`. Screen readers announce form errors.
9. **Semantic HTML**: Use `<button>` for actions, `<a>` for navigation, `<h1>–<h6>` in order, `<nav>` for navigation, `<main>` for main content.
10. **Skip to content**: Include a skip-to-main-content link as the first focusable element.

---

## 11. Design Token Export (JSON)

```json
{
  "color": {
    "gold": { "DEFAULT": "#C9A646", "light": "#D4B85C", "dark": "#A8882E", "muted": "rgba(201,166,70,0.15)" },
    "black": "#0B0B0B",
    "white": "#FFFFFF",
    "surface": {
      "base": "#0B0B0B",
      "raised": "#141414",
      "overlay": "#1A1A1A",
      "elevated": "#222222",
      "input": "#1A1A1A"
    },
    "text": {
      "primary": "#FFFFFF",
      "secondary": "#A0A0A0",
      "tertiary": "#666666",
      "inverse": "#0B0B0B"
    },
    "border": {
      "default": "#222222",
      "subtle": "#1A1A1A",
      "strong": "#333333"
    },
    "semantic": {
      "success": { "DEFAULT": "#2ECC71", "muted": "rgba(46,204,113,0.15)" },
      "warning": { "DEFAULT": "#F39C12", "muted": "rgba(243,156,18,0.15)" },
      "error": { "DEFAULT": "#E74C3C", "muted": "rgba(231,76,60,0.15)" },
      "info": { "DEFAULT": "#3498DB", "muted": "rgba(52,152,219,0.15)" }
    }
  },
  "typography": {
    "fontFamily": { "sans": "Geist Sans, system-ui, sans-serif", "mono": "Geist Mono, monospace" },
    "fontSize": {
      "display": "2.5rem",
      "h1": "2rem",
      "h2": "1.5rem",
      "h3": "1.25rem",
      "h4": "1rem",
      "body": "1rem",
      "bodySm": "0.875rem",
      "caption": "0.75rem",
      "overline": "0.6875rem"
    },
    "fontWeight": { "regular": 400, "medium": 500, "semibold": 600, "bold": 700 },
    "lineHeight": { "tight": 1.1, "snug": 1.3, "normal": 1.4, "relaxed": 1.6 }
  },
  "spacing": {
    "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px",
    "6": "24px", "8": "32px", "10": "40px", "12": "48px", "16": "64px"
  },
  "borderRadius": {
    "sm": "8px", "md": "12px", "lg": "16px", "xl": "24px", "full": "9999px"
  },
  "shadow": {
    "sm": "0 1px 2px rgba(0,0,0,0.3)",
    "md": "0 4px 12px rgba(0,0,0,0.4)",
    "lg": "0 8px 24px rgba(0,0,0,0.5)",
    "gold": "0 0 0 1px rgba(201,166,70,0.3), 0 4px 12px rgba(201,166,70,0.15)"
  },
  "motion": {
    "fast": "150ms", "normal": "250ms", "slow": "400ms",
    "easeOut": "cubic-bezier(0.16, 1, 0.3, 1)"
  },
  "breakpoints": {
    "sm": "640px", "md": "768px", "lg": "1024px", "xl": "1280px", "2xl": "1536px"
  }
}
```

---

## 12. File & Folder Structure

```
src/
├── app/
│   ├── globals.css              ← Theme tokens defined here
│   ├── layout.tsx               ← Root layout with providers + fonts
│   ├── providers.tsx            ← Client context providers
│   ├── login/
│   ├── owner/                   ← Owner portal pages
│   ├── ops/                     ← Operations portal pages
│   ├── growth/                  ← Customer growth portal pages
│   └── kitchen/                 ← Kitchen portal pages
├── components/
│   ├── ui/                      ← Base design system components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── status-badge.tsx
│   │   ├── kpi-card.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   ├── skeleton.tsx
│   │   ├── empty-state.tsx
│   │   ├── avatar.tsx
│   │   └── table.tsx
│   ├── layout/
│   │   ├── app-shell.tsx        ← Main layout (sidebar + content area)
│   │   ├── sidebar.tsx          ← Desktop sidebar
│   │   ├── bottom-nav.tsx       ← Mobile bottom nav  
│   │   ├── top-bar.tsx          ← Mobile top bar
│   │   └── page-header.tsx      ← Page title + breadcrumb + actions
│   └── charts/
│       └── chart-theme.tsx      ← Recharts theme wrapper
├── hooks/
│   └── use-media-query.ts       ← Responsive hook
└── lib/
    ├── utils.ts                 ← cn() + formatters
    ├── constants.tsx             ← Routes, nav items, API paths
    ├── auth.tsx                  ← Auth context
    └── api.ts                   ← API client
```

---

## 13. Implementation Checklist

When building any new page or component, verify:

- [ ] Uses only design system colors (no hardcoded hex values outside tokens)
- [ ] Typography follows the defined scale (no arbitrary font sizes)
- [ ] Spacing uses the 8px system (no random pixel values)
- [ ] All interactive elements ≥ 44px touch target
- [ ] Component has hover, active, focus, and disabled states
- [ ] Loading state uses skeleton loaders
- [ ] Empty state is designed (not a blank page)
- [ ] Error state is handled with clear messaging
- [ ] Responsive: renders correctly at mobile, tablet, desktop
- [ ] Tables convert to card lists on mobile
- [ ] Passes WCAG AA contrast requirements
- [ ] All icons have text labels or aria-labels
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Uses `font-mono` for numbers and amounts
- [ ] Gold is used sparingly (only CTAs, active states, key highlights)

---

## 14. Anti-Patterns — NEVER DO

1. ❌ Use bright white backgrounds (this is a dark-mode-first platform)
2. ❌ Use orange, pink, or any color outside the defined palette
3. ❌ Create buttons smaller than 44px height
4. ❌ Use placeholder text as the only label for inputs
5. ❌ Show a blank page while loading (always use skeletons)
6. ❌ Use more than 2 primary (gold) buttons on one screen
7. ❌ Create text smaller than 12px
8. ❌ Use icons without labels in navigation
9. ❌ Add bouncy/spring animations
10. ❌ Use `box-shadow` for depth in dark mode (use borders and surface layers instead)
11. ❌ Use generic spinners for page loading
12. ❌ Create tables that don't adapt to mobile
13. ❌ Hardcode colors — always use token references
14. ❌ Mix icon libraries — Lucide React only
15. ❌ Use alert()/confirm() dialogs — use the design system's modal

---

*This design system is the law of the platform. Every component, every page, every interaction must adhere to it. When in doubt, choose the simpler, more restrained option. Luxury is defined by what you leave out, not what you add.*
