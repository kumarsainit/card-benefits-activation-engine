# Design System & Visual Foundation

This document defines the visual hierarchy, tokens, component primitives, and design patterns for the **Card Benefit Activation Engine**.

---

## 1. Design Direction & Principles
- **Aesthetic**: Premium, modern, bright/airy fintech interface inspired by Aceternity UI, Glassmorphism, and Tailwind UI.
- **Translucent Surfaces**: Strategic use of frosted glass (`backdrop-blur-md`, subtle border alpha) with high-contrast text to maximize readability.
- **Restrained Motion**: Smooth, deliberate animations (Framer Motion) that emphasize data flow and status updates without visual distraction.
- **Accessibility**: Strict adherence to WCAG 2.1 AA standards, clear visible focus rings, semantic HTML elements, and keyboard navigability.

---

## 2. Color Palette & Tokens

### Base & Backgrounds
| Token | Light Value | Dark Value | Usage |
| :--- | :--- | :--- | :--- |
| `background` | `hsl(210, 40%, 98%)` (`#f8fafc`) | `hsl(224, 71.4%, 4.1%)` (`#020617`) | Main application background canvas |
| `foreground` | `hsl(222.2, 84%, 4.9%)` | `hsl(210, 40%, 98%)` | Primary body and heading text |
| `card` | `hsl(0, 0%, 100%)` | `hsl(222.2, 84%, 4.9%)` | Solid card / surface fallback |
| `border` | `hsl(214.3, 31.8%, 91.4%)` | `hsl(217.2, 32.6%, 17.5%)` | Card and input boundary strokes |

### Brand & Primary Accents
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `primary` | `#4f46e5` (Indigo-600) | Primary CTAs, active indicators, brand badges |
| `primary-hover`| `#4338ca` (Indigo-700) | Button hover states |
| `ring` | `#6366f1` (Indigo-500) | Focus rings and interactive outlines |

### Benefit Domain Accents
| Protection Type | Accent Hex | Border Glow Utility | Purpose |
| :--- | :--- | :--- | :--- |
| **Purchase Protection** | `#4f46e5` (Indigo) | `.benefit-glow-purchase` | Theft & damage protection highlights |
| **Return Protection** | `#7c3aed` (Purple) | `.benefit-glow-return` | 90-day merchant denial reimbursement |
| **Travel Delay** | `#0284c7` (Sky Blue) | `.benefit-glow-travel` | Flight / common carrier delay protections |

---

## 3. Glassmorphism Surface Hierarchy

| Glass Variant | CSS Utility | Backdrop Blur | Opacity / Surface | Best For |
| :--- | :--- | :--- | :--- | :--- |
| `glass-primary` | `.glass-primary` | `backdrop-blur-md` | `bg-white/75 dark:bg-slate-900/70` | Standard dashboard cards & section containers |
| `glass-secondary` | `.glass-secondary` | `backdrop-blur-sm` | `bg-white/45 dark:bg-slate-900/45` | Sub-panels, metadata badges, input wrappers |
| `glass-elevated` | `.glass-elevated` | `backdrop-blur-xl` | `bg-white/90 dark:bg-slate-900/85` | Modals, claim drawers, dropdown popovers |
| `glass-interactive` | `.glass-interactive` | `backdrop-blur-md` | Hover glow + shadow shift | Clickable benefit opportunities & claim cards |

---

## 4. Typography Scale (Inter)

- **Display Title**: `text-3xl md:text-4xl font-extrabold tracking-tight`
- **Page Heading**: `text-2xl font-bold tracking-tight text-foreground`
- **Section Heading**: `text-lg font-semibold leading-tight text-foreground`
- **Body Text**: `text-sm font-normal text-foreground leading-relaxed`
- **Secondary / Caption**: `text-xs font-medium text-muted-foreground`
- **Monospace Metadata**: `font-mono text-xs text-muted-foreground` (Transaction IDs, Claim references)

---

## 5. Icon System (Phosphor Icons)
- **Library**: `@phosphor-icons/react`
- **Weight**: `duotone` for primary feature badges / heroes; `regular` or `bold` for standard navigation items and buttons.
- **Convention**:
  - `ShieldCheck`: Purchase Protection / Enrolled Protections
  - `ArrowCounterClockwise`: Return Protection / Reimbursement
  - `AirplaneTakeoff`: Travel Delay Insurance
  - `Lightning`: Instant Activation / Auto-Detection
  - `CheckCircle`: Claim Approval / Verified Status
  - `Warning`: Claim Action Required / Policy Limits

---

## 6. Motion Conventions (Framer Motion)
- **`fadeIn`**: Simple 0.3s opacity transition for page headers and metadata panels.
- **`slideUp`**: 0.4s vertical translation (`y: 16 -> 0`) with custom cubic bezier for natural spring-like entry.
- **`staggerContainer`**: 0.08s stagger delay between grid child cards.
- **Reduced Motion**: Automatically respected through standard CSS media queries (`prefers-reduced-motion: reduce`).

---

## 7. UI Primitives Inventory
1. **`Button` / `IconButton`**: Supports `default`, `secondary`, `outline`, `ghost`, `glass`, `destructive`, and `shimmer`.
2. **`GlassCard`**: Translucent container supporting domain glows (`purchase`, `return`, `travel`).
3. **`Badge`**: Status indicators (`default`, `success`, `warning`, `info`, `purchase`, `return`, `travel`).
4. **`Input` / `Textarea`**: Glassmorphic inputs with embedded icons, validation error states, and accessible focus rings.
5. **`Select` / `Checkbox` / `Tabs`**: Radix UI powered primitives styled with glass backdrops.
6. **`Dialog` / `Sheet` / `Popover` / `Tooltip`**: Elevated modal and drawer containers with blur overlays.
7. **`Skeleton` / `Spinner`**: Clean loading states for async operations.
8. **`Alert`**: Categorized banner alerts (`default`, `destructive`, `success`, `warning`, `info`).
9. **`Progress`**: Animated horizontal progress indicator for multi-step claim prefill.
