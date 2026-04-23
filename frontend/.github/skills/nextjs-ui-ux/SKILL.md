---
name: nextjs-ui-ux
description: "Next.js UI/UX craft skill. Use when: building, redesigning, or revamping any frontend UI in this app — components, layouts, design tokens, responsive behavior, motion, accessibility, empty/loading/error states, dark mode, mobile bottom nav, modals/sheets, data tables, page headers, stat cards, typography hierarchy, navigation, forms, toasts, skeletons, hover/focus/press states, WCAG contrast, prefers-reduced-motion. DO NOT USE for API routes, auth flows, server actions, or data fetching."
argument-hint: "describe the screen/component to craft or revamp"
---

# SKILL: Next.js UI/UX Mastery
**Version**: 1.0.0
**Scope**: Pure UI — components, layouts, responsiveness, motion, design systems, visual craft
**Not covered**: API routes, data fetching, server actions, auth, deployment

---

## 0. READ THIS FIRST — THE MINDSET

You are not assembling components. You are **crafting experiences**.

Every pixel has intent. Every transition earns its place. Every empty state is an invitation. Every error state is a moment to rebuild trust. Your job is not to make something that works — it is to make something that **feels inevitable**.

The bar is: would a senior product designer at a world-class company be proud of this? If not, keep going.

---

## 1. DESIGN THINKING BEFORE ANY CODE

Before touching a file, answer these four questions in writing:

```
1. WHO uses this?
   → Their context, their device, their level of technical comfort.
   → A fintech dashboard user is different from a consumer shopping app user.

2. WHAT is the single job of this screen?
   → One primary action. One. Everything else is secondary.
   → If you can't name the primary action in 5 words, you don't understand the screen yet.

3. WHAT EMOTION should the user feel?
   → Confident? Delighted? Focused? Informed? Trust is a feeling, not a feature.
   → Your visual language should reinforce that emotion.

4. WHAT IS UNFORGETTABLE about this UI?
   → The one thing a user will remember.
   → Could be a transition, a layout choice, a typographic moment, an illustration.
   → If nothing is memorable, start over.
```

Only after answering these do you write code.

---

## 2. DESIGN TOKENS — THE FOUNDATION OF EVERYTHING

Design tokens are the single source of truth. **Never hardcode a color, spacing value, or font size.** Everything references a token.

### 2.1 Token File Structure

```
styles/
├── tokens/
│   ├── colors.css          # Color palette + semantic aliases
│   ├── typography.css      # Font families, sizes, weights, line heights
│   ├── spacing.css         # Spacing scale
│   ├── radius.css          # Border radius scale
│   ├── shadow.css          # Elevation / shadow scale
│   ├── motion.css          # Duration, easing, timing
│   └── breakpoints.css     # Responsive breakpoint tokens
├── base.css                # Reset + base element styles
└── globals.css             # Import all tokens + base
```

### 2.2 Complete Token System

```css
/* styles/tokens/colors.css */
:root {
  /* ── Raw Palette (never use these directly in components) ── */
  --palette-slate-50:  #f8fafc;
  --palette-slate-100: #f1f5f9;
  --palette-slate-200: #e2e8f0;
  --palette-slate-300: #cbd5e1;
  --palette-slate-400: #94a3b8;
  --palette-slate-500: #64748b;
  --palette-slate-600: #475569;
  --palette-slate-700: #334155;
  --palette-slate-800: #1e293b;
  --palette-slate-900: #0f172a;
  --palette-slate-950: #020617;

  --palette-amber-300: #fcd34d;
  --palette-amber-400: #fbbf24;
  --palette-amber-500: #f59e0b;

  --palette-emerald-400: #34d399;
  --palette-emerald-500: #10b981;
  --palette-emerald-600: #059669;

  --palette-rose-400: #fb7185;
  --palette-rose-500: #f43f5e;
  --palette-rose-600: #e11d48;

  --palette-sky-400: #38bdf8;
  --palette-sky-500: #0ea5e9;

  /* ── Semantic Tokens (use these in components) ── */

  /* Backgrounds */
  --bg-base:        var(--palette-slate-50);
  --bg-surface:     #ffffff;
  --bg-elevated:    #ffffff;
  --bg-sunken:      var(--palette-slate-100);
  --bg-overlay:     rgba(15, 23, 42, 0.6);

  /* Foreground / Text */
  --text-primary:   var(--palette-slate-900);
  --text-secondary: var(--palette-slate-500);
  --text-tertiary:  var(--palette-slate-400);
  --text-disabled:  var(--palette-slate-300);
  --text-inverse:   #ffffff;
  --text-link:      var(--color-brand);

  /* Brand */
  --color-brand:         var(--palette-amber-500);
  --color-brand-hover:   var(--palette-amber-400);
  --color-brand-active:  var(--palette-amber-300);
  --color-brand-subtle:  #fef3c7;
  --color-brand-on:      var(--palette-slate-900);  /* text on brand bg */

  /* Semantic Status */
  --color-success:        var(--palette-emerald-500);
  --color-success-subtle: #d1fae5;
  --color-success-text:   var(--palette-emerald-600);

  --color-warning:        var(--palette-amber-500);
  --color-warning-subtle: #fef3c7;
  --color-warning-text:   #92400e;

  --color-error:          var(--palette-rose-500);
  --color-error-subtle:   #ffe4e6;
  --color-error-text:     var(--palette-rose-600);

  --color-info:           var(--palette-sky-500);
  --color-info-subtle:    #e0f2fe;
  --color-info-text:      #0c4a6e;

  /* Borders */
  --border-subtle:   var(--palette-slate-100);
  --border-default:  var(--palette-slate-200);
  --border-strong:   var(--palette-slate-300);
  --border-focus:    var(--color-brand);
}

/* ── Dark Mode ── */
[data-theme='dark'] {
  --bg-base:        var(--palette-slate-950);
  --bg-surface:     var(--palette-slate-900);
  --bg-elevated:    var(--palette-slate-800);
  --bg-sunken:      var(--palette-slate-950);
  --bg-overlay:     rgba(0, 0, 0, 0.7);

  --text-primary:   var(--palette-slate-50);
  --text-secondary: var(--palette-slate-400);
  --text-tertiary:  var(--palette-slate-500);
  --text-disabled:  var(--palette-slate-600);

  --border-subtle:  var(--palette-slate-800);
  --border-default: var(--palette-slate-700);
  --border-strong:  var(--palette-slate-600);

  --color-brand-subtle: rgba(245, 158, 11, 0.15);
}
```

```css
/* styles/tokens/typography.css */
:root {
  /* ── Font Families ──
     Rule: Pair a distinctive display font with a refined, legible body font.
     Never use Inter, Roboto, or Arial as primary faces.
     Examples of great pairings:
       Display: Sora, Instrument Serif, Fraunces, Cabinet Grotesk, Clash Display
       Body:    DM Sans, Geist, Plus Jakarta Sans, Figtree, Nunito
  */
  --font-display: 'Sora', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* ── Type Scale (Major Third: 1.25) ── */
  --text-2xs:  0.625rem;   /* 10px */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */
  --text-5xl:  3rem;       /* 48px */
  --text-6xl:  3.75rem;    /* 60px */
  --text-7xl:  4.5rem;     /* 72px */

  /* ── Font Weights ── */
  --weight-regular:   400;
  --weight-medium:    500;
  --weight-semibold:  600;
  --weight-bold:      700;
  --weight-extrabold: 800;

  /* ── Line Heights ── */
  --leading-none:    1;
  --leading-tight:   1.25;
  --leading-snug:    1.375;
  --leading-normal:  1.5;
  --leading-relaxed: 1.625;
  --leading-loose:   2;

  /* ── Letter Spacing ── */
  --tracking-tighter: -0.05em;
  --tracking-tight:   -0.025em;
  --tracking-normal:  0em;
  --tracking-wide:    0.025em;
  --tracking-wider:   0.05em;
  --tracking-widest:  0.1em;
}
```

