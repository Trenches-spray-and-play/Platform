# Implementation Plan: Universal Platform Brand Rollout

This plan outlines the technical steps to propagate the "Super Scale" visual language from the Branding Lab V5 to the entire Trenches ecosystem (Landing & Dapp).

## Identified Gaps & Issues

1.  **Fragmented Token Sources**: Design tokens (colors, font sizes) are currently hardcoded in local `module.css` files, leading to "style drift."
2.  **Transient Theme State**: Theme toggling is currently local to V5; the rest of the platform lacks a persistent, across-app theme provider.
3.  **"Magic Number" Media Queries**: Breakpoints (768px, 1024px) are repeated verbatim across files instead of being managed as global variables.
4.  **Component Duplication**: Complex patterns like the ROI Calculator and Logic Flow exist as monolithic blocks in the Lab; they need to be modularized for reuse in the Dapp.
5.  **Safe Area Gaps**: Insets for modern mobile devices (iPhone dynamic island, etc.) are only handled in V5; the Dapp currently risks UI collisions on mobile.
6.  **Font Loading Inefficiency**: "Inter" is specified but not standardized across apps, leading to potential layout shifts during "Super Scale" rendering.
7.  **Nomenclature Drift**: Many legacy pages still use underscores in code-driven UI labels.
8.  **Interaction Inconsistency**: The "Pulse & Nudge" affordance is missing from all other platform interactive elements.
9.  **Build Latency**: Changes in shared packages need a standardized Turborepo/HMR strategy to avoid the "Port 3001 Stalls" seen in development.
10. **Accessibility Standards**: Zenith Green on white needs a formal contrast audit to ensure "Super Scale" remains legible for all users.
11. **Iconographic Fragmentation**: No standard stroke-width or color inheritance for `lucide-react` icons across the monorepo.
12. **Z-Index Collision Risks**: No centralized layer management; hardcoded `z-index: 1000` in V5 may collide with Dapp modals.
13. **Animation Configuration**: Cubic-bezier curves and spring configs are currently inconsistent/ad-hoc per component.
14. **Lack of Layout Patterns**: The 6-page "Super Scale" narrative flow is a hardcoded structure rather than a reusable `ScrollSnapLayout` component.
15. **Button Variant Bloat**: Multiple custom button classes (`v5CTA`, `v5MetaCTA`, `v5TierBtn`) should be unified into a single `ScaleButton` with variants.
16. **Missing Skeleton Aesthetics**: No "Institutional" standard for loading states (spinners/skeletons) across the Dapp.
17. **Haptic Syncing**: Visual tactile feedback is implemented, but there's no bridge for Haptic Feedback (Web Vibrations) on supporting mobile devices.
18. **Data-Theme Inheritance**: Shared components lack a robust strategy for handling nested `data-theme` overrides (e.g., a Dark card in a Light dashboard).
19. **Global "Clean" Tooling**: No easy-to-use root script for developers to clear `.next` caches when monorepo HMR stalls.
20. **Typography Utility Overload**: CSS modules are duplicating massive font-size declarations instead of using shared typography tokens.
21. **Launch-Critical Countdown**: The V6 hero currently lacks the `CountdownTimer` logic present in production, risking launch-date transparency.
22. **Auth-State Desynchronization**: V6 is a static preview and lacks the `isDetermining` and `authLoading` states required to prevent UI flickering during session check.
23. **Partner Trust Signals**: The "POWERED BY //" ecosystem banner (Solana, Base, etc.) is missing, potentially reducing user trust in institutional authority.
24. **Dynamic Config Injection**: Unlike legacy, V6 does not consume `config?.platformName` or `config?.docsUrl` from the Admin Portal.
25. **Mission Rotation Narrative**: The legacy 10-second mission loop is replaced by a static string in V6; needs a consensus on whether rotation improves or dilutes conversion.
26. **SEO Metadata Fragmentation**: Legacy pages utilize Next.js SEO metadata; V6 is currently a client-only component with no `generateMetadata` parity.
27. **Radial Progress Sizing**: The V6 radial progress is an aesthetic preview; it lacks the legacy logic for `RESERVE_ALLOCATED` data-binding.
28. **Navbar Content Collision**: The V6 header is fixed-height (100px); the legacy mobile navbar is more compact (60px), which may affect "above-the-fold" content on smaller devices.
29. **Modal Component Parity**: `OnboardingModal` and `AuthModal` are not integrated into the V6 layout, creating a "dead-end" for user conversion in the preview.
30. **Legacy CSS Pollution**: V6 currently runs alongside legacy `globals.css` which may cause unexpected priority conflicts during the "Super Scale" rollout.

