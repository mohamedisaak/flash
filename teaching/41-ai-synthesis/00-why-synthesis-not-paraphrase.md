# Why synthesis, not paraphrase

This is the most important lesson in the track. Every design decision in
`apps/synthesis` exists to serve the argument below. If you understand this, the
code is obvious; if you skip it, you will be tempted to "simplify" the feature
into the exact thing that gets news sites destroyed.

## The tempting shortcut (and why it fails)

The idea: *"I've crawled 500 articles. Let me run each through an AI that rewords
it and deletes any mention of the original outlet, then publish it as mine.
Free content, and Google won't know."*

Three separate walls this runs into:

### 1. Google actively penalises it

Google's spam policies name two things this does:

- **Scraped content** — "content copied from other sites… even if modified
  slightly." Rewording *is* the "modified slightly" case. It is called out
  explicitly.
- **Spammy automatically-generated content** — text produced primarily to
  manipulate rankings rather than help readers.

The enforcement isn't a gentle nudge. Sites built on spun content get **demoted
sitewide** or **deindexed** (removed from results entirely) — often all at once
during a core or spam update. The original outlet keeps the authority because it
published first and Google knows it. Your reworded copy is, at best, a weaker
duplicate competing against the source; at worst, it's flagged as spam and drags
your whole domain down.

> **Removing the attribution doesn't hide the copying — it's the tell.** Google
> compares your text against the web. A near-duplicate whose only edit is that
> the sources have been scrubbed is the textbook fingerprint of a content farm.

### 2. It's copyright infringement

Facts aren't copyrightable, but the *expression* of them is. A paraphrase that
tracks another article sentence-by-sentence is a **derivative work** — you need
a licence you don't have. News organisations issue DMCA takedowns and do sue.
"I changed the words" is not a defence; substantial similarity is judged on
structure and content, not verbatim matching.

### 3. It produces bad journalism

A single-source reword inherits every error, bias, and paywall gap of that one
source, and adds hallucinations on top. There's no cross-checking, no added
value, nothing a reader couldn't get better from the original.

## The legitimate version: synthesis

Real newsrooms *do* build on other outlets' reporting constantly. The move that
makes it legitimate is **synthesis**:

> Take the **facts** reported by **several** outlets, write a **genuinely new**
> article in your **own voice**, and **cite** the outlets you drew on.

This is how a wire-desk rewrite, a "what we know so far" explainer, or a roundup
works. It's not a loophole — it's the actual craft. And every property that
makes it good journalism is *also* a positive SEO signal:

| Property | Journalistic value | SEO value |
|---|---|---|
| Original prose | Your voice, your framing | Not a duplicate — indexable on its own |
| Multiple sources | Cross-checked, fuller picture | "Information gain" over any single source |
| Visible citations | Reader can verify | Outbound links to authorities = trust signal |
| Human editing | Accuracy, house style | E-E-A-T; editorial oversight |

## How the code encodes this

Each rule above is a specific mechanism in `apps/synthesis` — this is the
"why" behind the "what":

1. **Original prose, not paraphrase** → the system prompt in `prompts.py` bans
   copying/rewording and demands the facts be expressed anew. Low `temperature`
   keeps it grounded (faithful) without inventing.
2. **Grounded in real facts** → `services._gather_sources` feeds the model the
   actual reported content; the prompt forbids inventing quotes/numbers.
3. **Citations kept, never stripped** → `services._citations_html` appends a
   `Sources` block of **followed outbound links** to every piece. This is the
   literal opposite of the "remove linkages" request — and it's what protects
   you.
4. **Self-canonical** → the draft's `canonical_url` is left blank, declaring the
   piece canonical to itself (it's original), so there's no duplicate-content
   signal.
5. **Human-reviewed draft** → `services._create_draft` sets
   `status = DRAFT`. Nothing auto-publishes. A person reviews, edits, and
   decides — the editorial-oversight signal and your legal safety margin.
6. **Provenance recorded** → every run writes a `SynthesisJob` linking the draft
   to its exact sources, so you can always show your work.

## The one-sentence version

> You can't outrank the outlet you copied by copying it — you outrank nobody and
> risk your whole domain. Synthesise many sources into something original, credit
> them openly, and have a human sign off. That's the only version that both works
> and lasts.

Next: [how we run the model for free on your own server →](01-llm-providers-and-ollama.md)
