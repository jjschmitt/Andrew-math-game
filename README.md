# 🌟 Math Adventure — Mastery Quest (Grades 2–8)

An interactive math game built around how kids actually learn: **mastery before moving on**, **effortful retrieval**, and **the right cognitive load at the right moment**. Pick a Pokémon ⚡ or Mario 🍄 buddy and work through a learning path aligned to NC / Common Core standards.

The game **starts at 2nd grade and secretly contains 3rd–8th grade too**: nothing about the higher grades is shown anywhere in the UI until every skill of the current grade is mastered — then a "LEVEL UP" celebration fires and the next grade's units simply appear on the map. From the child's point of view, the game just keeps growing as they conquer it.

**Grades are never named on screen.** The child only ever sees "Level 2" through "Level 8" — the word "grade" doesn't appear anywhere in the game, so an advanced kid can race ahead (or take their time) without comparing themselves to a school grade. The only grade reference left is the small standards code on each problem (e.g. `NC.3.OA.7`), kept for grown-ups.

## 🚀 How to Play

1. Open `index.html` in any modern browser (no install, no dependencies).
2. Pick your adventure buddy (Pokémon or Mario) — it flavors the word problems, praise, and rewards.
3. Open the **Learning Path** and start the first skill. Master it to unlock the next!
4. Once skills are mastered, run the **Flashback Warm-Up** at the start of each session to keep them strong.

Progress saves automatically in the browser (localStorage), so the game remembers where you left off.

**iPad-friendly:** on touch devices the game shows its own big-button number pad (with `:`, `/`, `.`, and `-` keys when a problem needs them) and suppresses the iOS keyboard entirely, so the problem never gets covered or scrolled away. Everything fits one screen in both orientations. For the best experience use Safari's Share → "Add to Home Screen" — it launches full-screen without browser bars.

## 🧠 The Learning Science Inside

### 1. Mastery before moving on
- Skills unlock **sequentially** — the next skill (and the next unit) opens only after the current one is mastered.
- Mastery is earned, not lucky: it takes **15 correct answers (3 in the scaffolded Learn phase + 12 in Practice), and the last 4 in a row**, so a child can't guess their way forward.
- Mastery is also **maintained**: if a mastered skill is missed twice in review, it quietly reopens for re-practice.

### 2. Effortful retrieval
- Answers are **typed from memory** (free recall), not multiple choice, wherever possible.
- Hints never appear automatically — the child must attempt first. A wrong answer earns a strategy cue and a **second effortful attempt** before anything is revealed.
- Mastered skills return as **"Flashback" questions** interleaved into practice (every 4th question) on an **expanding spacing schedule** — quick at first, then further and further apart as memory strengthens.
- The **Warm-Up** mode starts each session with 5 retrieval questions from previously mastered skills.

### 3. The right cognitive load at the right moment
- Every skill begins in a **Learn phase**: a worked example ("Make a Ten: 9 + 4 → 9 + 1 = 10, then 10 + 3 = 13") plus visual models — ten frames, base-ten blocks, arrays, clock faces.
- Through grade 5, most Learn-phase problems also open with a **hands-on manipulative**: the child builds the math by tapping and dragging — building arrays, dealing counters onto plates (with remainders), shading and comparing fraction bars, walking a rectangle's perimeter, advancing a clock, revealing area-model partial products, sliding digits ×10/÷10, building decimals, sweeping a ray to measure an angle, stacking cube layers for volume, and walking a rocket to a coordinate point — before typing the answer.
- Scaffolds **fade** as the child succeeds: Practice phase drops the worked example and visuals; Master-level and Flashback questions are pure retrieval with harder numbers.
- Scaffolds **return automatically** after two missed problems in a row — the visual model and first hint come back until the child is succeeding again.
- One problem, one screen, no timers — working memory goes to the math, not the interface.
- Wrong answers end with a short **worked explanation** ("62 − 38: 62 − 30 = 32, 32 − 8 = 24"), then a *similar* problem — never the same one, so the child can't just copy the answer.

## 📚 Curriculum (NC / CCSS, Grades 2–8)

### Grade 2 (visible from the start)

| Unit | Skills | Standards |
|---|---|---|
| ⚡ Fact Power to 20 | Make a ten, doubles, add & subtract within 20 | 2.OA.2 |
| 🔢 Place Value to 1,000 | Hundreds/tens/ones, expanded form, skip counting, comparing | 2.NBT.1–4 |
| ➕ Add & Subtract Within 100 | 10 more/less, 2-digit add (with regrouping), 2-digit subtract | 2.NBT.5, 2.NBT.8 |
| 📖 Word Problem Power | Addition, subtraction & comparison stories, two-step problems | 2.OA.1 |
| 💯 Big Numbers to 1,000 | 100 more/less, 3-digit addition & subtraction | 2.NBT.7–8 |
| ⏰ Time & Money | Clocks to 5 minutes, counting coins, making change | 2.MD.7–8 |
| 📏 Measurement | Comparing lengths, length word problems | 2.MD.4–5 |
| 🔷 Shapes, Sharing & Arrays | Odd/even, arrays & repeated addition, shapes, halves/thirds/fourths | 2.G.1–3, 2.OA.3–4 |