```css
/* styles/tokens/spacing.css */
:root {
  --space-px:  1px;
  --space-0:   0;
  --space-0-5: 0.125rem;   /* 2px */
  --space-1:   0.25rem;    /* 4px */
  --space-1-5: 0.375rem;   /* 6px */
  --space-2:   0.5rem;     /* 8px */
  --space-2-5: 0.625rem;   /* 10px */
  --space-3:   0.75rem;    /* 12px */
  --space-3-5: 0.875rem;   /* 14px */
  --space-4:   1rem;       /* 16px */
  --space-5:   1.25rem;    /* 20px */
  --space-6:   1.5rem;     /* 24px */
  --space-7:   1.75rem;    /* 28px */
  --space-8:   2rem;       /* 32px */
  --space-9:   2.25rem;    /* 36px */
  --space-10:  2.5rem;     /* 40px */
  --space-11:  2.75rem;    /* 44px */
  --space-12:  3rem;       /* 48px */
  --space-14:  3.5rem;     /* 56px */
  --space-16:  4rem;       /* 64px */
  --space-20:  5rem;       /* 80px */
  --space-24:  6rem;       /* 96px */
  --space-28:  7rem;       /* 112px */
  --space-32:  8rem;       /* 128px */

  /* ── Semantic Spacing ── */
  --page-padding-x-mobile:  var(--space-4);   /* 16px sides on mobile */
  --page-padding-x-tablet:  var(--space-6);   /* 24px sides on tablet */
  --page-padding-x-desktop: var(--space-8);   /* 32px sides on desktop */
  --page-max-width:          1280px;
  --content-max-width:       768px;           /* Reading line length */
  --form-max-width:          480px;
}
```

```css
/* styles/tokens/motion.css */
:root {
  /* ── Durations ── */
  --duration-instant:  50ms;
  --duration-fast:     100ms;
  --duration-normal:   200ms;
  --duration-moderate: 300ms;
  --duration-slow:     400ms;
  --duration-slower:   600ms;
  --duration-slowest:  800ms;

  /* ── Easings ── */
  --ease-linear:  linear;
  --ease-out:     cubic-bezier(0.0, 0, 0.2, 1);       /* Decelerating — most UI transitions */
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);           /* Accelerating — exit transitions */
  --ease-inout:   cubic-bezier(0.4, 0, 0.2, 1);         /* Standard — balanced */
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);    /* Overshoot — delightful interactions */
  --ease-bounce:  cubic-bezier(0.68, -0.55, 0.27, 1.55);

  /* ── Prefers reduced motion ── */
  /* Always wrap animations with this */
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:   0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration:  0.01ms !important;
  }
}
```

```css
/* styles/tokens/radius.css */
:root {
  --radius-none: 0;
  --radius-xs:   0.125rem;  /* 2px  */
  --radius-sm:   0.25rem;   /* 4px  */
  --radius-md:   0.375rem;  /* 6px  */
  --radius-lg:   0.5rem;    /* 8px  */
  --radius-xl:   0.75rem;   /* 12px */
  --radius-2xl:  1rem;      /* 16px */
  --radius-3xl:  1.5rem;    /* 24px */
  --radius-full: 9999px;
}
```

```css
/* styles/tokens/shadow.css */
:root {
  --shadow-none: none;
  --shadow-xs:   0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm:   0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl:  0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.06);

  /* Colored shadows for brand elements */
  --shadow-brand: 0 10px 25px -5px rgb(245 158 11 / 0.3);
  --shadow-error: 0 4px 14px 0 rgb(244 63 94 / 0.25);
}
```

---

## 3. TYPOGRAPHY SYSTEM

Typography IS hierarchy. Get this wrong and nothing else matters.

### 3.1 Typographic Scale Component

```tsx
// components/ui/Typography.tsx
import { cn } from '@/lib/cn'
import { ElementType, HTMLAttributes } from 'react'

type TypographyVariant =
  | 'display-2xl'
  | 'display-xl'
  | 'display-lg'
  | 'display-md'
  | 'display-sm'
  | 'heading-xl'
  | 'heading-lg'
  | 'heading-md'
  | 'heading-sm'
  | 'heading-xs'
  | 'body-xl'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'body-xs'
  | 'label-lg'
  | 'label-md'
  | 'label-sm'
  | 'code'

const variantStyles: Record<TypographyVariant, string> = {
  'display-2xl': 'font-[var(--font-display)] text-[var(--text-7xl)] font-[var(--weight-extrabold)] leading-[var(--leading-none)] tracking-[var(--tracking-tighter)]',
  'display-xl':  'font-[var(--font-display)] text-[var(--text-6xl)] font-[var(--weight-extrabold)] leading-[var(--leading-none)] tracking-[var(--tracking-tight)]',
  'display-lg':  'font-[var(--font-display)] text-[var(--text-5xl)] font-[var(--weight-bold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]',
  'display-md':  'font-[var(--font-display)] text-[var(--text-4xl)] font-[var(--weight-bold)] leading-[var(--leading-tight)]',
  'display-sm':  'font-[var(--font-display)] text-[var(--text-3xl)] font-[var(--weight-bold)] leading-[var(--leading-snug)]',
  'heading-xl':  'font-[var(--font-display)] text-[var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-snug)]',
  'heading-lg':  'font-[var(--font-display)] text-[var(--text-xl)] font-[var(--weight-semibold)] leading-[var(--leading-snug)]',
  'heading-md':  'font-[var(--font-display)] text-[var(--text-lg)] font-[var(--weight-semibold)] leading-[var(--leading-normal)]',
  'heading-sm':  'font-[var(--font-display)] text-[var(--text-base)] font-[var(--weight-semibold)] leading-[var(--leading-normal)]',
  'heading-xs':  'font-[var(--font-display)] text-[var(--text-sm)] font-[var(--weight-semibold)] leading-[var(--leading-normal)]',
  'body-xl':     'font-[var(--font-body)] text-[var(--text-xl)] font-[var(--weight-regular)] leading-[var(--leading-relaxed)]',
  'body-lg':     'font-[var(--font-body)] text-[var(--text-lg)] font-[var(--weight-regular)] leading-[var(--leading-relaxed)]',
  'body-md':     'font-[var(--font-body)] text-[var(--text-base)] font-[var(--weight-regular)] leading-[var(--leading-normal)]',
  'body-sm':     'font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-regular)] leading-[var(--leading-normal)]',
  'body-xs':     'font-[var(--font-body)] text-[var(--text-xs)] font-[var(--weight-regular)] leading-[var(--leading-normal)]',
  'label-lg':    'font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-medium)] leading-[var(--leading-normal)] tracking-[var(--tracking-wide)]',
  'label-md':    'font-[var(--font-body)] text-[var(--text-xs)] font-[var(--weight-medium)] leading-[var(--leading-normal)] tracking-[var(--tracking-wide)]',
  'label-sm':    'font-[var(--font-body)] text-[var(--text-2xs)] font-[var(--weight-medium)] leading-[var(--leading-normal)] tracking-[var(--tracking-widest)] uppercase',
  'code':        'font-[var(--font-mono)] text-[var(--text-sm)] font-[var(--weight-regular)]',
}

const defaultElements: Record<TypographyVariant, ElementType> = {
  'display-2xl': 'h1', 'display-xl': 'h1', 'display-lg': 'h1', 'display-md': 'h2', 'display-sm': 'h2',
  'heading-xl': 'h2', 'heading-lg': 'h3', 'heading-md': 'h3', 'heading-sm': 'h4', 'heading-xs': 'h5',
  'body-xl': 'p', 'body-lg': 'p', 'body-md': 'p', 'body-sm': 'p', 'body-xs': 'p',
  'label-lg': 'span', 'label-md': 'span', 'label-sm': 'span',
  'code': 'code',
}

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant: TypographyVariant
  as?: ElementType
  color?: 'primary' | 'secondary' | 'tertiary' | 'brand' | 'error' | 'success' | 'inverse'
  balance?: boolean
}

const colorMap = {
  primary:   'text-[var(--text-primary)]',
  secondary: 'text-[var(--text-secondary)]',
  tertiary:  'text-[var(--text-tertiary)]',
  brand:     'text-[var(--color-brand)]',
  error:     'text-[var(--color-error-text)]',
  success:   'text-[var(--color-success-text)]',
  inverse:   'text-[var(--text-inverse)]',
}

export function Typography({ variant, as, color = 'primary', balance, className, children, ...props }: TypographyProps) {
  const Tag = as ?? defaultElements[variant]
  return (
    <Tag
      className={cn(
        variantStyles[variant],
        colorMap[color],
        balance && 'text-balance',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
```

