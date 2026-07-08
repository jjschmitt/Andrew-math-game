# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

A browser-based math game for kids. Static site with no build step:
`index.html` loads `engine.js` (game logic), `curriculum.js` (question
content), `manipulatives.js` (interactive Learn-phase widgets), and
`style.css`. Open `index.html` directly or serve the directory with any
static file server to run it.

## Model delegation policy

For all coding tasks in this repo (writing, editing, or refactoring code),
do NOT implement directly in the main conversation. Instead:

1. Use your judgement to pick an appropriate lower-power model for the task:
   - `haiku` for simple, mechanical, or well-specified changes (small edits,
     renames, copy tweaks, straightforward bug fixes).
   - `sonnet` for moderate tasks needing more reasoning (new features,
     multi-file changes, trickier bug fixes).
2. Launch that model in a subagent via the Agent tool, passing the chosen
   model with the `model` parameter and a complete, self-contained prompt
   (relevant file paths, requirements, and constraints).
3. Review the subagent's result in the main conversation and verify it
   before committing.

The main (higher-power) model should be reserved for planning, review,
verification, and answering questions — not routine implementation work.
