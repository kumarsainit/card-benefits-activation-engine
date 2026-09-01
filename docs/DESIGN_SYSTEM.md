# Card Benefits Activation Engine — Design System & UI Specifications

## 1. Design Philosophy

The CBAE design system follows an **Aceternity-inspired fintech aesthetic**:
- **Palette**: Clean slate foundations with indigo/violet primary accents and emerald value highlights.
- **Glassmorphism**: Subtle backdrop blur (`backdrop-blur-xl`), hairline borders (`border-slate-200/80 dark:border-slate-800/80`), and elevated translucent panels.
- **Typography**: Inter / system font family with clear numerical weights for financial figures.
- **Iconography**: Phosphor Icons React with consistent duotone and regular weights.

---

## 2. Benefit Domain Styling Tokens

| Benefit Type | Glow Token | Accent Color | Phosphor Icon |
| :--- | :--- | :--- | :--- |
| **Purchase Protection** | `.benefit-glow-purchase` | `indigo-500` / `#6366f1` | `<ShieldCheck weight="duotone" />` |
| **Return Protection** | `.benefit-glow-return` | `purple-500` / `#a855f7` | `<ArrowCounterClockwise weight="duotone" />` |
| **Travel Delay Insurance** | `.benefit-glow-travel` | `sky-500` / `#0ea5e9` | `<AirplaneTakeoff weight="duotone" />` |

---

## 3. Core UI Primitives

- **AppShell**: Responsive layout wrapping public and authenticated customer views with fixed blurred header, dynamic navigation tabs, real-time notification bell dropdown, theme toggle, and footer.
- **AdminShell**: Specialized operations layout with role indicator badge, dense navigation tabs, and access restriction guards.
- **BenefitOpportunityCard**: Card surfacing detected opportunities with confidence match badges, verified transaction summary, explainability clauses, and direct review CTA.
- **VirtualGlassCard**: Embossed glass virtual credit card showcasing tier, network, masked last-4 digits, and active status.
- **TransactionTable**: Responsive Tremor-inspired data table with mobile card fallback.
- **ClaimActivationWizard**: Accessible multi-step wizard guiding cardholders through zero re-entry facts, customer statement input, evidence drag-and-drop attachment, review confirmation, and success feedback.
- **ClaimTrackingTimeline**: Preline-inspired vertical status tracker visualizing the lifecycle state machine.
