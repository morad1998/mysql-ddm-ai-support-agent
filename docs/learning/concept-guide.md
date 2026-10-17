**LEARNER GUIDE · BEGINNER FRIENDLY · v6 (corrected)**

# MySQL Dynamic Data Masking: Concept Guide v6

Every term, command, mistake and finding from D0 through D3's complete build, explained from zero

> **Who this is for, and what's corrected in v6**
>
> This guide assumes you have never used MySQL, Git, GitHub, Node.js, or an AI model's API before this project began.
>
> v6 is a corrections pass over v4/v5, prompted by a careful read-through before this guide was published to the public repository. Four specific inaccuracies were fixed: an overclaim about what the view-bypass experiment actually proved, a garbled description of the component-install issue, an unverified attribution about Oracle's release notes (now removed), and an out-of-date 'what comes next' section. Nothing else was changed; this is the authoritative version going forward.
>
> Read start to finish like a short course, or use the table of contents to jump to one topic.

| Item | Value |
|---|---|
| Prepared for | Morad Alshammari, as a learning companion to the MySQL DDM bounty project |
| Covers | D0 (runtime), D1 (schema/personas/policies), D2 (Git/GitHub backup), D3 complete (API, tool-calling agent, consistency testing, web UI) |
| Document version | v6 (17 Oct 2026). Corrects v4/v5. Save alongside v1–v5; do not overwrite. |
| Reading time | About 95–105 minutes start to finish; or jump to any one section |

