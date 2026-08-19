# IPO Graph Intelligence Engine

An intelligent graph analytics platform backed by **CognoDB Cloud**, **FinBERT NLP**, and **React Force Graph**. It monitors multi-hop risk contagion, merchant banking syndicates, cross-directorship exposure, and market sentiment across upcoming IPO candidates[cite: 2, 3].

---

## 🔗 Project Deliverables
* **Live Hosted Application**: `https://ipo-graph-intelligence-ui.vercel.app/`
* **Seed Scripts**: `https://github.com/Vinay2334/IpoTracker_seed_scripts`

---

## 1. Problem & Use Case

Pre-IPO companies operate in an interdependent financial web where valuation, issue subscription, and listing risks are determined by upstream and downstream ties[cite: 2, 3]:
* **Syndicate & Underwriter Health**: Negative regulatory probes into lead investment banks affect issue pricing and investor trust[cite: 2].
* **Promoter & Cross-Directorship Governance**: Key board members and promoters linked to distressed or litigated firms create governance overhangs[cite: 2].
* **Macroeconomic Contagion**: Systemic shocks (such as crude oil spikes or geopolitical conflicts) ripple across related sectors and drag down Day 1 bidding demand[cite: 2].

The **IPO Graph Intelligence Engine** ingests raw financial news feeds, extracts named entities (companies, lead underwriters, promoters, and macro risks) via NLP, scores market sentiment with **FinBERT**, and maps them onto a native graph database in **CognoDB**[cite: 2, 3].

---

## 2. Why a Graph Database?

A relational (SQL) schema is inefficient and awkward for financial network analysis for three main reasons:

* **Arbitrary Multi-Hop Transitive Traversals**: Identifying indirect risk exposure (`Target Company -> Underwriter -> Investigation -> News Article`) in SQL requires deeply nested `JOIN` operations or recursive Common Table Expressions (CTEs). In openCypher, this is a single variable-length traversal (`-[:UNDERWRITTEN_BY|BACKED_BY*1..2]-(entity)<-[:REPORTS_ON]-(art:Article)`) executing in constant time relative to the subgraph size.
* **Index-Free Adjacency**: Relational join tables (`company_underwriters`, `article_entities`) require repeated $O(\log N)$ index lookups for every join jump. CognoDB uses native graph pointers, executing multi-hop traversals in sub-milliseconds regardless of total table size.
* **Heterogeneous Schema Evolution**: Financial news features dynamic, interconnected entity types (`Company`, `Institution`, `Person`, `MacroFactor`). A graph database natively stores heterogeneous nodes and typed relationships without requiring schema migrations or NULL-heavy join tables.

---

## 3. Graph Data Model & Schema

```mermaid
graph TD
    Article[":Article (FinBERT Scored)"] -->|:REPORTS_ON| Company[":Company"]
    Article -->|:REPORTS_ON| Institution[":Institution (Underwriter/PE)"]
    Article -->|:REPORTS_ON| Person[":Person (Promoter/Director)"]
    Article -->|:REPORTS_ON| Macro[":MacroFactor (Crude/Geopolitics)"]

    Company -->|:UNDERWRITTEN_BY| Institution
    Company -->|:BACKED_BY| Institution
    Company -->|:CONSORTIUM_PARTNER| Institution
    Company -->|:TARGETS_ACQUISITION| Company
    Person -->|:HOLDS_POSITION| Company
    Macro -->|:SYSTEMIC_DRAG| Company