# Example study pack (optional)

Interview-prep content for the Tasks app, for **computer architecture / chip-design / AI-hardware** interviews:

- 9 tracks (computer architecture, SoC design, operating systems, GPU basics, ML accelerators, ML systems, MLIR/compilers, memory systems, RTL design with CDC and timing), 51 modules and ~240 items: lecture videos (mostly free university courses on YouTube), papers and exercises, each with an estimated time.
- ~500 flashcards, ~350 multiple-choice quiz questions, ~170 interview questions with model answers (sources in each question's `source` column).
- 3 focus presets (an internship-season order, an architecture & AI-accelerator role, an RTL & embedded-firmware role).

All progress is empty. Load it once (it uses `INSERT OR IGNORE`, so loading twice changes nothing):

```
cd site
npx wrangler d1 execute DB --local --file ../examples/study-pack/study-pack.sql     # your PC
npx wrangler d1 execute DB --remote --file ../examples/study-pack/study-pack.sql    # the live site (after deploying)
```

Another field? Ask your agent to write a pack for it in the same tables (`prep_tracks`, `prep_modules`, `prep_items`, `cards`, `quiz_questions`, `questions`), with a source for every item, and load it the same way.
