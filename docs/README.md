# 📚 Trenches Documentation

> **Purpose:** Central knowledge base for the Trenches project  
> **Last Updated:** 2026-01-31  
> **Maintained by:** Lead Dev

---

## 📁 Folder Structure

```
docs/
├── README.md                    ← You are here
├── ai-context/                  ← Local-only (gitignored)
│   ├── memory/                  ← AI session memory files
│   ├── debugging/               ← Debugging guides & investigations
│   └── completed/               ← Completed implementation artifacts
│
├── [Core Project Docs]          ← GitHub tracked (see list below)
├── [Technical Specs]            ← GitHub tracked (see list below)
└── ai-context/                  ← Local-only (see ai-context/README.md)
    └── TRENCHES_BUSINESS_MODEL.md  ← Internal business model (confidential)
```

---

## 🗂️ Document Categories

### ✅ Tracked in GitHub (Core Team Docs)

These documents are essential for the team and kept in version control:

| Document | Purpose | Audience |
|----------|---------|----------|
| **BRAND_GUIDELINES.md** | Brand voice, tone, visual standards | Marketing, Design, Dev |
| **JOB_DESCRIPTIONS.md** | Role definitions, hiring priorities | Leadership, HR |
| **COMPLIANT_COPY_LIBRARY.md** | Approved copy, compliance rules | Marketing, Content |
| **CERTIFICATION_CHECKLIST.md** | Code review & certification process | Engineering |
| **CERTIFICATION_QUICKREF.md** | Quick certification reference | Engineering |
| **POSTGRESQL_SETUP.md** | Database setup instructions | DevOps, Backend Dev |
| **PLATFORM_DOCUMENTATION.md** | Architecture & system design | Engineering |
| **QUICK_START.md** | New developer onboarding | New Team Members |
| **non_negotiables.md** | Project principles & constraints | All Team Members |
| **INVESTOR_AND_USER_PITCHES.md** | Pitch decks & presentations | Leadership, BD |
| **BMAD_WORKFLOW.md** | Build-Measure-Analyze-Deploy workflow | Engineering |
| **VOICE_TONE_DECISION_TREE.md** | Content style guide | Marketing, Content |
| **social_contribution_system.md** | Social features specification | Product, Engineering |
| **ui_to_systems_mapping.md** | UI component architecture | Engineering |
| **existing_ui_audit.md** | Current UI assessment | Design, Engineering |

### ❌ Local Only (Gitignored)

These files are **NOT** tracked in GitHub. They live in `docs/ai-context/`:

#### `ai-context/memory/` - AI Session Memory
Session-specific context for AI assistants. Gets updated frequently, causes merge conflicts.

- `AGENT_MEMORY.md` - Main agent context (session tracking)
- `DIDI_MEMORY.md` - Didi's AI context
- `KIMI-LEAD-DEV_MEMORY.md` - Kimi's context as lead dev
- `MARKETING_LEAD_MEMORY.md` - Marketing lead AI context
- `MOLLY_MEMORY_DOC.md` - Molly's AI context
- `TBO_MEMORY.md` - TBO AI context

#### `ai-context/debugging/` - Debugging & Investigations
One-time troubleshooting guides. Gets stale quickly, reference as needed.

- `AUTH_ISSUE_DIAGNOSIS_AND_FIX.md` - Authentication troubleshooting
- `AUTH_ISSUE_STATUS.md` - Auth issue tracking
- `DEBUG_GUIDE_FOR_DUDU.md` - Debugging guide for Dudu
- `DEPOSIT_SYSTEM_ANALYSIS.md` - Deposit system deep dive
- `DUDU_CHECKLIST.md` - Task checklist for Dudu
- `DUDU_PERFORMANCE_EMERGENCY.md` - Performance emergency guide
- `PERFORMANCE_FIX_*` - Performance optimization guides
- `SLOW_PERFORMANCE_INVESTIGATION.md` - Performance investigation

#### `ai-context/completed/` - Completed Work
Implementation artifacts from finished work. Archived for reference.

- `IMPLEMENTATION_*.md` - Implementation plans
- `LAYER1_*.md` - Layer 1 setup documentation
- `TBO_COMPLETION_REPORT.md` - TBO work completion
- `TASK_*.md` - Assigned task documentation
- `LIGHTHOUSE_*.md` - Lighthouse audit reports
- `PLATFORM_ANALYSIS.md` - Platform analysis reports
- `VERIFICATION_*.md` - Verification reports
- `AI_UGC_TIKTOK_SYSTEM.md` - TikTok system spec (completed)

---

