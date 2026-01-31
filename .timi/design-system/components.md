# 🧩 Component Library

> Based on sample-v2 design system — Trenches Design System v2.0

---

## 🔘 Buttons

### Primary Button (`.btn-primary`)
**Use for:** Main CTAs, submit actions, deposit buttons

```
Background: --accent-primary (#22c55e)
Text: --bg-primary (#0a0a0b)
Padding: var(--space-3) var(--space-6) (12px 24px)
Border Radius: var(--radius-md) (10px)
Font: 0.875rem, weight 600
Hover: --accent-primary-hover + shadow-glow + translateY(-1px)
```

### Secondary Button (`.btn-secondary`)
**Use for:** Secondary actions, cancel, back

```
Background: --bg-elevated (#212124)
Border: 1px solid --border-primary
Text: --text-primary
Hover: --bg-tertiary + border-accent
```

### Ghost Button (`.btn-ghost`)
**Use for:** Low priority actions, icon buttons

```
Background: transparent
Text: --text-secondary
Hover: --bg-tertiary + text-primary
```

### Button Sizes
| Size | Class | Padding |
|------|-------|---------|
| Small | `.btn-sm` | var(--space-2) var(--space-4) |
| Default | - | var(--space-3) var(--space-6) |
| Large | `.btn-lg` | var(--space-4) var(--space-8) |

---

## 🃏 Cards

### Standard Card (`.card`)
**Use for:** Campaign cards, position cards, info cards

```
Background: --bg-card (rgba(26, 26, 29, 0.6))
Border: 1px solid --border-primary
Border Radius: var(--radius-lg) (14px)
Backdrop Filter: blur(12px)
Hover: border-accent + shadow-glow
```

### Elevated Card (`.card-elevated`)
**Use for:** Modals, dropdowns, popovers

```
Background: --bg-elevated (#212124)
Border: 1px solid --border-secondary
Border Radius: var(--radius-lg)
```

---

## 🏷️ Badges

### Trench Type Badges

| Type | Class | Background | Text |
|------|-------|------------|------|
| Rapid | `.badge-rapid` | rgba(34, 197, 94, 0.15) | --accent-rapid |
| Mid | `.badge-mid` | rgba(228, 228, 231, 0.15) | --accent-mid |
| Deep | `.badge-deep` | rgba(251, 191, 36, 0.15) | --accent-deep |

### Status Badges

| Status | Class | Background | Text |
|--------|-------|------------|------|
| Success | `.badge-success` | --success-light | --success |
| Warning | `.badge-warning` | --warning-light | --warning |
| Live | `.phaseLive` | --success-light | --success |
| Countdown | `.phaseCountdown` | --warning-light | --warning |
| Paused | `.phasePaused` | rgba(82, 82, 91, 0.3) | --text-tertiary |

**Badge specs:**
```
Padding: var(--space-1) var(--space-3) (4px 12px)
Font: 0.75rem, weight 600, uppercase
Border Radius: var(--radius-full)
Font Family: var(--font-mono)
Letter Spacing: 0.05em
```

---

## 📝 Inputs

### Text Input (`.input`)

```
Width: 100%
Padding: var(--space-3) var(--space-4)
Background: --bg-secondary
Border: 1px solid --border-primary
Border Radius: var(--radius-md)
Text: --text-primary
Font: var(--font-sans), 0.9375rem
Focus: border-accent + box-shadow 0 0 0 3px accent-glow
Placeholder: --text-muted
```

---

## 📊 Data Display

### Stat Card
**Use for:** Dashboard stats, key metrics

```
Layout: flex row, items center, gap var(--space-4)
Padding: var(--space-5)
Background: --bg-card
Border: 1px solid --border-primary
Border Radius: var(--radius-lg)
Icon: 48x48px, --bg-tertiary bg, --accent-primary color
Label: 0.75rem, uppercase, --text-tertiary
Value: 1.5rem, weight 700, --text-primary, mono font
Hover: border-accent + translateY(-2px)
```

### Progress Bar

```
Height: 4px
Background: --bg-tertiary
Border Radius: var(--radius-full)
Fill: trench-specific color
  - RAPID: --accent-rapid
  - MID: --accent-mid
  - DEEP: --accent-deep
```

---

## 🔔 Status Indicators

### Live Dot
```
Width/Height: 8px
Background: --success
Border Radius: 50%
Box Shadow: 0 0 8px --success
Animation: pulse 2s ease-in-out infinite
```

### Status Toast
```
Position: fixed, top-right
Padding: var(--space-4) var(--space-5)
Border Radius: var(--radius-lg)
Box Shadow: --shadow-lg
Animation: slideIn 0.3s ease-out

Success: success-light bg, border-accent, success text
Error: danger-light bg, danger border, danger text
```

---

## 🎛️ Interactive Elements

### Toggle Switch

```
Track: 44px x 24px, --border-primary bg, 12px radius
Thumb: 18px circle, white, 3px padding
Checked: --accent-primary bg, thumb translateX(20px)
Transition: 0.2s
```

### Divider
```
Height: 1px
Background: linear-gradient(90deg, transparent, --border-primary 20%, --border-primary 80%, transparent)
```

---

## 📱 Responsive Patterns

### Container
```
Max Width: 1400px (default), 1000px (narrow)
Padding: var(--space-6) desktop, var(--space-4) mobile
```

### Grid Breakpoints
| Breakpoint | Cards per row |
|------------|---------------|
| Desktop (>1024px) | 4 columns |
| Tablet (768-1024px) | 2 columns |
| Mobile (<768px) | 1 column |

---

## 🎬 Animation Patterns

### Hover Effects
```css
/* Card hover */
transform: translateY(-4px);
box-shadow: var(--shadow-lg), var(--shadow-glow);
border-color: var(--border-accent);

/* Button hover */
transform: translateY(-1px);
box-shadow: var(--shadow-glow);
```

### Entrance Animations
| Animation | Duration | Easing |
|-----------|----------|--------|
| fadeIn | 0.5s | ease-out |
| fadeInUp | 0.5s | ease-out |
| slideIn | 0.3s | ease-out |

### Stagger Delays
```
.stagger-1: 0.05s
.stagger-2: 0.1s
.stagger-3: 0.15s
.stagger-4: 0.2s
.stagger-5: 0.25s
```

---

## ♿ Accessibility Requirements

- All interactive elements must have focus-visible states
- Color contrast minimum 4.5:1 for text
- Reduced motion support via `prefers-reduced-motion`
- Keyboard navigation support
- ARIA labels for icon-only buttons

---

## 🧪 Component States

Every component must handle:
1. **Default** — Resting state
2. **Hover** — Mouse over
3. **Focus** — Keyboard/tab focus
4. **Active** — Click/tap down
5. **Disabled** — Non-interactive
6. **Loading** — Async operation (where applicable)