### 3.2 Typography Rules

```
HIERARCHY — 3 levels max per screen:
  Level 1: Page/section title (display or heading)
  Level 2: Supporting description (body-lg or body-md)
  Level 3: Metadata/labels (label or body-sm)

MEASURE — Keep line lengths between 45–75 characters for body text.
  Use max-width: var(--content-max-width) on text blocks.

RESPONSIVE FLUID TYPE — Headings must scale between breakpoints:
  Mobile:  display-sm   (30px)
  Tablet:  display-md   (36px)
  Desktop: display-lg   (48px)
  Wide:    display-xl   (60px)

OPENTYPE — Always enable:
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
  For numbers: font-variant-numeric: tabular-nums; (dashboards, prices)

VERTICAL RHYTHM — Maintain consistent spacing between text blocks:
  Paragraphs:    margin-bottom: var(--space-4)
  Headings:      margin-top: var(--space-8), margin-bottom: var(--space-3)
  Section heads: margin-top: var(--space-16)
```

---

## 4. RESPONSIVE DESIGN — THE FULL SYSTEM

### 4.1 Breakpoint Philosophy

```css
/* Mobile-first. These are the ONLY breakpoints you use. No exceptions. */
:root {
  --bp-sm:  640px;   /* Landscape phone / large phone */
  --bp-md:  768px;   /* Tablet portrait */
  --bp-lg:  1024px;  /* Tablet landscape / small laptop */
  --bp-xl:  1280px;  /* Desktop */
  --bp-2xl: 1536px;  /* Wide desktop */
}
```

**Tailwind mapping:**
```
sm:   min-width: 640px   → @screen sm
md:   min-width: 768px   → @screen md
lg:   min-width: 1024px  → @screen lg
xl:   min-width: 1280px  → @screen xl
2xl:  min-width: 1536px  → @screen 2xl
```

### 4.2 Responsive Component Patterns

**The Mobile Collapse Pattern** — every complex component has a mobile form:

```
Desktop → Mobile
─────────────────────────────────────────────────
Sidebar navigation    → Bottom navigation bar
Data table           → Card stack
Side-by-side form    → Stacked form
Tab bar (horizontal) → Scrollable tab bar
Inline filters       → Filter bottom sheet
Hover tooltips       → Long press / tap to reveal
Multi-column grid    → Single column
Split panel          → Full screen + back button
Dropdown menu        → Action sheet / bottom drawer
```

### 4.3 Container + Layout Primitives

```tsx
// components/layout/Container.tsx
import { cn } from '@/lib/cn'
import { HTMLAttributes } from 'react'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeMap = {
  sm:   'max-w-2xl',        /* 672px  — forms, articles */
  md:   'max-w-4xl',        /* 896px  — content pages */
  lg:   'max-w-6xl',        /* 1152px — wide content */
  xl:   'max-w-[1280px]',   /* standard desktop */
  full: 'max-w-none',
}

export function Container({ size = 'xl', className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        'px-4 sm:px-6 lg:px-8',
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

```tsx
// components/layout/Grid.tsx
/* Responsive auto-grid that collapses to 1 column on mobile */
interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: { default?: number; sm?: number; md?: number; lg?: number; xl?: number }
  gap?: 'sm' | 'md' | 'lg'
}

const gapMap = { sm: 'gap-3 sm:gap-4', md: 'gap-4 sm:gap-6', lg: 'gap-6 sm:gap-8' }

export function Grid({ cols = { default: 1, md: 2, lg: 3 }, gap = 'md', className, children, ...props }: GridProps) {
  const colClasses = [
    `grid-cols-${cols.default ?? 1}`,
    cols.sm  && `sm:grid-cols-${cols.sm}`,
    cols.md  && `md:grid-cols-${cols.md}`,
    cols.lg  && `lg:grid-cols-${cols.lg}`,
    cols.xl  && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ')

  return (
    <div className={cn('grid', colClasses, gapMap[gap], className)} {...props}>
      {children}
    </div>
  )
}
```

---

## 5. COMPONENT LIBRARY — UI/UX CRAFT

### 5.1 Button — Every State Matters

```tsx
// components/ui/Button.tsx
'use client'
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'outline'
type Size    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant
  size?:      Size
  loading?:   boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

/* UX DECISION: Press scale creates physical affordance — it feels clicked */
const base = [
  'relative inline-flex items-center justify-center font-medium',
  'rounded-[var(--radius-lg)]',
  'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-[var(--bg-surface)]',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  'select-none',
  /* Press feedback — micro-interaction that makes buttons feel physical */
  'active:scale-[0.97]',
].join(' ')

const variants: Record<Variant, string> = {
  primary:  [
    'bg-[var(--color-brand)] text-[var(--color-brand-on)]',
    'hover:bg-[var(--color-brand-hover)]',
    'shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-brand)]',
  ].join(' '),
  secondary: [
    'bg-[var(--bg-sunken)] text-[var(--text-primary)]',
    'border border-[var(--border-default)]',
    'hover:bg-[var(--palette-slate-200)] hover:border-[var(--border-strong)]',
  ].join(' '),
  outline: [
    'bg-transparent text-[var(--text-primary)]',
    'border border-[var(--border-strong)]',
    'hover:bg-[var(--bg-sunken)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-primary)]',
    'hover:bg-[var(--bg-sunken)]',
  ].join(' '),
  danger: [
    'bg-[var(--color-error)] text-white',
    'hover:opacity-90',
    'shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-error)]',
  ].join(' '),
  link: [
    'bg-transparent text-[var(--text-link)] underline-offset-4',
    'hover:underline px-0 h-auto',
  ].join(' '),
}

const sizes: Record<Size, string> = {
  xs: 'h-7  px-2.5 text-[var(--text-xs)]  gap-1   min-w-[28px]',
  sm: 'h-8  px-3   text-[var(--text-sm)]  gap-1.5 min-w-[32px]',
  md: 'h-10 px-4   text-[var(--text-sm)]  gap-2   min-w-[40px]',
  lg: 'h-12 px-5   text-[var(--text-base)] gap-2.5 min-w-[48px]',
  xl: 'h-14 px-6   text-[var(--text-lg)]  gap-3   min-w-[56px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading
        ? <Loader2 className="animate-spin" aria-hidden size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
        : leftIcon
      }
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  )
)
Button.displayName = 'Button'
```

**Button UX Rules:**
```
□ Touch targets: minimum 44×44px on mobile (even if visual size is smaller, use padding)
□ Icon-only buttons always have aria-label
□ Loading state disables the button AND shows spinner
□ Never use opacity alone for disabled — add cursor-not-allowed
□ Primary button appears ONCE per view. One hero action.
□ Destructive actions: require confirmation or have a separate danger variant
□ Button label: verb + noun ("Save changes", "Send payment", "Delete account")
    Never just a verb ("Save", "Send") — always name what's being acted on
