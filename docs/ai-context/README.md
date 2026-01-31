# 🤖 AI Context Folder

> **Purpose:** Local-only documentation for AI assistants and debugging  
> **Status:** Gitignored - Not tracked in GitHub  
> **Last Updated:** 2026-01-31

---

## ⚠️ IMPORTANT

**This folder and all its contents are Gitignored.**

These files are:
- ❌ **NOT** tracked in GitHub
- ❌ **NOT** shared with the team
- ✅ **Local-only** session context
- ✅ **Safe to delete** anytime

---

## 📁 Subfolder Structure

```
ai-context/
├── README.md              ← This file
├── memory/                ← AI session memory files
├── debugging/             ← Debugging guides & investigations
└── completed/             ← Completed implementation artifacts
```

---

## 🧠 memory/

**Purpose:** AI assistant session memory and context

**Files:**
- `AGENT_MEMORY.md` - Main agent context (session tracking, decisions)
- `DIDI_MEMORY.md` - Didi's AI context
- `KIMI-LEAD-DEV_MEMORY.md` - Kimi's context as lead dev
- `MARKETING_LEAD_MEMORY.md` - Marketing lead AI context
- `MOLLY_MEMORY_DOC.md` - Molly's AI context
- `TBO_MEMORY.md` - TBO AI context

**Update Frequency:** Every session  
**Retention:** Keep last 5-10 sessions, archive old ones  
**Owner:** Individual AI assistant

---

## 🐛 debugging/

**Purpose:** One-time debugging guides and investigations

**Files:**
- `AUTH_ISSUE_DIAGNOSIS_AND_FIX.md` - Authentication troubleshooting
- `DEBUG_GUIDE_FOR_DUDU.md` - Debugging guide for Dudu
- `PERFORMANCE_FIX_*` - Performance optimization guides
- `SLOW_PERFORMANCE_INVESTIGATION.md` - Performance investigation
- etc.

**Update Frequency:** Once per issue  
**Retention:** Archive after 30 days, delete after 90 days  
**Owner:** Issue resolver

---

## ✅ completed/

**Purpose:** Archived implementation artifacts

**Files:**
- `IMPLEMENTATION_*.md` - Implementation plans
- `LAYER1_*.md` - Layer 1 setup documentation
- `LIGHTHOUSE_*.md` - Lighthouse audit reports
- `PLATFORM_ANALYSIS.md` - Platform analysis reports
- `TBO_COMPLETION_REPORT.md` - Completed work reports
- etc.

**Update Frequency:** Never (read-only archive)  
**Retention:** Keep for 6 months, then delete  
**Owner:** Project / No owner

---

## 🔄 Document Lifecycle

```
NEW DOCUMENT
     │
     ▼
┌─────────────────┐
│ What type?      │
└────────┬────────┘
         │
    ┌────┼────┬────────────┐
    │    │    │            │
    ▼    ▼    ▼            ▼
 Memory Debug Complete   Other
    │    │    │            │
    ▼    ▼    ▼            ▼
memory/ debugging/ completed/  (don't create)
    │    │    │
    └────┴────┘
         │
         ▼
   [Time passes]
         │
         ▼
┌─────────────────┐
│ Archive/Delete  │
└─────────────────┘
```

---

## 📝 For AI Assistants

### When to Update Files

**Update your memory file when:**
- ✅ Session ends with significant work
- ✅ Architecture decisions made
- ✅ New patterns established
- ✅ Issues encountered and resolved

**Create debugging docs when:**
- ✅ Complex issue requires deep investigation
- ✅ Solution not obvious from code
- ✅ Other devs might encounter same issue

**Move to completed when:**
- ✅ Implementation finished
- ✅ Task/issue fully resolved
- ✅ No longer actively referenced

### File Template (Memory)

```markdown
# [Name] Memory Document

> **Role:** [Your Role]  
> **Last Updated:** [Date]

## Current Session
- [Summary of work done]
- [Decisions made]
- [Issues encountered]

## Active Context
- [Current priorities]
- [Blockers if any]
- [Next steps]

## Key Decisions
| Date | Decision | Context |
|------|----------|---------|
| [Date] | [What] | [Why] |

## Notes
[Anything else important]
```

---

## 🗑️ Cleanup Schedule

**Recommended cleanup every 30 days:**

| Folder | Action | Timeline |
|--------|--------|----------|
| `memory/` | Archive old sessions | Keep last 10 |
| `debugging/` | Delete resolved issues | After 90 days |
| `completed/` | Delete old artifacts | After 6 months |

---

## 🔗 Quick Links

- **Main Docs:** `../README.md`
- **Core Docs:** `../` (parent folder)
- **Certification:** `../CERTIFICATION_CHECKLIST.md`

---

**Remember:** These files are local-only. Don't put critical info here that the team needs!

---

*This folder is gitignored. Contents are not shared.*
