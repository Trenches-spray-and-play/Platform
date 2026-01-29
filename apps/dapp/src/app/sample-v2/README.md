# Trenches Frontend Sample v2.0

A modern, user-friendly frontend redesign for the Trenches "Spray & Play" coordination protocol.

## 🎯 Design Philosophy

This sample demonstrates a cleaner, more approachable UI while maintaining the tactical/military aesthetic of the original design. Key improvements:

- **Better Visual Hierarchy**: Clear distinction between sections and actions
- **Improved Typography**: Better readability with Inter font and consistent spacing
- **Enhanced Accessibility**: Better contrast ratios, focus states, and keyboard navigation
- **Mobile-First**: Responsive design that works seamlessly on all devices
- **Micro-interactions**: Subtle animations and hover states for better feedback

## 📁 Structure

```
sample-new/
├── globals.css              # Design system tokens and global styles
├── components/
│   ├── Layout.tsx          # Main layout with header, nav, footer
│   ├── Layout.module.css   # Layout styles
│   ├── CampaignCard.tsx    # Campaign preview card
│   └── CampaignCard.module.css
├── page.tsx                # Home page (Campaigns listing)
├── page.module.css
├── dashboard/
│   ├── page.tsx            # User dashboard
│   └── page.module.css
├── campaign/[id]/
│   ├── page.tsx            # Campaign detail page
│   └── page.module.css
└── earn/
    ├── page.tsx            # Earn BP page (tasks & raids)
    └── page.module.css
```

## 🎨 Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0b` | Main background |
| `--bg-secondary` | `#111113` | Card backgrounds |
| `--accent-primary` | `#22c55e` | Primary actions, highlights |
| `--accent-rapid` | `#22c55e` | Rapid trench accent |
| `--accent-mid` | `#e4e4e7` | Mid trench accent |
| `--accent-deep` | `#fbbf24` | Deep trench accent |

### Typography

- **Primary Font**: Inter (weights: 300, 400, 500, 600, 700, 800, 900)
- **Monospace Font**: JetBrains Mono (for numbers, codes, technical text)

### Spacing

Based on 4px grid: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

## 🚀 Pages

### 1. Home (Campaigns Listing)

**URL**: `/sample-new`

Features:
- Hero section with live stats
- Campaign cards with hover effects
- Filter tabs (All, Rapid, Mid, Deep)
- "How It Works" explanation

### 2. Dashboard

**URL**: `/sample-new/dashboard`

Features:
- Stats header (Belief Score, Boost Points, Balance, Referrals)
- Referral banner with copy button
- Active positions grid
- History tab for completed positions
- Quick action cards

### 3. Campaign Detail

**URL**: `/sample-new/campaign/[id]`

Features:
- Campaign info header with badges
- Stats grid (ROI, Wait Time, Reserves, Participants)
- About section with feature list
- Entry requirements
- Deposit form with calculation preview
- Confirmation modal

### 4. Earn

**URL**: `/sample-new/earn`

Features:
- Tab switcher (Tasks / Raids)
- One-time and Recurring task sections
- Raid list with quick actions
- BP reward indicators

## 🔌 API Integration

The frontend connects to existing backend APIs:

```
GET  /api/trenches          - List campaigns grouped by trench
GET  /api/user              - User profile data
GET  /api/user/positions    - User's campaign positions
GET  /api/tasks             - Available tasks
GET  /api/raids             - Active raids
POST /api/spray             - Deposit into campaign
```

## 🎭 Key UX Improvements

1. **Reduced Cognitive Load**: Cleaner layouts with better whitespace
2. **Clear CTAs**: Primary actions stand out with green accent color
3. **Progressive Disclosure**: Information revealed as needed
4. **Feedback Loops**: Loading states, hover effects, success confirmations
5. **Consistent Navigation**: Fixed header with clear active states

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

## 🛠️ Usage

To view the sample:

1. Start the development server:
   ```bash
   npm run dev:dapp
   ```

2. Navigate to `http://localhost:3000/sample-new`

## 🔄 Migration Guide

To integrate these designs into the main app:

1. Copy `globals.css` styles to the main `globals.css`
2. Replace or enhance existing components
3. Update route handlers if needed
4. Test all API integrations

## 🎨 Customization

### Changing Colors

Edit CSS variables in `globals.css`:

```css
:root {
  --accent-primary: #your-color;
  --accent-rapid: #your-color;
  /* etc */
}
```

### Adding New Pages

1. Create folder in `sample-new/`
2. Add `page.tsx` and `page.module.css`
3. Use `<Layout>` wrapper
4. Follow existing component patterns

## ♿ Accessibility

- All interactive elements are keyboard accessible
- Focus visible states for navigation
- Proper heading hierarchy
- ARIA labels where needed
- Reduced motion support via `prefers-reduced-motion`

## 📝 Notes

- This is a sample/POC implementation
- Some features (like actual deposit) are mocked
- Real implementation would need proper error handling
- Consider adding loading skeletons for better UX