```

---

### 5.2 Input System — The Anatomy of Trust

Users judge your product by your inputs. A bad input kills trust instantly.

```tsx
// components/ui/Input.tsx
'use client'
import { forwardRef, InputHTMLAttributes, useState, useId } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:       string
  hint?:        string
  error?:       string
  leftAddon?:   React.ReactNode   /* e.g. country code, icon */
  rightAddon?:  React.ReactNode   /* e.g. unit, clear button */
  labelProps?:  React.LabelHTMLAttributes<HTMLLabelElement>
  optional?:    boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftAddon, rightAddon, optional, className, labelProps, id: propId, disabled, ...props }, ref) => {
    const generatedId = useId()
    const id = propId ?? generatedId
    const errorId = `${id}-error`
    const hintId  = `${id}-hint`
    const hasError = !!error

    return (
      <div className="flex flex-col gap-[var(--space-1-5)] w-full">

        {/* Label row */}
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={id}
              className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-primary)] leading-[var(--leading-normal)]"
              {...labelProps}
            >
              {label}
            </label>
            {optional && (
              <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">Optional</span>
            )}
          </div>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left addon */}
          {leftAddon && (
            <div className="absolute left-3 flex items-center text-[var(--text-secondary)] pointer-events-none">
              {leftAddon}
            </div>
          )}

          {/* The actual input */}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={cn(error && errorId, hint && hintId) || undefined}
            className={cn(
              'w-full h-10 rounded-[var(--radius-lg)]',
              'bg-[var(--bg-surface)] text-[var(--text-primary)]',
              'text-[var(--text-sm)] font-[var(--font-body)]',
              'border border-[var(--border-default)]',
              'transition-all duration-[var(--duration-normal)]',
              /* Padding adjusts for addons */
              leftAddon  ? 'pl-9' : 'pl-3.5',
              rightAddon ? 'pr-9' : 'pr-3.5',
              /* Focus state — clear ring using brand color */
              'focus:outline-none focus:border-[var(--border-focus)]',
              'focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-opacity-20',
              /* Error state */
              hasError && [
                'border-[var(--color-error)]',
                'focus:ring-[var(--color-error)] focus:border-[var(--color-error)]',
              ],
              /* Disabled state */
              disabled && 'bg-[var(--bg-sunken)] text-[var(--text-disabled)] cursor-not-allowed',
              /* Placeholder */
              'placeholder:text-[var(--text-tertiary)]',
              className,
            )}
            {...props}
          />

          {/* Right addon */}
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-[var(--text-secondary)]">
              {rightAddon}
            </div>
          )}
        </div>

        {/* Hint / Error message */}
        {(hint || error) && (
          <p
            id={error ? errorId : hintId}
            className={cn(
              'text-[var(--text-xs)] leading-[var(--leading-normal)]',
              error ? 'text-[var(--color-error-text)]' : 'text-[var(--text-secondary)]',
            )}
            role={error ? 'alert' : undefined}
            aria-live={error ? 'polite' : undefined}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
```

**Input UX Rules:**
```
□ Label ABOVE the input. Always. Never placeholder-as-label.
□ Placeholder is an example, not a label ("e.g. john@example.com")
□ Error message appears BELOW the input, in red, with an icon
□ Error messages are human: "That email doesn't look right" not "Invalid email"
□ Hint text is persistent (shows before AND after focus)
□ Show optional, not required — most fields should be required
□ Password inputs MUST have show/hide toggle
□ Number inputs: use inputmode="numeric" + pattern for mobile keyboards
□ Search inputs: show clear (×) button when value is present
□ Real-time validation: validate on blur, not on every keystroke
□ Success state (✓) only shown after blur, not during typing
```

---

### 5.3 Card — The Workhorse Component

Cards are containers of meaning. They group related information. Never use a card for decoration.

```tsx
// components/ui/Card.tsx
import { cn } from '@/lib/cn'
import { HTMLAttributes, forwardRef } from 'react'

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost' | 'interactive'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variants: Record<CardVariant, string> = {
  default:     'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]',
  elevated:    'bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]',
  outlined:    'bg-[var(--bg-surface)] border border-[var(--border-default)]',
  ghost:       'bg-[var(--bg-sunken)]',
  /* Interactive card: hover state + press feedback */
  interactive: [
    'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]',
    'cursor-pointer',
    'hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0 active:shadow-[var(--shadow-sm)]',
    'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
  ].join(' '),
}

const paddings = {
  none: '',
  sm:   'p-3 sm:p-4',
  md:   'p-4 sm:p-5 lg:p-6',
  lg:   'p-6 sm:p-7 lg:p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-[var(--radius-xl)] overflow-hidden', variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

/* Card sub-components for consistent internal structure */
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-3 mb-4', className)} {...props} />
}
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[var(--text-base)] font-[var(--weight-semibold)] text-[var(--text-primary)] leading-[var(--leading-snug)]', className)} {...props} />
}
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[var(--text-sm)] text-[var(--text-secondary)] leading-[var(--leading-normal)]', className)} {...props} />
}
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />
}
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]', className)} {...props} />
}
```

---

### 5.4 Navigation — Desktop Sidebar + Mobile Bottom Bar

```tsx
// components/layout/AppShell.tsx
/* The master responsive navigation pattern:
   Desktop: persistent sidebar
   Tablet:  collapsible sidebar (icon-only collapsed)
   Mobile:  bottom navigation bar */

'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface NavItem {
  href:    string
  label:   string
  icon:    React.ReactNode
  badge?:  number
}

interface AppShellProps {
  navItems: NavItem[]
  children: React.ReactNode
  header?:  React.ReactNode
}

