**LEARNER GUIDE · BEGINNER FRIENDLY · v4**

# MySQL Dynamic Data Masking: Concept Guide v4

Every term, command, mistake and finding from D0 through D3's core AI proof, explained from zero

> **Who this is for, and what's new in v4**
>
> This guide assumes you have never used MySQL, Git, GitHub, Node.js, or an AI model's API before this project began.
>
> v4 adds everything learned while backing the project up to a public Git repository (D2) and building the first working AI support agent (D3): what a repository actually is, why secrets never get committed, what an API is and why it connects as a specific persona, what OCI Generative AI is, and — the centerpiece — how the project proved an AI model can do real, useful work while never touching real data.
>
> Read start to finish like a short course, or use the table of contents to jump to one topic.

| Item | Value |
|---|---|
| Prepared for | Morad Alshammari, as a learning companion to the MySQL DDM bounty project |
| Covers | D0 (runtime), D1 (schema/personas/policies), D2 (Git/GitHub backup), D3 core proof (API + first AI diagnosis) |
| Document version | v4 (17 Oct 2026). Save alongside v1–v3; do not overwrite. |
| Reading time | About 85–95 minutes start to finish; or jump to any one section |

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
  - [The three components actually needed](#the-three-components-actually-needed)
  - [What is a masking function?](#what-is-a-masking-function)
- [Part 5: Masking Policies — Deciding WHO Sees What](#part-5-masking-policies--deciding-who-sees-what)
  - [What is a masking policy, and a gatekeeper function?](#what-is-a-masking-policy-and-a-gatekeeper-function)
  - [USER vs. ROLE, and why a shared 'badge' role solved a real limitation](#user-vs-role-and-why-a-shared-badge-role-solved-a-real-limitation)
  - [Why a VIEW cannot be used to bypass masking](#why-a-view-cannot-be-used-to-bypass-masking)
  - [Privileges vs. masking — two different layers](#privileges-vs-masking--two-different-layers)
- [Part 6: New in D2 — Backing the Project Up With Git and GitHub](#part-6-new-in-d2--backing-the-project-up-with-git-and-github)
  - [What is Git, and why does a verified project need it?](#what-is-git-and-why-does-a-verified-project-need-it)
  - [git init, git add, and a commit](#git-init-git-add-and-a-commit)
  - [Why secrets must NEVER be committed, and how this project checked](#why-secrets-must-never-be-committed-and-how-this-project-checked)
  - [What is GitHub, and why public + MIT license?](#what-is-github-and-why-public--mit-license)
  - [git push, and why it's a deliberate, separate step from committing](#git-push-and-why-its-a-deliberate-separate-step-from-committing)
- [Part 7: New in D3 — Building an API That Connects as a Specific Persona](#part-7-new-in-d3--building-an-api-that-connects-as-a-specific-persona)
  - [What is an API, in the simplest possible terms?](#what-is-an-api-in-the-simplest-possible-terms)
  - [Why this API deliberately has almost no extra dependencies](#why-this-api-deliberately-has-almost-no-extra-dependencies)
  - [The single most important design decision: connecting AS svc_ai_agent](#the-single-most-important-design-decision-connecting-as-svc_ai_agent)
  - [A parameterized query, and why it resists SQL injection](#a-parameterized-query-and-why-it-resists-sql-injection)
  - [Where the password came from, and what happens if it's missing](#where-the-password-came-from-and-what-happens-if-its-missing)
- [Part 8: New in D3 — Connecting a Real AI Model](#part-8-new-in-d3--connecting-a-real-ai-model)
  - [What is OCI Generative AI, briefly?](#what-is-oci-generative-ai-briefly)
  - [A real decision worth understanding: why NOT reuse the other project's AI connection directly](#a-real-decision-worth-understanding-why-not-reuse-the-other-projects-ai-connection-directly)
  - [A system preamble, and why it's given to the model before any real data](#a-system-preamble-and-why-its-given-to-the-model-before-any-real-data)
  - [The actual test, and why fact-checking the AI's answer mattered](#the-actual-test-and-why-fact-checking-the-ais-answer-mattered)
  - [Why even a correct answer can still have real, worth-noting flaws](#why-even-a-correct-answer-can-still-have-real-worth-noting-flaws)
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

**What it is:** Oracle switched MySQL to a calendar-based version scheme partway through 2026: “26.7” just means “the July 2026 release”, not a different product from “9.7”.

**Why we need it:** What looked like a possible conflict turned out to be a simple renumbering, confirmed from Oracle's own release notes.

## Part 2: Getting the Software Onto the Laptop

### What is a “bundle”?

**What it is:** One download file that packs several related programs together, like a toolbox holding several tools. Oracle's Windows Enterprise bundle contains the server itself plus Shell, Router, Backup and connectors.

**Why we need it:** Of everything inside, this project only needed the server program (mysqld.exe).

### What is a checksum (SHA-256)?

**What it is:** A fingerprint calculated from every byte of a file. Change one letter anywhere and the fingerprint comes out completely different.

**Why we need it:** The bundle was downloaded twice; matching SHA-256 values proved both downloads were the exact same file, closing a licence-account question without needing to trust memory.

## Part 3: Running a Database Server for the First Time

### What is a port?

**What it is:** Like an apartment number on a street address: one network address, many numbered “doors”. This project's server uses door 3308, separate from the JSON Duality Views project's door 3307.

**Why we need it:** Separate ports let two unrelated MySQL servers run on the same laptop at the same time with zero conflict.

### Why root starts with an empty password, and where the real one goes

**What it is:** Initialising with --initialize-insecure creates the root account with no password, purely to simplify one-time setup. The very next action was always to set a real, random password, saved to one locked-down file, never typed or shown.

**Why we need it:** An account with full power and no password left unprotected is dangerous — fixing it immediately, before anything else, removes that risk window entirely.

### What does @@version_comment prove?

**What it is:** A built-in system variable. On an Enterprise server it literally contains “MySQL Enterprise Server - Commercial”.

**Why we need it:** Checking this directly against the running server proves masking is genuinely available, rather than trusting a download page's label.

## Part 4: Installing the Masking Feature Itself

### The three components actually needed

**What it is:** component_masking_functions supplies the disguising logic, but secretly needs component_masking underneath it. component_object_policy enforces a rule on a real column and needs its own table inside mysql.

**Why we need it:** Oracle's own installer scripts install all the right pieces together, avoiding a documented trap where installing the enforcement component the “obvious” way first can leave it unable to load properly.

### What is a masking function?

**What it is:** A ready-made piece of logic, built into MySQL, that takes one real value and returns a disguised version — like mask_ssn('123-45-6789') returning 'XXX-XX-6789'.

**Why we need it:** Having these ready-made inside the database keeps the disguising logic in one trusted place, rather than rewritten in every application that reads the data.

## Part 5: Masking Policies — Deciding WHO Sees What

### What is a masking policy, and a gatekeeper function?

**What it is:** A named rule, stored inside MySQL, written as a CASE expression: “IF this condition is true, show the real value; OTHERWISE, show a disguised one.” The gatekeeper (CURRENT_ROLE_IN) is the part that checks who is asking.

**Why we need it:** Once attached to a column, this applies automatically for every query, with no extra effort from whoever writes the SQL.

### USER vs. ROLE, and why a shared 'badge' role solved a real limitation

**What it is:** A user is a specific login; a role is a label carrying permissions, attachable to many users, like a job-title badge. A masking policy can only check ONE role in a single WHEN clause, so a shared, permission-free badge role (r_pii_exempt, later r_name_visible) was granted ALONGSIDE each exempt persona's own role.

**Why we need it:** This lets several independent personas share one exemption without rewriting the policy, and turned out to be a better real-world pattern than the originally planned multi-branch design — granting or revoking an exemption later is just one GRANT or REVOKE on a shared badge.

### Why a VIEW cannot be used to bypass masking

**What it is:** A dedicated experiment wrapped SHA2() around a masked column inside a VIEW, even one owned by root. The hash matched the MASKED placeholder, not the real value, proven by an independent Python calculation.

**Why we need it:** This proves masking enforcement travels with the column itself, through any SQL wrapped around it, based on the querying account's actual role — not something that can be worked around with a clever view.

### Privileges vs. masking — two different layers

**What it is:** A privilege (GRANT SELECT) decides WHETHER a table can be read at all. Masking decides HOW a value looks once you're already allowed to read it. internal_cost has no masking policy at all — it simply has no GRANT for two of the four personas, proven directly with ERROR 1142 (access denied).

**Why we need it:** Some data needs the lighter touch (disguise it); some data needs the heavier one (block it entirely). Using the right tool for each case keeps the design simple and honest.

## Part 6: New in D2 — Backing the Project Up With Git and GitHub

### What is Git, and why does a verified project need it?

**What it is:** Git is a tool that tracks every change to a set of files over time, in a hidden .git folder, so you can always see or recover an earlier version. Up to this point, everything built (the schema, the personas, the policies) existed only as commands typed into one chat session and the live database itself.

**Why we need it:** If the laptop or the chat history were lost, none of that verified work could be rebuilt. Git turns ‘commands that were once run’ into real, permanent files that anyone (including a future you) can read and re-run.

### git init, git add, and a commit

**What it is:** git init turns an ordinary folder into a tracked repository. git add stages files, marking them ready to be saved. A commit is a permanent snapshot of the staged files, with a short message describing what changed.

**Why we need it:** Writing the FINAL, CORRECTED version of each SQL script into real files (not a historical transcript of every failed attempt) means the repository represents ‘how to build this cleanly today’, which is exactly what someone reproducing the project later needs.

```bash
git init
git add .
git commit -m "D0 and D1: schema, personas, verified masking policies"
```

### Why secrets must NEVER be committed, and how this project checked

**What it is:** A .gitignore file tells Git to always ignore certain files or folders (here: secrets/, \*.pwd, .env). Before every single commit in this project, the agent also ran an explicit secret scan — searching the staged content for patterns like password assignments, private keys, or long random-looking strings — and reported the exact result before proceeding.

**Why we need it:** A public GitHub repository is visible to anyone in the world. Relying on .gitignore alone is good practice, but actively scanning before every push is the extra, evidence-based check that catches a mistake before it becomes permanent and public (since removing something from Git history after a push is far harder than not committing it in the first place).

### What is GitHub, and why public + MIT license?

**What it is:** GitHub is a website that hosts Git repositories online, so others can view, clone, or contribute to them. A LICENSE file (here, MIT) is a short legal document stating exactly how others are allowed to use your code — MIT is one of the most permissive and common choices for open demonstration projects.

**Why we need it:** A bounty submission needs to be reviewable by judges and, ideally, reproducible by anyone. Making the repository public with a clear license removes any ambiguity about whether someone is allowed to read, run, or learn from it.

### git push, and why it's a deliberate, separate step from committing

**What it is:** A commit only changes your LOCAL copy of the repository. git push sends your committed changes to the remote copy on GitHub, making them visible to the outside world for the first time.

**Why we need it:** This project treated creating the local commit (D2 Step 1) and actually publishing it (D2 Step 2) as two separate, deliberately spaced-out decisions — exactly because publishing is much harder to undo than committing. The final secret scan ran again, on the full history, right before this irreversible step.

```bash
git push -u origin main
# -u remembers that local 'main' should always sync with GitHub's 'main'
```

## Part 7: New in D3 — Building an API That Connects as a Specific Persona

### What is an API, in the simplest possible terms?

**What it is:** API stands for Application Programming Interface. In this project, it is simply a small program that listens for web requests (the same kind your browser sends) and replies with data — so other programs (later, an AI model) can ask it questions without needing to know any SQL themselves.

**Why we need it:** Up to now, every question asked of the database was typed by hand as SQL. An API lets that same question be asked as a simple web address instead, like visiting http://127.0.0.1:4000/customers/CUST-0001, which is something any other piece of software (including an AI agent) can do automatically.

### Why this API deliberately has almost no extra dependencies

**What it is:** Most real-world APIs are built using a framework like Express, which adds convenience but also adds a long list of other packages you now depend on. This project's API uses only Node's own built-in http module, plus the one database driver (mysql2) actually needed to talk to MySQL.

**Why we need it:** For a public bounty submission, a judge or reader might want to run your project themselves. The fewer things they need to install, the more likely they actually can — and the less that can quietly go wrong in the process.

### The single most important design decision: connecting AS svc_ai_agent

**What it is:** The API's database connection code is configured to log in specifically as svc_ai_agent — the exact same restricted persona built and tested throughout D1 — never as root and never with any elevated account.

**Why we need it:** This is what makes the whole demonstration genuine rather than theoretical: when the API returns data, it is returning WHATEVER MYSQL ITSELF decided to show that specific persona. If the API ever accidentally returned a REAL email or card number instead of a masked one, that would immediately prove a serious configuration mistake — so checking this first, before building anything else, was the right instinct.

### A parameterized query, and why it resists SQL injection

**What it is:** Instead of building a SQL command by gluing a user's input directly into a string, a parameterized query uses a placeholder (?) and hands the actual value to the database driver separately. The driver then guarantees that value is treated as plain data, never as part of the SQL command itself.

**Why we need it:** This project deliberately tested sending a classic attack-style string (one designed to try to delete a table) as a customer code. Because the query was parameterized, MySQL treated it as a literal, nonsense code — returning an ordinary 404 ‘not found’, not an error, and not a dropped table. This is a textbook, directly observable proof that the API is not vulnerable to this specific, well-known kind of attack.

```js
// Safe: the code is a separate parameter, never glued into the SQL text
db.query('SELECT * FROM customer WHERE customer_code = ?', [code]);
```

### Where the password came from, and what happens if it's missing

**What it is:** Exactly like the root password in D0, svc_ai_agent's password is never typed into the API's code. The API reads it, once, from the same locked-down secrets file created back in D1, at the moment it starts up.

**Why we need it:** The project deliberately tested what happens if that file is missing: the server refuses to start at all, with a clear error, rather than silently falling back to an empty or default password. A program that fails loudly and safely is far better than one that fails quietly and insecurely.

## Part 8: New in D3 — Connecting a Real AI Model

### What is OCI Generative AI, briefly?

**What it is:** A cloud service from Oracle that lets you send a question (a “prompt”) to a large language model — in this project's case, Cohere Command A — and get back a generated, human-like reply, without needing to run the model yourself.

**Why we need it:** The project needed a way to ask an AI model to look at the masked customer data and decide what it means, in plain English, the same way a human support agent would.

### A real decision worth understanding: why NOT reuse the other project's AI connection directly

**What it is:** An existing AI connection (an OCI Function called jdv-genai-gateway) had already been built for the separate JSON Duality Views bounty project. Testing showed it genuinely could not be used yet: it requires a special access key that only an unfinished piece of infrastructure (an API Gateway) can supply, and trying to call it directly was correctly refused with a clear '401 Unauthorized' error.

**Why we need it:** Rather than go finish that OTHER project's unfinished infrastructure in the middle of THIS one, the project used a completely different, simpler, independent path instead: OCI's own command-line tool can talk to Generative AI directly, with no custom Function or Gateway needed at all. This kept the two separate public bounty projects fully independent of each other, which matters if a judge or reader tries to reproduce only one of them.

### A system preamble, and why it's given to the model before any real data

**What it is:** A preamble (sometimes called a 'system prompt') is a fixed instruction given to an AI model before the actual conversation, describing its role, its limits, and how it should behave. This project's preamble explicitly told the model it must never guess, invent, or ask for the real value behind any masked or hidden field.

**Why we need it:** This is a second, separate layer of protection on top of the database's own masking. The database guarantees the model is PHYSICALLY NEVER GIVEN the real data in the first place; the preamble is an additional, explicit instruction reinforcing the same boundary in how the model is expected to behave with whatever it does receive.

### The actual test, and why fact-checking the AI's answer mattered

**What it is:** The masked JSON for one specific, already-known test customer (CUST-0002, who has a deliberately built duplicate-charge scenario) was sent to the model with a question: diagnose the issue and draft a reply. The model's response was then checked, line by line, against the REAL, known seed data — not simply trusted because it sounded confident and well-written.

**Why we need it:** The model correctly identified both the active warranty and the duplicate payment using only masked values (e.g. 'card ending in 0102'), and never once asked for, guessed, or invented any real customer value. This is the single strongest piece of evidence in the whole project: a real AI model did genuinely useful diagnostic work while being physically unable to see the sensitive data underneath it.

### Why even a correct answer can still have real, worth-noting flaws

**What it is:** Fact-checking the model's response also caught four smaller issues: it invented a currency symbol that doesn't exist in the schema, it promised specific actions (like an immediate refund) that the AI persona has no authority to actually commit to, it treated the customer's own complaint as an established fact rather than something still to be confirmed, and its greeting used the masked name slightly awkwardly.

**Why we need it:** None of these are failures of the MASKING design — the core privacy guarantee held perfectly. But they are genuine, realistic observations about how an AI model behaves even when given correct, well-structured data, and they directly motivate a real design decision: any AI-drafted reply should go through a human review step (for example, the Supervisor persona) before it's actually sent to a customer.

## What Comes Next

This guide now covers D0 through D3's core proof. The next concepts you will meet, in the order the project will actually use them:

- Real tool-calling: instead of our own code fetching everything up front, the AI model itself will be given a list of available 'tools' (like get_warranty, get_orders) and allowed to decide which ones to call and when — the more realistic way a genuine AI agent operates.
- The mandatory web UI: a browser-based chat interface showing the agent's conversation alongside a masked-vs-unmasked side-by-side view, for the demo and future presentations.
- A deliberate red-team phase: trying to trick or break the masking from the agent's side, including a prompt-injection test using the service_ticket.problem_text column reserved for exactly this purpose.
- Deciding the open Auditor-hashing design question (Part 5) as part of a later defense-in-depth phase, alongside Enterprise Audit logging.

> **How to use this guide going forward**
>
> Keep this document open alongside the Project Checkpoint document. Whenever a new agent report introduces a term you haven't seen, check here first — if it's genuinely new, the next version of this guide will add it in the same style.