### Grade 3 (appears when all of grade 2 is mastered)

| Unit | Skills | Standards |
|---|---|---|
| ✖️ Multiplication Power | ×2/5/10 facts, all times tables, division facts, equal-group stories | 3.OA.1–7 |
| 🎯 Rounding & Bigger Moves | Rounding to 10s/100s, multiply by tens, two-step stories with × | 3.NBT, 3.OA.8 |
| 🍕 Fraction Foundations | Naming fractions, number line, comparing, equivalent fractions | 3.NF.1–3 |
| 📐 Area, Perimeter & Time | Area of rectangles, perimeter, elapsed time | 3.MD.1, 3.MD.7–8 |

### Grade 4 (appears when all of grade 3 is mastered)

| Unit | Skills | Standards |
|---|---|---|
| 🚀 Multiply Big | 2-digit × 1-digit, bigger multiplication, factors & primes, multi-step stories | 4.NBT.5, 4.OA.3–4 |
| ➗ Divide & Conquer | Remainders, dividing bigger numbers, interpreting-the-remainder stories | 4.NBT.6, 4.OA.3 |
| 🧩 Fraction Action | Equivalents, add/subtract like fractions, compare unlike, fraction of a number | 4.NF.1–4 |
| 📊 Decimals, Measures & Angles | Decimal notation & comparison, unit conversions, angle types & angle math | 4.NF.6–7, 4.MD |

### Grade 5 (appears when all of grade 4 is mastered)

| Unit | Skills | Standards |
|---|---|---|
| 🧮 Powers & Order of Operations | Order of operations, 2-digit × 2-digit, ×/÷ by 10/100/1000 | 5.OA.1, 5.NBT.2, 5.NBT.5 |
| 💎 Decimal Mastery | Add/subtract, multiply, and divide decimals | 5.NBT.7 |
| 🏆 Fraction Pro | Add/subtract unlike fractions, multiply fractions, divide with unit fractions | 5.NF.1, 5.NF.4, 5.NF.7 |
| 📦 Volume & the Coordinate Plane | Volume of boxes, coordinates | 5.MD.5, 5.G.1 |

### Grade 6 (appears when all of grade 5 is mastered)

| Unit | Skills | Standards |
|---|---|---|
| 🥤 Ratios, Rates & Percents | Equivalent ratios, unit rates, percent of a number | 6.RP |
| 🧊 Into the Negatives | Comparing negatives, the four quadrants, dividing fractions, GCF & LCM | 6.NS |
| 🔤 Expressions & Equations | Exponents, evaluating expressions, one-step equations | 6.EE |
| 📊 Area & Data | Area of parallelograms/triangles, mean & median | 6.G, 6.SP |

### Grade 7 (appears when all of grade 6 is mastered)

| Unit | Skills | Standards |
|---|---|---|
| 💰 Proportions & Percent Power | Solving proportions, discounts & tips | 7.RP |
| ➖ Integer Operations | Adding/subtracting integers, multiplying/dividing integers | 7.NS |
| ⚖️ Two-Step Equations | Two-step equations, the distributive property | 7.EE |
| 🎲 Circles, Angles & Chance | Circumference & area of circles, angle pairs, probability | 7.G, 7.SP |

### Grade 8 (appears when all of grade 7 is mastered)

| Unit | Skills | Standards |
|---|---|---|
| 🔬 Powers, Roots & Scientific Notation | Exponent rules, square/cube roots, scientific notation | 8.EE, 8.NS |
| 📈 Slopes & Equations | Slope, multi-step equations, evaluating functions | 8.EE, 8.F |
| 📐 Right Triangles & Volume | The Pythagorean theorem, volume in terms of π | 8.G |

The standard being practiced is shown on every problem, and strategy hints teach the mental-math strategies teachers use at each grade (make a ten, break numbers apart, common denominators, count up for change). Fraction answers accept any equivalent form (3/4, 6/8, or 1 1/2 for 3/2).

## 👨‍👩‍👧 For Parents

- A good session: one **Warm-Up** (about 2 minutes) plus 10–15 minutes on the current skill.
- The 🔄 icon on the path means a skill needs refreshing — the game noticed it slipping and scheduled it for review.
- Struggle is part of the design: the game asks for a second try before showing anything. Resist the urge to jump in — retrieval effort is what builds the memory.

## 🛠️ Technical Details

- Pure HTML, CSS, and JavaScript — no dependencies, no build step.
- `curriculum.js` — 95 skill definitions across grades 2–8, each with problem generators at three scaffold levels, hints, and worked explanations.
- `engine.js` — mastery tracking, grade-tier gating, spaced-review scheduling, adaptive scaffolding, theming, and localStorage persistence.
- To reset all progress, run `localStorage.removeItem('math-adventure-grade2-v1')` in the browser console.

## 📝 License

Educational project — use and modify freely for personal or educational purposes.

---

Have fun learning math! 🎉📚✨