export function AppShell({ navItems, children, header }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col',
          'bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]',
          'transition-all duration-[var(--duration-moderate)] ease-[var(--ease-out)]',
          sidebarOpen ? 'w-60' : 'w-16',
        )}
      >
        {/* Logo area */}
        <div className={cn('flex items-center h-16 px-4 border-b border-[var(--border-subtle)] shrink-0', !sidebarOpen && 'justify-center')}>
          {sidebarOpen ? (
            <span className="font-[var(--font-display)] font-[var(--weight-bold)] text-[var(--text-lg)] text-[var(--text-primary)]">
              Acme
            </span>
          ) : (
            <span className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-brand)] flex items-center justify-center">
              <span className="text-[var(--weight-bold)] text-[var(--text-sm)] text-[var(--color-brand-on)]">A</span>
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-[var(--radius-lg)] h-10',
                  'transition-colors duration-[var(--duration-fast)]',
                  sidebarOpen ? 'px-3 gap-3' : 'justify-center',
                  isActive
                    ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]',
                )}
              >
                <span className={cn('shrink-0', isActive && 'text-[var(--color-brand)]')} aria-hidden>
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span className="text-[var(--text-sm)] font-[var(--weight-medium)] truncate">{item.label}</span>
                )}
                {sidebarOpen && item.badge ? (
                  <span className="ml-auto bg-[var(--color-error)] text-white text-[var(--text-2xs)] font-[var(--weight-bold)] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              'flex items-center justify-center w-full h-9 rounded-[var(--radius-md)]',
              'text-[var(--text-tertiary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-secondary)]',
              'transition-colors duration-[var(--duration-fast)]',
            )}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header — optional slot */}
        {header && (
          <header className="shrink-0 h-16 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center px-4 sm:px-6">
            {header}
          </header>
        )}

        {/* Scrollable content area */}
        <main
          className="flex-1 overflow-y-auto"
          /* Mobile: extra bottom padding for bottom nav */
        >
          <div className="pb-20 lg:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav
        className={cn(
          'lg:hidden',
          'fixed bottom-0 left-0 right-0 z-[var(--z-sticky)]',
          'bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]',
          /* Safe area inset for iOS home indicator */
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'min-w-[60px] h-full gap-1',
                  'transition-colors duration-[var(--duration-fast)]',
                  isActive ? 'text-[var(--color-brand)]' : 'text-[var(--text-tertiary)]',
                )}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-2 w-1 h-1 rounded-full bg-[var(--color-brand)]" />
                )}
                <span aria-hidden className="mt-3">{item.icon}</span>
                <span className="text-[var(--text-2xs)] font-[var(--weight-medium)]">{item.label}</span>
                {/* Badge */}
                {item.badge && (
                  <span className="absolute top-1.5 right-2 bg-[var(--color-error)] text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
```

---

### 5.5 Modal / Dialog — Responsive Sheet Pattern

On desktop: centered modal. On mobile: bottom sheet. Same component, same API.

```tsx
// components/ui/Modal.tsx
'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open:       boolean
  onClose:    () => void
  title?:     string
  description?: string
  size?:      'sm' | 'md' | 'lg' | 'xl' | 'full'
  children:   React.ReactNode
  footer?:    React.ReactNode
}

const sizeMap = {
  sm:   'sm:max-w-sm',
  md:   'sm:max-w-md',
  lg:   'sm:max-w-lg',
  xl:   'sm:max-w-xl',
  full: 'sm:max-w-[calc(100vw-2rem)]',
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  /* Keyboard: close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  /* Body scroll lock */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      className={cn(
        'fixed inset-0 z-[var(--z-modal)]',
        'flex',
        /* Mobile: bottom sheet. Desktop: centered */
        'items-end sm:items-center justify-center',
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full z-10',
          'bg-[var(--bg-surface)]',
          'shadow-[var(--shadow-2xl)]',
          /* Mobile: full width, rounded top corners, slide up */
          'rounded-t-[var(--radius-3xl)] sm:rounded-[var(--radius-2xl)]',
          /* Desktop: max-width constrained */
          sizeMap[size],
          /* Animations */
          'animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 sm:zoom-in-95 duration-300',
        )}
      >
        {/* Drag handle — mobile only hint */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-0 sm:px-6 sm:pt-5">
            <div>
              <h2 id="modal-title" className="text-[var(--text-lg)] font-[var(--weight-semibold)] text-[var(--text-primary)] leading-[var(--leading-snug)]">
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className={cn(
                'shrink-0 w-8 h-8 rounded-[var(--radius-md)]',
                'flex items-center justify-center',
                'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]',
                'transition-colors duration-[var(--duration-fast)]',
              )}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 overflow-y-auto max-h-[80vh] sm:max-h-[70vh]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-[var(--border-subtle)] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
```

---

### 5.6 Empty States — Invitations, Not Errors

An empty state is a **moment of relationship** with the user. Every empty state needs three things: context (why it's empty), relief (it's OK), and direction (what to do).

```tsx
// components/ui/EmptyState.tsx
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface EmptyStateProps {
  illustration?: React.ReactNode   /* SVG or image */
  title:         string
  description:   string
  actions?:      Array<{
    label:    string
    onClick?: () => void
    href?:    string
    variant?: 'primary' | 'secondary' | 'ghost'
  }>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { wrapper: 'py-8',  icon: 'w-10 h-10', title: 'text-[var(--text-sm)]',   desc: 'text-[var(--text-xs)]'  },
  md: { wrapper: 'py-12', icon: 'w-14 h-14', title: 'text-[var(--text-base)]', desc: 'text-[var(--text-sm)]'  },
  lg: { wrapper: 'py-20', icon: 'w-20 h-20', title: 'text-[var(--text-xl)]',   desc: 'text-[var(--text-base)]' },
}

export function EmptyState({ illustration, title, description, actions, size = 'md', className }: EmptyStateProps) {
  const s = sizes[size]
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-4', s.wrapper, className)}>

      {illustration && (
        <div className={cn('mb-4 text-[var(--text-tertiary)]', s.icon)}>
          {illustration}
        </div>
      )}

      <h3 className={cn('font-[var(--weight-semibold)] text-[var(--text-primary)] mb-2', s.title)}>
        {title}
      </h3>
      <p className={cn('text-[var(--text-secondary)] max-w-xs leading-[var(--leading-relaxed)] mb-6', s.desc)}>
        {description}
      </p>

      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant ?? (i === 0 ? 'primary' : 'ghost')}
              onClick={action.onClick}
              size="md"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

/*
 EMPTY STATE COPYWRITING GUIDE
 ─────────────────────────────────────────────────────
 Title:       Short, empathetic, present-tense.
              ✓ "No payments yet"
              ✓ "Your inbox is empty"
              ✗ "No data found"
              ✗ "Error: Empty result set"

 Description: Tell them WHY and what to do.
              ✓ "Once you make your first payment, it'll show up here."
              ✓ "Messages from your team will appear here."
              ✗ "There are no records to display."

 CTA:         One primary action. Verb + noun.
              ✓ "Send your first payment"
              ✓ "Invite a team member"
*/
```

---

### 5.7 Skeleton / Shimmer — Loading as Design

Loading states are **part of the UI**. They must match the layout of the real content exactly.

```tsx
// components/ui/Skeleton.tsx
import { cn } from '@/lib/cn'

interface SkeletonProps {
  className?: string
  variant?:  'text' | 'circular' | 'rectangular'
  animate?:  boolean
}

export function Skeleton({ className, variant = 'rectangular', animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-sunken)]',
        animate && 'animate-pulse',
        variant === 'circular'     && 'rounded-full',
        variant === 'rectangular'  && 'rounded-[var(--radius-md)]',
        variant === 'text'         && 'rounded-[var(--radius-sm)] h-4',
        className,
      )}
      aria-hidden="true"
    />
  )
}

/* 
  SHIMMER EFFECT — more premium than flat pulse:
  Add to globals.css:

  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .shimmer {
    background: linear-gradient(
      90deg,
      var(--bg-sunken)    25%,
      var(--bg-surface)   50%,
      var(--bg-sunken)    75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite ease-in-out;
  }
*/

