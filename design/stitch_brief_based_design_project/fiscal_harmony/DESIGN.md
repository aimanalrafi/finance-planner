---
name: Fiscal Harmony
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777f'
  outline-variant: '#c5c6cf'
  surface-tint: '#4f5e83'
  primary: '#000109'
  on-primary: '#ffffff'
  primary-container: '#0a1b3d'
  on-primary-container: '#7584ac'
  inverse-primary: '#b7c6f1'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#040100'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c1800'
  on-tertiary-container: '#b97600'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b7c6f1'
  on-primary-fixed: '#091a3c'
  on-primary-fixed-variant: '#37466a'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  slate-surface: '#F8FAFC'
  navy-deep: '#060D1F'
  growth-light: '#ECFDF5'
  caution-light: '#FFFBEB'
  glass-border: rgba(255, 255, 255, 0.4)
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 12px
---

## Brand & Style

The design system is rooted in the **Corporate / Modern** aesthetic, specifically tailored for the iOS ecosystem. It prioritizes clarity, trust, and structural integrity to transform the anxiety of financial "surprises" into a sense of controlled harmony. 

The personality is that of a "Sophisticated Financial Advisor"—calm, precise, and encouraging. The interface leverages the familiarity of Apple’s Human Interface Guidelines (HIG) but elevates it with a distinctive color narrative and tactile depth. It avoids the coldness of traditional spreadsheets by using generous whitespace, soft rounded forms, and high-quality typography that makes complex multi-person household data feel breathable and manageable.

## Colors

The palette is anchored by **Deep Navy** (`#0A1B3D`), representing stability and the "Big Picture" of the household's long-term wealth. This is contrasted with a **Slate** neutral system that provides a professional, low-fatigue backdrop for frequent data entry.

**Chromatic Accents:**
- **Emerald Green (Primary Action/Growth):** Used for savings progress, "Actual" figures that are under budget, and successful investment growth.
- **Soft Amber (Highlight/Surprise):** Specifically reserved for "Tentative" expenses, "Surprise" alerts, and items requiring user decision-making. 
- **Functional Use:** Income flows use the Emerald Green, while fixed "Needs" use the Deep Navy to denote their non-negotiable status.

## Typography

This design system uses **Hanken Grotesk** as the primary typeface to emulate the crisp, high-legibility feel of San Francisco while providing a slightly more modern, geometric character suited for a dedicated SaaS tool.

**Numerical Clarity:**
**JetBrains Mono** is introduced for tabular data, currency amounts (€), and "Planned vs. Actual" comparisons. This monospaced font ensures that digits align vertically across multi-month views, making it effortless for the user to compare numbers at a glance without their eyes jumping.

**Hierarchy:**
- **Display:** Used for total household net worth or monthly balance.
- **Headline:** Used for category buckets (Needs, Wants, Savings).
- **Label Caps:** Used for metadata like "TENTATIVE" or "JOINT ACCOUNT" tags.

## Layout & Spacing

The system follows a **Fixed-Fluid hybrid grid**. On iPhone, it utilizes a standard 4-column layout with a 20px safe-area margin. 

**Spacing Rhythm:**
A strict 4px base unit is used. Content is grouped using "Tight" (8px) or "Standard" (16px) spacing to reinforce relationships between labels and their corresponding data. 

**Multi-Month Reflow:**
- **Mobile:** Horizontal scrolling "Cards" for month-to-month views.
- **Tablet/Desktop:** A 12-column grid where months can be compared side-by-side (up to 3 months visible at once).
- **Yearly View:** Uses a density-optimized table layout where "Actuals" and "Planned" are stacked vertically within a single cell to save horizontal space.

## Elevation & Depth

To keep complex data approachable, depth is created through **Tonal Layers** rather than heavy shadows.

- **Level 0 (Background):** The base `slate-surface`.
- **Level 1 (Cards):** Pure white background with a very subtle 1px border (`#E2E8F0`) and a soft, wide-diffusion shadow (4px Blur, 2% Opacity, Navy tint).
- **Level 2 (Modals/Surprise Alerts):** Floating elements use a **Glassmorphism** effect with a heavy backdrop blur (20px) to maintain the context of the budget behind the alert.
- **Active State:** When a category is tapped, it "lifts" slightly with a slightly more pronounced shadow to indicate focus.

## Shapes

The design system employs a **Rounded** (Level 2) language. This softens the "hard numbers" of financial planning, making the app feel more like a lifestyle tool than a banking ledger.

- **Containers/Cards:** 1rem (16px) corner radius.
- **Buttons/Input Fields:** 0.75rem (12px) corner radius.
- **Tags/Chips:** Fully rounded (Pill) for categorical labels (e.g., "Joint," "Person 1").
- **Progress Bars:** Rounded ends to signify fluid progress rather than hard stops.

## Components

### Buttons & Controls
- **Primary Action:** Solid Navy background with White text. Used for "Confirm Plan."
- **Secondary Action:** Ghost style with Emerald Green border and text. Used for "Add Expense."
- **Segmented Control:** Used to toggle between "Solo" and "Household" views or "Planned" vs "Actual" filters.

### Financial Cards
- **Bucket Cards:** Large containers for "Needs," "Wants," and "Savings." They feature a top-aligned progress bar and a split-view footer showing "Remaining Budget."
- **Instalment Tracker:** A specialized list item with a "Pips" indicator (e.g., 3 of 6 dots filled) to show the duration of the split expense.

### Input Fields
- **Currency Input:** Large, center-aligned text fields that automatically append the "€" symbol. They use a soft amber focus ring when editing a "Surprise" expense.
- **Tentative Toggle:** A switch or checkbox that, when active, applies a dashed border to the parent card to signify its unconfirmed status.

### Data Visualizations
- **The "Impact" Gauge:** A custom component for the Surprise Expense Handler. It shows a horizontal bar of the current bucket, with a striped "Amber" section showing how the new expense will overflow the budget.