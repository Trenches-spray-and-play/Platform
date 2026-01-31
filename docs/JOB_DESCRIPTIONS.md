# Trenches Job Descriptions

> **Version:** 1.0  
> **Last Updated:** 2026-01-30  
> **Status:** Hiring Ready

---

## Table of Contents

1. [Smart Contract Security Engineer](#1-smart-contract-security-engineer)
2. [DevOps / Infrastructure Engineer](#2-devops--infrastructure-engineer)
3. [Senior QA / Automation Engineer](#3-senior-qa--automation-engineer)
4. [Product Designer (UI/UX)](#4-product-designer-uiux)
5. [Head of Customer Success](#5-head-of-customer-success)
6. [Business Development Lead](#6-business-development-lead)
7. [Data Engineer / Analytics Lead](#7-data-engineer--analytics-lead)
8. [Community Manager](#8-community-manager)
9. [Legal / Compliance Officer](#9-legal--compliance-officer)
10. [Platform Engineer (Performance)](#10-platform-engineer-performance)

---

## 1. Smart Contract Security Engineer

**Department:** Engineering  
**Reports To:** CTO / Lead Dev  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $140K - $200K + Token Allocation

### About the Role

Trenches is a belief coordination platform handling millions in user deposits across multiple blockchains. We're looking for a Smart Contract Security Engineer to ensure our payout mechanics, oracle integrations, and reserve management are bulletproof. This role is mission-critical—one exploit could be catastrophic.

### Key Responsibilities

**Audit & Review**
- Conduct internal audits of all smart contracts before deployment
- Review and validate oracle price feed integrations
- Audit payout queue logic and reserve calculations
- Perform threat modeling for economic attack vectors (flash loans, oracle manipulation, front-running)

**Security Infrastructure**
- Implement emergency pause mechanisms with multi-sig governance
- Design and maintain incident response procedures
- Set up automated security monitoring (Forta bots, Tenderly alerts)
- Establish bug bounty program coordination

**Process & Standards**
- Define secure development lifecycle (SDLC) standards
- Conduct security training for engineering team
- Review all contract upgrades and parameter changes
- Maintain security documentation and runbooks

**On-Call & Response**
- Participate in security incident response (24/7 on-call rotation)
- Execute emergency procedures when vulnerabilities are detected
- Coordinate with external auditors for major releases

### Required Qualifications

- 4+ years in smart contract security or blockchain development
- Deep expertise in Solidity and EVM security patterns
- Experience with formal verification tools (Certora, Manticore) or fuzzing (Echidna)
- Proven track record: audited contracts with $100M+ TVL
- Understanding of DeFi economic attack vectors (MEV, oracle manipulation, sandwich attacks)
- Experience with multi-chain deployments (EVM chains + Solana preferred)

### Preferred Qualifications

- Published security research or audit reports
- Experience with HyperEVM or Solana development
- Background in traditional finance or trading systems
- Contributions to open-source security tools
- Certifications: OSWE, CEH, or equivalent

### What Success Looks Like

- Zero critical vulnerabilities in production contracts
- <2 hour response time for security incidents
- Completion of internal audit within 48 hours of contract freeze
- Successful external audits with no critical findings

---

## 2. DevOps / Infrastructure Engineer

**Department:** Engineering  
**Reports To:** CTO / Product Senior Engineer  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $120K - $170K + Token Allocation

### About the Role

Our platform operates across HyperEVM, Ethereum, Base, Arbitrum, and Solana—handling real-time payouts, oracle price feeds, and a complex queue system. We need a DevOps Engineer to ensure our infrastructure is reliable, observable, and scalable as we grow from 3 trenches to 500+.

### Key Responsibilities

**Infrastructure Management**
- Manage multi-cloud infrastructure (Vercel, AWS/GCP, or equivalent)
- Maintain reliable RPC connections across all supported chains
- Implement database scaling strategies (PostgreSQL with Prisma)
- Manage Redis caching layer and queue systems

**Monitoring & Observability**
- Build comprehensive monitoring stack (Datadog, Grafana, or PagerDuty)
- Set up critical alerts: oracle downtime, payout failures, RPC errors
- Create dashboards for real-time system health
- Implement distributed tracing for debugging

**CI/CD & Automation**
- Maintain and optimize CI/CD pipelines
- Automate contract deployment processes
- Implement infrastructure-as-code (Terraform/Pulumi)
- Manage staging/production environment parity

**Incident Response**
- On-call rotation for infrastructure incidents
- Post-mortem documentation and process improvement
- Capacity planning and performance optimization

### Required Qualifications

- 3+ years in DevOps, SRE, or Infrastructure Engineering
- Experience with Next.js/Vercel deployment patterns
- Strong PostgreSQL administration skills
- Proficiency with Docker, containerization, and orchestration
- Experience with monitoring tools (Datadog, New Relic, or Grafana)
- Understanding of blockchain node infrastructure

### Preferred Qualifications

- Experience with Web3 infrastructure (Alchemy, Infura, QuickNode)
- Knowledge of Solana validator operations
- Previous fintech or crypto exchange experience
- Certifications: AWS/GCP Solutions Architect, CKA

### What Success Looks Like

- 99.9% uptime for core services
- <5 minute MTTR (Mean Time To Recovery) for incidents
- Automated deployment pipeline with zero-downtime releases
- Proactive capacity scaling before bottlenecks occur

---

## 3. Senior QA / Automation Engineer

**Department:** Engineering  
**Reports To:** Lead Dev  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $100K - $150K + Token Allocation

### About the Role

At Trenches, bugs don't just cause frustration—they cost real money. A miscalculated payout or failed deposit could mean thousands in losses. We're seeking a Senior QA Engineer to build our testing infrastructure from the ground up, ensuring every release is rock-solid.

### Key Responsibilities

**Test Automation**
- Build comprehensive E2E test suite using Playwright or Cypress
- Implement blockchain transaction testing (deposit → task completion → payout)
- Create automated regression testing for critical flows
- Develop API testing framework for backend validation

**Test Strategy**
- Design test plans for complex financial scenarios
- Implement property-based testing for mathematical calculations
- Create test data management strategies
- Define test coverage metrics and gates

**Specialized Testing**
- Load testing for payout queue performance
- Multi-chain transaction testing
- Oracle price feed validation testing
- Wallet integration testing (MetaMask, Phantom, etc.)

**Quality Process**
- Establish QA gates in CI/CD pipeline
- Conduct exploratory testing for new features
- Document and track bugs with severity classification
- Lead bug triage and prioritization

### Required Qualifications

- 4+ years in QA Engineering with 2+ in automation
- Expertise with Playwright, Cypress, or Selenium
- Experience testing financial or transactional applications
- Strong understanding of blockchain wallet interactions
- Proficiency in TypeScript/JavaScript
- Experience with API testing (REST, GraphQL)

### Preferred Qualifications

- Experience with blockchain testing frameworks (Hardhat, Foundry)
- Knowledge of DeFi protocols and mechanisms
- Performance testing experience (k6, JMeter, or Artillery)
- Previous crypto/web3 QA experience
- Security testing background

### What Success Looks Like

- >90% automated test coverage for critical paths
- Zero critical bugs in production releases
- <2 hour test execution time for full regression suite
- Comprehensive test documentation for all features

---

## 4. Product Designer (UI/UX)

**Department:** Product  
**Reports To:** Product Senior Engineer / CEO  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $110K - $160K + Token Allocation

### About the Role

Trenches is a complex product: trenches, campaigns, tasks, belief scores, portfolios, and multi-chain wallets. We're looking for a Product Designer to transform this complexity into an intuitive, beautiful experience that our users love. You'll own the design system and shape every interaction.

### Key Responsibilities

**Design Execution**
- Create wireframes, high-fidelity mockups, and interactive prototypes
- Design responsive web experiences (desktop + mobile-first)
- Build and maintain a comprehensive design system in Figma
- Design complex financial data visualizations (portfolio, earnings, trenches)

**User Experience**
- Conduct user research and usability testing
- Create user flows for complex processes (deposit → task → payout)
- Design onboarding experiences for crypto newcomers
- Optimize conversion funnels (signup → deposit → first task)

**Collaboration**
- Work closely with engineering on implementation feasibility
- Partner with marketing on brand consistency
- Present designs to stakeholders and incorporate feedback
- Maintain design documentation and component libraries

**DesignOps**
- Establish design QA process
- Create and maintain design tokens
- Ensure accessibility compliance (WCAG 2.1 AA)
- Evolve brand identity as product matures

### Required Qualifications

- 4+ years in Product Design with consumer-facing products
- Expert proficiency in Figma
- Strong portfolio demonstrating complex product design
- Experience with design systems and component libraries
- Understanding of responsive design principles
- Experience with prototyping tools (Framer, ProtoPie, or Principle)

### Preferred Qualifications

- Experience designing fintech, crypto, or trading interfaces
- Knowledge of Web3 design patterns (wallet connections, transaction states)
- Motion design skills for micro-interactions
- User research experience (interviews, surveys, usability testing)
- Frontend development basics (HTML/CSS) for better collaboration

### What Success Looks Like

- Design system adopted across all products
- <20% drop-off in key conversion funnels
- User satisfaction score >4.5/5
- Consistent brand experience across all touchpoints

---

## 5. Head of Customer Success

**Department:** Operations  
**Reports To:** CEO / COO  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $100K - $150K + Token Allocation

### About the Role

When users deposit money and complete tasks, they expect their payout. Any confusion or delay creates anxiety and churn. As Head of Customer Success, you'll build the systems and team to ensure every user has a smooth, supported experience—especially when things go wrong.

### Key Responsibilities

**Support Operations**
- Design and implement tiered support system (L1/L2/L3)
- Build help center and self-service documentation
- Establish SLAs: <2 hour response for critical issues
- Create playbook for common issues ("where's my payout?", "task not verified")

**Team Building**
- Hire and manage support team (starting with 2-3 agents)
- Create training programs for product knowledge
- Establish quality assurance for support interactions
- Build escalation procedures for complex cases

**User Success**
- Design onboarding flows that reduce time-to-first-deposit
- Create educational content (videos, guides, webinars)
- Implement NPS/CSAT tracking and improvement programs
- Build user feedback loops for product improvements

**Crisis Management**
- Handle payout disputes and transaction failures
- Coordinate with engineering on bug-related compensation
- Manage communications during platform incidents
- Maintain relationships with high-value users

### Required Qualifications

- 5+ years in Customer Success or Support leadership
- Experience in fintech, crypto, or high-velocity transactional products
- Track record of building support teams from scratch
- Excellent written and verbal communication skills
- Crisis management and conflict resolution experience
- Data-driven approach to support metrics

### Preferred Qualifications

- Crypto/DeFi knowledge (wallets, transactions, gas fees)
- Experience with support platforms (Intercom, Zendesk, or Crisp)
- Previous startup experience (Series A or B stage)
- Multi-language capabilities (Spanish, Portuguese, or Asian languages)
- Community management background

### What Success Looks Like

- <2 hour average response time for critical issues
- >80% CSAT score
- 50%+ reduction in "where's my payout?" tickets through better UX
- Self-service resolution rate >60%

---

## 6. Business Development Lead

**Department:** Growth  
**Reports To:** CEO / Marketing Lead  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $120K - $180K + Commission + Token Allocation

### About the Role

Trenches lives and dies by the quality and quantity of projects running trenches. We need a Business Development Lead to bring crypto projects onto our platform—securing the campaigns that will attract our first 100,000 users. This is a hunter role with significant upside.

### Key Responsibilities

**Pipeline Development**
- Generate and qualify leads from crypto projects (tokens, DeFi protocols, NFTs)
- Build relationships with launchpads, VCs, and project founders
- Attend crypto conferences and represent Trenches (Consensus, Token2049, etc.)
- Create and maintain CRM pipeline (HubSpot, Salesforce, or similar)

**Partnership Execution**
- Conduct discovery calls with project teams
- Present Trenches value proposition and negotiate terms
- Coordinate with product team on campaign setup
- Close trench deployment deals (target: 20 → 50 → 100/month)

**Ecosystem Building**
- Establish partnerships with ecosystem funds (HyperEVM, Solana Foundation)
- Build referral relationships with marketing agencies
- Coordinate co-marketing opportunities with project partners
- Represent Trenches in ecosystem working groups

**Market Intelligence**
- Track competitor landscape (launchpads, airdrop platforms, exchanges)
- Identify emerging chains and ecosystems for expansion
- Gather product feedback from project partners
- Report on market trends and opportunities

### Required Qualifications

- 4+ years in Business Development, Partnerships, or Sales
- Deep network in crypto/web3 (founders, marketers, VCs)
- Track record of closing 6-figure+ deals
- Excellent presentation and negotiation skills
- Understanding of token economics and crypto marketing
- Self-starter with high tolerance for rejection

### Preferred Qualifications

- Previous BD role at a launchpad, exchange, or crypto marketing firm
- Existing relationships with HyperEVM or Solana ecosystem
- Content creation or public speaking experience
- Technical background (can discuss smart contracts, oracles)
- International experience (APAC, Europe markets)

### What Success Looks Like

- 20 → 50 → 100 trenches deployed per month
- $500K average trench size
- 30%+ partner referral rate
- Established presence in 3+ major ecosystems

---

## 7. Data Engineer / Analytics Lead

**Department:** Engineering  
**Reports To:** CTO / Product Senior Engineer  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $130K - $180K + Token Allocation

### About the Role

Trenches generates rich data: user behavior, campaign performance, payout flows, and on-chain activity. We need a Data Engineer to build our analytics infrastructure, detect fraud patterns, and eventually productize our data as an API offering. This role is both defensive (fraud prevention) and offensive (new revenue stream).

### Key Responsibilities

**Data Infrastructure**
- Build ETL pipelines for blockchain and application data
- Design data warehouse architecture (Snowflake, BigQuery, or ClickHouse)
- Implement real-time streaming for critical metrics
- Maintain data quality and lineage documentation

**Analytics & Insights**
- Create executive dashboards for business metrics
- Build cohort analysis for user retention
- Analyze campaign performance and ROI for projects
- Support data needs for investor reporting

**Fraud Detection**
- Implement sybil attack detection algorithms
- Create anomaly detection for unusual payout patterns
- Build user scoring models for "belief score" validation
- Coordinate with Customer Success on fraud investigations

**API Product Development**
- Design and build institutional-grade analytics API
- Create data products for market research firms
- Ensure API reliability and documentation
- Price and package data offerings

### Required Qualifications

- 4+ years in Data Engineering or Analytics
- Expertise with SQL, Python, and data pipelines (Airflow, dbt, or Prefect)
- Experience with cloud data warehouses (Snowflake, BigQuery, Redshift)
- Knowledge of real-time streaming (Kafka, Kinesis, or Pub/Sub)
- Experience with data visualization tools (Tableau, Looker, or Metabase)

### Preferred Qualifications

- Blockchain data experience (Dune Analytics, Nansen, or The Graph)
- Machine learning background for fraud detection
- Previous fintech or crypto analytics experience
- Knowledge of privacy-preserving analytics techniques
- Open-source data tool contributions

### What Success Looks Like

- Sub-minute latency for critical business metrics
- <1% false positive rate on fraud detection
- Analytics API generating $50K+ MRR by month 12
- Comprehensive data dictionary and documentation

---

## 8. Community Manager

**Department:** Growth  
**Reports To:** Marketing Lead  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $70K - $110K + Token Allocation

### About the Role**

Crypto users live in Discord and Telegram. They want real-time answers, alpha leaks, and a sense of belonging. As Community Manager, you'll be the voice of Trenches—building a vibrant community that stays engaged, helps each other, and spreads the word organically.

### Key Responsibilities

**Community Operations**
- Manage Discord and Telegram communities (moderation, engagement)
- Create and enforce community guidelines
- Organize AMA sessions, community calls, and events
- Manage bot integrations and automation

**Content & Engagement**
- Create daily content for community channels (updates, tips, highlights)
- Recognize and reward top community members
- Coordinate campaign announcements and countdowns
- Run community contests and incentivized programs

**User Education**
- Answer product questions and troubleshoot issues
- Create educational content (guides, FAQs, video tutorials)
- Onboard new users to platform mechanics
- Bridge feedback between community and product team

**Advocacy Program**
- Identify and recruit community ambassadors
- Coordinate ambassador incentives and rewards
- Amplify user-generated content and success stories
- Build regional community chapters

### Required Qualifications

- 3+ years in Community Management, preferably in crypto/web3
- Active presence in crypto communities (Discord power user)
- Excellent written communication with engaging voice
- Experience with community tools (Discord bots, Telegram, Collab.Land)
- Ability to moderate difficult conversations and de-escalate conflicts
- Flexible hours for global community coverage

### Preferred Qualifications

- Experience managing 10K+ member communities
- Content creation skills (memes, graphics, short videos)
- Multi-language capabilities
- Network of crypto influencers and KOLs
- Previous moderation experience for DeFi or NFT projects

### What Success Looks Like

- 50K+ engaged Discord members within 6 months
- >15% DAU/MAU ratio in community
- <24 hour average response time to community questions
- 20+ active community ambassadors

---

## 9. Legal / Compliance Officer

**Department:** Operations  
**Reports To:** CEO  
**Employment Type:** Full-time (Remote) or External Counsel initially  
**Salary Range:** $140K - $200K + Token Allocation (or hourly for external)

### About the Role**

Trenches operates at the intersection of financial services, marketing, and crypto—a regulatory minefield. We're seeking a Legal/Compliance Officer to navigate securities laws, ensure our "targeted settlements" language is compliant, and protect the company from regulatory risk as we scale globally.

### Key Responsibilities

**Regulatory Compliance**
- Monitor global regulatory landscape (SEC, CFTC, EU MiCA, etc.)
- Ensure marketing language compliance (no "guaranteed returns")
- Review and approve all user-facing financial communications
- Coordinate with external counsel on jurisdictional matters

**Legal Documentation**
- Draft and maintain Terms of Service and Privacy Policy
- Create user agreements and risk disclosures
- Review partnership agreements with projects
- Manage IP portfolio and trademark registrations

**KYC/AML Program**
- Design and implement KYC/AML policies
- Coordinate with compliance vendors (SumSub, Onfido, etc.)
- Manage SAR (Suspicious Activity Report) filings
- Conduct periodic compliance audits

**Incident Response**
- Coordinate legal response to user disputes
- Manage subpoena and law enforcement requests
- Handle insurance and liability matters
- Oversee incident disclosure procedures

### Required Qualifications

- JD or equivalent legal qualification
- 4+ years in fintech, securities, or crypto legal practice
- Deep understanding of securities laws and Howey Test implications
- Experience with KYC/AML compliance programs
- Knowledge of international data privacy laws (GDPR, CCPA)

### Preferred Qualifications

- In-house experience at a crypto exchange or DeFi protocol
- Regulatory relationships or previous government experience
- Experience with multi-jurisdiction licensing
- Background in marketing/sponsorship law
- Crypto-native (holds crypto, understands DeFi mechanics)

### What Success Looks Like

- Zero regulatory enforcement actions
- Clear compliance framework for all jurisdictions
- <48 hour turnaround on legal review of materials
- Successful navigation of any regulatory inquiries

---

## 10. Platform Engineer (Performance)

**Department:** Engineering  
**Reports To:** CTO / Lead Dev  
**Employment Type:** Full-time (Remote)  
**Salary Range:** $130K - $190K + Token Allocation

### About the Role**

When Trenches scales to 500+ active campaigns, 100K+ users, and $250M+ GMV, every millisecond and every database query matters. We're looking for a Platform Engineer to optimize our systems for scale—ensuring payouts are fast, reliable, and cost-efficient at massive volume.

### Key Responsibilities

**Performance Optimization**
- Optimize database queries and indexing strategies
- Implement caching layers (Redis) for high-frequency reads
- Profile and optimize API response times
- Reduce blockchain interaction costs and latency

**Architecture at Scale**
- Design payout queue architecture for high throughput
- Implement database sharding or partitioning strategies
- Optimize real-time notification systems
- Design for horizontal scalability

**Cost Optimization**
- Monitor and optimize infrastructure costs
- Implement intelligent batching for blockchain transactions
- Optimize RPC usage and provider costs
- Right-size compute resources based on demand

**Technical Excellence**
- Conduct performance testing and capacity planning
- Build benchmarking suites for critical paths
- Create performance budgets and monitoring
- Lead technical debt reduction initiatives

### Required Qualifications

- 5+ years in backend engineering with focus on performance
- Expert-level SQL and database optimization skills
- Experience with high-throughput distributed systems
- Proficiency in TypeScript/Node.js
- Experience with caching strategies and queue systems
- Understanding of blockchain transaction optimization

### Preferred Qualifications

- Previous experience at high-scale fintech or exchange
- Knowledge of PostgreSQL internals and optimization
- Experience with load testing at scale
- Background in financial systems or trading platforms
- Contributions to performance-focused open-source projects

### What Success Looks Like

- API p99 latency <200ms under full load
- Database query time <50ms for critical paths
- 50% reduction in infrastructure cost per transaction
- Zero downtime during peak campaign periods

---

## Hiring Priority Matrix

| Priority | Role | Timeline | Blockers if Not Hired |
|----------|------|----------|----------------------|
| 🔴 Critical | Security Engineer | Immediate | Cannot launch mainnet safely |
| 🔴 Critical | DevOps Engineer | Immediate | No monitoring, blind to outages |
| 🟡 High | Product Designer | 2 weeks | Poor UX, user confusion, churn |
| 🟡 High | QA Engineer | 2 weeks | Bugs in production cost real money |
| 🟡 High | Head of CS | 1 month | User complaints overwhelm team |
| 🟢 Medium | BD Lead | 2 months | No projects = no revenue |
| 🟢 Medium | Data Engineer | 2 months | Fraud goes undetected |
| 🟢 Medium | Community Manager | 2 months | Weak organic growth |
| 🔵 Scale | Legal/Compliance | 3 months | Regulatory risk increases |
| 🔵 Scale | Platform Engineer | 6 months | Performance bottlenecks |

---

## Compensation Philosophy

### Base Salary
- Competitive with top-tier crypto startups
- Adjusted for location and experience
- Reviewed every 6 months

### Token Allocation
- All roles receive BLT token allocation
- 4-year vesting with 1-year cliff
- Significant upside for early team members

### Benefits
- Remote-first with flexible hours
- Health, dental, vision coverage
- Annual conference/travel budget
- Hardware allowance
- Learning & development stipend

---

## Interview Process

1. **Resume Review** - Skills and experience alignment
2. **Hiring Manager Screen** - 30 min culture fit and role discussion
3. **Technical/Skills Assessment** - Take-home or live exercise
4. **Team Interviews** - 2-3 sessions with cross-functional team
5. **Final Interview** - With CEO/Founder
6. **Offer** - Within 48 hours of final interview

**Timeline:** 2-3 weeks from application to offer

---

**Ready to build the future of crypto distribution?**  
📩 **Apply:** careers@playtrenches.xyz  
🌐 **Learn more:** playtrenches.xyz