## 1. Phase 1: Variable Centralization
**Goal**: Create a single source of truth for design tokens.

### [Component] [packages/ui](file:///Users/mac/Trenches%20-%20Spray%20and%20Play/packages/ui)
- **NEW**: Create `packages/ui/src/styles/tokens.css` containing CSS variables for colors, typography, **responsive breakpoints**, and **Z-Index layers**.
- **NEW**: Create `packages/ui/src/providers/ThemeProvider.tsx` to handle persistent dark/light state across the monorepo.
- **NEW**: Create `packages/ui/src/config/animations.ts` containing the standard Framer Motion `spring` and `transition` presets.
- Update `package.json` to export these tokens for consumption by `apps/landing` and `apps/dapp`.

## 2. Phase 2: Component Modernization
**Goal**: Ensure shared components adhere to the new standards.

### [Component] [packages/ui/src/components](file:///Users/mac/Trenches%20-%20Spray%20and%20Play/packages/ui/src/components)
- **Logo**: Update to support "Super Scale" rendering (weight 950, letter-spacing -0.5px).
- **NEW: ScaleButton**: A unified button component with `whileTap` support and variants (Hero, Meta, Tier).
- **NEW: ScaleIcon**: A wrapper for `lucide-react` that enforces standard stroke-width (1.5px) and Zenith Green integration.
- **NEW: ScrollSnapLayout**: Modularize the 6-page narrative flow for use in the Dapp profile/onboarding.
- **TrenchCards**: Standardize typography across all trench levels (Rapid, Mid, Deep) to match V5 density.
- **Safe Area Wrappers**: Create a shared `MobileSafeArea` component to manage `env(safe-area-inset-*)` globally.

## 3. Phase 3: Landing Page Rollout
**Goal**: Replace legacy CSS in `apps/landing` with the new universal tokens.

### [Component] [apps/landing](file:///Users/mac/Trenches%20-%20Spray%20and%20Play/apps/landing)
- **Global CSS**: Import `token.css` in `src/app/globals.css`.
- **Hero Sections**: Refactor V1-V4 heroes to use the V5 `H1` scale (8.5rem Desktop / 3.5rem Mobile).
- **Navigation**: Update the main navigation bar to use the breathing room padding established in V5.

## 4. Phase 4: Dapp Integration
**Goal**: Bring institutional authority to the active trading experience.

### [Component] [apps/dapp](file:///Users/mac/Trenches%20-%20Spray%20and%20Play/apps/dapp)
- **Dashboard Refresh**: Update the main trading dashboard to use the Zenith Green accent and Super Scale headings.
- **Mobile Experience**: Implement `scroll-snap-type` on the main dapp views to replicate the 6-page narrative feel of the lab.

## Verification Plan

### Automated Tests
- Audit all pages for underscore terminology using a platform-wide `grep`.
- Verify CSS variable propagation using `browser_subagent`.

### Manual Quality Assurance
- Cross-device testing (PC, Tablet, iPhone, Android) to ensure "Super Scale" scaling is perfect everywhere.
- Interaction audit to confirm every primary button provides tactile haptic-style feedback.
