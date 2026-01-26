# Social Contribution System

> **Status**: Formal Definition
> 
> **Purpose**: Define how belief is earned and reflected in access, not payouts

## Core Principle

Social Contributions are off-chain belief signals used to weight access and priority inside Trenches.

**They do not guarantee payouts.**
**They do not create yield.**
**They do not mint tokens.**

## What Users Actually Earn

- **Belief Points (BP)** → affects:
  - queue priority
  - overtaking ability
  - maximum allowed entry size
- **Boost Points (temporary)** → affects:
  - speed inside a queue
  - visibility while waiting

**They do not earn guaranteed payouts.**

## Contribution Types

- Original content (threads, videos, articles)
- Educational explanations
- Campaign-related narratives
- Testimonials (wins or losses)

## Submission Flow

- User submits a content link (X, Telegram, YouTube, Medium, etc.)
- Content is stored in a public archive
- Content enters a review pool

## Review Mechanism

While waiting in queue, users can:
- Browse submitted content
- Review as much as they want
- Each review requires:
  - opening the link
  - interacting (like, reply, repost, comment)
  - submitting proof (link / interaction ID)

This creates forced human friction.

## Endorsement Logic

Reviews generate:
- **Review Points** (temporary boosts)

Endorsements generate:
- **Belief Points** (permanent, slow)

Belief Points are only added when:
- Content receives endorsement from multiple distinct users
- Reviewers themselves have non-zero belief score
- Endorsements are time-distributed (not instant)

This prevents:
- self-review loops
- bot rings
- "content spam"

## How This Affects the Queue

Belief Points increase:
- Max spray size per trench
- Ability to enter deeper trenches
- Queue overtaking weight

Boost Points:
- Temporarily move users forward
- Decay over time
- Cannot exceed hard caps

**So: Good contributors move faster but still respect caps**

## What Users See in the UI

While waiting for payout, users see:
- "Content Review Feed"
- Each item shows:
  - author
  - belief score
  - endorsements count
  - required interaction

Buttons:
- "Open content"
- "Submit interaction proof"
- "Endorse / Skip"

This keeps users active without promising money.

## Abuse Controls

Hard rules:
- You cannot review your own content
- Same reviewer cannot endorse the same author repeatedly
- Review limits scale with belief score
- Low-belief accounts have capped influence
- All points are reversible if abuse is detected

## Critical Warning

**If you frame this as:**
> "Do tasks → get paid faster"

**You'll destroy:**
- trust
- legal safety
- belief purity

**If you frame it as:**
> "Belief is earned socially and reflected in access"

**You're building something new.**

## Implementation Order

1. **Spec only** - Design the full system (data models, scoring rules, decay mechanics, abuse prevention). No UI. No code.
2. **Backend first** - Implement APIs for content submission, review logging, endorsement aggregation, belief point calculation. Assume frontend already exists.
3. **UI integration** - Integrate content review feed into existing queue waiting screen. Do not redesign layout. Add only required components.
