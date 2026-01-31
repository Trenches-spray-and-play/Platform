# Lead Dev Implementation Brief: "3 Trenches. Infinite Projects."

> **Document Type:** Technical Implementation Guide  
> **For:** Lead Dev  
> **Date:** 2026-01-31  
> **Priority:** 🚨 HIGH

---

## 1. EXECUTIVE SUMMARY

Replace all instances of the current headline/tagline with:

```
3 Trenches. Infinite Projects.
```

**Scope:** Website, meta tags, email templates, component defaults  
**Timeline:** 4 weeks (Week 4 = all materials ready)  
**Priority Order:** Website > Meta > Components > Email

---

## 2. FILE INVENTORY

### 2.1 Website Files to Update

```
apps/web/
├── app/
│   ├── page.tsx                    # Hero headline
│   ├── layout.tsx                  # Default metadata
│   ├── about/page.tsx              # Page metadata
│   ├── features/page.tsx           # Page metadata
│   └── ...                         # All page metadata
├── components/
│   ├── Hero.tsx                    # Default headline prop
│   ├── SEOHead.tsx                 # Title template
│   └── Footer.tsx                  # Any brand mentions
└── lib/
    └── metadata.ts                 # Centralized metadata config
```

### 2.2 Email Templates

```
packages/email/
├── templates/
│   ├── welcome.tsx
│   ├── referral.tsx
│   ├── milestone.tsx
│   └── newsletter.tsx
└── components/
    └── Header.tsx                  # Email header branding
```

### 2.3 Configuration Files

```
├── site.config.ts                  # Site name/tagline constants
├── next-seo.config.ts              # Default SEO configuration
└── sitemap.config.js               # Sitemap titles
```

---

## 3. IMPLEMENTATION CHECKLIST

### Week 1: Website Headlines + Meta

```
□ Update Hero component default headline
  File: components/Hero.tsx
  Change: headline prop default value

□ Update layout.tsx metadata
  File: app/layout.tsx
  Change: title, description, openGraph, twitter

□ Update all page-specific metadata
  Files: app/*/page.tsx
  Change: generateMetadata() functions

□ Update site.config.ts constants
  File: site.config.ts
  Change: SITE_NAME, SITE_TAGLINE constants

□ Update next-seo.config.ts
  File: next-seo.config.ts
  Change: defaultTitle, titleTemplate

□ Test: Run npm run build && npm run compliance:check
```

### Week 2: Components + Templates

```
□ Update SEOHead component
  File: components/SEOHead.tsx
  Change: Default title template

□ Update Footer component
  File: components/Footer.tsx
  Change: Any hardcoded brand references

□ Update Navigation
  File: components/Navigation.tsx
  Change: Logo alt text, aria-labels

□ Update Error Pages
  Files: app/error.tsx, app/not-found.tsx
  Change: Metadata and copy

□ Test: Visual regression testing
```

### Week 3: Email Templates

```
□ Update Welcome Email
  File: templates/welcome.tsx
  Change: Subject line, header, body copy

□ Update Referral Email
  File: templates/referral.tsx
  Change: Subject line, header, body copy

□ Update Milestone Email
  File: templates/milestone.tsx
  Change: Subject line, header, body copy

□ Update Newsletter Template
  File: templates/newsletter.tsx
  Change: Header, consistent references

□ Update Email Header Component
  File: components/Header.tsx
  Change: Branding text

□ Test: Send test emails, verify rendering
```

### Week 4: QA + Launch

```
□ Update sitemap.xml generation
  File: sitemap.config.js or next-sitemap.config.js
  Change: Site name references

□ Update robots.txt if needed
  File: app/robots.ts or public/robots.txt

□ Run full SEO audit
  Tool: Lighthouse, ahrefs, or SEMrush

□ Cross-browser testing
  Browsers: Chrome, Firefox, Safari, Edge

□ Mobile testing
  Devices: iOS Safari, Android Chrome

□ Compliance check
  Command: npm run compliance:check

□ Deploy to staging
□ Final review with Marketing Lead
□ Deploy to production
```

---

## 4. CODE EXAMPLES

### 4.1 Hero Component

```tsx
// Before
interface HeroProps {
  headline?: string;
}

const defaultHeadline = "Turn Belief into Profit";

// After
interface HeroProps {
  headline?: string;
}

const defaultHeadline = "3 Trenches. Infinite Projects.";
```

### 4.2 Metadata Configuration

```tsx
// Before
export const metadata = {
  title: "Trenches — Turn Belief into Profit",
  description: "...",
};

// After
export const metadata = {
  title: "3 Trenches. Infinite Projects.",
  description: "3 Trenches. Infinite Projects. Turn your belief into profit with the leading crypto belief coordination platform.",
  openGraph: {
    title: "3 Trenches. Infinite Projects.",
    // ...
  },
  twitter: {
    title: "3 Trenches. Infinite Projects.",
    // ...
  },
};
```

### 4.3 Site Config

```ts
// site.config.ts
export const SITE_CONFIG = {
  name: "Trenches",
  headline: "3 Trenches. Infinite Projects.",
  tagline: "Turn Belief into Profit",
  description: "3 Trenches. Infinite Projects. The belief coordination platform for crypto projects and users.",
  // ...
};
```

---

## 5. TESTING PROTOCOL

### 5.1 Pre-Deploy Checklist

```bash
# 1. Build verification
npm run build

# 2. Compliance check
npm run compliance:check

# 3. Lint check
npm run lint

# 4. Type check
npm run type-check
```

### 5.2 Post-Deploy Verification

```
□ Homepage displays correct headline
□ Browser tab shows correct title
□ View source shows correct meta tags
□ Social share preview (Facebook Debugger)
□ Twitter Card Validator
□ All internal pages have updated titles
□ Email templates render correctly
```

---

## 6. ESCALATION CONTACTS

| Issue Type | Contact |
|------------|---------|
| Technical blockers | Marketing Lead |
| Content questions | Marketing Lead |
| Approval needed | TBO |
| Timeline changes | Marketing Lead + TBO |

---

## 7. ROLLBACK PLAN

If critical issues arise:

1. **Immediate:** Revert to previous commit
2. **Communicate:** Notify Marketing Lead within 15 minutes
3. **Document:** Log the issue and resolution
4. **Review:** Schedule post-mortem within 24 hours

---

**Questions?** Escalate immediately. This is a TBO-approved rebrand with Week 4 hard deadline.

**Last Updated:** 2026-01-31
