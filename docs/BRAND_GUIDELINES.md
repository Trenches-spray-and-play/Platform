# Universal Brand Guidelines: The "Super Scale" Standard

This document defines the visual and structural "North Star" for the Trenches platform, derived from the perfected Branding Lab V5 prototype. These guidelines are non-negotiable for all future interface development.

## 1. Design Philosophy: "Institutional Elite"
The platform must feel like a high-end financial institution from the future—bold, minimalist, and authoritative. 
- **Aggressive Typography**: Large headings that occupy significant viewport space.
- **Vertical Rhythm**: Deliberate, snap-based vertical movement on mobile.
- **Monochrome Foundation**: Grayscale-first design with a single "Zenith Green" accent.

## 2. Typography Scale (Super Scale)

| Token | Desktop (PC) | Mobile (Web) | Weight/Letter-Spacing |
| :--- | :--- | :--- | :--- |
| **H1 (Hero)** | 8.5rem | 3.5rem | 950 / -5px |
| **H2 (Section)** | 6.5rem | 2.5rem | 950 / -5px |
| **Body (Large)** | 1.6rem | 1.1rem | 600 / Normal |
| **Section Tag** | 0.65rem | 0.55rem | 900 / 5px (Wide) |
| **Labels** | 0.65rem | 0.45rem | 900 / 2px |

> [!IMPORTANT]
> **Nomenclature**: Never use underscores in user-facing text (e.g., use "The ROI Calculator" not "THE_ROI_CALCULATOR").

## 3. Color Palette

### Base
- **Main Background**: `#060606` (Dark) / `#FFFFFF` (Light)
- **Secondary Text**: `#A1A1AA` (Dark) / `#52525B` (Light)
- **Borders**: `rgba(255, 255, 255, 0.08)` (Dark) / `#EEEEEE` (Light)

### Accent (Zenith Green)
- **Primary**: `#00FF66`
- **Glow**: `rgba(0, 255, 102, 0.15)`

## 3.5 System Standards

### Responsive Breakpoints
- **Mobile**: `(max-width: 768px)`
- **Tablet**: `(min-width: 769px) and (max-width: 1024px)`
- **Desktop (PC)**: `(min-width: 1025px)`

### Safe Area Strategy
- All mobile views must implement `padding-bottom: env(safe-area-inset-bottom)` on primary action containers to avoid overlap with device navigation bars.

### Iconography (ScaleIcon)
- **Standard Stroke**: `1.5px` (Lucide standard is 2px; we use 1.5px for institutional precision).
- **Color Inheritance**: Icons must inherit `var(--text-primary)` by default and `var(--accent-primary)` for active/critical states.
- **Rendering**: Must use `vector-effect: non-scaling-stroke` for consistent weight across all resolutions.

### Layering (Z-Index)
To avoid collision in the monorepo, use the following standardized layers:
- **Base/Background**: `0`
- **Surface/Content**: `10`
- **Sticky Headers**: `1000`
- **Modals/Overlays**: `2000`
- **Toasts/Notifications**: `3000`

## 4. Interaction Principles
- **Tactile Feedback**: Every button must have a `whileTap={{ scale: 0.95 }}` animation (via Framer Motion).
- **Discovery Hints**: Interactive elements (like sliders) should nudge or pulse until first interacted with.
- **Precision Touch Targets**: Minimum hit area of 44px for all mobile controls.

### Animation Physics
- **Standard Spring**: `stiffness: 300, damping: 30, mass: 1` (Responsive & Institutional).
- **Hover Transitions**: `cubic-bezier(0.4, 0, 0.2, 1)` with `0.2s` duration.
- **Scroll Snap**: Transitions between snap-points must feel instantaneous yet smooth (default iOS-style deceleration).

## 5. Structural Rules
- **Viewport Snapping**: Mobile pages must use `100svh` containers with `scroll-snap-type: y mandatory`.
- **Adaptive Spacing**: Spacing must double as the device size increases. Mobile margins (1rem) become PC margins (3rem+).
