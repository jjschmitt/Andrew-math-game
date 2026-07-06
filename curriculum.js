// ============================================================
// 2nd Grade Math Curriculum
// Aligned to NC 2nd Grade / CCSS Grade 2 standards.
//
// Every skill exposes generate(level):
//   level 1 = Learn   (scaffolded: visuals shown, friendlier numbers)
//   level 2 = Practice (grade-level numbers, visuals only via hints)
//   level 3 = Master / Review (pure retrieval from memory)
//
// Problems are plain objects:
//   { prompt, visual, answerType: 'number'|'text'|'time'|'choice',
//     choices?, answer, hints: [...], explain }
// ============================================================

const R = {
    int(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
};

const KID_NAMES = ['Maya', 'Leo', 'Ava', 'Sam', 'Zoe', 'Eli', 'Mia', 'Noah', 'Ruby', 'Jack', 'Andrew'];

function heroName() {
    const theme = (typeof window !== 'undefined' && window.MathTheme) || null;
    const pool = theme ? KID_NAMES.concat(theme.heroes) : KID_NAMES;
    return R.pick(pool);
}

function twoHeroNames() {
    const a = heroName();
    let b = heroName();
    while (b === a) b = heroName();
    return [a, b];
}

function themeThing() {
    const theme = (typeof window !== 'undefined' && window.MathTheme) || null;
    if (theme) return R.pick(theme.items);
    return R.pick([
        { name: 'marbles', icon: '🔵' },
        { name: 'stickers', icon: '⭐' },
        { name: 'shells', icon: '🐚' },
        { name: 'blocks', icon: '🟦' }
    ]);
}

function pad2(n) {
    return n < 10 ? '0' + n : String(n);
}

// ------------------------------------------------------------
// Visual builders (self-contained HTML/SVG strings)
// ------------------------------------------------------------

function tenFrame(filled, cross = 0) {
    // cross = how many of the LAST filled cells get an X (for subtraction)
    let cells = '';
    for (let i = 0; i < 10; i++) {
        let cls = 'tf-cell';
        if (i < filled) {
            cls += ' filled';
            if (cross > 0 && i >= filled - cross) cls += ' crossed';
        }
        cells += `<div class="${cls}"></div>`;
    }
    return `<div class="ten-frame">${cells}</div>`;
}

function twoTenFrames(a, b) {
    return `<div class="visual-row">${tenFrame(a)}${tenFrame(b)}</div>`;
}

function subFrames(m, s) {
    // m is between 11 and 20; cross out s counters starting from the second frame
    const f2 = m - 10;
    const crossIn2 = Math.min(s, f2);
    const crossIn1 = s - crossIn2;
    return `<div class="visual-row">${tenFrame(10, crossIn1)}${tenFrame(f2, crossIn2)}</div>`;
}

function baseTenBlocks(h, t, o) {
    let html = '<div class="base-ten">';
    if (h > 0) html += '<div class="bt-group">' + '<div class="bt-hundred"></div>'.repeat(h) + '</div>';
    if (t > 0) html += '<div class="bt-group">' + '<div class="bt-ten"></div>'.repeat(t) + '</div>';
    if (o > 0) html += '<div class="bt-group">' + '<div class="bt-one"></div>'.repeat(o) + '</div>';
    html += '</div>';
    return html;
}

function baseTenPair(a, b) {
    const blocks = n => baseTenBlocks(Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10);
    return `<div class="bt-pair">
        <div class="bt-side"><div class="bt-label">${a}</div>${blocks(a)}</div>
        <div class="bt-plus">+</div>
        <div class="bt-side"><div class="bt-label">${b}</div>${blocks(b)}</div>
    </div>`;
}

function dotArray(rows, cols, icon) {
    let html = '<div class="dot-array">';
    for (let r = 0; r < rows; r++) {
        html += '<div class="array-row">' + `<span class="array-item">${icon}</span>`.repeat(cols) + '</div>';
    }
    html += '</div>';
    return html;
}

function pairDots(n) {
    // Columns of 2 to show even/odd pairing; leftover dot highlighted
    const pairs = Math.floor(n / 2);
    const leftover = n % 2;
    let html = '<div class="pairs">';
    for (let i = 0; i < pairs; i++) {
        html += '<div class="pair-col"><span class="pair-dot"></span><span class="pair-dot"></span></div>';
    }
    if (leftover) html += '<div class="pair-col"><span class="pair-dot leftover"></span></div>';
    html += '</div>';
    return html;
}

function clockSVG(h, m) {
    const cx = 60, cy = 60;
    let nums = '';
    for (let i = 0; i < 12; i++) {
        const ang = (i * 30) * Math.PI / 180;
        const x = cx + Math.sin(ang) * 44;
        const y = cy - Math.cos(ang) * 44;
        nums += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" class="clock-num">${i === 0 ? 12 : i}</text>`;
    }
    const mAng = (m * 6) * Math.PI / 180;
    const hAng = ((h % 12) * 30 + m / 2) * Math.PI / 180;
    const mx = cx + Math.sin(mAng) * 36, my = cy - Math.cos(mAng) * 36;
    const hx = cx + Math.sin(hAng) * 24, hy = cy - Math.cos(hAng) * 24;
    return `<svg class="clock" viewBox="0 0 120 120" width="170" height="170" role="img" aria-label="analog clock">
        <circle cx="60" cy="60" r="56" class="clock-face"/>
        ${nums}
        <line x1="60" y1="60" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" class="hand hour"/>
        <line x1="60" y1="60" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" class="hand minute"/>
        <circle cx="60" cy="60" r="3.5" class="clock-center"/>
    </svg>`;
}

const COIN_TYPES = {
    quarter: { value: 25, label: '25¢', cls: 'quarter' },
    dime: { value: 10, label: '10¢', cls: 'dime' },
    nickel: { value: 5, label: '5¢', cls: 'nickel' },
    penny: { value: 1, label: '1¢', cls: 'penny' }
};

function coinsHTML(counts) {
    // counts = {quarter: n, dime: n, nickel: n, penny: n}
    let html = '<div class="coins">';
    for (const kind of ['quarter', 'dime', 'nickel', 'penny']) {
        const n = counts[kind] || 0;
        for (let i = 0; i < n; i++) {
            html += `<span class="coin ${COIN_TYPES[kind].cls}">${COIN_TYPES[kind].label}</span>`;
        }
    }
    html += '</div>';
    return html;
}

function coinsValue(counts) {
    let total = 0;
    for (const kind in counts) total += COIN_TYPES[kind].value * counts[kind];
    return total;
}

function lengthBars(aLen, aName, bLen, bName) {
    const scale = 3;
    return `<div class="bars">
        <div class="bar-row"><div class="bar bar-a" style="width:${aLen * scale}px"></div><span class="bar-label">${aName}: ${aLen} cm</span></div>
        <div class="bar-row"><div class="bar bar-b" style="width:${bLen * scale}px"></div><span class="bar-label">${bName}: ${bLen} cm</span></div>
    </div>`;
}

function regularPolygonPoints(n, cx = 60, cy = 62, r = 46) {
    const pts = [];
    for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / n;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
}

const SHAPE_DEFS = {
    triangle: { sides: 3, points: () => regularPolygonPoints(3) },
    quadrilateral: {
        sides: 4,
        points: () => R.pick([
            '25,25 95,25 95,95 25,95',      // square
            '15,38 105,38 105,86 15,86',    // rectangle
            '38,30 82,30 104,92 16,92'      // trapezoid
        ])
    },
    pentagon: { sides: 5, points: () => regularPolygonPoints(5) },
    hexagon: { sides: 6, points: () => regularPolygonPoints(6) }
};

const SHAPE_LABELS = { triangle: 'Triangle', quadrilateral: 'Quadrilateral', pentagon: 'Pentagon', hexagon: 'Hexagon' };

function shapeSVG(name) {
    return `<svg class="shape-svg" viewBox="0 0 120 120" width="150" height="150"><polygon points="${SHAPE_DEFS[name].points()}"/></svg>`;
}

function fractionRect(parts, shaded) {
    const w = 240, hgt = 90;
    const pw = w / parts;
    let html = `<svg class="frac-svg" viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}">`;
    for (let i = 0; i < parts; i++) {
        const cls = i < shaded ? 'frac-part shaded' : 'frac-part';
        html += `<rect x="${i * pw}" y="0" width="${pw}" height="${hgt}" class="${cls}"/>`;
    }
    html += '</svg>';
    return html;
}

// ------------------------------------------------------------
// The curriculum
// ------------------------------------------------------------

const CURRICULUM = {
    units: [
        // ============ UNIT 1 ============
        {
            id: 'facts20',
            title: 'Fact Power to 20',
            icon: '⚡',
            standard: 'NC.2.OA.2',
            prereq: null,
            skills: [
                {
                    id: 'make-ten',
                    title: 'Make a Ten',
                    standard: 'NC.2.OA.2',
                    learnIntro: '<strong>Strategy: Make a Ten!</strong><br>9 + 4 → 9 needs 1 more to make 10.<br>Take 1 from the 4: 9 + 1 = 10, then 10 + 3 = <strong>13</strong>.',
                    generate(level) {
                        const a = level === 1 ? 9 : R.pick(level === 2 ? [8, 9] : [7, 8, 9]);
                        const need = 10 - a;
                        const b = R.int(need + 1, 9);
                        const rest = b - need;
                        return {
                            prompt: `${a} + ${b} = ?`,
                            visual: level < 3 ? twoTenFrames(a, b) : null,
                            answerType: 'number',
                            answer: a + b,
                            hints: [
                                `How many more does ${a} need to make 10?`,
                                `${a} needs ${need} more. Take ${need} from the ${b} — that leaves ${rest}.`,
                                `${a} + ${need} = 10, and 10 + ${rest} = ?`
                            ],
                            explain: `Make a ten: ${a} + ${need} = 10, then 10 + ${rest} = ${a + b}.`
                        };
                    }
                },
                {
                    id: 'doubles',
                    title: 'Doubles & Near Doubles',
                    standard: 'NC.2.OA.2',
                    learnIntro: '<strong>Strategy: Use Doubles!</strong><br>If you know 7 + 7 = 14, then 7 + 8 is just one more: <strong>15</strong>.',
                    generate(level) {
                        const n = R.int(2, level === 1 ? 8 : 9);
                        if (level === 1 || (level >= 2 && Math.random() < 0.3)) {
                            return {
                                prompt: `${n} + ${n} = ?`,
                                visual: level === 1 ? dotArray(2, n, '🔵') : null,
                                answerType: 'number',
                                answer: n + n,
                                hints: [
                                    `This is a double! Two equal groups of ${n}.`,
                                    `${n} + ${n} is the same as 2 groups of ${n}.`,
                                    `Count the two rows of dots together.`
                                ],
                                explain: `Double ${n}: ${n} + ${n} = ${n + n}.`
                            };
                        }
                        const [x, y] = R.shuffle([n, n + 1]);
                        return {
                            prompt: `${x} + ${y} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: n + n + 1,
                            hints: [
                                `This is a near double! It is close to ${n} + ${n}.`,
                                `${n} + ${n} = ${n + n}. Now add 1 more.`
                            ],
                            explain: `Near double: ${n} + ${n} = ${n + n}, plus 1 more = ${n + n + 1}.`
                        };
                    }
                },
                {
                    id: 'add-within-20',
                    title: 'Add Within 20',
                    standard: 'NC.2.OA.2',
                    learnIntro: '<strong>Mix your strategies!</strong><br>Count on from the bigger number, use doubles, or make a ten — whichever is fastest for YOUR brain.',
                    generate(level) {
                        let a, b;
                        if (level === 1) {
                            a = R.int(6, 9);
                            b = R.int(3, 9);
                        } else if (level === 2 || Math.random() < 0.5) {
                            a = R.int(4, 9);
                            b = R.int(4, 9);
                        } else {
                            a = R.int(11, 16);
                            b = R.int(2, 20 - a);
                        }
                        const big = Math.max(a, b), small = Math.min(a, b);
                        return {
                            prompt: `${a} + ${b} = ?`,
                            visual: level === 1 && a <= 10 && b <= 10 ? twoTenFrames(a, b) : null,
                            answerType: 'number',
                            answer: a + b,
                            hints: [
                                `Start at the bigger number, ${big}, and count on ${small} more.`,
                                `Could you make a ten? Or use a double you know?`,
                                `${big} + ${small}: count ${big}... ${big + 1}, ${big + 2}...`
                            ],
                            explain: `${a} + ${b} = ${a + b}. Start at ${big} and count on ${small}.`
                        };
                    }
                },
                {
                    id: 'sub-within-20',
                    title: 'Subtract Within 20',
                    standard: 'NC.2.OA.2',
                    learnIntro: '<strong>Strategy: Think Addition!</strong><br>13 − 5 = ? asks the same thing as 5 + ? = 13.<br>You already know your addition facts — use them backwards!',
                    generate(level) {
                        let m, s;
                        if (level === 1) {
                            m = R.int(11, 15);
                            s = R.int(2, m - 6);
                        } else if (level === 2) {
                            m = R.int(11, 18);
                            s = R.int(3, 9);
                        } else {
                            m = R.int(12, 20);
                            s = R.int(4, 9);
                        }
                        const ans = m - s;
                        return {
                            prompt: `${m} − ${s} = ?`,
                            visual: level === 1 ? subFrames(m, s) : null,
                            answerType: 'number',
                            answer: ans,
                            hints: [
                                `Think addition: ${s} + ? = ${m}.`,
                                `Count up from ${s} to ${m}. How many hops?`,
                                `Or count back: start at ${m} and take away ${s}.`
                            ],
                            explain: `${m} − ${s} = ${ans}, because ${s} + ${ans} = ${m}.`
                        };
                    }
                }
            ]
        },

        // ============ UNIT 2 ============
        {
            id: 'placeValue',
            title: 'Place Value to 1,000',
            icon: '🔢',
            standard: 'NC.2.NBT.1–4',
            prereq: 'facts20',
            skills: [
                {
                    id: 'hundreds-tens-ones',
                    title: 'Hundreds, Tens & Ones',
                    standard: 'NC.2.NBT.1',
                    learnIntro: '<strong>Big idea: bundles!</strong><br>10 ones make a ten. 10 tens make a hundred.<br>The number 347 means 3 hundreds, 4 tens, 7 ones.',
                    generate(level) {
                        if (level < 3) {
                            const h = level === 1 ? R.int(1, 3) : R.int(1, 6);
                            const t = level === 1 ? R.int(0, 4) : R.int(0, 8);
                            const o = R.int(0, 9);
                            const n = h * 100 + t * 10 + o;
                            return {
                                prompt: 'What number do the base-ten blocks show?',
                                visual: baseTenBlocks(h, t, o),
                                answerType: 'number',
                                answer: n,
                                hints: [
                                    `Count the big squares (hundreds) first: ${h}.`,
                                    `${h} hundreds = ${h * 100}, ${t} tens = ${t * 10}, ${o} ones = ${o}.`,
                                    `${h * 100} + ${t * 10} + ${o} = ?`
                                ],
                                explain: `${h} hundreds + ${t} tens + ${o} ones = ${n}.`
                            };
                        }
                        const digits = [R.int(1, 9), R.int(1, 9), R.int(1, 9)];
                        const n = digits[0] * 100 + digits[1] * 10 + digits[2];
                        const posIdx = R.int(0, 2);
                        const posName = ['hundreds', 'tens', 'ones'][posIdx];
                        const digit = digits[posIdx];
                        const value = digit * [100, 10, 1][posIdx];
                        return {
                            prompt: `What is the VALUE of the digit in the ${posName} place in ${n}?`,
                            visual: null,
                            answerType: 'number',
                            answer: value,
                            hints: [
                                `In ${n}, the ${posName} digit is ${digit}.`,
                                `A ${digit} in the ${posName} place is worth ${digit} ${posName}.`
                            ],
                            explain: `The ${digit} is in the ${posName} place, so it is worth ${value}.`
                        };
                    }
                },
                {
                    id: 'expanded-form',
                    title: 'Expanded Form',
                    standard: 'NC.2.NBT.3',
                    learnIntro: '<strong>Stretch numbers out!</strong><br>628 = 600 + 20 + 8.<br>Expanded form shows what each digit is really worth.',
                    generate(level) {
                        const h = R.int(1, 9);
                        const t = level === 1 ? R.int(1, 9) : R.int(0, 9);
                        const o = level === 1 ? R.int(1, 9) : R.int(0, 9);
                        const n = h * 100 + t * 10 + o;
                        if (level < 3) {
                            const parts = [h * 100];
                            if (t > 0) parts.push(t * 10);
                            if (o > 0) parts.push(o);
                            return {
                                prompt: `${parts.join(' + ')} = ?`,
                                visual: level === 1 ? baseTenBlocks(h, t, o) : null,
                                answerType: 'number',
                                answer: n,
                                hints: [
                                    `${h * 100} means ${h} hundreds.`,
                                    `Put the pieces together: hundreds, then tens, then ones.`
                                ],
                                explain: `${parts.join(' + ')} = ${n}.`
                            };
                        }
                        return {
                            prompt: `What number has ${h} hundreds, ${t} tens, and ${o} ones?`,
                            visual: null,
                            answerType: 'number',
                            answer: n,
                            hints: [
                                `Write the digits in order: hundreds, tens, ones.`,
                                `${h} hundreds = ${h * 100}. Now add ${t} tens and ${o} ones.`
                            ],
                            explain: `${h} hundreds, ${t} tens, ${o} ones → ${n}.`
                        };
                    }
                },
                {
                    id: 'skip-counting',
                    title: 'Skip Counting (5s, 10s, 100s)',
                    standard: 'NC.2.NBT.2',
                    learnIntro: '<strong>Count in jumps!</strong><br>By 5s: 340, 345, 350, 355...<br>By 100s: 137, 237, 337... only the hundreds digit changes!',
                    generate(level) {
                        const step = level === 1 ? R.pick([5, 10]) : R.pick([5, 10, 100]);
                        let start;
                        if (step === 5) start = R.int(2, 180) * 5;
                        else if (step === 10) start = R.int(1, 90) * 10;
                        else start = R.int(1, 6) * 100 + (level === 3 ? R.int(0, 9) * 10 : 0);
                        const seq = [0, 1, 2, 3].map(i => start + i * step);
                        const blankIdx = level < 3 ? 3 : R.int(1, 2);
                        const shown = seq.map((v, i) => (i === blankIdx ? '___' : String(v)));
                        return {
                            prompt: `Skip count by ${step}s. What number goes in the blank?<br><span class="seq">${shown.join(', ')}</span>`,
                            visual: null,
                            answerType: 'number',
                            answer: seq[blankIdx],
                            hints: [
                                `Each jump adds ${step}.`,
                                blankIdx === 3
                                    ? `What is ${seq[2]} + ${step}?`
                                    : `What is ${seq[blankIdx - 1]} + ${step}?`
                            ],
                            explain: `Counting by ${step}s: ${seq.join(', ')}. The blank is ${seq[blankIdx]}.`
                        };
                    }
                },
                {
                    id: 'compare-numbers',
                    title: 'Compare Numbers (<, >, =)',
                    standard: 'NC.2.NBT.4',
                    learnIntro: '<strong>Compare like a detective!</strong><br>Check hundreds first. Tie? Check tens. Tie again? Check ones.<br>The open mouth of &lt; and &gt; always eats the BIGGER number!',
                    generate(level) {
                        let a, b;
                        if (level === 1) {
                            a = R.int(1, 9) * 100 + R.int(0, 99);
                            do { b = R.int(1, 9) * 100 + R.int(0, 99); } while (Math.floor(b / 100) === Math.floor(a / 100));
                        } else if (level === 2) {
                            const h = R.int(1, 9);
                            a = h * 100 + R.int(0, 99);
                            do { b = h * 100 + R.int(0, 99); } while (b === a);
                        } else {
                            const h = R.int(1, 9), t = R.int(0, 9), o = R.int(0, 9);
                            a = h * 100 + t * 10 + o;
                            b = Math.random() < 0.15 ? a : h * 100 + o * 10 + t; // digit-swap trap (or equal)
                        }
                        const answer = a < b ? '<' : a > b ? '>' : '=';
                        return {
                            prompt: `Which symbol makes this true?<br><span class="compare-nums">${a} &nbsp; ? &nbsp; ${b}</span>`,
                            visual: null,
                            answerType: 'choice',
                            choices: ['<', '>', '='],
                            answer,
                            hints: [
                                `Compare the hundreds digits first: ${Math.floor(a / 100)} and ${Math.floor(b / 100)}.`,
                                `If hundreds match, compare tens: ${Math.floor(a / 10) % 10} and ${Math.floor(b / 10) % 10}.`,
                                `The symbol opens toward the bigger number.`
                            ],
                            explain: `${a} ${answer === '=' ? 'equals' : answer === '<' ? 'is less than' : 'is greater than'} ${b}, so ${a} ${answer} ${b}.`
                        };
                    }
                }
            ]
        },

        // ============ UNIT 3 ============
        {
            id: 'within100',
            title: 'Add & Subtract Within 100',
            icon: '➕',
            standard: 'NC.2.NBT.5–8',
            prereq: 'placeValue',
            skills: [
                {
                    id: 'ten-more-less',
                    title: '10 More, 10 Less',
                    standard: 'NC.2.NBT.8',
                    learnIntro: '<strong>Zoom by tens!</strong><br>47 + 10 = 57. Only the tens digit changes — the ones digit stays the same.',
                    generate(level) {
                        const n = R.int(15, 85);
                        const plus = Math.random() < 0.5;
                        const answer = plus ? n + 10 : n - 10;
                        const phrasing = level === 3 && Math.random() < 0.5
                            ? `What is 10 ${plus ? 'more than' : 'less than'} ${n}?`
                            : `${n} ${plus ? '+' : '−'} 10 = ?`;
                        return {
                            prompt: phrasing,
                            visual: level === 1 ? baseTenBlocks(0, Math.floor(n / 10), n % 10) : null,
                            answerType: 'number',
                            answer,
                            hints: [
                                `Only the tens digit changes!`,
                                `${n} has ${Math.floor(n / 10)} tens. ${plus ? 'Add' : 'Take away'} one ten.`
                            ],
                            explain: `${n} ${plus ? '+' : '−'} 10 = ${answer}. The ones digit stays ${n % 10}.`
                        };
                    }
                },
                {
                    id: 'add-2digit',
                    title: 'Add 2-Digit Numbers',
                    standard: 'NC.2.NBT.5',
                    learnIntro: '<strong>Strategy: Tens first!</strong><br>34 + 25 → add the tens (30 + 20 = 50), add the ones (4 + 5 = 9), then put them together: <strong>59</strong>.',
                    generate(level) {
                        const t1 = R.int(1, 5), t2 = R.int(1, Math.min(8 - t1, 4) + (level > 1 ? 1 : 0));
                        const o1 = R.int(0, 8), o2 = R.int(0, 9 - o1);
                        const a = t1 * 10 + o1, b = t2 * 10 + o2;
                        return {
                            prompt: `${a} + ${b} = ?`,
                            visual: level === 1 ? baseTenPair(a, b) : null,
                            answerType: 'number',
                            answer: a + b,
                            hints: [
                                `Add the tens first: ${t1 * 10} + ${t2 * 10} = ${(t1 + t2) * 10}.`,
                                `Now the ones: ${o1} + ${o2} = ${o1 + o2}.`,
                                `Put them together: ${(t1 + t2) * 10} + ${o1 + o2} = ?`
                            ],
                            explain: `${a} + ${b}: tens ${t1 * 10} + ${t2 * 10} = ${(t1 + t2) * 10}, ones ${o1} + ${o2} = ${o1 + o2}, together ${a + b}.`
                        };
                    }
                },
                {
                    id: 'add-2digit-regroup',
                    title: 'Add with Regrouping',
                    standard: 'NC.2.NBT.5',
                    learnIntro: '<strong>Trade 10 ones for 1 ten!</strong><br>47 + 25 → 47 + 20 = 67, then 67 + 5 = <strong>72</strong>.<br>The ones made more than ten, so a new ten appeared!',
                    generate(level) {
                        const o1 = R.int(3, 9), o2 = R.int(10 - o1, 9);
                        const t1 = R.int(1, 5), t2 = R.int(1, Math.max(1, 8 - t1));
                        const a = t1 * 10 + o1, b = t2 * 10 + o2;
                        return {
                            prompt: `${a} + ${b} = ?`,
                            visual: level === 1 ? baseTenPair(a, b) : null,
                            answerType: 'number',
                            answer: a + b,
                            hints: [
                                `Try adding in two hops: first the tens, then the ones.`,
                                `${a} + ${t2 * 10} = ${a + t2 * 10}.`,
                                `Now add the ones: ${a + t2 * 10} + ${o2} = ?`
                            ],
                            explain: `${a} + ${b}: ${a} + ${t2 * 10} = ${a + t2 * 10}, then + ${o2} = ${a + b}.`
                        };
                    }
                },
                {
                    id: 'sub-2digit',
                    title: 'Subtract 2-Digit Numbers',
                    standard: 'NC.2.NBT.5',
                    learnIntro: '<strong>Subtract in hops!</strong><br>62 − 38 → 62 − 30 = 32, then 32 − 8 = <strong>24</strong>.<br>Take away the tens first, then the ones.',
                    generate(level) {
                        let a, b;
                        if (level === 1) {
                            const t1 = R.int(3, 8), t2 = R.int(1, t1 - 1);
                            const o1 = R.int(3, 9), o2 = R.int(0, o1 - 1);
                            a = t1 * 10 + o1; b = t2 * 10 + o2;
                        } else {
                            const t1 = R.int(3, 9), t2 = R.int(1, t1 - 1);
                            const o1 = R.int(0, 6), o2 = R.int(o1 + 1, 9); // forces regrouping
                            a = t1 * 10 + o1; b = t2 * 10 + o2;
                        }
                        const afterTens = a - Math.floor(b / 10) * 10;
                        return {
                            prompt: `${a} − ${b} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: a - b,
                            hints: [
                                `Take away the tens first: ${a} − ${Math.floor(b / 10) * 10} = ${afterTens}.`,
                                `Now take away the ones: ${afterTens} − ${b % 10} = ?`,
                                `Or think addition: ${b} + ? = ${a}.`
                            ],
                            explain: `${a} − ${b}: ${a} − ${Math.floor(b / 10) * 10} = ${afterTens}, then − ${b % 10} = ${a - b}.`
                        };
                    }
                }
            ]
        },

        // ============ UNIT 4 ============
        {
            id: 'wordProblems',
            title: 'Word Problem Power',
            icon: '📖',
            standard: 'NC.2.OA.1',
            prereq: 'within100',
            skills: [
                {
                    id: 'wp-add',
                    title: 'Addition Stories',
                    standard: 'NC.2.OA.1',
                    learnIntro: '<strong>Be a math detective!</strong><br>Read the story. Ask: what do I know? What am I looking for?<br>"More", "found", "got" usually mean the total is growing.',
                    generate(level) {
                        const item = themeThing();
                        const name = heroName();
                        const a = level === 1 ? R.int(12, 35) : R.int(18, 55);
                        const b = level === 1 ? R.int(10, 25) : R.int(13, Math.min(44, 99 - a));
                        if (level === 3 && Math.random() < 0.5) {
                            const total = a + b;
                            return {
                                prompt: `${name} had ${a} ${item.name} ${item.icon}. After finding some more, ${name} had ${total}. How many did ${name} find?`,
                                visual: null,
                                answerType: 'number',
                                answer: b,
                                hints: [
                                    `${name} started with ${a} and ended with ${total}.`,
                                    `Think: ${a} + ? = ${total}.`,
                                    `Count up from ${a} to ${total}.`
                                ],
                                explain: `${a} + ${b} = ${total}, so ${name} found ${b} ${item.name}.`
                            };
                        }
                        return {
                            prompt: `${name} had ${a} ${item.name} ${item.icon}. Then ${name} found ${b} more. How many ${item.name} does ${name} have now?`,
                            visual: null,
                            answerType: 'number',
                            answer: a + b,
                            hints: [
                                `What do you know? ${a} to start, then ${b} more.`,
                                `"Found more" means the pile grows — add!`,
                                `${a} + ${b} = ?`
                            ],
                            explain: `${a} + ${b} = ${a + b} ${item.name}.`
                        };
                    }
                },
                {
                    id: 'wp-sub',
                    title: 'Subtraction & Comparing Stories',
                    standard: 'NC.2.OA.1',
                    learnIntro: '<strong>Two kinds of subtraction stories:</strong><br>Taking away ("gave away 15") and comparing ("how many MORE?").<br>Both use subtraction!',
                    generate(level) {
                        const item = themeThing();
                        const [name1, name2] = twoHeroNames();
                        if (level >= 2 && Math.random() < 0.5) {
                            const big = R.int(40, 95), small = R.int(15, big - 12);
                            return {
                                prompt: `${name1} has ${big} ${item.name} ${item.icon}. ${name2} has ${small}. How many MORE does ${name1} have than ${name2}?`,
                                visual: null,
                                answerType: 'number',
                                answer: big - small,
                                hints: [
                                    `Comparing means finding the difference.`,
                                    `Think: ${small} + ? = ${big}.`,
                                    `${big} − ${small} = ?`
                                ],
                                explain: `${big} − ${small} = ${big - small}. ${name1} has ${big - small} more.`
                            };
                        }
                        const a = level === 1 ? R.int(20, 40) : R.int(35, 90);
                        const b = level === 1 ? R.int(8, a - 8) : R.int(14, a - 10);
                        return {
                            prompt: `${name1} had ${a} ${item.name} ${item.icon}. ${name1} gave ${b} to ${name2}. How many ${item.name} does ${name1} have left?`,
                            visual: null,
                            answerType: 'number',
                            answer: a - b,
                            hints: [
                                `"Gave away" means the pile shrinks — subtract!`,
                                `${a} − ${b} = ?`,
                                `Try taking away the tens of ${b} first, then the ones.`
                            ],
                            explain: `${a} − ${b} = ${a - b} ${item.name} left.`
                        };
                    }
                },
                {
                    id: 'wp-two-step',
                    title: 'Two-Step Stories',
                    standard: 'NC.2.OA.1',
                    learnIntro: '<strong>Some stories take TWO steps!</strong><br>Solve the first part, hold that number in your head, then do the second part.',
                    generate(level) {
                        const item = themeThing();
                        const name = heroName();
                        const a = level === 1 ? R.int(15, 30) : R.int(25, 50);
                        const b = level === 1 ? R.int(8, 20) : R.int(12, 30);
                        const c = R.int(6, Math.min(a + b - 5, level === 1 ? 15 : 35));
                        return {
                            prompt: `${name} had ${a} ${item.name} ${item.icon}. ${name} earned ${b} more, but then used ${c}. How many ${item.name} does ${name} have now?`,
                            visual: null,
                            answerType: 'number',
                            answer: a + b - c,
                            hints: [
                                `Step 1: ${a} + ${b} = ?`,
                                `Step 1 gives ${a + b}. Now step 2: take away ${c}.`,
                                `${a + b} − ${c} = ?`
                            ],
                            explain: `Step 1: ${a} + ${b} = ${a + b}. Step 2: ${a + b} − ${c} = ${a + b - c}.`
                        };
                    }
                }
            ]
        },

        // ============ UNIT 5 ============
        {
            id: 'within1000',
            title: 'Big Numbers to 1,000',
            icon: '💯',
            standard: 'NC.2.NBT.7–8',
            prereq: 'wordProblems',
            skills: [
                {
                    id: 'hundred-more-less',
                    title: '100 More, 100 Less',
                    standard: 'NC.2.NBT.8',
                    learnIntro: '<strong>Zoom by hundreds!</strong><br>456 + 100 = 556. Only the hundreds digit changes.<br>456 + 10 = 466. Only the tens digit changes (usually!).',
                    generate(level) {
                        const n = R.int(150, 850);
                        const amount = level === 1 ? 100 : R.pick([10, 100]);
                        let plus = Math.random() < 0.5;
                        if (level < 3 && amount === 10) {
                            // avoid crossing a hundred until Master level
                            const tens = Math.floor(n / 10) % 10;
                            if (plus && tens === 9) plus = false;
                            if (!plus && tens === 0) plus = true;
                        }
                        const answer = plus ? n + amount : n - amount;
                        return {
                            prompt: `${n} ${plus ? '+' : '−'} ${amount} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer,
                            hints: [
                                amount === 100 ? `Only the hundreds digit changes!` : `Watch the tens digit.`,
                                `${n} → ${plus ? 'go up' : 'go down'} one ${amount === 100 ? 'hundred' : 'ten'}.`
                            ],
                            explain: `${n} ${plus ? '+' : '−'} ${amount} = ${answer}.`
                        };
                    }
                },
                {
                    id: 'add-3digit',
                    title: 'Add 3-Digit Numbers',
                    standard: 'NC.2.NBT.7',
                    learnIntro: '<strong>Same strategy, bigger numbers!</strong><br>356 + 227 → hundreds: 300+200=500, tens: 50+20=70, ones: 6+7=13.<br>500 + 70 + 13 = <strong>583</strong>.',
                    generate(level) {
                        let a, b;
                        if (level === 1) {
                            const h1 = R.int(1, 5), h2 = R.int(1, 8 - h1);
                            const t1 = R.int(0, 5), t2 = R.int(0, 9 - t1);
                            const o1 = R.int(0, 5), o2 = R.int(0, 9 - o1);
                            a = h1 * 100 + t1 * 10 + o1;
                            b = h2 * 100 + t2 * 10 + o2;
                        } else {
                            a = R.int(120, 600);
                            b = R.int(110, 999 - a);
                        }
                        const bh = Math.floor(b / 100) * 100, bt = Math.floor(b / 10) % 10 * 10, bo = b % 10;
                        return {
                            prompt: `${a} + ${b} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: a + b,
                            hints: [
                                `Add in hops: hundreds, then tens, then ones.`,
                                `${a} + ${bh} = ${a + bh}.`,
                                `${a + bh} + ${bt} = ${a + bh + bt}. Now add ${bo}.`
                            ],
                            explain: `${a} + ${b}: ${a} + ${bh} = ${a + bh}, + ${bt} = ${a + bh + bt}, + ${bo} = ${a + b}.`
                        };
                    }
                },
                {
                    id: 'sub-3digit',
                    title: 'Subtract 3-Digit Numbers',
                    standard: 'NC.2.NBT.7',
                    learnIntro: '<strong>Take away in hops!</strong><br>634 − 258 → 634 − 200 = 434, − 50 = 384, − 8 = <strong>376</strong>.',
                    generate(level) {
                        let a, b;
                        if (level === 1) {
                            const h1 = R.int(3, 9), h2 = R.int(1, h1 - 1);
                            const t1 = R.int(2, 9), t2 = R.int(0, t1 - 1);
                            const o1 = R.int(2, 9), o2 = R.int(0, o1 - 1);
                            a = h1 * 100 + t1 * 10 + o1;
                            b = h2 * 100 + t2 * 10 + o2;
                        } else {
                            a = R.int(300, 950);
                            b = R.int(120, a - 40);
                        }
                        const bh = Math.floor(b / 100) * 100, bt = Math.floor(b / 10) % 10 * 10, bo = b % 10;
                        return {
                            prompt: `${a} − ${b} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: a - b,
                            hints: [
                                `Take away in hops: hundreds, tens, then ones.`,
                                `${a} − ${bh} = ${a - bh}.`,
                                `${a - bh} − ${bt} = ${a - bh - bt}. Now take away ${bo}.`
                            ],
                            explain: `${a} − ${b}: ${a} − ${bh} = ${a - bh}, − ${bt} = ${a - bh - bt}, − ${bo} = ${a - b}.`
                        };
                    }
                }
            ]
        },

        // ============ UNIT 6 ============
        {
            id: 'timeMoney',
            title: 'Time & Money',
            icon: '⏰',
            standard: 'NC.2.MD.7–8',
            prereq: 'within100',
            skills: [
                {
                    id: 'tell-time',
                    title: 'Tell Time to 5 Minutes',
                    standard: 'NC.2.MD.7',
                    learnIntro: '<strong>Two hands, two jobs!</strong><br>The SHORT hand shows the hour. The LONG hand counts minutes by 5s.<br>Long hand on the 3 → 15 minutes.',
                    generate(level) {
                        const h = R.int(1, 12);
                        const m = level === 1 ? R.pick([0, 30]) : level === 2 ? R.pick([0, 15, 30, 45]) : R.int(0, 11) * 5;
                        return {
                            prompt: 'What time does the clock show? (Type it like 3:45)',
                            visual: clockSVG(h, m),
                            answerType: 'time',
                            answer: `${h}:${pad2(m)}`,
                            timeValue: { h, m },
                            hints: [
                                `The SHORT hand tells the hour. It is ${m > 30 ? 'getting close to the next number, but the hour is still' : 'pointing at (or just past)'} ${h}.`,
                                `The LONG hand counts by 5s: each big number is 5 more minutes.`,
                                `Long hand on the ${m === 0 ? 12 : m / 5} means ${m} minutes.`
                            ],
                            explain: `Short hand: ${h}. Long hand on the ${m === 0 ? 12 : m / 5} = ${m} minutes. The time is ${h}:${pad2(m)}.`
                        };
                    }
                },
                {
                    id: 'count-coins',
                    title: 'Count Coins',
                    standard: 'NC.2.MD.8',
                    learnIntro: '<strong>Start big, count on!</strong><br>Quarter = 25¢, dime = 10¢, nickel = 5¢, penny = 1¢.<br>Count the biggest coins first: 25, 50, 60, 65, 66...',
                    generate(level) {
                        let counts;
                        if (level === 1) {
                            counts = { quarter: 0, dime: R.int(1, 4), nickel: 0, penny: R.int(1, 4) };
                        } else if (level === 2) {
                            counts = { quarter: R.int(0, 2), dime: R.int(1, 3), nickel: R.int(0, 1), penny: R.int(0, 4) };
                        } else {
                            counts = { quarter: R.int(1, 3), dime: R.int(0, 2), nickel: R.int(0, 2), penny: R.int(0, 4) };
                        }
                        const total = coinsValue(counts);
                        const parts = [];
                        if (counts.quarter) parts.push(`${counts.quarter} quarter${counts.quarter > 1 ? 's' : ''} = ${counts.quarter * 25}¢`);
                        if (counts.dime) parts.push(`${counts.dime} dime${counts.dime > 1 ? 's' : ''} = ${counts.dime * 10}¢`);
                        if (counts.nickel) parts.push(`${counts.nickel} nickel${counts.nickel > 1 ? 's' : ''} = ${counts.nickel * 5}¢`);
                        if (counts.penny) parts.push(`${counts.penny} penn${counts.penny > 1 ? 'ies' : 'y'} = ${counts.penny}¢`);
                        return {
                            prompt: 'How many cents in all?',
                            visual: coinsHTML(counts),
                            answerType: 'number',
                            answer: total,
                            hints: [
                                `Start with the biggest coins and count on.`,
                                `Quarters are 25¢ each, dimes 10¢, nickels 5¢, pennies 1¢.`,
                                parts.join(', ') + '.'
                            ],
                            explain: `${parts.join(', ')}. Total: ${total}¢.`
                        };
                    }
                },
                {
                    id: 'money-problems',
                    title: 'Money Word Problems',
                    standard: 'NC.2.MD.8',
                    learnIntro: '<strong>Making change = counting up!</strong><br>Toy costs 65¢, you pay 100¢ (one dollar).<br>Count up: 65 → 70 is 5, then 70 → 100 is 30. Change: <strong>35¢</strong>.',
                    generate(level) {
                        const name = heroName();
                        if (level === 3 && Math.random() < 0.5) {
                            const p1 = R.int(15, 45), p2 = R.int(10, Math.min(50, 90 - p1));
                            return {
                                prompt: `${name} buys a sticker for ${p1}¢ and a pencil for ${p2}¢. ${name} pays with a $1 bill (100¢). How much change does ${name} get?`,
                                visual: null,
                                answerType: 'number',
                                answer: 100 - p1 - p2,
                                hints: [
                                    `Step 1: what do the two things cost together?`,
                                    `${p1}¢ + ${p2}¢ = ${p1 + p2}¢.`,
                                    `Step 2: 100 − ${p1 + p2} = ?`
                                ],
                                explain: `${p1} + ${p2} = ${p1 + p2}¢ spent. 100 − ${p1 + p2} = ${100 - p1 - p2}¢ change.`
                            };
                        }
                        const pay = level === 1 ? 50 : 100;
                        const price = level === 1 ? R.int(4, 9) * 5 : R.int(31, 89);
                        return {
                            prompt: `A toy costs ${price}¢. ${name} pays with ${pay === 100 ? 'a $1 bill (100¢)' : 'two quarters (50¢)'}. How much change does ${name} get?`,
                            visual: null,
                            answerType: 'number',
                            answer: pay - price,
                            hints: [
                                `Count UP from ${price} to ${pay}.`,
                                `${price} + ? = ${pay}.`,
                                `Hop to the next ten first: ${price} + ${(10 - price % 10) % 10 || 10}...`
                            ],
                            explain: `${pay} − ${price} = ${pay - price}¢ change, because ${price} + ${pay - price} = ${pay}.`
                        };
                    }
                }
            ]
        },

        // ============ UNIT 7 ============
        {
            id: 'measurement',
            title: 'Measurement',
            icon: '📏',
            standard: 'NC.2.MD.1–5',
            prereq: 'within100',
            skills: [
                {
                    id: 'compare-lengths',
                    title: 'Compare Lengths',
                    standard: 'NC.2.MD.4',
                    learnIntro: '<strong>How much longer?</strong><br>To compare two lengths, subtract the shorter from the longer.<br>74 cm − 49 cm = 25 cm longer.',
                    generate(level) {
                        const things = R.pick([['ribbon', 'string'], ['snake', 'lizard'], ['blue train', 'red train'], ['rope', 'stick']]);
                        const aLen = R.int(35, 90);
                        const bLen = aLen - (level === 1 ? R.int(10, 25) : R.int(8, 29));
                        return {
                            prompt: `The ${things[0]} is ${aLen} cm long. The ${things[1]} is ${bLen} cm long. How much LONGER is the ${things[0]}?`,
                            visual: level < 3 ? lengthBars(aLen, things[0], bLen, things[1]) : null,
                            answerType: 'number',
                            answer: aLen - bLen,
                            hints: [
                                `Find the difference between the two lengths.`,
                                `Think: ${bLen} + ? = ${aLen}.`,
                                `${aLen} − ${bLen} = ?`
                            ],
                            explain: `${aLen} − ${bLen} = ${aLen - bLen} cm longer.`
                        };
                    }
                },
                {
                    id: 'length-problems',
                    title: 'Length Word Problems',
                    standard: 'NC.2.MD.5',
                    learnIntro: '<strong>Lengths add and subtract like anything else!</strong><br>A 45 cm rope loses 18 cm → 45 − 18 = 27 cm left.',
                    generate(level) {
                        const name = heroName();
                        if (level === 3 && Math.random() < 0.4) {
                            const a = R.int(60, 95), b = R.int(12, 25), c = R.int(10, 25);
                            return {
                                prompt: `A rope was ${a} cm long. ${name} cut off ${b} cm, then cut off ${c} more cm. How long is the rope now?`,
                                visual: null,
                                answerType: 'number',
                                answer: a - b - c,
                                hints: [
                                    `Two steps! First: ${a} − ${b} = ?`,
                                    `That leaves ${a - b}. Now cut ${c} more.`
                                ],
                                explain: `${a} − ${b} = ${a - b}, then − ${c} = ${a - b - c} cm.`
                            };
                        }
                        if (Math.random() < 0.5) {
                            const a = R.int(25, 60), b = R.int(15, Math.min(38, 99 - a));
                            return {
                                prompt: `${name} tapes a ${a} cm ribbon and a ${b} cm ribbon end to end. How long is the whole ribbon?`,
                                visual: null,
                                answerType: 'number',
                                answer: a + b,
                                hints: [
                                    `End to end means the lengths join together — add!`,
                                    `${a} + ${b} = ?`
                                ],
                                explain: `${a} + ${b} = ${a + b} cm in all.`
                            };
                        }
                        const a = R.int(40, 95), b = R.int(12, a - 15);
                        return {
                            prompt: `A string is ${a} cm long. ${name} cuts off ${b} cm. How long is the string now?`,
                            visual: null,
                            answerType: 'number',
                            answer: a - b,
                            hints: [
                                `"Cuts off" means the string gets shorter — subtract!`,
                                `${a} − ${b} = ?`
                            ],
                            explain: `${a} − ${b} = ${a - b} cm left.`
                        };
                    }
                }
            ]
        },

        // ============ UNIT 8 ============
        {
            id: 'geometry',
            title: 'Shapes, Sharing & Arrays',
            icon: '🔷',
            standard: 'NC.2.G.1–3, NC.2.OA.3–4',
            prereq: 'within100',
            skills: [
                {
                    id: 'odd-even',
                    title: 'Odd or Even?',
                    standard: 'NC.2.OA.3',
                    learnIntro: '<strong>Even numbers pair up perfectly!</strong><br>Even: every dot has a partner (2, 4, 6, 8...).<br>Odd: one dot is left out (1, 3, 5, 7...).<br>Shortcut: just look at the ONES digit!',
                    generate(level) {
                        const n = level === 1 ? R.int(3, 20) : level === 2 ? R.int(10, 50) : R.int(20, 100);
                        const answer = n % 2 === 0 ? 'Even' : 'Odd';
                        return {
                            prompt: `Is ${n} odd or even?`,
                            visual: level === 1 ? pairDots(n) : null,
                            answerType: 'choice',
                            choices: ['Even', 'Odd'],
                            answer,
                            hints: [
                                `Can every one pair up with a partner?`,
                                `Shortcut: look only at the ones digit — ${n % 10}.`,
                                `Ones digit 0, 2, 4, 6, 8 → even. 1, 3, 5, 7, 9 → odd.`
                            ],
                            explain: `The ones digit of ${n} is ${n % 10}, so ${n} is ${answer.toLowerCase()}.`
                        };
                    }
                },
                {
                    id: 'arrays',
                    title: 'Arrays & Repeated Addition',
                    standard: 'NC.2.OA.4',
                    learnIntro: '<strong>Rows and columns — a sneak peek at multiplication!</strong><br>3 rows of 4 → 4 + 4 + 4 = <strong>12</strong>.',
                    generate(level) {
                        const item = themeThing();
                        const rows = R.int(2, 5), cols = R.int(2, 5);
                        const addition = Array(rows).fill(cols).join(' + ');
                        if (level < 3) {
                            return {
                                prompt: `${rows} rows of ${cols}. How many ${item.name} in all?`,
                                visual: dotArray(rows, cols, item.icon),
                                answerType: 'number',
                                answer: rows * cols,
                                hints: [
                                    `Each row has ${cols}. Add row by row.`,
                                    `${addition} = ?`,
                                    `Or skip count by ${cols}s, ${rows} times.`
                                ],
                                explain: `${rows} rows of ${cols}: ${addition} = ${rows * cols}.`
                            };
                        }
                        return {
                            prompt: `A tray has ${rows} rows with ${cols} ${item.name} in each row. How many in all?`,
                            visual: null,
                            answerType: 'number',
                            answer: rows * cols,
                            hints: [
                                `Picture the array in your head: ${rows} rows of ${cols}.`,
                                `${addition} = ?`
                            ],
                            explain: `${addition} = ${rows * cols}.`
                        };
                    }
                },
                {
                    id: 'shapes',
                    title: 'Name That Shape',
                    standard: 'NC.2.G.1',
                    learnIntro: '<strong>Count the sides!</strong><br>3 sides = triangle. 4 sides = quadrilateral.<br>5 sides = pentagon. 6 sides = hexagon.',
                    generate(level) {
                        const names = Object.keys(SHAPE_DEFS);
                        const name = R.pick(names);
                        const def = SHAPE_DEFS[name];
                        if (level < 3) {
                            return {
                                prompt: 'What is this shape called?',
                                visual: shapeSVG(name),
                                answerType: 'choice',
                                choices: names.map(n => SHAPE_LABELS[n]),
                                answer: SHAPE_LABELS[name],
                                hints: [
                                    `Count the sides carefully.`,
                                    `This shape has ${def.sides} sides.`,
                                    `3 = triangle, 4 = quadrilateral, 5 = pentagon, 6 = hexagon.`
                                ],
                                explain: `It has ${def.sides} sides, so it is a ${SHAPE_LABELS[name].toLowerCase()}.`
                            };
                        }
                        if (Math.random() < 0.5) {
                            return {
                                prompt: `Which shape has ${def.sides} sides?`,
                                visual: null,
                                answerType: 'choice',
                                choices: names.map(n => SHAPE_LABELS[n]),
                                answer: SHAPE_LABELS[name],
                                hints: [`3 = triangle, 4 = quadrilateral, 5 = pentagon, 6 = hexagon.`],
                                explain: `A ${SHAPE_LABELS[name].toLowerCase()} has ${def.sides} sides.`
                            };
                        }
                        return {
                            prompt: `How many sides does a ${SHAPE_LABELS[name].toLowerCase()} have?`,
                            visual: null,
                            answerType: 'number',
                            answer: def.sides,
                            hints: [`Picture the shape in your head and count its sides.`],
                            explain: `A ${SHAPE_LABELS[name].toLowerCase()} has ${def.sides} sides.`
                        };
                    }
                },
                {
                    id: 'equal-shares',
                    title: 'Halves, Thirds & Fourths',
                    standard: 'NC.2.G.3',
                    learnIntro: '<strong>Fair shares!</strong><br>2 equal shares = halves. 3 equal shares = thirds. 4 equal shares = fourths.<br>Equal means every piece is the SAME size.',
                    generate(level) {
                        const parts = R.pick([2, 3, 4]);
                        const word = { 2: 'halves', 3: 'thirds', 4: 'fourths' }[parts];
                        if (level === 1) {
                            return {
                                prompt: 'This bar is cut into equal shares. How many equal shares do you see?',
                                visual: fractionRect(parts, 0),
                                answerType: 'number',
                                answer: parts,
                                hints: [`Count each piece of the bar.`],
                                explain: `The bar has ${parts} equal shares — we call them ${word}.`
                            };
                        }
                        if (level === 2) {
                            return {
                                prompt: 'This bar is cut into equal shares. What is EACH share called?',
                                visual: fractionRect(parts, 1),
                                answerType: 'choice',
                                choices: ['A half', 'A third', 'A fourth'],
                                answer: { 2: 'A half', 3: 'A third', 4: 'A fourth' }[parts],
                                hints: [
                                    `Count the equal shares first: there are ${parts}.`,
                                    `2 shares → halves, 3 → thirds, 4 → fourths.`
                                ],
                                explain: `${parts} equal shares means each one is ${{ 2: 'a half', 3: 'a third', 4: 'a fourth' }[parts]}.`
                            };
                        }
                        if (Math.random() < 0.5) {
                            return {
                                prompt: `A sandwich is cut into ${word}. How many equal pieces is that?`,
                                visual: null,
                                answerType: 'number',
                                answer: parts,
                                hints: [`Halves = 2, thirds = 3, fourths = 4.`],
                                explain: `${word.charAt(0).toUpperCase() + word.slice(1)} means ${parts} equal pieces.`
                            };
                        }
                        return {
                            prompt: `How many ${word} make one whole?`,
                            visual: null,
                            answerType: 'number',
                            answer: parts,
                            hints: [`If you cut a whole into ${word}, how many pieces do you get?`],
                            explain: `${parts} ${word} make one whole.`
                        };
                    }
                }
            ]
        }
    ]
};

// Flat lookup helpers
const SKILL_INDEX = {};
CURRICULUM.units.forEach(unit => {
    unit.skills.forEach((skill, i) => {
        SKILL_INDEX[skill.id] = { skill, unit, indexInUnit: i };
    });
});

function allSkillIds() {
    return Object.keys(SKILL_INDEX);
}