- [Part 1: The Big Picture](#part-1-the-big-picture)
  - [What is the bounty actually asking for?](#what-is-the-bounty-actually-asking-for)
  - [What is MySQL?](#what-is-mysql)
  - [Community vs. Enterprise vs. HeatWave](#community-vs-enterprise-vs-heatwave)
  - [Why the version number jumped from 9.7 to 26.7](#why-the-version-number-jumped-from-97-to-267)
- [Part 2: Getting the Software Onto the Laptop](#part-2-getting-the-software-onto-the-laptop)
  - [What is a “bundle”?](#what-is-a-bundle)
  - [What is a checksum (SHA-256)?](#what-is-a-checksum-sha-256)
- [Part 3: Running a Database Server for the First Time](#part-3-running-a-database-server-for-the-first-time)
  - [What is a port?](#what-is-a-port)
  - [Why root starts with an empty password, and where the real one goes](#why-root-starts-with-an-empty-password-and-where-the-real-one-goes)
  - [What does @@version_comment prove?](#what-does-version_comment-prove)
- [Part 4: Installing the Masking Feature Itself](#part-4-installing-the-masking-feature-itself)
  - [What is a component?](#what-is-a-component)
  - [The real dependency this project actually hit](#the-real-dependency-this-project-actually-hit)
  - [What is a masking function?](#what-is-a-masking-function)
- [Part 5: Masking Policies — Deciding WHO Sees What](#part-5-masking-policies--deciding-who-sees-what)
  - [What is a masking policy, and a gatekeeper function?](#what-is-a-masking-policy-and-a-gatekeeper-function)
  - [USER vs. ROLE, and why a shared 'badge' role solved a real limitation](#user-vs-role-and-why-a-shared-badge-role-solved-a-real-limitation)
  - [What the VIEW experiment actually proved — and what it did not test](#what-the-view-experiment-actually-proved--and-what-it-did-not-test)
  - [Privileges vs. masking — two different layers](#privileges-vs-masking--two-different-layers)
- [Part 6: Backing the Project Up With Git and GitHub](#part-6-backing-the-project-up-with-git-and-github)
  - [What is Git, and why does a verified project need it?](#what-is-git-and-why-does-a-verified-project-need-it)
  - [Why secrets must NEVER be committed, and how this project checked](#why-secrets-must-never-be-committed-and-how-this-project-checked)
  - [What is GitHub, and why public + MIT license?](#what-is-github-and-why-public--mit-license)
  - [git push, and why it's a deliberate, separate step from committing](#git-push-and-why-its-a-deliberate-separate-step-from-committing)
- [Part 7: Building an API That Connects as a Specific Persona](#part-7-building-an-api-that-connects-as-a-specific-persona)
  - [What is an API, in the simplest possible terms?](#what-is-an-api-in-the-simplest-possible-terms)
  - [The single most important design decision: connecting AS svc_ai_agent](#the-single-most-important-design-decision-connecting-as-svc_ai_agent)
  - [A parameterized query, and why it resists SQL injection](#a-parameterized-query-and-why-it-resists-sql-injection)
  - [What is OCI Generative AI, briefly?](#what-is-oci-generative-ai-briefly)
  - [Keeping two bounty projects independent](#keeping-two-bounty-projects-independent)
  - [A system preamble, and why it's given to the model before any real data](#a-system-preamble-and-why-its-given-to-the-model-before-any-real-data)
- [Part 8: Real Tool-Calling](#part-8-real-tool-calling)
  - [From one big blob to real tools](#from-one-big-blob-to-real-tools)
  - [How a tool-calling conversation actually works, step by step](#how-a-tool-calling-conversation-actually-works-step-by-step)
  - [What the model chose to do, on its own](#what-the-model-chose-to-do-on-its-own)
  - [Why the same test was run three times](#why-the-same-test-was-run-three-times)
- [Part 9: Building a Web Interface That Shows the Proof Visually](#part-9-building-a-web-interface-that-shows-the-proof-visually)
  - [Why a working project still needs a web page](#why-a-working-project-still-needs-a-web-page)
  - [Why the web page has no build step](#why-the-web-page-has-no-build-step)
  - [A demo-only endpoint, clearly labeled as such](#a-demo-only-endpoint-clearly-labeled-as-such)
  - [Two small, real safety checks the web page needed](#two-small-real-safety-checks-the-web-page-needed)
- [What Comes Next](#what-comes-next)

## Part 1: The Big Picture

### What is the bounty actually asking for?

**What it is:** An Oracle ACE bounty asks the community to build a real, working example of one of Oracle's technologies. This one is about MySQL's Dynamic Data Masking feature.

**Why we need it:** The question this whole project answers is: just because a program (here, an AI assistant) is ALLOWED to run a query, should it be allowed to see every value the query returns? This project demonstrates that the answer is no, and that MySQL itself can enforce that, not just the application on top of it.

### What is MySQL?

**What it is:** A database: software that stores information in organised tables (rows and columns, like a powerful spreadsheet) and answers questions about it quickly and safely, even with many users at once.

**Why we need it:** Our bounty needs somewhere to store customers, warranties, payments and support tickets — MySQL is that storage engine, with masking built in.

### Community vs. Enterprise vs. HeatWave

**What it is:** Community Edition is free and open-source. Enterprise Edition is the same core database with paid extras added (audit logging, a firewall, and Dynamic Data Masking). HeatWave is MySQL as a ready-made cloud service that Oracle runs for you.

**Why we need it:** Dynamic Data Masking only exists in Enterprise Edition or HeatWave, which is why confirming genuine Enterprise access came before building anything.

### Why the version number jumped from 9.7 to 26.7

**What it is:** Oracle moved MySQL to a calendar-based version scheme partway through 2026: “26.7” simply means “the July 2026 release”, not a different product from “9.7”. MySQL 9.7 was the final release under the older, sequential numbering scheme.

**Why we need it:** What looked like a possible conflict between two release lines turned out to be a renumbering of the same product line. Note on sourcing: this was reasoned from the version numbers and naming themselves during the project, not independently checked against Oracle's published release notes — worth a quick look at the official notes if this detail matters for a citation.

## Part 2: Getting the Software Onto the Laptop

### What is a “bundle”?

**What it is:** One download file that packs several related programs together, like a toolbox holding several tools. Oracle's Windows Enterprise bundle contains the server itself plus Shell, Router, Backup and connectors.

**Why we need it:** Of everything inside, this project only needed the server program (mysqld.exe).

### What is a checksum (SHA-256)?

**What it is:** A fingerprint calculated from every byte of a file. Change one letter anywhere and the fingerprint comes out completely different.

**Why we need it:** The bundle was downloaded twice; matching SHA-256 values proved both downloads were the exact same file, closing a licence-account question without needing to trust memory.

## Part 3: Running a Database Server for the First Time

### What is a port?

**What it is:** Like an apartment number on a street address: one network address, many numbered “doors”. This project's server uses door 3308, separate from a different project's door 3307.

**Why we need it:** Separate ports let two unrelated MySQL servers run on the same laptop at the same time with zero conflict.

### Why root starts with an empty password, and where the real one goes

**What it is:** Initialising with --initialize-insecure creates the root account with no password, purely to simplify one-time setup. The very next action was always to set a real, random password, saved to one locked-down file, never typed or shown.

**Why we need it:** An account with full power and no password left unprotected is dangerous — fixing it immediately, before anything else, removes that risk window entirely.

### What does @@version_comment prove?

**What it is:** A built-in system variable. On an Enterprise server it literally contains “MySQL Enterprise Server - Commercial”.

**Why we need it:** Checking this directly against the running server proves masking is genuinely available, rather than trusting a download page's label.

## Part 4: Installing the Masking Feature Itself

### What is a component?

**What it is:** An optional add-on module the server can load for new abilities, shipped as .dll files, waiting to be switched on.

**Why we need it:** Dynamic Data Masking is not one on/off switch — it depends on multiple components that depend on each other in ways not fully spelled out in the quick-start documentation.

### The real dependency this project actually hit

**What it is:** Installing component_masking_functions on its own failed, because it silently needs a separate, underlying component — component_masking — to already be installed first. The server's own error pointed at a missing function that component_masking provides, which is how the dependency was discovered.

**Why we need it:** The fix was to install component_masking together with component_masking_functions (both are provided by one of Oracle's installer scripts, masking_functions_install.sql), rather than attempting the function library alone. A second, separate component — component_object_policy — is the one that actually enforces masking policies on a column, and it needs its own table inside the mysql database; Oracle's own install_component_object_policy.sql script creates that table and installs the component together. Using these shipped scripts, rather than typing individual INSTALL COMPONENT commands by hand, is what let the project resolve the dependency correctly on the first real attempt.

| Component | What it actually does |
|---|---|
| component_masking | A hidden foundation layer that component_masking_functions depends on; the dependency was not obvious from the documentation and was discovered via a failed install attempt |
| component_masking_functions | Gives you the usable functions, e.g. mask_ssn(), mask_pan() |
| component_object_policy | Enforces a masking rule on an actual table column, and needs a backing table (mysql.column_masking_policies) to store the rules |

### What is a masking function?

**What it is:** A ready-made piece of logic, built into MySQL, that takes one real value and returns a disguised version — like mask_ssn('123-45-6789') returning 'XXX-XX-6789'.

**Why we need it:** Having these ready-made inside the database keeps the disguising logic in one trusted place, rather than rewritten in every application that reads the data.

## Part 5: Masking Policies — Deciding WHO Sees What

### What is a masking policy, and a gatekeeper function?

**What it is:** A named rule, stored inside MySQL, written as a CASE expression: “IF this condition is true, show the real value; OTHERWISE, show a disguised one.” The gatekeeper (CURRENT_ROLE_IN) is the part that checks who is asking.

**Why we need it:** Once attached to a column, this applies automatically for every query, with no extra effort from whoever writes the SQL.

```sql
CREATE MASKING POLICY mp_email(c) CASE
  WHEN CURRENT_ROLE_IN('r_pii_exempt') THEN c
  ELSE CONCAT(LEFT(c,1), '***@', SUBSTRING_INDEX(c,'@',-1))
END;
```

### USER vs. ROLE, and why a shared 'badge' role solved a real limitation

**What it is:** A user is a specific login; a role is a label carrying permissions, attachable to many users, like a job-title badge. A masking policy can only check ONE role in a single WHEN clause, so a shared, permission-free badge role (r_pii_exempt, later r_name_visible) was granted ALONGSIDE each exempt persona's own role.

**Why we need it:** This lets several independent personas share one exemption without rewriting the policy, and turned out to be a better real-world pattern than the originally planned multi-branch design — granting or revoking an exemption later is just one GRANT or REVOKE on a shared badge.

### What the VIEW experiment actually proved — and what it did not test

**What it is:** An experiment wrapped SHA2() around a masked email column inside a VIEW owned by root (the database's most powerful account, which itself has no exemption role). The hash matched the MASKED placeholder, not the real value, proven by an independent calculation. This showed that root, querying through the view, still only received the masked value — the view did not let root “see past” the mask.

**Why we need it:** It is important to be precise about what this does and does not establish. The exempt personas (Supervisor, Auditor) were never actually granted SELECT on the test view, so the experiment could not observe what an exempt account sees through a view — it only confirmed the behaviour for a non-exempt querying context. The reasonable, narrower conclusion is: a view cannot be used by a non-exempt account to recover a real value from a masked column. Whether masking is evaluated relative to the querying account specifically (as opposed to some other rule) in every possible view configuration remains, strictly, untested beyond this one case, and is recorded as such in the project's own findings log.

### Privileges vs. masking — two different layers

**What it is:** A privilege (GRANT SELECT) decides WHETHER a table can be read at all. Masking decides HOW a value looks once you're already allowed to read it. internal_cost has no masking policy at all — it simply has no GRANT for two of the four personas, proven directly with ERROR 1142 (access denied).

**Why we need it:** Some data needs the lighter touch (disguise it); some data needs the heavier one (block it entirely). Using the right tool for each case keeps the design simple and honest.

## Part 6: Backing the Project Up With Git and GitHub

### What is Git, and why does a verified project need it?

**What it is:** Git is a tool that tracks every change to a set of files over time, so you can always see or recover an earlier version. Up to a point, everything built existed only as commands typed into one chat session and the live database itself.

**Why we need it:** If the laptop or the chat history were lost, none of that verified work could be rebuilt. Git turns ‘commands that were once run’ into real, permanent files that anyone (including a future you) can read and re-run.

### Why secrets must NEVER be committed, and how this project checked

**What it is:** A .gitignore file tells Git to always ignore certain files or folders (here: secrets/, \*.pwd, .env). Before every single commit in this project, an explicit secret scan also searched the staged content for patterns like password assignments, private keys, or long random-looking strings, reporting the exact result before proceeding.

**Why we need it:** A public GitHub repository is visible to anyone in the world. Removing something from Git history after a push is far harder than not committing it in the first place, so actively scanning before every push is the extra check that catches a mistake before it becomes permanent and public.

### What is GitHub, and why public + MIT license?

**What it is:** GitHub is a website that hosts Git repositories online. A LICENSE file (here, MIT) is a short legal document stating exactly how others are allowed to use your code — MIT is one of the most permissive and common choices for open demonstration projects.

**Why we need it:** A bounty submission needs to be reviewable by judges and, ideally, reproducible by anyone. Making the repository public with a clear license removes any ambiguity about whether someone is allowed to read, run, or learn from it.

### git push, and why it's a deliberate, separate step from committing

**What it is:** A commit only changes your LOCAL copy of the repository. git push sends your committed changes to the remote copy on GitHub, making them visible to the outside world for the first time.

**Why we need it:** This project treated creating a local commit and actually publishing it as two separate, deliberately spaced-out decisions — exactly because publishing is much harder to undo than committing.

## Part 7: Building an API That Connects as a Specific Persona

### What is an API, in the simplest possible terms?

**What it is:** A small program that listens for web requests and replies with data, so other programs (later, an AI model) can ask it questions without needing to know any SQL themselves.

**Why we need it:** An API lets a question be asked as a simple web address, like http://127.0.0.1:4000/customers/CUST-0001, which any other piece of software, including an AI agent, can do automatically.

### The single most important design decision: connecting AS svc_ai_agent

**What it is:** The API's database connection code is configured to log in specifically as svc_ai_agent — the exact same restricted persona built and tested throughout the project — never as root and never with any elevated account.

**Why we need it:** When the API returns data, it is returning WHATEVER MYSQL ITSELF decided to show that specific persona. If the API ever accidentally returned a REAL email or card number instead of a masked one, that would immediately prove a serious configuration mistake — so checking this first, before building anything else, was the right instinct.

### A parameterized query, and why it resists SQL injection

**What it is:** Instead of building a SQL command by gluing a user's input directly into a string, a parameterized query uses a placeholder (?) and hands the actual value to the database driver separately, which guarantees that value is treated as plain data, never as part of the SQL command itself.

**Why we need it:** A classic attack-style string, sent as a customer code, was treated as a literal, nonsense code — returning an ordinary 404 ‘not found’, not an error, and not a dropped table.

```js
// Safe: the code is a separate parameter, never glued into the SQL text
db.query('SELECT * FROM customer WHERE customer_code = ?', [code]);
```

### What is OCI Generative AI, briefly?

**What it is:** A cloud service from Oracle that lets you send a prompt to a large language model — in this project's case, Cohere Command A — and get back a generated reply, without needing to run the model yourself.

**Why we need it:** The project needed a way to ask an AI model to look at the masked customer data and decide what it means, the same way a human support agent would.

### Keeping two bounty projects independent

**What it is:** An AI connection already built for a separate bounty project could not be reused here: it required infrastructure that did not yet exist, and a direct call was correctly refused rather than silently allowed. Rather than finish that other project's unfinished infrastructure here, this project used a simpler, independent path — OCI's own command-line tool, which can talk to Generative AI directly with no custom infrastructure needed.

**Why we need it:** This kept the two separate public bounty projects fully independent of each other, which matters if a judge or reader tries to reproduce only one of them.

### A system preamble, and why it's given to the model before any real data

**What it is:** A fixed instruction given to an AI model before the actual conversation, describing its role, its limits, and how it should behave. This project's preamble explicitly told the model it must never guess, invent, or ask for the real value behind any masked or hidden field.

**Why we need it:** The database guarantees the model is physically never given the real data in the first place; the preamble is a second, separate layer reinforcing the same boundary in how the model is expected to behave with whatever it does receive.

## Part 8: Real Tool-Calling

### From one big blob to real tools

**What it is:** An early test fetched all the relevant data ourselves and handed the model one combined document to summarise. Real tool-calling instead gives the model a small set of tools (find a customer, check their warranty, check their orders and payments, check their support tickets) and lets it decide which to call and in what order.

**Why we need it:** This is the more realistic agentic design the bounty's evaluation criteria describe.

### How a tool-calling conversation actually works, step by step

**What it is:** The model is sent the conversation so far, plus the list of tools. Instead of answering in plain text, it can reply with a request like 'call get_warranty with code=CUST-0002'. The code then runs that function, puts the real result back into the conversation as a tool result, and sends everything back to the model. This repeats until the model finally answers in plain text.

**Why we need it:** A hard cap (6 tool calls) prevents a model that gets confused from calling tools indefinitely.

```text
1. Model: "call get_warranty(code='CUST-0002')"
2. Our code: runs the real function, returns the masked result
3. Our code: sends the result back as a tool result
4. Model: requests another tool, or gives its final answer
```

### What the model chose to do, on its own

**What it is:** Given only tool descriptions and one open-ended instruction, the model decided, without being told, to call all four tools in most runs, and only two of four in one run, judging it didn't need all of them for that particular question.

**Why we need it:** This is genuine evidence of agentic reasoning: the model is choosing what information it needs based on the situation, not simply following a fixed script.

### Why the same test was run three times

**What it is:** AI models are not perfectly deterministic: the same prompt can produce different wording, or different reasoning, each time. Running the same test multiple times distinguishes a one-off quirk from a real, repeatable pattern.

**Why we need it:** The duplicate-charge finding was correct in all three runs. But the model never explicitly stated the warranty's active status in its customer-facing reply, in any of the three runs, even when it had already fetched that exact record. A follow-up test, asking for an internal summary rather than a customer reply, showed the model did state it correctly that way — suggesting the gap is tied to how the question is framed, not a failure to retrieve the data. Two further issues, an invented currency symbol and a fabricated refund timeline, each appeared in two of the three runs, confirming them as a real pattern rather than a fluke.

> **What held, every time, across every run**
>
> Zero real values — card number, IBAN, email, mobile, national ID, surname — ever appeared in any tool call, tool result, or final answer. The masking guarantee held perfectly even while the model's narrative completeness varied.

## Part 9: Building a Web Interface That Shows the Proof Visually

### Why a working project still needs a web page

**What it is:** Everything built could already be proven correct using curl commands and JSON responses in a terminal. A web page lets a human — a judge, a colleague, a reader — see the masking guarantee happen in front of them, without reading raw JSON.

**Why we need it:** A visual, side-by-side comparison of masked and real data for the exact same customer is one of the clearest ways to demonstrate the entire bounty's premise in a single screenshot.

### Why the web page has no build step

**What it is:** The page is written directly in plain HTML, CSS and JavaScript — the same three languages every browser already understands — instead of a framework that needs compiling first.

**Why we need it:** Anyone cloning the repository can open the page immediately, with no extra installation step.

### A demo-only endpoint, clearly labeled as such

**What it is:** One new endpoint deliberately opens TWO separate database connections for a single request — one as the restricted AI agent persona, one as the fully-trusted Supervisor persona — and returns both results together, purely to show masked and real data side by side.

**Why we need it:** This is explicitly commented in the code as existing only to power this demonstration. A real production application would never have one endpoint capable of fetching two different privilege levels at once.

### Two small, real safety checks the web page needed

**What it is:** Path traversal (trying a web address like '/../../some-other-file' to reach a file it shouldn't) was tested directly, and the server correctly refused with a 404. Every dynamic value is inserted using textContent rather than raw HTML, preventing a customer's own typed text from being interpreted as a page command.

**Why we need it:** Testing these directly, rather than assuming a simple page is automatically safe, is the same evidence-first discipline used throughout this project.

## What Comes Next

This guide covers D0 through D3's complete build: the runtime, the masking feature, the schema and personas, Git/GitHub backup, the API, the tool-calling AI agent, consistency testing, and the web UI. The next phase of the project is D4, which will cover:

- Defense in depth: how Enterprise Audit logging and Enterprise Firewall add further layers beyond masking and privileges alone.
- A deliberate red-team phase: trying to trick or break the masking from the agent's side, including a prompt-injection test using the service_ticket.problem_text column reserved for exactly this purpose.
- Deciding the open question of whether the Auditor persona should see a hashed, rather than fully real, view of sensitive data — a question the view experiment in Part 5 left open rather than resolved, since it was never tested for an exempt account.
- Preparing the final article and release for submission.

> **How to use this guide going forward**
>
> Keep this document open alongside the Project Checkpoint document. Whenever a new agent report introduces a term you haven't seen, check here first.
