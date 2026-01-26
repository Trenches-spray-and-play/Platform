# Quick Start: BMAD Integration

## Your Next 2 Actions

### 1. Create UI Audit

File already created: `docs/existing_ui_audit.md`

### 2. Run Audit Prompt in Cursor

Copy and paste this into Cursor chat:

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

## Key Files Reference

- `docs/non_negotiables.md` - **LAW** (cannot be violated)
- `docs/social_contribution_system.md` - Formal system definition
- `docs/existing_ui_audit.md` - Audit results (to be populated)
- `docs/BMAD_WORKFLOW.md` - Full workflow guide

## Critical Reminder

BMAD is your **systems auditor + co-architect**, not a designer.

You have:
- ✅ Real interface (trenches-web.vercel.app)
- ✅ Defined philosophy (non_negotiables.md)
- ✅ Formal system definition (social_contribution_system.md)

Now: **Harden it, don't rebuild it.**
