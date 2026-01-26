# BMAD Integration Workflow

> **Status**: Active
> 
> **Purpose**: Guide for using BMAD as systems auditor/co-architect for existing Trenches app

## Mindset Shift

Since `trenches-web.vercel.app` already exists:

❌ **Don't** ask BMAD to "build Trenches"
✅ **Do** use BMAD to:
- Extract implicit logic from your UI
- Formalize rules you already assumed
- Identify missing constraints, edge cases, and risks
- Incrementally replace mocks with real systems

**BMAD is now your systems auditor + co-architect, not a designer.**

## Phase 1: Audit Existing UI

### Step 1: Run UI Audit

In Cursor chat, paste:

```
BMAD: Open the deployed UI at https://trenches-web.vercel.app

Infer:
1. Core features currently implied by the UI
2. Assumptions the UI makes about backend behavior
3. What parts are purely visual vs logical
4. What is missing for this to be a real non-custodial system

Do NOT propose redesigns yet.
This is an audit.

Output results to docs/existing_ui_audit.md
```

### Step 2: Map UI to Systems

After audit completes, run:

```
BMAD: Using docs/existing_ui_audit.md,
map each visible UI section to:

- required backend logic
- required on-chain data
- off-chain indexing needs

Output as a table.
No code.
```

## Phase 2: Replace Mocks Layer by Layer

### Layer 1 — Read-only truth (SAFE)

```
BMAD: Implement read-only HyperEVM transaction detection
for BLT transfers relevant to Trenches.

No writes.
No custody.
Indexing only.

Deploy this before payouts.
```

### Layer 2 — Enforcement logic (still safe)

```
BMAD: Add server-side enforcement for:
- payment timeout
- max ROI caps
- round expiry

Assume wallet-to-wallet payments already occurred.
```

### Layer 3 — Social + reputation (last)

Only after money logic is stable:

```
BMAD: Design belief score and boost calculation
based on verified actions and time.
No speculation incentives.

Reference: docs/social_contribution_system.md
```

## Phase 3: Social Contribution System

### Step 1 — Spec only

```
BMAD: Using docs/social_contribution_system.md,
design the full social contribution and review system.

Include:
- data models
- scoring rules
- decay mechanics
- abuse prevention

No UI.
No code.
```

### Step 2 — Backend first

```
BMAD: Implement backend APIs for:
- content submission
- review logging
- endorsement aggregation
- belief point calculation

Assume frontend already exists.
```

### Step 3 — UI integration

```
BMAD: Integrate content review feed
into the existing queue waiting screen.

Do not redesign layout.
Add only required components.
```

## What NOT to Let BMAD Do

🚫 "Optimize payouts"
🚫 "Increase engagement loops"
🚫 "Gamify earnings"
🚫 "Auto-compound by default"

Those are how projects accidentally cross lines.

## Critical Constraints

Always reference:
- `docs/non_negotiables.md` - These are LAW
- `docs/social_contribution_system.md` - Formal definitions

BMAD must reject any design violating non-negotiables.

## Reality Check

Most people:
- Install BMAD with no product
- Ask it to hallucinate a system
- Ship something incoherent

You:
- Built a real interface
- Defined a philosophy
- Now want to harden it

**That's the correct order.**