/* Skeleton card — matches CardComponent exactly */
export function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-4 sm:p-5 lg:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-5/6" />
        <Skeleton variant="text" className="w-4/6" />
      </div>
    </div>
  )
}
```

---

### 5.8 Toast Notifications — Feedback Architecture

```tsx
// lib/toast.ts + components/ui/Toast.tsx
/*
  TOAST HIERARCHY — choose the right level:
  
  ✦ SUCCESS  → Mutation completed. Brief, auto-dismisses in 3s.
               "Payment sent"  ← short and done
               
  ✦ ERROR    → Something failed. Longer, includes action if recoverable.
               "Payment failed — Check your network and try again" [Retry]
               
  ✦ WARNING  → Non-blocking issue. User should know.
               "Your session expires in 5 minutes" [Stay signed in]
               
  ✦ INFO     → Neutral information. Not critical.
               "Syncing your data..."
               
  ✦ LOADING  → Long operation in progress. Replace with success/error.
               "Uploading file..." → "File uploaded" or "Upload failed"

  PLACEMENT:
  Desktop: top-right (doesn't block primary action)
  Mobile:  bottom-center (thumb zone, above bottom nav)
  
  DISMISSAL:
  Success/Info: auto-dismiss 3–4s
  Warning:      auto-dismiss 6s
  Error:        persistent until dismissed (errors deserve attention)
  Loading:      persistent until resolved
  
  MAX VISIBLE: 3 at a time. Stack and queue the rest.
*/
```

---

### 5.9 Data Table → Responsive Card List

Desktop tables collapse to card stacks on mobile. Never show a horizontal scroll on mobile.

```tsx
// components/ui/DataTable.tsx
'use client'
import { cn } from '@/lib/cn'

interface Column<T> {
  key:      keyof T | string
  header:   string
  cell:     (row: T) => React.ReactNode
  width?:   string
  align?:   'left' | 'center' | 'right'
  hideOn?:  'sm' | 'md'              /* Hide column on small screens */
  mobile?:  boolean                   /* Show this field in mobile card view */
}