## 🔄 Document Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  NEW DOCUMENT CREATED                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  IS IT SESSION-SPECIFIC?                                    │
│  (AI memory, debugging, one-time investigation)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │ YES                   │ NO
          ▼                       ▼
┌─────────────────┐    ┌──────────────────────────────┐
│ ai-context/     │    │ IS IT CORE PROJECT DOC?      │
│ (gitignored)    │    │ (Brand, jobs, specs, guides) │
└─────────────────┘    └───────────┬──────────────────┘
                                   │
                       ┌───────────┴───────────┐
                       │ YES                   │ NO
                       ▼                       ▼
             ┌─────────────────┐    ┌─────────────────┐
             │ docs/           │    │ docs/archive/   │
             │ (github)        │    │ (gitignored)    │
             └─────────────────┘    └─────────────────┘
```

---

## 📝 Adding New Documents

### Decision Tree

```
Is this document...
│
├─ Session-specific AI context? → ai-context/memory/
├─ Debugging/investigation? → ai-context/debugging/
├─ Completed work artifact? → ai-context/completed/
│
├─ Core project documentation?
│  ├─ Brand/Design? → docs/ (tracked)
│  ├─ Technical specs? → docs/ (tracked)
│  ├─ Process guides? → docs/ (tracked)
│  └─ Onboarding? → docs/ (tracked)
│
└─ Temporary/throwaway? → Don't commit, keep local
```

### Quick Checklist

Before adding a document to GitHub:

- [ ] Is this useful to the **entire team**?
- [ ] Will this remain **relevant** for >1 month?
- [ ] Is this **not** session-specific debugging?
- [ ] Does this follow the **naming convention**?

---

## 🏷️ Naming Conventions

### Core Docs (GitHub)
- `UPPER_SNAKE_CASE.md` for primary docs
- Descriptive names: `BRAND_GUIDELINES.md`, `POSTGRESQL_SETUP.md`

### AI Context (Local)
- `*_MEMORY.md` for AI session memory
- `*_DIAGNOSIS.md` for debugging
- `*_STATUS.md` for tracking
- `*_COMPLETION_*.md` for finished work

### Debugging (Local)
- `DEBUG_*.md` for debugging guides
- `*_EMERGENCY.md` for hotfix guides
- `*_INVESTIGATION.md` for deep dives

---

## 🚀 For AI Assistants

When working with documentation:

1. **Check `docs/README.md`** first (this file)
2. **Read relevant core docs** from tracked list
3. **Check `ai-context/memory/`** for session context
4. **Reference `ai-context/debugging/`** for troubleshooting
5. **Update `AGENT_MEMORY.md`** at end of session

**Never modify:**
- Documents in other team members' memory folders
- Completed work artifacts (archive only)

**Always update:**
- Your own memory file after significant work
- Core docs if architectural changes made

---

## 📊 Document Statistics

| Category | Count | Location | GitHub? |
|----------|-------|----------|---------|
| Core Project Docs | ~15 | `docs/` | ✅ Yes |
| AI Memory | ~6 | `ai-context/memory/` | ❌ No |
| Debugging | ~10 | `ai-context/debugging/` | ❌ No |
| Completed Work | ~15 | `ai-context/completed/` | ❌ No |

**Total Size:** ~560KB → ~150KB in GitHub (after filtering)

---

## 🔒 Gitignore Rules

See root `.gitignore` for complete rules:

```gitignore
# AI Session Memory (ephemeral)
docs/*_MEMORY.md
docs/AGENT_MEMORY.md
docs/DUDU_*.md
docs/DIDI_*.md
...

# Temporary/Debugging (one-time)
docs/*_DIAGNOSIS*.md
docs/*_DEBUG*.md
docs/*_EMERGENCY*.md
...

# Exceptions (keep in GitHub)
!docs/README.md
!docs/BRAND_GUIDELINES.md
!docs/JOB_DESCRIPTIONS.md
...
```

---

## ❓ FAQ

**Q: Why are AI memory files gitignored?**  
A: They update every session, cause merge conflicts, and contain temporary context that gets stale quickly.

**Q: What if I need to share a debugging guide?**  
A: Move it from `ai-context/debugging/` to `docs/` and update `.gitignore` exception.

**Q: Who maintains this structure?**  
A: Lead Dev owns the docs structure. Update this README when adding new categories.

**Q: Can I delete old files in ai-context/?**  
A: Yes, files in `ai-context/` are safe to delete. They're local-only backups.

---

**Questions?** Ask the Lead Dev or check `CERTIFICATION_CHECKLIST.md` for process questions.

---

*Last updated: 2026-01-31 by Kimi*