interface DataTableProps<T> {
  data:       T[]
  columns:    Column<T>[]
  keyField:   keyof T
  loading?:   boolean
  empty?:     React.ReactNode
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ data, columns, keyField, loading, empty, onRowClick }: DataTableProps<T>) {
  if (loading) return <TableSkeleton columns={columns} />
  if (!data.length) return <>{empty}</>

  return (
    <>
      {/* ── DESKTOP TABLE (md+) ── */}
      <div className="hidden md:block overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
        <table className="w-full border-collapse">
          <thead className="bg-[var(--bg-sunken)] border-b border-[var(--border-default)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-left',
                    'text-[var(--text-xs)] font-[var(--weight-semibold)]',
                    'text-[var(--text-secondary)] uppercase tracking-[var(--tracking-wider)]',
                    col.hideOn === 'md' && 'hidden lg:table-cell',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {data.map((row) => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors duration-[var(--duration-fast)]',
                  onRowClick && 'cursor-pointer hover:bg-[var(--bg-sunken)]',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-3.5',
                      'text-[var(--text-sm)] text-[var(--text-primary)]',
                      col.hideOn === 'md' && 'hidden lg:table-cell',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD LIST (< md) ── */}
      <div className="md:hidden space-y-3">
        {data.map((row) => {
          const mobileColumns = columns.filter((c) => c.mobile !== false)
          const [primary, ...rest] = mobileColumns
          return (
            <div
              key={String(row[keyField])}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'bg-[var(--bg-surface)] rounded-[var(--radius-xl)]',
                'border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]',
                'p-4',
                onRowClick && 'cursor-pointer active:bg-[var(--bg-sunken)]',
              )}
            >
              {/* Primary field — prominent */}
              {primary && (
                <div className="font-[var(--weight-medium)] text-[var(--text-base)] text-[var(--text-primary)] mb-2">
                  {primary.cell(row)}
                </div>
              )}
              {/* Rest of mobile fields as key-value */}
              <div className="space-y-1">
                {rest.map((col) => (
                  <div key={String(col.key)} className="flex items-center justify-between">
                    <span className="text-[var(--text-xs)] text-[var(--text-secondary)]">{col.header}</span>
                    <span className="text-[var(--text-sm)] text-[var(--text-primary)]">{col.cell(row)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
```

---

## 6. MOTION & ANIMATION SYSTEM

### 6.1 Motion Philosophy

```
MOTION HAS FOUR PURPOSES:
  1. ORIENT   → Tell users where they are (page transitions, nav highlights)
  2. CONFIRM  → Validate their actions (button press, form submit, delete)
  3. REVEAL   → Introduce new content (modal open, dropdown, accordion)
  4. GUIDE    → Direct attention (error shake, loading pulse, CTA pulse)

WHAT MOTION IS NOT:
  ✗ Decoration
  ✗ Filler for slow loading
  ✗ An opportunity to show off
  ✗ A replacement for good UX

DURATION RULES:
  Micro (state changes):   100–150ms
  Transitions (UI show/hide): 200–300ms
  Page transitions:        250–350ms
  Complex sequences:       300–500ms (total, including stagger)
  NEVER animate > 600ms unless deliberately cinematic
```

### 6.2 Framer Motion Presets

```typescript
// lib/motion.ts — reusable motion variants

export const fadeIn = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1 },
  exit:     { opacity: 0 },
  transition: { duration: 0.2, ease: [0.0, 0, 0.2, 1] },
}

export const fadeUp = {
  initial:  { opacity: 0, y: 12 },
  animate:  { opacity: 1, y: 0  },
  exit:     { opacity: 0, y: 8  },
  transition: { duration: 0.25, ease: [0.0, 0, 0.2, 1] },
}

export const scaleIn = {
  initial:  { opacity: 0, scale: 0.95 },
  animate:  { opacity: 1, scale: 1    },
  exit:     { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
}

export const slideInFromRight = {
  initial:  { opacity: 0, x: '100%' },
  animate:  { opacity: 1, x: 0      },
  exit:     { opacity: 0, x: '100%' },
  transition: { duration: 0.3, ease: [0.0, 0, 0.2, 1] },
}

export const slideInFromBottom = {
  initial:  { opacity: 0, y: '100%' },
  animate:  { opacity: 1, y: 0      },
  exit:     { opacity: 0, y: '100%' },
  transition: { duration: 0.3, ease: [0.0, 0, 0.2, 1] },
}

/* Stagger children — wrap list items in this */
export const staggerContainer = (staggerDelay = 0.05) => ({
  animate: { transition: { staggerChildren: staggerDelay } },
})

export const staggerItem = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.0, 0, 0.2, 1] },
}

/* Page transition — use in layout.tsx */
export const pageTransition = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1 },
  exit:     { opacity: 0 },
  transition: { duration: 0.15 },
}

/* Error shake — for invalid form submissions */
export const shake = {
  animate: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
}
```

### 6.3 Next.js Page Transitions

```tsx
// app/template.tsx — wraps every page with a transition
'use client'
import { motion, AnimatePresence } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

---

## 7. LAYOUT PATTERNS

### 7.1 Page Header (Every page needs one)

```tsx
// components/layout/PageHeader.tsx
interface PageHeaderProps {
  title:        string
  description?: string
  breadcrumb?:  Array<{ label: string; href?: string }>
  actions?:     React.ReactNode
}

export function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
      <div className="min-w-0">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-2">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-tertiary)]">
                {i > 0 && <span aria-hidden>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-[var(--text-secondary)] transition-colors">{crumb.label}</a>
                ) : (
                  <span className="text-[var(--text-secondary)]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[var(--text-2xl)] sm:text-[var(--text-3xl)] font-[var(--font-display)] font-[var(--weight-bold)] text-[var(--text-primary)] leading-[var(--leading-tight)] truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[var(--text-sm)] sm:text-[var(--text-base)] text-[var(--text-secondary)] leading-[var(--leading-normal)]">
            {description}
          </p>
        )}
      </div>
      {/* Actions — full width on mobile, inline on desktop */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 sm:mt-1">
          {actions}
        </div>
      )}
    </div>
  )
}
```

### 7.2 Stat / Metric Card

```tsx
// components/ui/StatCard.tsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StatCardProps {
  label:      string
  value:      string | number
  trend?:     { value: number; period: string }   /* e.g. { value: 12.5, period: 'vs last month' } */
  icon?:      React.ReactNode
  loading?:   boolean
}

export function StatCard({ label, value, trend, icon, loading }: StatCardProps) {
  const trendPositive = trend && trend.value > 0
  const trendNeutral  = trend && trend.value === 0

  if (loading) return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="text" className="w-24 h-3" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton variant="text" className="w-32 h-7 mb-2" />
      <Skeleton variant="text" className="w-20 h-3" />
    </div>
  )

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-4 sm:p-5 hover:shadow-[var(--shadow-md)] transition-shadow duration-[var(--duration-normal)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[var(--text-xs)] font-[var(--weight-medium)] text-[var(--text-secondary)] uppercase tracking-[var(--tracking-wider)]">
          {label}
        </p>
        {icon && (
          <div className="w-8 h-8 rounded-[var(--radius-lg)] bg-[var(--color-brand-subtle)] flex items-center justify-center text-[var(--color-brand)]">
            {icon}
          </div>
        )}
      </div>

      <p className="text-[var(--text-2xl)] sm:text-[var(--text-3xl)] font-[var(--font-display)] font-[var(--weight-bold)] text-[var(--text-primary)] tabular-nums leading-none mb-2">
        {value}
      </p>

      {trend && (
        <div className={cn(
          'flex items-center gap-1 text-[var(--text-xs)] font-[var(--weight-medium)]',
          trendNeutral  ? 'text-[var(--text-secondary)]' :
          trendPositive ? 'text-[var(--color-success-text)]' :
                          'text-[var(--color-error-text)]',
        )}>
          {trendNeutral  ? <Minus size={12} /> :
           trendPositive ? <TrendingUp size={12} /> :
                           <TrendingDown size={12} />}
          <span>
            {trendPositive ? '+' : ''}{trend.value}% {trend.period}
          </span>
        </div>
      )}
    </div>
  )
}
```

---

## 8. ADVANCED UI/UX PROBLEM SOLVING

### 8.1 The HEART Framework — Diagnosing UI Problems

Before redesigning anything, diagnose it:

```
H — Happiness     Does the UI make users feel confident and in control?
E — Engagement    Do users interact deeply or bounce quickly?
A — Adoption      Do new users understand it immediately?
R — Retention     Do users come back? Is it habitual?
T — Task success  Can users complete their primary task without help?

For each dimension, ask:
  What's the SIGNAL? (observable behavior)
  What's the METRIC? (measurable indicator)
  What's the CAUSE?  (root problem in the UI)
```

### 8.2 Common UI Problems & Their Real Solutions

```
PROBLEM: Users don't find the primary CTA
ROOT CAUSE: Visual hierarchy is broken
REAL FIX:
  → One primary button per view. Never two primary buttons.
  → Primary button uses brand color. Secondary uses neutral.
  → CTA is above the fold. Always.
  → White space around CTA — breathing room = importance.

PROBLEM: Form abandonment is high
ROOT CAUSE: Cognitive load is too heavy
REAL FIX:
  → Break multi-field forms into steps (Stepper component)
  → Show progress (X of Y steps)
  → Autofill everything possible (autocomplete attributes)
  → Show requirements BEFORE they type, not after they fail
  → One column layout — two-column forms are harder to scan
  → Remove optional fields entirely or move to step 2

PROBLEM: Users are confused about their current state
ROOT CAUSE: Navigation has no active feedback
REAL FIX:
  → Active nav item: color + background + optional left bar indicator
  → Breadcrumbs on all nested pages
  → Page title in browser tab matches page heading
  → URL changes on every meaningful state change

PROBLEM: Mobile users are frustrated
ROOT CAUSE: Desktop UI transplanted to mobile
REAL FIX:
  → Thumb zone mapping: bottom = easy, top = hard
  → Primary actions in bottom 40% of screen
  → Touch targets ≥ 44×44px (add padding around small icons)
  → Bottom navigation replaces sidebar
  → Drawers slide from bottom (not right) on mobile
  → Swipe to go back (or show back arrow top-left)
  → No hover-dependent interactions

PROBLEM: Users don't understand error messages
ROOT CAUSE: Error messages are written for developers
REAL FIX:
  → Human tone: "That didn't work" not "Request failed with status 400"
  → Tell them what to do: "Check your internet connection and try again"
  → If it's their fault, be kind: "That email is already registered — try signing in"
  → If it's your fault, own it: "Something went wrong on our end. We're on it."
  → Never show error codes to users

PROBLEM: Loading states feel slow even when they're fast
ROOT CAUSE: No perceived progress
REAL FIX:
  → Show skeleton immediately (< 16ms — before the request even fires)
  → Skeleton must match real content shape exactly
  → Optimistic updates: show the result before the server confirms
  → For > 3s operations: show a progress indicator with step labels
  → Never show a spinner for > 3s without context

PROBLEM: Modals feel jarring and disorienting
ROOT CAUSE: No visual connection between trigger and modal
REAL FIX:
  → Animate from trigger location (scale from button)
  → Dim and blur the background (not black out)
  → Show what triggered the modal in the header
  → Make closing obvious: Escape key + backdrop click + visible X
  → Mobile: slide up from bottom (feels native)

PROBLEM: Data tables are unusable on mobile
ROOT CAUSE: Table is a desktop-only metaphor
REAL FIX:
  → Tables collapse to cards below md breakpoint
  → Choose 2-3 most important columns for mobile card
  → Tap card to see full detail (not inline expansion)
  → Keep sort/filter controls in a bottom sheet on mobile

PROBLEM: Color contrast fails accessibility
ROOT CAUSE: Brand colors aren't designed for accessibility
REAL FIX:
  → Check every text/background combination against WCAG AA (4.5:1)
  → Use semantic color tokens, not raw palette values
  → Dark mode: don't just invert — redesign for dark
  → Disable/placeholder text: at least 3:1 against background
  → Never convey meaning through color alone (add icon or text)
```

### 8.3 The Gestalt Principles in Practice

```
PROXIMITY:    Group related things. Space = separation.
              → Form fields in the same section share a container
              → 24px between groups, 8px between related items

SIMILARITY:   Same style = same function.
              → All primary actions look the same
              → All destructive actions look the same
              → Never style two different things identically

CONTINUITY:   Eyes follow lines.
              → Left-align forms (not center) — eyes scan down
              → Card grids: same height enforces the grid
              → Sidebar items: vertically aligned icons

CLOSURE:      The brain completes incomplete shapes.
              → Use it: half-visible content signals scrollability
              → Truncated text with "..." implies more
              → Carousel peek shows edge of next card

FIGURE-GROUND: What's the main focus vs. the background?
              → Modal content = figure. Blurred backdrop = ground.
              → Hover highlight = figure. Rest of table = ground.
```

---

## 9. DARK MODE

Dark mode is not `background: black`. It's a full redesign of the light experience.

### 9.1 Dark Mode Rules

```
BACKGROUNDS ARE NOT SIMPLY INVERTED:
  Light: white page, white cards, light gray sections
  Dark:  dark gray page, slightly lighter cards, even lighter sections
  
  Dark bg hierarchy (lightest-to-darkest = nearest-to-farthest from user):
  --bg-elevated:  #1e293b   (cards, popups)
  --bg-surface:   #0f172a   (page sections, sidebars)
  --bg-base:      #020617   (page background)

SHADOWS DON'T WORK IN DARK MODE:
  In dark mode, shadows are invisible.
  Use subtle borders instead: border: 1px solid rgb(255 255 255 / 0.08)
  
TEXT CONTRAST:
  Light mode: #0f172a on white = contrast 18:1 (great)
  Dark mode: white on #0f172a = contrast 18:1 (great)
  Reduce secondary text to ~60% opacity, not full white

COLORS NEED SATURATION ADJUSTMENT:
  Bright brand colors are eye-searing on dark backgrounds
  Reduce saturation by 10-20% for dark mode variants
  
IMAGES & ILLUSTRATIONS:
  Consider: brightness(0.85) on images in dark mode
  Consider: separate dark-mode illustration variants

IMPLEMENTATION (Next.js):
  Use next-themes for zero-flash dark mode
  Apply [data-theme='dark'] attribute on <html>
  All colors reference CSS tokens — switching is automatic
```

---

## 10. ACCESSIBILITY — BUILT IN, NOT BOLTED ON

### 10.1 The Accessibility Mindset

Accessibility is not a checklist. It is a design principle: **your UI works for all humans.**

```
KEYBOARD USERS (motor impairment):
  → Every interactive element reachable by Tab
  → Logical tab order matches visual order
  → Focus ring always visible (never outline: none without replacement)
  → Escape closes all overlays
  → Arrow keys navigate lists, menus, tabs

SCREEN READER USERS (visual impairment):
  → Semantic HTML always (button not div, nav not div, h1 not p)
  → aria-label on all icon-only controls
  → aria-live for dynamic content (toasts, form errors, counts)
  → Images: meaningful alt text or alt="" if decorative
  → Tables: thead with scope="col", caption or aria-label

COLOR BLIND USERS:
  → Never convey meaning through color alone
  → Add icon + color (✓ green + icon, ✗ red + icon)
  → Test with 4 modes: protanopia, deuteranopia, tritanopia, achromatopsia

MOTOR IMPAIRMENT:
  → Touch targets: 44×44px minimum (iOS HIG standard)
  → No time-limited interactions
  → Hover actions must be tappable alternatives

LOW VISION:
  → Respect browser font size (use rem, not px for text)
  → Support 200% zoom without horizontal scroll
  → Sufficient contrast (4.5:1 text, 3:1 UI elements)

COGNITIVE LOAD:
  → Plain language. Short sentences.
  → One task per screen
  → Consistent navigation — never move things around
  → Undo instead of confirm-then-delete
```

---

## 11. UI QUALITY CHECKLIST

Run this before marking any UI work done:

```
VISUAL QUALITY
  □ Design tokens used everywhere (no hardcoded colors/spacing)
  □ Consistent border radius (never a mix of styles)
  □ Typography hierarchy respected (max 3 levels per screen)
  □ Icons are from one icon set (Lucide) and consistent in size
  □ Brand color used purposefully (not decoratively)
  □ Dark mode tested and correct
  □ Looks good at 1280px (desktop), 768px (tablet), 375px (mobile)

INTERACTION QUALITY
  □ Every button has hover, focus, active, disabled, loading states
  □ Every input has focus, error, disabled states with correct labels
  □ Hover interactions have an equivalent tap/keyboard action
  □ Animations respect prefers-reduced-motion
  □ No layout shift when content loads

CONTENT QUALITY
  □ Every empty state has title + description + CTA
  □ Skeleton loaders match real content shape
  □ Error messages are human-readable, not technical
  □ Loading states appear within 100ms of triggering an action
  □ Success feedback appears for all user-initiated mutations
  □ Truncated text has a way to reveal full content

RESPONSIVE QUALITY
  □ Tested at 320px (smallest phone), 375px, 768px, 1024px, 1280px
  □ No horizontal overflow at any breakpoint
  □ Touch targets ≥ 44×44px on mobile
  □ Navigation switches to bottom bar on mobile
  □ Tables collapse to card list on mobile
  □ Modals/drawers slide from bottom on mobile
  □ iOS safe area insets applied (env(safe-area-inset-*))
  □ Keyboard does not hide important content on mobile

ACCESSIBILITY QUALITY
  □ Tab order is logical
  □ Focus ring visible on all interactive elements
  □ All icon-only buttons have aria-label
  □ Color contrast passes WCAG AA (4.5:1 text, 3:1 UI)
  □ Dynamic content announced via aria-live
  □ Form inputs have labels (not just placeholders)
  □ Errors linked to inputs via aria-describedby
  □ Semantic HTML (nav, main, button, h1-h6, etc.)

PERFORMANCE (UI impact)
  □ No layout thrashing (read/write DOM operations separated)
  □ Animations use transform/opacity only (not width/height)
  □ Images have explicit dimensions to prevent CLS
  □ Heavy components lazy-loaded (charts, editors, maps)
  □ Font loading: font-display: swap, preload key fonts
```

---

## 12. FONT LOADING IN NEXT.JS

```tsx
// app/layout.tsx
import { Sora, DM_Sans } from 'next/font/google'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

---

## 13. GREAT UI FONT PAIRINGS (Never Use Inter As Primary)

```
PAIRING 1 — Editorial Authority
  Display: Instrument Serif (serif — trustworthy, editorial)
  Body:    Geist (clean geometric sans)
  Use for: Finance, legal, professional services

PAIRING 2 — Modern Clarity  
  Display: Sora (geometric, confident)
  Body:    DM Sans (warm, highly legible)
  Use for: SaaS dashboards, productivity tools

PAIRING 3 — Warm & Human
  Display: Fraunces (optical serif with character)
  Body:    Plus Jakarta Sans (friendly, approachable)
  Use for: Consumer apps, health, lifestyle

PAIRING 4 — Energetic & Bold
  Display: Cabinet Grotesk (wide-set, strong)
  Body:    Figtree (readable, circular)
  Use for: Startups, marketplaces, young audience

PAIRING 5 — Technical Precision
  Display: Space Grotesk (structured, precise)
  Body:    Nunito (soft, very legible)
  Use for: Developer tools, data products
  
PAIRING 6 — Luxury & Refined
  Display: Cormorant Garamond (classical elegance)
  Body:    Jost (clean, light weight)
  Use for: Luxury goods, fashion, high-end services

RULE: Never ship with only one font weight loaded.
      Always load Regular + Medium + SemiBold + Bold minimum.
```

---

*SKILL version 1.0.0 — Next.js UI/UX Mastery*
*Focus: Design systems, component craft, responsiveness, motion, accessibility, UX problem solving*
*Inspired by: Hubtel Butterfly BDS, Dribbble skill-level UI, Apple HIG, Material Design 3, Radix UI, Vercel Design*