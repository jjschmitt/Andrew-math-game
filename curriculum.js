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
        if (max < min) [min, max] = [max, min];
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

function withCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

function gcd(a, b) {
    while (b) { [a, b] = [b, a % b]; }
    return a;
}

function fracStr(n, d) {
    const g = gcd(n, d);
    return `${n / g}/${d / g}`;
}

function frac(n, d) {
    // Standard fraction problem fields: canonical (reduced) answer string
    // plus the raw value for equivalence checking in the engine.
    return { answer: fracStr(n, d), fracValue: { n, d } };
}

function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
}

function fractionNumberLine(b, k) {
    const x0 = 20, x1 = 300, y = 34;
    let ticks = '';
    for (let i = 0; i <= b; i++) {
        const x = x0 + (x1 - x0) * i / b;
        ticks += `<line x1="${x.toFixed(1)}" y1="${y - 9}" x2="${x.toFixed(1)}" y2="${y + 9}" class="nl-tick"/>`;
    }
    const px = x0 + (x1 - x0) * k / b;
    return `<svg class="numline" viewBox="0 0 320 66" width="320" height="66">
        <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="nl-line"/>
        ${ticks}
        <text x="${x0}" y="${y + 26}" text-anchor="middle" class="nl-label">0</text>
        <text x="${x1}" y="${y + 26}" text-anchor="middle" class="nl-label">1</text>
        <circle cx="${px.toFixed(1)}" cy="${y}" r="7" class="nl-point"/>
    </svg>`;
}

function fractionPair(a, b, c, d) {
    return `<div class="frac-pair">
        <div class="frac-side">${fractionRect(b, a)}<div class="frac-caption">${a}/${b}</div></div>
        <div class="frac-side">${fractionRect(d, c)}<div class="frac-caption">${c}/${d}</div></div>
    </div>`;
}

function areaGrid(rows, cols) {
    let html = '<div class="area-grid">';
    for (let r = 0; r < rows; r++) {
        html += '<div class="area-row">' + '<div class="unit-square"></div>'.repeat(cols) + '</div>';
    }
    html += '</div>';
    return html;
}

function perimeterRectSVG(l, w) {
    const s = 18, W = l * s, H = w * s, pad = 34;
    return `<svg class="peri-svg" viewBox="0 0 ${W + pad * 2} ${H + pad * 2}" width="${W + pad * 2}" height="${H + pad * 2}">
        <rect x="${pad}" y="${pad}" width="${W}" height="${H}" class="peri-rect"/>
        <text x="${pad + W / 2}" y="${pad - 10}" text-anchor="middle" class="peri-label">${l} units</text>
        <text x="${pad - 16}" y="${pad + H / 2 + 5}" text-anchor="middle" class="peri-label">${w}</text>
    </svg>`;
}

function angleSVG(deg) {
    const cx = 78, cy = 100, r = 64, ar = 22;
    const rad = deg * Math.PI / 180;
    const x2 = cx + r * Math.cos(rad), y2 = cy - r * Math.sin(rad);
    const ax = cx + ar * Math.cos(rad), ay = cy - ar * Math.sin(rad);
    const large = deg > 180 ? 1 : 0;
    return `<svg class="angle-svg" viewBox="0 0 156 116" width="195" height="145">
        <path d="M ${cx + ar} ${cy} A ${ar} ${ar} 0 ${large} 0 ${ax.toFixed(1)} ${ay.toFixed(1)}" class="angle-arc"/>
        <line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" class="angle-ray"/>
        <line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="angle-ray"/>
        <circle cx="${cx}" cy="${cy}" r="3" class="angle-vertex"/>
    </svg>`;
}

function coordPlaneSVG(px, py) {
    const s = 26, n = 9, pad = 26;
    const size = n * s + pad * 2;
    let grid = '', labels = '';
    for (let i = 0; i <= n; i++) {
        const p = pad + i * s;
        grid += `<line x1="${p}" y1="${pad}" x2="${p}" y2="${pad + n * s}" class="cp-grid"/>`;
        grid += `<line x1="${pad}" y1="${p}" x2="${pad + n * s}" y2="${p}" class="cp-grid"/>`;
        labels += `<text x="${p}" y="${pad + n * s + 16}" text-anchor="middle" class="cp-label">${i}</text>`;
        labels += `<text x="${pad - 10}" y="${pad + (n - i) * s + 4}" text-anchor="middle" class="cp-label">${i}</text>`;
    }
    const x = pad + px * s, y = pad + (n - py) * s;
    return `<svg class="coord-svg" viewBox="0 0 ${size} ${size + 6}" width="${size}" height="${size + 6}">
        ${grid}
        <line x1="${pad}" y1="${pad + n * s}" x2="${pad + n * s}" y2="${pad + n * s}" class="cp-axis"/>
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${pad + n * s}" class="cp-axis"/>
        ${labels}
        <circle cx="${x}" cy="${y}" r="7" class="cp-point"/>
    </svg>`;
}

function boxSVG(l, w, h) {
    // Simple isometric-ish rectangular prism with labeled edges
    const s = 16, L = l * s, H = h * s, D = w * 8;
    const x0 = 26, y0 = 26 + D;
    return `<svg class="box-svg" viewBox="0 0 ${L + D + 84} ${H + D + 60}" width="${L + D + 84}" height="${H + D + 60}">
        <polygon points="${x0},${y0} ${x0 + L},${y0} ${x0 + L + D},${y0 - D} ${x0 + D},${y0 - D}" class="box-top"/>
        <polygon points="${x0 + L},${y0} ${x0 + L + D},${y0 - D} ${x0 + L + D},${y0 - D + H} ${x0 + L},${y0 + H}" class="box-side"/>
        <rect x="${x0}" y="${y0}" width="${L}" height="${H}" class="box-front"/>
        <text x="${x0 + L / 2}" y="${y0 + H + 18}" text-anchor="middle" class="box-label">${l}</text>
        <text x="${x0 - 12}" y="${y0 + H / 2 + 5}" text-anchor="middle" class="box-label">${h}</text>
        <text x="${x0 + L + D / 2 + 26}" y="${y0 - D / 2 + 2}" text-anchor="middle" class="box-label">${w}</text>
    </svg>`;
}

// ------------------------------------------------------------
// The curriculum
// ------------------------------------------------------------

const CURRICULUM = {
    units: [
        // ============ UNIT 1 ============
        {
            id: 'facts20',
            grade: 2,
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
            grade: 2,
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
            grade: 2,
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
            grade: 2,
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
            grade: 2,
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
            grade: 2,
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
            grade: 2,
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
            grade: 2,
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
                        if (level === 1) {
                            return {
                                prompt: `Build ${rows} rows of ${cols} — tap the squares!<span class="prompt-sub">Then type how many in all.</span>`,
                                visual: null,
                                interactive: { type: 'build-array', rows, cols, icon: item.icon, done: `You built ${rows} rows of ${cols} — that's ${rows * cols}! Type it in ✏️` },
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
                        if (level === 2) {
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
                                prompt: 'Tap each piece to count the equal shares.<span class="prompt-sub">Then type how many shares there are.</span>',
                                visual: null,
                                interactive: { type: 'shade-fraction', parts, target: parts, mode: 'count', done: `You counted ${parts} equal shares! Type it in ✏️` },
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
        },
        // ============ GRADE 3 ============
        {
            id: 'g3-mult',
            grade: 3,
            title: 'Multiplication Power',
            icon: '✖️',
            standard: 'NC.3.OA.1–7',
            prereq: null,
            skills: [
                {
                    id: 'mult-facts-easy',
                    title: 'Multiply by 2, 5 & 10',
                    standard: 'NC.3.OA.7',
                    learnIntro: '<strong>Multiplication = equal groups!</strong><br>5 × 4 means 4 groups of 5. Skip count: 5, 10, 15, <strong>20</strong>.',
                    generate(level) {
                        const a = R.pick(level === 1 ? [2, 5] : [2, 5, 10]);
                        const b = R.int(2, 9);
                        const [x, y] = level === 1 ? [a, b] : R.shuffle([a, b]);
                        const skips = Array.from({ length: b }, (_, i) => a * (i + 1)).join(', ');
                        if (level === 1) {
                            return {
                                prompt: `${x} × ${y} = ?<span class="prompt-sub">Build ${b} rows of ${a}, then type the total.</span>`,
                                visual: null,
                                interactive: { type: 'build-array', rows: b, cols: a, icon: '🔵', done: `You built ${b} rows of ${a} — that's ${a * b}! Type it in ✏️` },
                                answerType: 'number',
                                answer: a * b,
                                hints: [
                                    `That means ${b} groups of ${a}.`,
                                    `Skip count by ${a}s, ${b} times.`,
                                    `${skips}`
                                ],
                                explain: `${a} × ${b}: skip count by ${a}s — ${skips}.`
                            };
                        }
                        return {
                            prompt: `${x} × ${y} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: a * b,
                            hints: [
                                `That means ${b} groups of ${a}.`,
                                `Skip count by ${a}s, ${b} times.`,
                                `${skips}`
                            ],
                            explain: `${a} × ${b}: skip count by ${a}s — ${skips}.`
                        };
                    }
                },
                {
                    id: 'mult-facts-all',
                    title: 'All the Times Tables',
                    standard: 'NC.3.OA.7',
                    learnIntro: '<strong>Use facts you know to find facts you don\'t!</strong><br>7 × 8 = 7 × 7 + 7 = 49 + 7 = <strong>56</strong>.<br>One fact away is one hop away.',
                    generate(level) {
                        const a = level === 1 ? R.pick([3, 4]) : level === 2 ? R.int(3, 7) : R.int(6, 9);
                        const b = level === 1 ? R.int(2, 6) : level === 2 ? R.int(3, 8) : R.int(6, 9);
                        if (level === 1) {
                            return {
                                prompt: `${a} × ${b} = ?<span class="prompt-sub">Build ${a} rows of ${b}, then type the total.</span>`,
                                visual: null,
                                interactive: { type: 'build-array', rows: a, cols: b, icon: '🔵', done: `You built ${a} rows of ${b} — that's ${a * b}! Type it in ✏️` },
                                answerType: 'number',
                                answer: a * b,
                                hints: [
                                    `Think of a nearby fact you already know.`,
                                    `${a} × ${b - 1} = ${a * (b - 1)}. Now add one more ${a}.`,
                                    `${a * (b - 1)} + ${a} = ?`
                                ],
                                explain: `${a} × ${b} = ${a} × ${b - 1} + ${a} = ${a * (b - 1)} + ${a} = ${a * b}.`
                            };
                        }
                        return {
                            prompt: `${a} × ${b} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: a * b,
                            hints: [
                                `Think of a nearby fact you already know.`,
                                `${a} × ${b - 1} = ${a * (b - 1)}. Now add one more ${a}.`,
                                `${a * (b - 1)} + ${a} = ?`
                            ],
                            explain: `${a} × ${b} = ${a} × ${b - 1} + ${a} = ${a * (b - 1)} + ${a} = ${a * b}.`
                        };
                    }
                },
                {
                    id: 'div-facts',
                    title: 'Division Facts',
                    standard: 'NC.3.OA.7',
                    learnIntro: '<strong>Division is multiplication backwards!</strong><br>24 ÷ 6 = ? asks: 6 × ? = 24. You know it — it\'s <strong>4</strong>!',
                    generate(level) {
                        const d = level === 1 ? R.int(2, 5) : R.int(2, 9);
                        const q = level === 1 ? R.int(2, 5) : R.int(3, 9);
                        const n = d * q;
                        if (level === 1) {
                            return {
                                prompt: `${n} ÷ ${d} = ?<span class="prompt-sub">Deal all ${n} onto the ${d} plates, then type how many are on each.</span>`,
                                visual: null,
                                interactive: { type: 'share-groups', total: n, groups: d, icon: '🔵', itemName: 'dots', done: `You shared ${n} into ${d} equal groups — ${q} on each plate! Type it in ✏️` },
                                answerType: 'number',
                                answer: q,
                                hints: [
                                    `Think multiplication: ${d} × ? = ${n}.`,
                                    `Split ${n} into ${d} equal rows — how many in each row?`,
                                    `Skip count by ${d}s up to ${n} and count the hops.`
                                ],
                                explain: `${n} ÷ ${d} = ${q}, because ${d} × ${q} = ${n}.`
                            };
                        }
                        return {
                            prompt: `${n} ÷ ${d} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: q,
                            hints: [
                                `Think multiplication: ${d} × ? = ${n}.`,
                                `Split ${n} into ${d} equal rows — how many in each row?`,
                                `Skip count by ${d}s up to ${n} and count the hops.`
                            ],
                            explain: `${n} ÷ ${d} = ${q}, because ${d} × ${q} = ${n}.`
                        };
                    }
                },
                {
                    id: 'mult-div-stories',
                    title: 'Equal-Group Stories',
                    standard: 'NC.3.OA.3',
                    learnIntro: '<strong>Spot the equal groups!</strong><br>"4 bags with 6 apples each" → 4 × 6.<br>"24 apples shared into bags of 6" → 24 ÷ 6.',
                    generate(level) {
                        const item = themeThing();
                        const name = heroName();
                        if (level === 3 && Math.random() < 0.5) {
                            const m = R.int(3, 8), q = R.int(3, 9), n = m * q;
                            return {
                                prompt: `${name} puts ${n} ${item.name} ${item.icon} into rows of ${m}. How many rows does ${name} make?`,
                                visual: null,
                                answerType: 'number',
                                answer: q,
                                hints: [
                                    `Each row uses ${m}. How many rows of ${m} make ${n}?`,
                                    `Think: ${m} × ? = ${n}.`
                                ],
                                explain: `${n} ÷ ${m} = ${q} rows, because ${m} × ${q} = ${n}.`
                            };
                        }
                        const a = level === 1 ? R.int(2, 5) : R.int(3, 9);
                        const b = level === 1 ? R.int(2, 6) : R.int(4, 9);
                        if (level === 1) {
                            return {
                                prompt: `${name} has ${a} bags with ${b} ${item.name} ${item.icon} in each bag. How many ${item.name} in all?<span class="prompt-sub">Build ${a} rows of ${b}, then type the total.</span>`,
                                visual: null,
                                interactive: { type: 'build-array', rows: a, cols: b, icon: item.icon, done: `You built ${a} rows of ${b} — that's ${a * b}! Type it in ✏️` },
                                answerType: 'number',
                                answer: a * b,
                                hints: [
                                    `Equal groups! ${a} groups of ${b}.`,
                                    `${a} × ${b} = ?`
                                ],
                                explain: `${a} bags of ${b}: ${a} × ${b} = ${a * b}.`
                            };
                        }
                        return {
                            prompt: `${name} has ${a} bags with ${b} ${item.name} ${item.icon} in each bag. How many ${item.name} in all?`,
                            visual: null,
                            answerType: 'number',
                            answer: a * b,
                            hints: [
                                `Equal groups! ${a} groups of ${b}.`,
                                `${a} × ${b} = ?`
                            ],
                            explain: `${a} bags of ${b}: ${a} × ${b} = ${a * b}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g3-numbers',
            grade: 3,
            title: 'Rounding & Bigger Moves',
            icon: '🎯',
            standard: 'NC.3.NBT, 3.OA.8',
            prereq: 'g3-mult',
            skills: [
                {
                    id: 'rounding',
                    title: 'Rounding to 10s & 100s',
                    standard: 'NC.3.NBT.1',
                    learnIntro: '<strong>Which ten is closer?</strong><br>Rounding 47 to the nearest ten: 47 is between 40 and 50, closer to <strong>50</strong>.<br>The digit to the right decides: 5 or more rounds UP.',
                    generate(level) {
                        let n, target;
                        if (level === 1) {
                            n = R.int(11, 98);
                            if (n % 10 === 0) n += 3;
                            target = 10;
                        } else if (level === 2) {
                            n = R.int(101, 989);
                            target = R.pick([10, 100]);
                            if (n % target === 0) n += target === 10 ? 4 : 40;
                        } else {
                            n = R.int(105, 989);
                            target = 100;
                            if (n % 100 === 0) n += 51;
                        }
                        const answer = Math.round(n / target) * target;
                        const decider = target === 10 ? n % 10 : Math.floor(n / 10) % 10;
                        if (level === 1) {
                            const lower = Math.floor(n / 10) * 10;
                            return {
                                prompt: `Round ${n} to the nearest ten.<span class="prompt-sub">Drag the dot to the closer ten, then type it.</span>`,
                                visual: null,
                                interactive: { type: 'number-line', ticks: 10, targetTick: answer - lower, endLabels: [String(lower), String(lower + 10)], refTick: n - lower, refLabel: String(n), done: `${n} is closer to ${answer}! Type it in ✏️` },
                                answerType: 'number',
                                answer,
                                hints: [
                                    `${n} is between ${Math.floor(n / target) * target} and ${Math.floor(n / target) * target + target}.`,
                                    `Look at the ${target === 10 ? 'ones' : 'tens'} digit: ${decider}. Is it 5 or more?`,
                                    `${decider} ${decider >= 5 ? 'is 5 or more → round UP' : 'is less than 5 → round DOWN'}.`
                                ],
                                explain: `The ${target === 10 ? 'ones' : 'tens'} digit is ${decider}, so ${n} rounds ${decider >= 5 ? 'up' : 'down'} to ${answer}.`
                            };
                        }
                        return {
                            prompt: `Round ${n} to the nearest ${target === 10 ? 'ten' : 'hundred'}.`,
                            visual: null,
                            answerType: 'number',
                            answer,
                            hints: [
                                `${n} is between ${Math.floor(n / target) * target} and ${Math.floor(n / target) * target + target}.`,
                                `Look at the ${target === 10 ? 'ones' : 'tens'} digit: ${decider}. Is it 5 or more?`,
                                `${decider} ${decider >= 5 ? 'is 5 or more → round UP' : 'is less than 5 → round DOWN'}.`
                            ],
                            explain: `The ${target === 10 ? 'ones' : 'tens'} digit is ${decider}, so ${n} rounds ${decider >= 5 ? 'up' : 'down'} to ${answer}.`
                        };
                    }
                },
                {
                    id: 'multiply-tens',
                    title: 'Multiply by Tens',
                    standard: 'NC.3.NBT.3',
                    learnIntro: '<strong>Use the fact, then think tens!</strong><br>4 × 60 = 4 × 6 tens = 24 tens = <strong>240</strong>.',
                    generate(level) {
                        const a = R.int(2, 9);
                        const t = (level === 1 ? R.int(1, 4) : R.int(2, 9)) * 10;
                        const interactive = level === 1 ? { type: 'build-array', rows: a, cols: t / 10, icon: '🔟', done: `Each 🔟 is one ten. ${a} rows of ${t / 10} tens is ${a * t / 10} tens — that's ${a * t}! Type it in ✏️` } : null;
                        return {
                            prompt: `${a} × ${t} = ?${level === 1 ? `<span class="prompt-sub">Build ${a} rows of ${t / 10} tens, then type the total.</span>` : ''}`,
                            visual: null,
                            interactive,
                            answerType: 'number',
                            answer: a * t,
                            hints: [
                                `${t} is ${t / 10} tens.`,
                                `${a} × ${t / 10} = ${a * t / 10}. So the answer is ${a * t / 10} tens.`
                            ],
                            explain: `${a} × ${t} = ${a} × ${t / 10} tens = ${a * t / 10} tens = ${a * t}.`
                        };
                    }
                },
                {
                    id: 'two-step-mult-stories',
                    title: 'Two-Step Stories with ×',
                    standard: 'NC.3.OA.8',
                    learnIntro: '<strong>Multiply first, then add or subtract!</strong><br>"3 packs of 6, plus 4 loose" → 3 × 6 = 18, then 18 + 4 = <strong>22</strong>.',
                    generate(level) {
                        const item = themeThing();
                        const name = heroName();
                        const a = level === 1 ? R.int(2, 4) : R.int(3, 7);
                        const b = level === 1 ? R.int(3, 6) : R.int(4, 9);
                        if (Math.random() < 0.5) {
                            const c = R.int(3, 12);
                            return {
                                prompt: `${name} buys ${a} packs of ${b} ${item.name} ${item.icon} and ${c} loose ones. How many ${item.name} in all?`,
                                visual: null,
                                answerType: 'number',
                                answer: a * b + c,
                                hints: [
                                    `Step 1: how many are in the packs? ${a} × ${b} = ?`,
                                    `Step 2: add the ${c} loose ones to ${a * b}.`
                                ],
                                explain: `${a} × ${b} = ${a * b}, then ${a * b} + ${c} = ${a * b + c}.`
                            };
                        }
                        const s = a * b + R.int(6, 30);
                        return {
                            prompt: `${name} had ${s} ${item.name} ${item.icon} and gave away ${a} bags of ${b}. How many are left?`,
                            visual: null,
                            answerType: 'number',
                            answer: s - a * b,
                            hints: [
                                `Step 1: how many were given away? ${a} × ${b} = ?`,
                                `Step 2: ${s} − ${a * b} = ?`
                            ],
                            explain: `${a} × ${b} = ${a * b} given away. ${s} − ${a * b} = ${s - a * b} left.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g3-fractions',
            grade: 3,
            title: 'Fraction Foundations',
            icon: '🍕',
            standard: 'NC.3.NF',
            prereq: 'g3-numbers',
            skills: [
                {
                    id: 'fraction-of-shape',
                    title: 'Name the Fraction',
                    standard: 'NC.3.NF.1',
                    learnIntro: '<strong>A fraction counts equal parts!</strong><br>The bottom number = how many equal parts in the whole.<br>The top number = how many you\'re talking about. 3 shaded of 4 → <strong>3/4</strong>.',
                    generate(level) {
                        const b = level === 1 ? R.pick([2, 3, 4]) : R.pick([3, 4, 6, 8]);
                        const k = level === 1 ? 1 : R.int(1, b - 1);
                        if (level === 3) {
                            const name = heroName();
                            return Object.assign({
                                prompt: `A pizza is cut into ${b} equal slices. ${name} eats ${k} slice${k > 1 ? 's' : ''}. What fraction of the pizza did ${name} eat? (Type it like 3/4)`,
                                visual: null,
                                answerType: 'fraction',
                                hints: [
                                    `How many equal parts is the whole cut into? That's the bottom number.`,
                                    `${k} out of ${b} equal parts.`
                                ],
                                explain: `${k} of the ${b} equal parts → ${k}/${b}.`
                            }, frac(k, b));
                        }
                        if (level === 1) {
                            return Object.assign({
                                prompt: `Shade ${k} part of the bar, then type the fraction (like 3/4).`,
                                visual: null,
                                interactive: { type: 'shade-fraction', parts: b, target: k, mode: 'shade', done: `You shaded ${k} of ${b} — that's ${k}/${b}! Type it in ✏️` },
                                answerType: 'fraction',
                                hints: [
                                    `Count ALL the equal parts first — that's the bottom number.`,
                                    `There are ${b} parts, and ${k} ${k > 1 ? 'are' : 'is'} shaded.`
                                ],
                                explain: `${k} shaded out of ${b} equal parts → ${k}/${b}.`
                            }, frac(k, b));
                        }
                        return Object.assign({
                            prompt: 'What fraction of the bar is shaded? (Type it like 3/4)',
                            visual: fractionRect(b, k),
                            answerType: 'fraction',
                            hints: [
                                `Count ALL the equal parts first — that's the bottom number.`,
                                `There are ${b} parts, and ${k} ${k > 1 ? 'are' : 'is'} shaded.`
                            ],
                            explain: `${k} shaded out of ${b} equal parts → ${k}/${b}.`
                        }, frac(k, b));
                    }
                },
                {
                    id: 'fraction-number-line',
                    title: 'Fractions on the Number Line',
                    standard: 'NC.3.NF.2',
                    learnIntro: '<strong>Fractions live between 0 and 1!</strong><br>Cut the line from 0 to 1 into equal hops.<br>4 hops → each hop is 1/4. The 3rd mark is <strong>3/4</strong>.',
                    generate(level) {
                        const b = level === 1 ? R.pick([2, 3, 4]) : R.pick([3, 4, 6, 8]);
                        const k = R.int(1, b - 1);
                        if (level === 1) {
                            return Object.assign({
                                prompt: `Drag the dot to hop ${k}, then type the fraction it lands on (like 3/4).`,
                                visual: null,
                                interactive: { type: 'number-line', ticks: b, targetTick: k, endLabels: ['0', '1'], done: `You landed on hop ${k} of ${b} — that's ${k}/${b}! Type it in ✏️` },
                                answerType: 'fraction',
                                hints: [
                                    `Count the equal hops between 0 and 1 — that's the bottom number.`,
                                    `The line is cut into ${b} equal parts.`,
                                    `The point is ${k} hop${k > 1 ? 's' : ''} from 0.`
                                ],
                                explain: `The line has ${b} equal parts and the point is at hop ${k} → ${k}/${b}.`
                            }, frac(k, b));
                        }
                        return Object.assign({
                            prompt: 'What fraction does the point show? (Type it like 3/4)',
                            visual: fractionNumberLine(b, k),
                            answerType: 'fraction',
                            hints: [
                                `Count the equal hops between 0 and 1 — that's the bottom number.`,
                                `The line is cut into ${b} equal parts.`,
                                `The point is ${k} hop${k > 1 ? 's' : ''} from 0.`
                            ],
                            explain: `The line has ${b} equal parts and the point is at hop ${k} → ${k}/${b}.`
                        }, frac(k, b));
                    }
                },
                {
                    id: 'compare-fractions-3',
                    title: 'Compare Fractions',
                    standard: 'NC.3.NF.3',
                    learnIntro: '<strong>Same bottom? Compare tops!</strong> 3/8 &lt; 5/8.<br><strong>Same top? Bigger bottom = smaller pieces!</strong> 1/8 &lt; 1/3.',
                    generate(level) {
                        let a1, d1, a2, d2;
                        if (level < 3) {
                            d1 = d2 = R.pick([3, 4, 6, 8]);
                            a1 = R.int(1, d1 - 1);
                            do { a2 = R.int(1, d2 - 1); } while (a2 === a1 && Math.random() > 0.15);
                        } else {
                            a1 = a2 = R.int(1, 3);
                            d1 = R.pick([2, 3, 4]);
                            do { d2 = R.pick([3, 4, 6, 8]); } while (d2 === d1);
                            if (a1 >= d1) a1 = a2 = d1 - 1;
                        }
                        const cross1 = a1 * d2, cross2 = a2 * d1;
                        const answer = cross1 < cross2 ? '<' : cross1 > cross2 ? '>' : '=';
                        const correct = answer === '<' ? 'bottom' : answer === '>' ? 'top' : 'equal';
                        const interactive = level === 1 ? { type: 'compare-bars', top: { parts: d1, target: a1, label: `${a1}/${d1}` }, bottom: { parts: d2, target: a2, label: `${a2}/${d2}` }, correct, done: `You shaded both bars and saw which is bigger — now tap ${answer} below!` } : null;
                        return {
                            prompt: `Which symbol makes this true?<br><span class="compare-nums">${a1}/${d1} &nbsp; ? &nbsp; ${a2}/${d2}</span>${level === 1 ? '<span class="prompt-sub">Shade each bar to match its fraction, then tap the bigger one.</span>' : ''}`,
                            visual: level === 1 ? fractionPair(a1, d1, a2, d2) : null,
                            interactive,
                            answerType: 'choice',
                            choices: ['<', '>', '='],
                            answer,
                            hints: [
                                d1 === d2
                                    ? `The pieces are the same size (${d1}ths). Who has more pieces?`
                                    : `The tops match! Which whole is cut into BIGGER pieces?`,
                                d1 === d2
                                    ? `Compare the top numbers: ${a1} and ${a2}.`
                                    : `Cutting into ${Math.max(d1, d2)} parts makes SMALLER pieces than cutting into ${Math.min(d1, d2)}.`
                            ],
                            explain: `${a1}/${d1} ${answer === '=' ? 'equals' : answer === '<' ? 'is less than' : 'is greater than'} ${a2}/${d2}.`
                        };
                    }
                },
                {
                    id: 'equivalent-fractions-3',
                    title: 'Equivalent Fractions',
                    standard: 'NC.3.NF.3',
                    learnIntro: '<strong>Same amount, different cuts!</strong><br>1/2 = 2/4 = 3/6. Multiply the top AND bottom by the same number.',
                    generate(level) {
                        const [a, b] = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]);
                        const k = level === 1 ? 2 : R.int(2, 4);
                        if (level === 3 && Math.random() < 0.5) {
                            return {
                                prompt: `Fill in the blank: ${a}/${b} = ${a * k}/?`,
                                visual: null,
                                answerType: 'number',
                                answer: b * k,
                                hints: [
                                    `The top was multiplied by ${k} (${a} → ${a * k}).`,
                                    `Do the same to the bottom: ${b} × ${k} = ?`
                                ],
                                explain: `${a}/${b} = ${a * k}/${b * k} — top and bottom both × ${k}.`
                            };
                        }
                        const interactive = level === 1 ? { type: 'equiv-bars', topParts: b, topShaded: a, bottomParts: b * k, done: `Same length shaded! ${a}/${b} = ${a * k}/${b * k}, so the missing number is ${a * k}. Type it in ✏️` } : null;
                        return {
                            prompt: `Fill in the blank: ${a}/${b} = ?/${b * k}${level === 1 ? '<span class="prompt-sub">Shade the bottom bar until it matches the top bar.</span>' : ''}`,
                            visual: level === 1 ? fractionPair(a, b, a * k, b * k) : null,
                            interactive,
                            answerType: 'number',
                            answer: a * k,
                            hints: [
                                `The bottom was multiplied by ${k} (${b} → ${b * k}).`,
                                `Do the same to the top: ${a} × ${k} = ?`
                            ],
                            explain: `${a}/${b} = ${a * k}/${b * k} — top and bottom both × ${k}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g3-measure',
            grade: 3,
            title: 'Area, Perimeter & Time',
            icon: '📐',
            standard: 'NC.3.MD',
            prereq: 'g3-fractions',
            skills: [
                {
                    id: 'area',
                    title: 'Area of Rectangles',
                    standard: 'NC.3.MD.7',
                    learnIntro: '<strong>Area = how many squares cover it!</strong><br>A 4-by-3 rectangle holds 4 × 3 = <strong>12</strong> square units. Rows × columns!',
                    generate(level) {
                        const rows = level === 1 ? R.int(2, 4) : R.int(3, 9);
                        const cols = level === 1 ? R.int(2, 5) : R.int(3, 9);
                        if (level === 3) {
                            return {
                                prompt: `A rectangle is ${cols} units long and ${rows} units wide. What is its AREA in square units?`,
                                visual: null,
                                answerType: 'number',
                                answer: rows * cols,
                                hints: [
                                    `Picture it covered in unit squares: ${rows} rows of ${cols}.`,
                                    `Area = length × width.`
                                ],
                                explain: `Area = ${cols} × ${rows} = ${rows * cols} square units.`
                            };
                        }
                        const interactive = level === 1 ? { type: 'build-array', rows, cols, icon: '🟩', done: `You covered the whole rectangle — ${rows} rows of ${cols} makes ${rows * cols} square units! Type it in ✏️` } : null;
                        return {
                            prompt: `Each small square is 1 square unit. What is the AREA of this rectangle?${level === 1 ? '<span class="prompt-sub">Cover the rectangle with tiles, then type how many.</span>' : ''}`,
                            visual: areaGrid(rows, cols),
                            interactive,
                            answerType: 'number',
                            answer: rows * cols,
                            hints: [
                                `You could count every square... or be clever!`,
                                `There are ${rows} rows with ${cols} squares in each.`,
                                `${rows} × ${cols} = ?`
                            ],
                            explain: `${rows} rows × ${cols} columns = ${rows * cols} square units.`
                        };
                    }
                },
                {
                    id: 'perimeter',
                    title: 'Perimeter',
                    standard: 'NC.3.MD.8',
                    learnIntro: '<strong>Perimeter = the walk around the edge!</strong><br>A rectangle 6 long and 4 wide: 6 + 4 + 6 + 4 = <strong>20</strong> units around.',
                    generate(level) {
                        // keep w strictly shorter than l — the Master-level
                        // variant asks for "the shorter side"
                        const l = R.int(3, 12);
                        const w = R.int(2, Math.min(l - 1, 8));
                        if (level === 3 && Math.random() < 0.5) {
                            const p = 2 * (l + w);
                            return {
                                prompt: `A rectangle has a perimeter of ${p} units. One side is ${l} units. How long is the shorter side?`,
                                visual: null,
                                answerType: 'number',
                                answer: w,
                                hints: [
                                    `Two sides are ${l}, so those use up ${2 * l} units.`,
                                    `${p} − ${2 * l} = ${p - 2 * l} is left for the other TWO sides.`,
                                    `${p - 2 * l} ÷ 2 = ?`
                                ],
                                explain: `${p} − ${l} − ${l} = ${p - 2 * l}, shared by two sides → ${w} each.`
                            };
                        }
                        const interactive = level === 1 ? { type: 'trace-sides', l, w, done: `You walked every side: ${l} + ${w} + ${l} + ${w} = ${2 * (l + w)}! Type it in ✏️` } : null;
                        return {
                            prompt: `What is the PERIMETER of this rectangle (the distance all the way around)?${level === 1 ? '<span class="prompt-sub">Tap each side of the rectangle to add up the distance around.</span>' : ''}`,
                            visual: level < 3 ? perimeterRectSVG(l, w) : null,
                            interactive,
                            answerType: 'number',
                            answer: 2 * (l + w),
                            hints: [
                                `Add all four sides: ${l} + ${w} + ${l} + ${w}.`,
                                `Shortcut: (${l} + ${w}) × 2.`
                            ],
                            explain: `${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} units.`
                        };
                    }
                },
                {
                    id: 'elapsed-time',
                    title: 'Elapsed Time',
                    standard: 'NC.3.MD.1',
                    learnIntro: '<strong>Hop along the clock!</strong><br>3:40 + 25 minutes → hop 20 to reach 4:00, then 5 more → <strong>4:05</strong>.',
                    generate(level) {
                        const h = R.int(1, 11);
                        const m0 = R.int(0, 11) * 5;
                        if (level === 3 && Math.random() < 0.5) {
                            const dur = R.int(2, 10) * 5;
                            const total = h * 60 + m0 + dur;
                            const h2 = Math.floor(total / 60), m2 = total % 60;
                            return {
                                prompt: `A movie starts at ${h}:${pad2(m0)} and ends at ${h2}:${pad2(m2)}. How many minutes long is it?`,
                                visual: null,
                                answerType: 'number',
                                answer: dur,
                                hints: [
                                    `Count up from ${h}:${pad2(m0)}.`,
                                    `First hop to the next hour, then count the rest.`
                                ],
                                explain: `From ${h}:${pad2(m0)} to ${h2}:${pad2(m2)} is ${dur} minutes.`
                            };
                        }
                        const dur = level === 1 ? R.pick([30, 60]) : R.pick([15, 20, 25, 30, 40, 45, 50]);
                        const total = h * 60 + m0 + dur;
                        const h2 = Math.floor(total / 60), m2 = total % 60;
                        const interactive = level === 1 ? { type: 'clock-adder', h, m: m0, addMinutes: dur, done: `You moved the clock forward ${dur} minutes — read the new time and type it like 3:45 ✏️` } : null;
                        return {
                            prompt: `It is ${h}:${pad2(m0)}. What time will it be in ${dur} minutes? (Type it like 3:45)${level === 1 ? `<span class="prompt-sub">Tap the buttons to move the clock forward ${dur} minutes.</span>` : ''}`,
                            visual: level === 1 ? clockSVG(h, m0) : null,
                            interactive,
                            answerType: 'time',
                            answer: `${h2}:${pad2(m2)}`,
                            timeValue: { h: h2, m: m2 },
                            hints: [
                                `Count by 5s or 10s from ${h}:${pad2(m0)}.`,
                                `Hop to the next hour first if you can.`
                            ],
                            explain: `${h}:${pad2(m0)} + ${dur} minutes = ${h2}:${pad2(m2)}.`
                        };
                    }
                }
            ]
        },
        // ============ GRADE 4 ============
        {
            id: 'g4-mult',
            grade: 4,
            title: 'Multiply Big',
            icon: '🚀',
            standard: 'NC.4.NBT.5, 4.OA',
            prereq: null,
            skills: [
                {
                    id: 'multiply-2x1',
                    title: '2-Digit × 1-Digit',
                    standard: 'NC.4.NBT.5',
                    learnIntro: '<strong>Break it apart!</strong><br>34 × 6 → (30 × 6) + (4 × 6) = 180 + 24 = <strong>204</strong>.',
                    generate(level) {
                        const a = level === 1 ? R.int(12, 25) : level === 2 ? R.int(13, 49) : R.int(24, 89);
                        const b = level === 1 ? R.int(2, 4) : level === 2 ? R.int(3, 6) : R.int(3, 9);
                        const tens = Math.floor(a / 10) * 10, ones = a % 10;
                        const interactive = level === 1 ? { type: 'partial-products', aParts: (a % 10 === 0 ? [a] : [tens, ones]), bParts: [b], done: `The pieces add up to ${a * b}! Type it in ✏️` } : null;
                        return {
                            prompt: `${a} × ${b} = ?${level === 1 ? `<span class="prompt-sub">Break ${a} into tens and ones — tap each piece of the rectangle.</span>` : ''}`,
                            visual: null,
                            interactive,
                            answerType: 'number',
                            answer: a * b,
                            hints: [
                                `Break ${a} apart: ${tens} + ${ones}.`,
                                `${tens} × ${b} = ${tens * b}, and ${ones} × ${b} = ${ones * b}.`,
                                `${tens * b} + ${ones * b} = ?`
                            ],
                            explain: `${a} × ${b} = (${tens} × ${b}) + (${ones} × ${b}) = ${tens * b} + ${ones * b} = ${a * b}.`
                        };
                    }
                },
                {
                    id: 'multiply-big',
                    title: 'Bigger Multiplication',
                    standard: 'NC.4.NBT.5',
                    learnIntro: '<strong>Same trick, more pieces!</strong><br>213 × 3 → (200 × 3) + (10 × 3) + (3 × 3) = 600 + 30 + 9 = <strong>639</strong>.',
                    generate(level) {
                        if (level === 3) {
                            const a = R.int(12, 39), b = R.int(12, 29);
                            const bt = Math.floor(b / 10) * 10, bo = b % 10;
                            return {
                                prompt: `${a} × ${b} = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: a * b,
                                hints: [
                                    `Break ${b} apart: ${bt} + ${bo}.`,
                                    `${a} × ${bt} = ${a * bt}, and ${a} × ${bo} = ${a * bo}.`,
                                    `${a * bt} + ${a * bo} = ?`
                                ],
                                explain: `${a} × ${b} = (${a} × ${bt}) + (${a} × ${bo}) = ${a * bt} + ${a * bo} = ${a * b}.`
                            };
                        }
                        const a = R.int(110, level === 1 ? 320 : 480);
                        const b = level === 1 ? R.int(2, 3) : R.int(2, 6);
                        const h = Math.floor(a / 100) * 100, t = Math.floor(a / 10) % 10 * 10, o = a % 10;
                        const parts = [`${h} × ${b} = ${h * b}`];
                        if (t) parts.push(`${t} × ${b} = ${t * b}`);
                        if (o) parts.push(`${o} × ${b} = ${o * b}`);
                        const interactive = level === 1 ? { type: 'partial-products', aParts: [h, t, o].filter(x => x), bParts: [b], done: `All the pieces together make ${a * b}! Type it in ✏️` } : null;
                        return {
                            prompt: `${a} × ${b} = ?${level === 1 ? `<span class="prompt-sub">Break ${a} into hundreds, tens and ones — tap each piece.</span>` : ''}`,
                            visual: null,
                            interactive,
                            answerType: 'number',
                            answer: a * b,
                            hints: [
                                `Break ${a} into hundreds, tens, and ones.`,
                                parts.join(', ') + '.',
                                `Now add the pieces together.`
                            ],
                            explain: `${a} × ${b}: ${parts.join(', ')} → total ${a * b}.`
                        };
                    }
                },
                {
                    id: 'factors-primes',
                    title: 'Factors & Primes',
                    standard: 'NC.4.OA.4',
                    learnIntro: '<strong>Prime = exactly two factors (1 and itself).</strong><br>7 is prime — only 1 × 7 works.<br>12 is composite — 1×12, 2×6, 3×4 all work!',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            let n;
                            do { n = R.int(24, 90); } while (isPrime(n));
                            let f = 2;
                            while (n % f !== 0) f++;
                            return {
                                prompt: `What is the SMALLEST prime factor of ${n}?`,
                                visual: null,
                                answerType: 'number',
                                answer: f,
                                hints: [
                                    `Try the small primes in order: 2, 3, 5, 7...`,
                                    `Is ${n} even? Then 2 divides it. If not, do its digits add to a multiple of 3?`
                                ],
                                explain: `${n} = ${f} × ${n / f}, and ${f} is prime — so ${f} is the smallest prime factor.`
                            };
                        }
                        const n = level === 1 ? R.int(4, 20) : level === 2 ? R.int(21, 50) : R.int(30, 60);
                        const answer = isPrime(n) ? 'Prime' : 'Composite';
                        let f = 2;
                        if (!isPrime(n)) { while (n % f !== 0) f++; }
                        return {
                            prompt: `Is ${n} prime or composite?`,
                            visual: null,
                            answerType: 'choice',
                            choices: ['Prime', 'Composite'],
                            answer,
                            hints: [
                                `Can you arrange ${n} dots into a rectangle with more than one row?`,
                                `Check the small primes: does 2, 3, 5, or 7 divide ${n} evenly?`
                            ],
                            explain: isPrime(n)
                                ? `Only 1 × ${n} makes ${n} — it is prime.`
                                : `${n} = ${f} × ${n / f}, so it has extra factors — composite.`
                        };
                    }
                },
                {
                    id: 'multi-step-stories-4',
                    title: 'Multi-Step Stories',
                    standard: 'NC.4.OA.3',
                    learnIntro: '<strong>Big stories, small steps!</strong><br>Solve one piece at a time and hold your answer for the next step.',
                    generate(level) {
                        const item = themeThing();
                        const name = heroName();
                        const a = level === 1 ? R.int(2, 4) : R.int(3, 6);
                        const b = level === 1 ? R.int(11, 15) : R.int(12, 25);
                        if (level === 3 && Math.random() < 0.5) {
                            const c = R.int(2, 4), d = R.int(11, 20);
                            return {
                                prompt: `${name} has ${a} boxes of ${b} ${item.name} ${item.icon} and ${c} boxes of ${d}. How many ${item.name} in all?`,
                                visual: null,
                                answerType: 'number',
                                answer: a * b + c * d,
                                hints: [
                                    `Step 1: ${a} × ${b} = ?`,
                                    `Step 2: ${c} × ${d} = ?`,
                                    `Step 3: add ${a * b} + ${c * d}.`
                                ],
                                explain: `${a} × ${b} = ${a * b} and ${c} × ${d} = ${c * d}; together ${a * b + c * d}.`
                            };
                        }
                        const c = R.int(8, Math.min(40, a * b - 5));
                        return {
                            prompt: `${name} has ${a} boxes of ${b} ${item.name} ${item.icon}. ${name} gives away ${c}. How many are left?`,
                            visual: null,
                            answerType: 'number',
                            answer: a * b - c,
                            hints: [
                                `Step 1: how many to start? ${a} × ${b} = ?`,
                                `Step 2: ${a * b} − ${c} = ?`
                            ],
                            explain: `${a} × ${b} = ${a * b}, then ${a * b} − ${c} = ${a * b - c}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g4-div',
            grade: 4,
            title: 'Divide & Conquer',
            icon: '➗',
            standard: 'NC.4.NBT.6, 4.OA.3',
            prereq: 'g4-mult',
            skills: [
                {
                    id: 'divide-remainders',
                    title: 'Division with Remainders',
                    standard: 'NC.4.NBT.6',
                    learnIntro: '<strong>Sometimes it doesn\'t come out even!</strong><br>17 ÷ 5: five goes in 3 times (15), with 2 left over.<br>Quotient 3, remainder <strong>2</strong>.',
                    generate(level) {
                        const d = level === 1 ? R.int(3, 5) : R.int(3, 9);
                        const q = level === 1 ? R.int(2, 5) : R.int(3, 9);
                        const r = R.int(1, d - 1);
                        const n = d * q + r;
                        const askRemainder = Math.random() < 0.5;
                        const interactive = level === 1 ? { type: 'share-groups', total: n, groups: d, share: q, remainder: r, icon: '🔵', itemName: 'dots', done: askRemainder ? `Every plate got ${q}, and ${r} couldn't be shared — the remainder is ${r}! Type it in ✏️` : `Every plate got ${q}, with ${r} left over — each group gets ${q}! Type it in ✏️` } : null;
                        return {
                            prompt: (askRemainder
                                ? `What is the REMAINDER when ${n} is divided by ${d}?`
                                : `How many whole groups of ${d} fit inside ${n}?`) + (level === 1 ? `<span class="prompt-sub">Deal fairly onto the ${d} plates — some will be left over!</span>` : ''),
                            visual: null,
                            interactive,
                            answerType: 'number',
                            answer: askRemainder ? r : q,
                            hints: [
                                `Find the biggest multiple of ${d} that fits in ${n}.`,
                                `${d} × ${q} = ${d * q}. How much of ${n} is left after that?`
                            ],
                            explain: `${n} ÷ ${d}: ${d} × ${q} = ${d * q}, remainder ${n} − ${d * q} = ${r}.`
                        };
                    }
                },
                {
                    id: 'long-division',
                    title: 'Divide Bigger Numbers',
                    standard: 'NC.4.NBT.6',
                    learnIntro: '<strong>Divide in chunks!</strong><br>84 ÷ 4 → 80 ÷ 4 = 20, and 4 ÷ 4 = 1. Together: <strong>21</strong>.',
                    generate(level) {
                        const d = R.int(2, 9);
                        const qt = (level === 1 ? R.int(1, 2) : level === 2 ? R.int(1, 9) : R.int(2, 14)) * 10;
                        const qo = R.int(1, 9);
                        const q = qt + qo;
                        const n = d * q;
                        return {
                            prompt: `${n} ÷ ${d} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: q,
                            hints: [
                                `Divide in chunks: what big chunk of ${n} is easy to divide by ${d}?`,
                                `${d} × ${qt} = ${d * qt}. That leaves ${n - d * qt}.`,
                                `${n - d * qt} ÷ ${d} = ${qo}. Add your chunks: ${qt} + ${qo}.`
                            ],
                            explain: `${n} ÷ ${d}: ${d} × ${qt} = ${d * qt}, leaving ${n - d * qt}; ${n - d * qt} ÷ ${d} = ${qo}. Answer: ${qt} + ${qo} = ${q}.`
                        };
                    }
                },
                {
                    id: 'division-stories',
                    title: 'Division Stories',
                    standard: 'NC.4.OA.3',
                    learnIntro: '<strong>What does the remainder MEAN?</strong><br>26 kids, vans hold 6 → 26 ÷ 6 = 4 R2.<br>You need 5 vans — the 2 extra kids still need a ride!',
                    generate(level) {
                        const item = themeThing();
                        const name = heroName();
                        const d = R.int(3, 8);
                        const q = R.int(3, 9);
                        if (level === 1) {
                            const n = d * q;
                            return {
                                prompt: `${name} shares ${n} ${item.name} ${item.icon} equally among ${d} friends. How many does each friend get?${n <= 24 ? '<span class="prompt-sub">Deal them onto the plates to share fairly.</span>' : ''}`,
                                visual: null,
                                interactive: n <= 24 ? { type: 'share-groups', total: n, groups: d, icon: '🔵', itemName: 'items', done: `You shared ${n} equally — ${q} for each! Type it in ✏️` } : null,
                                answerType: 'number',
                                answer: q,
                                hints: [`Think: ${d} × ? = ${n}.`],
                                explain: `${n} ÷ ${d} = ${q} each.`
                            };
                        }
                        const r = R.int(1, d - 1);
                        const n = d * q + r;
                        if (level === 2 || Math.random() < 0.5) {
                            return {
                                prompt: `${name} packs ${n} ${item.name} ${item.icon} into boxes of ${d}. How many ${item.name} are LEFT OVER?`,
                                visual: null,
                                answerType: 'number',
                                answer: r,
                                hints: [
                                    `Fill as many boxes as you can: ${d} × ${q} = ${d * q}.`,
                                    `${n} − ${d * q} = ?`
                                ],
                                explain: `${q} full boxes hold ${d * q}; ${n} − ${d * q} = ${r} left over.`
                            };
                        }
                        return {
                            prompt: `${n} kids are going on a trip. Each van holds ${d} kids. How many vans do they NEED?`,
                            visual: null,
                            answerType: 'number',
                            answer: q + 1,
                            hints: [
                                `${n} ÷ ${d} = ${q} remainder ${r}.`,
                                `${q} full vans carry ${d * q} kids... but ${r} kids are still standing there!`
                            ],
                            explain: `${q} vans fit ${d * q} kids; the last ${r} kids need one more van → ${q + 1} vans.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g4-fractions',
            grade: 4,
            title: 'Fraction Action',
            icon: '🧩',
            standard: 'NC.4.NF.1–4',
            prereq: 'g4-div',
            skills: [
                {
                    id: 'equivalent-fractions-4',
                    title: 'Equivalent Fractions Pro',
                    standard: 'NC.4.NF.1',
                    learnIntro: '<strong>Scale up or down — top and bottom together!</strong><br>3/4 = 9/12 (both × 3). 10/15 = 2/3 (both ÷ 5).',
                    generate(level) {
                        const [a, b] = R.pick([[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [5, 6]]);
                        const k = level === 1 ? R.int(2, 3) : R.int(2, 6);
                        if (Math.random() < 0.5) {
                            return {
                                prompt: `Fill in the blank: ${a}/${b} = ?/${b * k}${level === 1 ? '<span class="prompt-sub">Shade the bottom bar to match the top bar.</span>' : ''}`,
                                visual: null,
                                interactive: level === 1 ? { type: 'equiv-bars', topParts: b, topShaded: a, bottomParts: b * k, done: `Same length! ${a}/${b} = ${a * k}/${b * k} — the missing number is ${a * k}. Type it in ✏️` } : null,
                                answerType: 'number',
                                answer: a * k,
                                hints: [
                                    `${b} was multiplied by ${k} to get ${b * k}.`,
                                    `Multiply the top by ${k} too: ${a} × ${k}.`
                                ],
                                explain: `${a}/${b} = ${a * k}/${b * k} — both × ${k}.`
                            };
                        }
                        return {
                            prompt: `Fill in the blank: ${a}/${b} = ${a * k}/?`,
                            visual: null,
                            answerType: 'number',
                            answer: b * k,
                            hints: [
                                `${a} was multiplied by ${k} to get ${a * k}.`,
                                `Multiply the bottom by ${k} too: ${b} × ${k}.`
                            ],
                            explain: `${a}/${b} = ${a * k}/${b * k} — both × ${k}.`
                        };
                    }
                },
                {
                    id: 'add-sub-fractions-like',
                    title: 'Add & Subtract Fractions',
                    standard: 'NC.4.NF.3',
                    learnIntro: '<strong>Same-size pieces just add up!</strong><br>3/8 + 2/8 = 5/8. The pieces (eighths) don\'t change — only the count.',
                    generate(level) {
                        const d = R.pick(level === 1 ? [4, 5, 6] : [5, 6, 8, 10, 12]);
                        const add = Math.random() < 0.6;
                        if (add) {
                            const a = R.int(1, d - 2);
                            const c = R.int(1, d - 1 - a);
                            return Object.assign({
                                prompt: `${a}/${d} + ${c}/${d} = ? (Type it like 3/4)${level === 1 ? `<span class="prompt-sub">Shade ${c} more pieces.</span>` : ''}`,
                                visual: level === 1 ? fractionPair(a, d, c, d) : null,
                                interactive: level === 1 ? { type: 'shade-two', parts: d, preShaded: a, change: c, mode: 'add', done: `${a} shaded plus ${c} more makes ${a + c} out of ${d} — type it like ${a + c}/${d} ✏️` } : null,
                                answerType: 'fraction',
                                hints: [
                                    `The pieces are the same size — ${d}ths.`,
                                    `Just add the counts: ${a} + ${c}. The bottom stays ${d}.`
                                ],
                                explain: `${a}/${d} + ${c}/${d} = ${a + c}/${d}.`
                            }, frac(a + c, d));
                        }
                        const a = R.int(2, d - 1);
                        const c = R.int(1, a - 1);
                        return Object.assign({
                            prompt: `${a}/${d} − ${c}/${d} = ? (Type it like 3/4)${level === 1 ? `<span class="prompt-sub">Cross off ${c} pieces.</span>` : ''}`,
                            visual: null,
                            interactive: level === 1 ? { type: 'shade-two', parts: d, preShaded: a, change: c, mode: 'remove', done: `You crossed off ${c}, leaving ${a - c} of ${d} — type it like ${a - c}/${d} ✏️` } : null,
                            answerType: 'fraction',
                            hints: [
                                `Same-size pieces (${d}ths) — subtract the counts.`,
                                `${a} − ${c} = ?. The bottom stays ${d}.`
                            ],
                            explain: `${a}/${d} − ${c}/${d} = ${a - c}/${d}.`
                        }, frac(a - c, d));
                    }
                },
                {
                    id: 'compare-unlike-fractions',
                    title: 'Compare Unlike Fractions',
                    standard: 'NC.4.NF.2',
                    learnIntro: '<strong>Use 1/2 as your measuring stick!</strong><br>3/8 is less than a half; 5/9 is more than a half → 3/8 &lt; 5/9.<br>Or rename both with the same denominator.',
                    generate(level) {
                        let a1, d1, a2, d2;
                        if (level === 3 && Math.random() < 0.2) {
                            [a1, d1] = R.pick([[1, 2], [2, 3], [3, 4]]);
                            const k = R.int(2, 3);
                            a2 = a1 * k; d2 = d1 * k;
                        } else {
                            do {
                                d1 = R.pick([2, 3, 4, 5, 8]);
                                do { d2 = R.pick([3, 4, 5, 6, 8]); } while (d2 === d1);
                                a1 = R.int(1, d1 - 1);
                                a2 = R.int(1, d2 - 1);
                            } while (level < 3 && a1 * d2 === a2 * d1);
                        }
                        const c1 = a1 * d2, c2 = a2 * d1;
                        const answer = c1 < c2 ? '<' : c1 > c2 ? '>' : '=';
                        const correct = answer === '<' ? 'bottom' : answer === '>' ? 'top' : 'equal';
                        const interactive = level === 1 ? { type: 'compare-bars', top: { parts: d1, target: a1, label: `${a1}/${d1}` }, bottom: { parts: d2, target: a2, label: `${a2}/${d2}` }, correct, done: `You shaded both bars and saw which is bigger — now tap ${answer} below!` } : null;
                        return {
                            prompt: `Which symbol makes this true?<br><span class="compare-nums">${a1}/${d1} &nbsp; ? &nbsp; ${a2}/${d2}</span>${level === 1 ? '<span class="prompt-sub">Shade each bar, then tap the bigger one.</span>' : ''}`,
                            visual: level === 1 ? fractionPair(a1, d1, a2, d2) : null,
                            interactive,
                            answerType: 'choice',
                            choices: ['<', '>', '='],
                            answer,
                            hints: [
                                `Is each fraction more or less than one half?`,
                                `Rename with the same bottom: ${a1}/${d1} = ${c1}/${d1 * d2} and ${a2}/${d2} = ${c2}/${d1 * d2}.`
                            ],
                            explain: `${a1}/${d1} = ${c1}/${d1 * d2} and ${a2}/${d2} = ${c2}/${d1 * d2}, so ${a1}/${d1} ${answer} ${a2}/${d2}.`
                        };
                    }
                },
                {
                    id: 'fraction-of-number',
                    title: 'Fraction of a Number',
                    standard: 'NC.4.NF.4',
                    learnIntro: '<strong>Divide, then multiply!</strong><br>2/3 of 12 → 12 ÷ 3 = 4 (that\'s 1/3), then 4 × 2 = <strong>8</strong>.',
                    generate(level) {
                        const b = level === 1 ? R.pick([2, 3, 4]) : R.int(2, 6);
                        const a = level === 1 ? 1 : R.int(1, b - 1);
                        const m = R.int(2, level === 3 ? 9 : 5);
                        const n = b * m;
                        const interactive = level === 1 ? { type: 'share-groups', total: n, groups: b, icon: '🔵', itemName: 'counters', done: `You split ${n} into ${b} equal groups — each group has ${m}. So 1/${b} of ${n} is ${m}! Type it in ✏️` } : null;
                        return {
                            prompt: (level === 3 && Math.random() < 0.5
                                ? `${n} × ${a}/${b} = ?`
                                : `What is ${a}/${b} of ${n}?`) + (level === 1 ? `<span class="prompt-sub">Deal all ${n} onto the ${b} plates, then count one plate.</span>` : ''),
                            visual: null,
                            interactive,
                            answerType: 'number',
                            answer: a * m,
                            hints: [
                                `First find 1/${b} of ${n}: divide ${n} ÷ ${b}.`,
                                `1/${b} of ${n} is ${m}. Now take ${a} of those.`,
                                `${m} × ${a} = ?`
                            ],
                            explain: `${n} ÷ ${b} = ${m}, then ${m} × ${a} = ${a * m}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g4-decimals',
            grade: 4,
            title: 'Decimals, Measures & Angles',
            icon: '📊',
            standard: 'NC.4.NF.6–7, 4.MD',
            prereq: 'g4-fractions',
            skills: [
                {
                    id: 'decimals-intro',
                    title: 'Meet the Decimals',
                    standard: 'NC.4.NF.6–7',
                    learnIntro: '<strong>Decimals are fractions in disguise!</strong><br>7/10 = 0.7 and 43/100 = 0.43.<br>The first spot after the point is tenths, the second is hundredths.',
                    generate(level) {
                        if (level === 1) {
                            const t = R.int(1, 9);
                            return {
                                prompt: `Write ${t}/10 as a decimal. (Type it like 0.7)<span class="prompt-sub">Shade ${t} of the 10 parts.</span>`,
                                visual: fractionRect(10, t),
                                interactive: { type: 'shade-fraction', parts: 10, target: t, mode: 'shade', done: `You shaded ${t} of 10 equal parts — ${t} tenths is written 0.${t}. Type it in ✏️` },
                                answerType: 'text',
                                answer: `0.${t}`,
                                accept: [`.${t}`, `0.${t}0`],
                                hints: [
                                    `Tenths go in the FIRST spot after the decimal point.`,
                                    `${t} tenths → 0 point ${t}.`
                                ],
                                explain: `${t}/10 = 0.${t}.`
                            };
                        }
                        if (level === 2) {
                            const hh = R.int(1, 99);
                            const s = hh < 10 ? `0.0${hh}` : `0.${hh}`;
                            return {
                                prompt: `Write ${hh}/100 as a decimal. (Type it like 0.43)`,
                                visual: null,
                                answerType: 'text',
                                answer: s,
                                accept: [s.slice(1), hh % 10 === 0 ? `0.${hh / 10}` : s],
                                hints: [
                                    `Hundredths fill TWO spots after the decimal point.`,
                                    `${hh} hundredths → ${s}.`
                                ],
                                explain: `${hh}/100 = ${s}.`
                            };
                        }
                        const t = R.int(1, 9);
                        let hh;
                        do { hh = R.int(11, 99); } while (hh === t * 10);
                        const a100 = t * 10, b100 = hh;
                        const answer = a100 < b100 ? '<' : a100 > b100 ? '>' : '=';
                        return {
                            prompt: `Which symbol makes this true?<br><span class="compare-nums">0.${t} &nbsp; ? &nbsp; 0.${hh}</span>`,
                            visual: null,
                            answerType: 'choice',
                            choices: ['<', '>', '='],
                            answer,
                            hints: [
                                `Careful — more digits does NOT mean bigger!`,
                                `Rename: 0.${t} = ${a100} hundredths, and 0.${hh} = ${b100} hundredths.`
                            ],
                            explain: `0.${t} = ${a100}/100 and 0.${hh} = ${b100}/100, so 0.${t} ${answer} 0.${hh}.`
                        };
                    }
                },
                {
                    id: 'unit-conversions',
                    title: 'Unit Conversions',
                    standard: 'NC.4.MD.1',
                    learnIntro: '<strong>Big units → small units: multiply!</strong><br>3 m = 3 × 100 = 300 cm. 2 hours = 2 × 60 = 120 minutes.',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            const kind = R.pick([
                                { a: R.int(1, 4), b: R.int(1, 11) * 5, big: 'hours', small: 'minutes', f: 60 },
                                { a: R.int(1, 5), b: R.int(1, 9) * 10, big: 'm', small: 'cm', f: 100 },
                                { a: R.int(1, 4), b: R.int(5, 55), big: 'minutes', small: 'seconds', f: 60 }
                            ]);
                            return {
                                prompt: `${kind.a} ${kind.big} ${kind.b} ${kind.small} = ? ${kind.small}`,
                                visual: null,
                                answerType: 'number',
                                answer: kind.a * kind.f + kind.b,
                                hints: [
                                    `Convert the big unit first: ${kind.a} ${kind.big} = ${kind.a * kind.f} ${kind.small}.`,
                                    `Then add the extra ${kind.b}.`
                                ],
                                explain: `${kind.a} × ${kind.f} = ${kind.a * kind.f}, plus ${kind.b} = ${kind.a * kind.f + kind.b} ${kind.small}.`
                            };
                        }
                        const conv = R.pick([
                            ['meters', 'centimeters', 100],
                            ['kilometers', 'meters', 1000],
                            ['kilograms', 'grams', 1000],
                            ['liters', 'milliliters', 1000],
                            ['minutes', 'seconds', 60],
                            ['hours', 'minutes', 60],
                            ['feet', 'inches', 12]
                        ]);
                        const n = R.int(2, 9);
                        if (level === 2 && Math.random() < 0.4) {
                            return {
                                prompt: `${n * conv[2]} ${conv[1]} = ? ${conv[0]}`,
                                visual: null,
                                answerType: 'number',
                                answer: n,
                                hints: [
                                    `1 ${conv[0].replace(/s$/, '')} = ${conv[2]} ${conv[1]}.`,
                                    `How many groups of ${conv[2]} are in ${n * conv[2]}?`
                                ],
                                explain: `${n * conv[2]} ÷ ${conv[2]} = ${n} ${conv[0]}.`
                            };
                        }
                        return {
                            prompt: `${n} ${conv[0]} = ? ${conv[1]}`,
                            visual: null,
                            answerType: 'number',
                            answer: n * conv[2],
                            hints: [
                                `1 ${conv[0].replace(/s$/, '')} = ${conv[2]} ${conv[1]}.`,
                                `${n} × ${conv[2]} = ?`
                            ],
                            explain: `${n} × ${conv[2]} = ${n * conv[2]} ${conv[1]}.`
                        };
                    }
                },
                {
                    id: 'angles',
                    title: 'Angles',
                    standard: 'NC.4.MD.6–7, 4.G.1',
                    learnIntro: '<strong>Angles measure the turn between two rays!</strong><br>Right angle = 90° (a perfect corner). Acute = smaller. Obtuse = bigger.<br>A straight line is 180°.',
                    generate(level) {
                        if (level === 3) {
                            const total = R.pick([90, 180]);
                            const x = R.int(15, total - 15);
                            return {
                                prompt: `Two angles fit together to make a ${total === 90 ? 'right angle (90°)' : 'straight line (180°)'}. One angle is ${x}°. What is the other?`,
                                visual: null,
                                answerType: 'number',
                                answer: total - x,
                                hints: [
                                    `The two angles add up to ${total}°.`,
                                    `${total} − ${x} = ?`
                                ],
                                explain: `${x}° + ${total - x}° = ${total}°.`
                            };
                        }
                        const kind = R.pick(level === 1
                            ? [['Acute', R.int(20, 70)], ['Right', 90], ['Obtuse', R.int(110, 160)]]
                            : [['Acute', R.int(15, 75)], ['Right', 90], ['Obtuse', R.int(105, 170)], ['Straight', 180]]);
                        const choices = level === 1 ? ['Acute', 'Right', 'Obtuse'] : ['Acute', 'Right', 'Obtuse', 'Straight'];
                        const deg = kind[1];
                        const interactive = level === 1 ? { type: 'angle-drag', deg, done: `You measured it — about ${deg}°! Now tap which kind of angle that is.` } : null;
                        return {
                            prompt: `What kind of angle is this?${level === 1 ? '<span class="prompt-sub">Drag the measuring ray to match the angle.</span>' : ''}`,
                            visual: angleSVG(kind[1]),
                            interactive,
                            answerType: 'choice',
                            choices,
                            answer: kind[0],
                            hints: [
                                `Compare it to a square corner (90°).`,
                                `Smaller than a corner = acute. Bigger = obtuse. Exactly a corner = right.`
                            ],
                            explain: `This angle is ${kind[1]}° — ${kind[0].toLowerCase()}.`
                        };
                    }
                }
            ]
        },
        // ============ GRADE 5 ============
        {
            id: 'g5-ops',
            grade: 5,
            title: 'Powers & Order of Operations',
            icon: '🧮',
            standard: 'NC.5.OA, 5.NBT',
            prereq: null,
            skills: [
                {
                    id: 'order-of-ops',
                    title: 'Order of Operations',
                    standard: 'NC.5.OA.1',
                    learnIntro: '<strong>There\'s an order!</strong><br>Parentheses first, then × and ÷, then + and −.<br>2 + 3 × 4 = 2 + 12 = <strong>14</strong> (not 20!).',
                    generate(level) {
                        const b = R.int(2, 9), c = R.int(2, 9);
                        if (level === 1) {
                            const a = R.int(2, 20);
                            return {
                                prompt: `${a} + ${b} × ${c} = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: a + b * c,
                                hints: [
                                    `Multiplication comes BEFORE addition.`,
                                    `${b} × ${c} = ${b * c}. Now add ${a}.`
                                ],
                                explain: `Multiply first: ${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${a + b * c}.`
                            };
                        }
                        if (level === 2) {
                            if (Math.random() < 0.5) {
                                const a = R.int(2, 9);
                                return {
                                    prompt: `(${a} + ${b}) × ${c} = ?`,
                                    visual: null,
                                    answerType: 'number',
                                    answer: (a + b) * c,
                                    hints: [
                                        `Parentheses FIRST: ${a} + ${b} = ${a + b}.`,
                                        `Now multiply by ${c}.`
                                    ],
                                    explain: `(${a} + ${b}) = ${a + b}, then ${a + b} × ${c} = ${(a + b) * c}.`
                                };
                            }
                            const a = R.int(3, 9), sub = R.int(2, a * b - 2);
                            return {
                                prompt: `${a} × ${b} − ${sub} = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: a * b - sub,
                                hints: [
                                    `Multiply first: ${a} × ${b} = ${a * b}.`,
                                    `${a * b} − ${sub} = ?`
                                ],
                                explain: `${a} × ${b} = ${a * b}, then − ${sub} = ${a * b - sub}.`
                            };
                        }
                        if (Math.random() < 0.5) {
                            const a = R.int(2, 8), d = R.int(2, 8);
                            return {
                                prompt: `${a} × ${b} + ${c} × ${d} = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: a * b + c * d,
                                hints: [
                                    `Do BOTH multiplications first.`,
                                    `${a} × ${b} = ${a * b} and ${c} × ${d} = ${c * d}.`
                                ],
                                explain: `${a * b} + ${c * d} = ${a * b + c * d}.`
                            };
                        }
                        const a = R.int(2, 9);
                        const base = (a + b) * c;
                        const d2 = R.int(2, base - 2);
                        return {
                            prompt: `(${a} + ${b}) × ${c} − ${d2} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: base - d2,
                            hints: [
                                `Parentheses first: ${a} + ${b} = ${a + b}.`,
                                `Then multiply: ${a + b} × ${c} = ${base}.`,
                                `Finally subtract ${d2}.`
                            ],
                            explain: `(${a}+${b}) = ${a + b}; × ${c} = ${base}; − ${d2} = ${base - d2}.`
                        };
                    }
                },
                {
                    id: 'multiply-2x2',
                    title: '2-Digit × 2-Digit',
                    standard: 'NC.5.NBT.5',
                    learnIntro: '<strong>Break one number apart!</strong><br>23 × 45 = 23 × 40 + 23 × 5 = 920 + 115 = <strong>1,035</strong>.',
                    generate(level) {
                        const a = level === 1 ? R.int(12, 25) : level === 2 ? R.int(13, 45) : R.int(22, 79);
                        const b = level === 1 ? R.int(11, 15) : level === 2 ? R.int(12, 25) : R.int(13, 49);
                        const bt = Math.floor(b / 10) * 10, bo = b % 10;
                        const at = Math.floor(a / 10) * 10, ao = a % 10;
                        const interactive = level === 1 ? { type: 'partial-products', aParts: (a % 10 === 0 ? [a] : [at, ao]), bParts: (b % 10 === 0 ? [b] : [bt, bo]), done: `All four pieces add up to ${a * b}! Type it in ✏️` } : null;
                        return {
                            prompt: `${a} × ${b} = ?${level === 1 ? '<span class="prompt-sub">Break both numbers into tens and ones — tap every piece.</span>' : ''}`,
                            visual: null,
                            interactive,
                            answerType: 'number',
                            answer: a * b,
                            hints: [
                                `Break ${b} apart: ${bt} + ${bo}.`,
                                `${a} × ${bt} = ${a * bt}, and ${a} × ${bo} = ${a * bo}.`,
                                `${a * bt} + ${a * bo} = ?`
                            ],
                            explain: `${a} × ${b} = ${a} × ${bt} + ${a} × ${bo} = ${a * bt} + ${a * bo} = ${a * b}.`
                        };
                    }
                },
                {
                    id: 'powers-of-ten',
                    title: 'Multiply & Divide by 10, 100, 1000',
                    standard: 'NC.5.NBT.2',
                    learnIntro: '<strong>Digits shift, they don\'t change!</strong><br>× 10 makes every digit worth 10× more: 3.6 × 10 = 36.<br>÷ 10 does the opposite: 45 ÷ 10 = 4.5.',
                    generate(level) {
                        if (level === 1) {
                            const n = R.int(3, 95), p = R.pick([10, 100]);
                            return {
                                prompt: `${n} × ${p} = ?<span class="prompt-sub">Tap ×10 until you've multiplied by ${p}.</span>`,
                                visual: null,
                                interactive: { type: 'place-shift', start: n, target: n * p, done: `Multiplying by ${p} slid every digit over — ${n} became ${n * p}! Type it in ✏️` },
                                answerType: 'number',
                                answer: n * p,
                                hints: [`× ${p} shifts every digit ${p === 10 ? 'one place' : 'two places'} bigger.`],
                                explain: `${n} × ${p} = ${n * p}.`
                            };
                        }
                        if (level === 2) {
                            const p = R.pick([10, 100]);
                            const n = R.int(2, 90) * p;
                            return {
                                prompt: `${n} ÷ ${p} = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: n / p,
                                hints: [`÷ ${p} shifts every digit ${p === 10 ? 'one place' : 'two places'} smaller.`],
                                explain: `${n} ÷ ${p} = ${n / p}.`
                            };
                        }
                        let k;
                        do { k = R.int(11, 99); } while (k % 10 === 0);
                        const form = R.pick(['dx10', 'dx100', 'div10', 'div100']);
                        const map = {
                            dx10: { prompt: `${k / 10} × 10 = ?`, answer: k, explain: `${k / 10} × 10 = ${k} — the decimal point hops one place right.` },
                            dx100: { prompt: `${k / 10} × 100 = ?`, answer: k * 10, explain: `${k / 10} × 100 = ${k * 10} — two hops right.` },
                            div10: { prompt: `${k} ÷ 10 = ?`, answer: k / 10, explain: `${k} ÷ 10 = ${k / 10} — one hop left.` },
                            div100: { prompt: `${k} ÷ 100 = ?`, answer: k / 100, explain: `${k} ÷ 100 = ${k / 100} — two hops left.` }
                        };
                        const it = map[form];
                        return {
                            prompt: it.prompt,
                            visual: null,
                            answerType: 'number',
                            answer: it.answer,
                            hints: [
                                `The digits stay the same — only their places change.`,
                                `Multiplying hops the decimal point right; dividing hops it left.`
                            ],
                            explain: it.explain
                        };
                    }
                }
            ]
        },
        {
            id: 'g5-decimals',
            grade: 5,
            title: 'Decimal Mastery',
            icon: '💎',
            standard: 'NC.5.NBT.7',
            prereq: 'g5-ops',
            skills: [
                {
                    id: 'add-sub-decimals',
                    title: 'Add & Subtract Decimals',
                    standard: 'NC.5.NBT.7',
                    learnIntro: '<strong>Line up the decimal points!</strong><br>3.45 + 2.3 → think 3.45 + 2.30 = <strong>5.75</strong>.<br>Tenths with tenths, hundredths with hundredths.',
                    generate(level) {
                        const add = Math.random() < 0.6;
                        let A, B, scale;
                        if (level === 1) {
                            scale = 10;
                            do { A = R.int(add ? 12 : 25, 95); } while (A % 10 === 0);
                            do { B = R.int(11, add ? 84 : A - 8); } while (B % 10 === 0);
                        } else {
                            scale = 100;
                            do { A = R.int(120, 899); } while (A % 100 === 0);
                            B = level === 2 ? R.int(11, 89) * 10 : (Math.random() < 0.5 ? R.int(11, 89) * 10 : R.int(105, 850));
                            if (!add && B >= A) B = A - R.int(15, 100);
                            if (B % 100 === 0) B = add ? B + 30 : B - 30;
                        }
                        const ans = add ? (A + B) / scale : (A - B) / scale;
                        const dA = A / scale, dB = B / scale;
                        const interactive = level === 1 ? { type: 'decimal-build', startTenths: A, deltaTenths: B, op: add ? 'add' : 'sub', done: add ? `You added ${dB} onto ${dA} and landed on ${ans}! Type it in ✏️` : `You took ${dB} away from ${dA} and landed on ${ans}! Type it in ✏️` } : null;
                        return {
                            prompt: `${dA} ${add ? '+' : '−'} ${dB} = ?${level === 1 ? `<span class="prompt-sub">${add ? `Tap +1 and +0.1 to add ${dB}.` : `Tap −1 and −0.1 to take away ${dB}.`}</span>` : ''}`,
                            visual: null,
                            interactive,
                            answerType: 'number',
                            answer: ans,
                            hints: [
                                `Line up the decimal points before you ${add ? 'add' : 'subtract'}.`,
                                `Give both numbers the same number of decimal places (add a zero if needed).`,
                                `Think money: $${dA.toFixed(2)} ${add ? '+' : '−'} $${dB.toFixed(2)}.`
                            ],
                            explain: `${dA} ${add ? '+' : '−'} ${dB} = ${ans}. Lining up the points keeps tenths with tenths.`
                        };
                    }
                },
                {
                    id: 'multiply-decimals',
                    title: 'Multiply Decimals',
                    standard: 'NC.5.NBT.7',
                    learnIntro: '<strong>Multiply, then place the point!</strong><br>0.4 × 6: think 4 × 6 = 24. One decimal place in the problem → one in the answer: <strong>2.4</strong>.',
                    generate(level) {
                        if (level === 1) {
                            const t = R.int(2, 9), b = R.int(2, 9);
                            return {
                                prompt: `0.${t} × ${b} = ?<span class="prompt-sub">Each 🟧 is one tenth (0.1). Build ${b} rows of ${t}.</span>`,
                                visual: null,
                                interactive: { type: 'build-array', rows: b, cols: t, icon: '🟧', done: `${b} rows of ${t} tenths is ${t * b} tenths — that's ${t * b / 10}! Type it in ✏️` },
                                answerType: 'number',
                                answer: t * b / 10,
                                hints: [
                                    `First multiply like whole numbers: ${t} × ${b} = ${t * b}.`,
                                    `The problem has ONE decimal place, so the answer needs one too.`
                                ],
                                explain: `${t} × ${b} = ${t * b}; one decimal place → ${t * b / 10}.`
                            };
                        }
                        if (level === 2) {
                            const t1 = R.int(2, 9), t2 = R.int(2, 9);
                            return {
                                prompt: `0.${t1} × 0.${t2} = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: t1 * t2 / 100,
                                hints: [
                                    `Multiply like whole numbers: ${t1} × ${t2} = ${t1 * t2}.`,
                                    `Count decimal places in the problem: 1 + 1 = 2. The answer needs TWO.`
                                ],
                                explain: `${t1} × ${t2} = ${t1 * t2}; two decimal places → ${t1 * t2 / 100}.`
                            };
                        }
                        let k;
                        do { k = R.int(11, 49); } while (k % 10 === 0);
                        const b = R.int(2, 8);
                        return {
                            prompt: `${k / 10} × ${b} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: k * b / 10,
                            hints: [
                                `Think ${k} × ${b} = ${k * b} first.`,
                                `One decimal place in the problem → one in the answer.`
                            ],
                            explain: `${k} × ${b} = ${k * b}; one decimal place → ${k * b / 10}.`
                        };
                    }
                },
                {
                    id: 'divide-decimals',
                    title: 'Divide Decimals',
                    standard: 'NC.5.NBT.7',
                    learnIntro: '<strong>Share it out evenly!</strong><br>6.4 ÷ 8: think 64 tenths ÷ 8 = 8 tenths = <strong>0.8</strong>.',
                    generate(level) {
                        if (level < 3) {
                            const d = R.int(2, 9);
                            let t;
                            if (level === 1) t = R.int(2, 9);
                            else do { t = R.int(11, 96); } while (t % 10 === 0);
                            const n = t * d / 10;
                            return {
                                prompt: `${n} ÷ ${d} = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: t / 10,
                                hints: [
                                    `Think in tenths: ${n} is ${t * d} tenths.`,
                                    `${t * d} tenths ÷ ${d} = ${t} tenths.`
                                ],
                                explain: `${t * d} tenths ÷ ${d} = ${t} tenths = ${t / 10}.`
                            };
                        }
                        const d = R.pick([2, 4, 5]);
                        let n;
                        do { n = R.int(3, 42); } while (n % d === 0);
                        return {
                            prompt: `${n} ÷ ${d} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: n / d,
                            hints: [
                                `It doesn't come out even — the answer is a decimal.`,
                                `${d} × ${Math.floor(n / d)} = ${d * Math.floor(n / d)}, so the answer is ${Math.floor(n / d)} point something.`,
                                `Think money: ${n} dollars shared by ${d} people.`
                            ],
                            explain: `${n} ÷ ${d} = ${n / d}, because ${d} × ${n / d} = ${n}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g5-fractions',
            grade: 5,
            title: 'Fraction Pro',
            icon: '🏆',
            standard: 'NC.5.NF',
            prereq: 'g5-decimals',
            skills: [
                {
                    id: 'add-unlike-fractions',
                    title: 'Add & Subtract Unlike Fractions',
                    standard: 'NC.5.NF.1',
                    learnIntro: '<strong>Different-size pieces? Rename first!</strong><br>1/2 + 1/4 → 1/2 = 2/4, so 2/4 + 1/4 = <strong>3/4</strong>.',
                    generate(level) {
                        if (level < 3) {
                            const [d1, d2] = R.pick([[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [5, 10], [2, 10], [3, 9], [4, 12]]);
                            const k = d2 / d1;
                            if (level === 1) {
                                const a2 = R.int(1, d2 - k - 1);
                                return Object.assign({
                                    prompt: `1/${d1} + ${a2}/${d2} = ? (Type it like 3/4)<span class="prompt-sub">The first fraction is already shaded — shade ${a2} more.</span>`,
                                    visual: null,
                                    interactive: { type: 'shade-two', parts: d2, preShaded: k, change: a2, mode: 'add', preLabel: `1/${d1} = ${k}/${d2}`, done: `1/${d1} is the same as ${k}/${d2}; add ${a2} more to get ${k + a2}/${d2} — type it like ${k + a2}/${d2} ✏️` },
                                    answerType: 'fraction',
                                    hints: [
                                        `The pieces are different sizes! Rename 1/${d1} as ${d2}ths.`,
                                        `1/${d1} = ${k}/${d2}.`,
                                        `${k}/${d2} + ${a2}/${d2} = ?`
                                    ],
                                    explain: `1/${d1} = ${k}/${d2}, so ${k}/${d2} + ${a2}/${d2} = ${fracStr(k + a2, d2)}.`
                                }, frac(k + a2, d2));
                            }
                            const a1 = R.int(1, d1 - 1);
                            const a2 = R.int(1, d2 - 1);
                            const add = Math.random() < 0.6;
                            const n1 = a1 * k;
                            if (add) {
                                return Object.assign({
                                    prompt: `${a1}/${d1} + ${a2}/${d2} = ? (Type it like 3/4)`,
                                    visual: null,
                                    answerType: 'fraction',
                                    hints: [
                                        `Rename ${a1}/${d1} as ${d2}ths first.`,
                                        `${a1}/${d1} = ${n1}/${d2}.`,
                                        `${n1}/${d2} + ${a2}/${d2} = ?`
                                    ],
                                    explain: `${a1}/${d1} = ${n1}/${d2}; ${n1}/${d2} + ${a2}/${d2} = ${fracStr(n1 + a2, d2)}.`
                                }, frac(n1 + a2, d2));
                            }
                            const [big, small] = n1 >= a2 ? [n1, a2] : [a2, n1];
                            const [bs, ss] = n1 >= a2 ? [`${a1}/${d1}`, `${a2}/${d2}`] : [`${a2}/${d2}`, `${a1}/${d1}`];
                            if (big === small) return this.generate(level); // avoid zero answers
                            return Object.assign({
                                prompt: `${bs} − ${ss} = ? (Type it like 3/4)`,
                                visual: null,
                                answerType: 'fraction',
                                hints: [
                                    `Rename both as ${d2}ths first.`,
                                    `That gives ${big}/${d2} − ${small}/${d2}.`
                                ],
                                explain: `As ${d2}ths: ${big}/${d2} − ${small}/${d2} = ${fracStr(big - small, d2)}.`
                            }, frac(big - small, d2));
                        }
                        const [d1, d2] = R.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7]]);
                        const a1 = R.int(1, d1 - 1), a2 = R.int(1, d2 - 1);
                        const lcd = d1 * d2;
                        const n1 = a1 * d2, n2 = a2 * d1;
                        const add = Math.random() < 0.6 || n1 === n2;
                        if (add) {
                            return Object.assign({
                                prompt: `${a1}/${d1} + ${a2}/${d2} = ? (Type it like 3/4)`,
                                visual: null,
                                answerType: 'fraction',
                                hints: [
                                    `Find a common denominator: ${d1} × ${d2} = ${lcd}.`,
                                    `${a1}/${d1} = ${n1}/${lcd} and ${a2}/${d2} = ${n2}/${lcd}.`,
                                    `${n1}/${lcd} + ${n2}/${lcd} = ?`
                                ],
                                explain: `${n1}/${lcd} + ${n2}/${lcd} = ${fracStr(n1 + n2, lcd)}.`
                            }, frac(n1 + n2, lcd));
                        }
                        const [big, small] = n1 >= n2 ? [n1, n2] : [n2, n1];
                        const [bs, ss] = n1 >= n2 ? [`${a1}/${d1}`, `${a2}/${d2}`] : [`${a2}/${d2}`, `${a1}/${d1}`];
                        return Object.assign({
                            prompt: `${bs} − ${ss} = ? (Type it like 3/4)`,
                            visual: null,
                            answerType: 'fraction',
                            hints: [
                                `Common denominator: ${d1} × ${d2} = ${lcd}.`,
                                `That gives ${big}/${lcd} − ${small}/${lcd}.`
                            ],
                            explain: `${big}/${lcd} − ${small}/${lcd} = ${fracStr(big - small, lcd)}.`
                        }, frac(big - small, lcd));
                    }
                },
                {
                    id: 'multiply-fractions',
                    title: 'Multiply Fractions',
                    standard: 'NC.5.NF.4',
                    learnIntro: '<strong>Top × top, bottom × bottom!</strong><br>2/3 × 4/5 = (2×4)/(3×5) = <strong>8/15</strong>.<br>Multiplying by a fraction makes things SMALLER — you\'re taking a part of a part!',
                    generate(level) {
                        const b = level === 1 ? R.pick([2, 3, 4]) : R.int(2, level === 2 ? 5 : 6);
                        const d = level === 1 ? R.pick([2, 3, 4]) : R.int(2, level === 2 ? 5 : 6);
                        const a = level === 1 ? 1 : R.int(1, b - 1);
                        const c = level === 1 ? 1 : R.int(1, d - 1);
                        const interactive = level === 1 ? { type: 'frac-mult-grid', aNum: a, aDen: b, bNum: c, bDen: d, done: `The overlap is ${a * c} of ${b * d} little pieces — that's ${a * c}/${b * d}! Type it like ${a * c}/${b * d} ✏️` } : null;
                        return Object.assign({
                            prompt: `${a}/${b} × ${c}/${d} = ? (Type it like 3/4)${level === 1 ? '<span class="prompt-sub">One fraction is shaded across — shade the other down and look at the overlap.</span>' : ''}`,
                            visual: null,
                            interactive,
                            answerType: 'fraction',
                            hints: [
                                `Multiply the tops: ${a} × ${c} = ${a * c}.`,
                                `Multiply the bottoms: ${b} × ${d} = ${b * d}.`
                            ],
                            explain: `${a}/${b} × ${c}/${d} = ${a * c}/${b * d}${fracStr(a * c, b * d) !== `${a * c}/${b * d}` ? ` = ${fracStr(a * c, b * d)}` : ''}.`
                        }, frac(a * c, b * d));
                    }
                },
                {
                    id: 'divide-unit-fractions',
                    title: 'Divide with Unit Fractions',
                    standard: 'NC.5.NF.7',
                    learnIntro: '<strong>Ask: how many pieces fit?</strong><br>3 ÷ 1/4 asks "how many quarter-pieces are in 3 wholes?"<br>Each whole holds 4 → 3 × 4 = <strong>12</strong>.',
                    generate(level) {
                        const n = R.int(2, 6);
                        const b = R.int(2, 6);
                        if (level < 3 || Math.random() < 0.5) {
                            const interactive = level === 1 ? { type: 'split-wholes', wholes: n, per: b, done: `You cut ${n} wholes into ${b} pieces each — ${n * b} pieces! Type it in ✏️` } : null;
                            return {
                                prompt: `${n} ÷ 1/${b} = ?${level === 1 ? `<span class="prompt-sub">Tap each whole to cut it into ${b} pieces, then count.</span>` : ''}`,
                                visual: null,
                                interactive,
                                answerType: 'number',
                                answer: n * b,
                                hints: [
                                    `How many 1/${b}-size pieces fit in ${n} wholes?`,
                                    `Each whole holds ${b} pieces. There are ${n} wholes.`,
                                    `${n} × ${b} = ?`
                                ],
                                explain: `Each whole has ${b} pieces of size 1/${b}; ${n} wholes → ${n} × ${b} = ${n * b}.`
                            };
                        }
                        return Object.assign({
                            prompt: `1/${b} ÷ ${n} = ? (Type it like 1/8)`,
                            visual: null,
                            answerType: 'fraction',
                            hints: [
                                `You are splitting 1/${b} into ${n} equal shares.`,
                                `Each share is ${n} times smaller: the bottom becomes ${b} × ${n}.`
                            ],
                            explain: `1/${b} split ${n} ways → 1/${b * n}.`
                        }, frac(1, b * n));
                    }
                }
            ]
        },
        {
            id: 'g5-space',
            grade: 5,
            title: 'Volume & the Coordinate Plane',
            icon: '📦',
            standard: 'NC.5.MD.4–5, 5.G.1',
            prereq: 'g5-fractions',
            skills: [
                {
                    id: 'volume',
                    title: 'Volume of Boxes',
                    standard: 'NC.5.MD.5',
                    learnIntro: '<strong>Volume = layers of cubes!</strong><br>One layer holds length × width cubes. Stack the layers: × height.<br>4 × 3 × 2 = <strong>24</strong> cubic units.',
                    generate(level) {
                        const l = level === 3 ? R.int(3, 9) : R.int(2, 6);
                        const w = level === 3 ? R.int(2, 9) : R.int(2, 4);
                        const h = level === 3 ? R.int(2, 9) : R.int(2, 5);
                        if (level === 3) {
                            return {
                                prompt: `A box is ${l} units long, ${w} units wide, and ${h} units tall. What is its VOLUME in cubic units?`,
                                visual: null,
                                answerType: 'number',
                                answer: l * w * h,
                                hints: [
                                    `One layer of cubes: ${l} × ${w} = ${l * w}.`,
                                    `There are ${h} layers: ${l * w} × ${h} = ?`
                                ],
                                explain: `${l} × ${w} × ${h} = ${l * w * h} cubic units.`
                            };
                        }
                        const interactive = level === 1 ? { type: 'cube-builder', l, w, h, done: `${h} layers of ${l * w} cubes each — ${l * w * h} cubes fill the box! Type it in ✏️` } : null;
                        return {
                            prompt: `How many unit cubes fit inside this box (its volume)?${level === 1 ? '<span class="prompt-sub">Stack cubes to fill the box, then count them all.</span>' : ''}`,
                            visual: boxSVG(l, w, h),
                            interactive,
                            answerType: 'number',
                            answer: l * w * h,
                            hints: [
                                `Start with the bottom layer: ${l} × ${w} cubes.`,
                                `The bottom layer holds ${l * w}. Stack ${h} layers.`,
                                `${l * w} × ${h} = ?`
                            ],
                            explain: `Each layer: ${l} × ${w} = ${l * w}; ${h} layers → ${l * w * h} cubic units.`
                        };
                    }
                },
                {
                    id: 'coordinate-plane',
                    title: 'The Coordinate Plane',
                    standard: 'NC.5.G.1',
                    learnIntro: '<strong>Over, then up!</strong><br>The point (3, 4) means: go 3 RIGHT, then 4 UP.<br>x comes first, y comes second — alphabetical order!',
                    generate(level) {
                        if (level === 3) {
                            const x = R.int(1, 5), y = R.int(1, 5);
                            const dx = R.int(1, 4), dy = R.int(1, 4);
                            const askX = Math.random() < 0.5;
                            return {
                                prompt: `Start at the point (${x}, ${y}). Move ${dx} right and ${dy} up. What is the ${askX ? 'x' : 'y'}-coordinate of where you land?`,
                                visual: null,
                                answerType: 'number',
                                answer: askX ? x + dx : y + dy,
                                hints: [
                                    `Moving right changes x. Moving up changes y.`,
                                    askX ? `${x} + ${dx} = ?` : `${y} + ${dy} = ?`
                                ],
                                explain: `You land at (${x + dx}, ${y + dy}); the ${askX ? 'x' : 'y'}-coordinate is ${askX ? x + dx : y + dy}.`
                            };
                        }
                        const x = R.int(1, 8), y = R.int(1, 8);
                        const askX = Math.random() < 0.5;
                        return {
                            prompt: `What is the ${askX ? 'x' : 'y'}-coordinate of the point?`,
                            visual: coordPlaneSVG(x, y),
                            answerType: 'number',
                            answer: askX ? x : y,
                            hints: [
                                `x tells how far RIGHT from 0. y tells how far UP.`,
                                askX ? `Count the steps to the right.` : `Count the steps going up.`
                            ],
                            explain: `The point is at (${x}, ${y}) — ${askX ? 'x' : 'y'} is ${askX ? x : y}.`
                        };
                    }
                }
            ]
        },
        // ============ GRADE 6 ============
        {
            id: 'g6-ratios',
            grade: 6,
            title: 'Ratios, Rates & Percents',
            icon: '🥤',
            standard: 'NC.6.RP',
            prereq: null,
            skills: [
                {
                    id: 'equivalent-ratios',
                    title: 'Equivalent Ratios',
                    standard: 'NC.6.RP.1',
                    learnIntro: '<strong>Ratios scale together!</strong><br>3 : 5 = 12 : ? → 3 was multiplied by 4 to get 12, so 5 × 4 = <strong>20</strong>.<br>Whatever you do to one side, do to the other!',
                    generate(level) {
                        const a = R.int(2, 9);
                        let b = R.int(2, 9);
                        if (b === a) b = a + 1;
                        const k = level === 1 ? R.int(2, 3) : R.int(2, 6);
                        const c = a * k, d = b * k;
                        const askA = level === 3 && Math.random() < 0.5;
                        if (askA) {
                            return {
                                prompt: `Fill in the blank: ? : ${b} = ${c} : ${d}`,
                                visual: null,
                                answerType: 'number',
                                answer: a,
                                hints: [
                                    `The right ratio was scaled up from the left one.`,
                                    `${b} × ? = ${d}. That scale factor is ${k}.`,
                                    `${c} ÷ ${k} = ?`
                                ],
                                explain: `${a}:${b} scaled by ${k} gives ${c}:${d}, so the blank is ${a}.`
                            };
                        }
                        return {
                            prompt: `Fill in the blank: ${a} : ${b} = ${c} : ?`,
                            visual: null,
                            answerType: 'number',
                            answer: d,
                            hints: [
                                `What was ${a} multiplied by to get ${c}?`,
                                `${a} was multiplied by ${k}.`,
                                `Multiply ${b} by ${k} too: ${b} × ${k} = ?`
                            ],
                            explain: `${a}:${b} = ${c}:${d} — both numbers scaled by ${k}.`
                        };
                    }
                },
                {
                    id: 'unit-rates',
                    title: 'Unit Rates',
                    standard: 'NC.6.RP.2',
                    learnIntro: '<strong>Unit rate = the amount for just ONE!</strong><br>6 apples cost 18 coins → 18 ÷ 6 = <strong>3</strong> coins per apple.',
                    generate(level) {
                        const rate = level === 1 ? R.int(2, 9) : level === 2 ? R.int(3, 15) : R.int(4, 25);
                        const count = level === 1 ? R.int(2, 6) : level === 2 ? R.int(3, 8) : R.int(3, 12);
                        const total = rate * count;
                        if (Math.random() < 0.5) {
                            const item = themeThing();
                            return {
                                prompt: `${count} ${item.name} ${item.icon} cost ${total} coins in all. How many coins does 1 cost?`,
                                visual: null,
                                answerType: 'number',
                                answer: rate,
                                hints: [
                                    `A unit rate is the amount for just ONE.`,
                                    `${total} ÷ ${count} = ?`
                                ],
                                explain: `${total} ÷ ${count} = ${rate} coins each.`
                            };
                        }
                        const name = heroName();
                        return {
                            prompt: `${name}'s car goes ${total} miles in ${count} hours. How many miles per hour is that?`,
                            visual: null,
                            answerType: 'number',
                            answer: rate,
                            hints: [
                                `Miles PER hour means miles for just ONE hour.`,
                                `${total} ÷ ${count} = ?`
                            ],
                            explain: `${total} ÷ ${count} = ${rate} miles per hour.`
                        };
                    }
                },
                {
                    id: 'percent-of',
                    title: 'Percent of a Number',
                    standard: 'NC.6.RP.3',
                    learnIntro: '<strong>Percent means "out of 100"!</strong><br>10% of 80 → 80 ÷ 10 = <strong>8</strong>.<br>Find 10% first, then scale it to find other percents.',
                    generate(level) {
                        if (level === 1) {
                            const percent = R.pick([10, 50]);
                            const base = R.int(2, 20) * 10;
                            const answer = base * percent / 100;
                            return {
                                prompt: `What is ${percent}% of ${base}?`,
                                visual: null,
                                answerType: 'number',
                                answer,
                                hints: [
                                    percent === 10 ? `10% means 1/10 — divide by 10.` : `50% means HALF!`,
                                    percent === 10 ? `${base} ÷ 10 = ?` : `${base} ÷ 2 = ?`
                                ],
                                explain: `${percent}% of ${base} = ${answer}.`
                            };
                        }
                        if (level === 2) {
                            const percent = R.pick([20, 25, 75]);
                            const base = R.int(1, 10) * 20;
                            const answer = base * percent / 100;
                            const tenPct = base / 10;
                            return {
                                prompt: `What is ${percent}% of ${base}?`,
                                visual: null,
                                answerType: 'number',
                                answer,
                                hints: [
                                    `Find 10% first: ${base} ÷ 10 = ${tenPct}.`,
                                    percent === 25 ? `25% is a quarter — try ${base} ÷ 4.` : percent === 75 ? `75% is three quarters of the whole.` : `Double 10% to get 20%.`
                                ],
                                explain: `${percent}% of ${base} = ${answer}.`
                            };
                        }
                        const percent = R.pick([5, 10, 20, 25, 50, 75]);
                        const base = R.int(1, 8) * 20;
                        const part = base * percent / 100;
                        return {
                            prompt: `${part} is what percent of ${base}?`,
                            visual: null,
                            answerType: 'number',
                            answer: percent,
                            hints: [
                                `Divide the part by the whole: ${part} ÷ ${base}.`,
                                `Turn that fraction into a percent by thinking "out of 100."`
                            ],
                            explain: `${part} ÷ ${base} = ${percent}%.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g6-negatives',
            grade: 6,
            title: 'Into the Negatives',
            icon: '🧊',
            standard: 'NC.6.NS',
            prereq: 'g6-ratios',
            skills: [
                {
                    id: 'negatives-compare',
                    title: 'Comparing Negatives',
                    standard: 'NC.6.NS.7',
                    learnIntro: '<strong>Further LEFT means SMALLER!</strong><br>−8 is further left than −3, so −8 &lt; −3 — even though 8 looks "bigger"!',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            const n = -R.int(1, 12);
                            return {
                                prompt: `|${n}| = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: Math.abs(n),
                                hints: [
                                    `Absolute value is the DISTANCE from zero — always positive.`,
                                    `${n} is ${Math.abs(n)} steps away from 0.`
                                ],
                                explain: `|${n}| = ${Math.abs(n)}.`
                            };
                        }
                        let a, b;
                        if (level === 1) {
                            a = R.int(-10, 10);
                            do { b = R.int(-10, 10); } while (b === a);
                        } else if (level === 2) {
                            a = R.int(-15, 15);
                            do { b = R.int(-15, 15); } while (b === a);
                        } else {
                            a = R.int(-9, -1);
                            do { b = R.int(-9, -1); } while (b === a);
                        }
                        const answer = a < b ? '<' : a > b ? '>' : '=';
                        return {
                            prompt: `Which symbol makes this true?<br><span class="compare-nums">${a} &nbsp; ? &nbsp; ${b}</span>`,
                            visual: null,
                            answerType: 'choice',
                            choices: ['<', '>', '='],
                            answer,
                            hints: [
                                `Picture a number line — which one is further LEFT?`,
                                `Numbers get SMALLER the further left (more negative) they are.`,
                                a < 0 && b < 0 ? `Both are negative — the one CLOSER to zero is actually bigger.` : `Any positive number beats any negative number.`
                            ],
                            explain: `${a} ${answer === '<' ? 'is less than' : answer === '>' ? 'is greater than' : 'equals'} ${b} on the number line.`
                        };
                    }
                },
                {
                    id: 'quadrants',
                    title: 'The Four Quadrants',
                    standard: 'NC.6.NS.6',
                    learnIntro: '<strong>Signs tell you the quadrant!</strong><br>(−3, 5): x is negative, y is positive → <strong>Quadrant II</strong>.<br>I: (+,+) II: (−,+) III: (−,−) IV: (+,−).',
                    generate(level) {
                        const range = level === 1 ? 6 : level === 2 ? 9 : 12;
                        let x, y;
                        do { x = R.int(-range, range); } while (x === 0);
                        do { y = R.int(-range, range); } while (y === 0);
                        const quadrant = x > 0 && y > 0 ? 'Quadrant I' : x < 0 && y > 0 ? 'Quadrant II' : x < 0 && y < 0 ? 'Quadrant III' : 'Quadrant IV';
                        return {
                            prompt: `The point (${x}, ${y}) is in which quadrant?`,
                            visual: null,
                            answerType: 'choice',
                            choices: ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'],
                            answer: quadrant,
                            hints: [
                                `Quadrant I: both positive. Quadrant II: x negative, y positive.`,
                                `Quadrant III: both negative. Quadrant IV: x positive, y negative.`,
                                `Here x is ${x > 0 ? 'positive' : 'negative'} and y is ${y > 0 ? 'positive' : 'negative'}.`
                            ],
                            explain: `x is ${x > 0 ? 'positive' : 'negative'} and y is ${y > 0 ? 'positive' : 'negative'}, so the point is in ${quadrant}.`
                        };
                    }
                },
                {
                    id: 'divide-fractions',
                    title: 'Dividing Fractions',
                    standard: 'NC.6.NS.1',
                    learnIntro: '<strong>Keep, Change, Flip!</strong><br>1/2 ÷ 1/4 → keep 1/2, change ÷ to ×, flip 1/4 to 4/1.<br>1/2 × 4/1 = <strong>2</strong>.',
                    generate(level) {
                        const b = R.int(2, 6);
                        const d = R.int(2, 6);
                        const a = level === 1 ? 1 : R.int(1, b - 1);
                        const c = level === 1 ? 1 : R.int(1, d - 1);
                        return Object.assign({
                            prompt: `${a}/${b} ÷ ${c}/${d} = ? (Type it like 3/4)`,
                            visual: null,
                            answerType: 'fraction',
                            hints: [
                                `Dividing fractions: Keep, Change, Flip!`,
                                `Flip the second fraction: ${c}/${d} becomes ${d}/${c}.`,
                                `Now multiply: ${a}/${b} × ${d}/${c} = ?`
                            ],
                            explain: `${a}/${b} ÷ ${c}/${d} = ${a}/${b} × ${d}/${c} = ${fracStr(a * d, b * c)}.`
                        }, frac(a * d, b * c));
                    }
                },
                {
                    id: 'gcf-lcm',
                    title: 'GCF & LCM',
                    standard: 'NC.6.NS.4',
                    learnIntro: '<strong>GCF = biggest shared factor. LCM = smallest shared multiple.</strong><br>GCF(8, 12) = 4. LCM(4, 6) = 12.',
                    generate(level) {
                        if (level === 3) {
                            let g, m, n, l, a, b;
                            do {
                                g = R.int(1, 4);
                                m = R.int(1, 4);
                                n = R.int(1, 4);
                            } while (gcd(m, n) !== 1 || m === n || g * m * n > 60);
                            a = g * m; b = g * n; l = g * m * n;
                            return {
                                prompt: `What is the LCM (Least Common Multiple) of ${a} and ${b}?`,
                                visual: null,
                                answerType: 'number',
                                answer: l,
                                hints: [
                                    `List multiples of ${a}: ${a}, ${2 * a}, ${3 * a}...`,
                                    `Keep going until you hit one that's also a multiple of ${b}.`,
                                    `Shortcut: LCM = (${a} × ${b}) ÷ GCF(${a}, ${b}) = (${a} × ${b}) ÷ ${g}.`
                                ],
                                explain: `${a} = ${g}×${m} and ${b} = ${g}×${n}; since ${m} and ${n} share no factors, LCM = ${g}×${m}×${n} = ${l}.`
                            };
                        }
                        const g = R.int(2, 6);
                        let m, n;
                        do { m = R.int(1, 5); n = R.int(1, 5); } while (gcd(m, n) !== 1 || m === n);
                        const a = g * m, b = g * n;
                        return {
                            prompt: `What is the GCF (Greatest Common Factor) of ${a} and ${b}?`,
                            visual: null,
                            answerType: 'number',
                            answer: g,
                            hints: [
                                `List the factors of ${a} and of ${b}.`,
                                `Look for the LARGEST factor they share.`,
                                `Both ${a} and ${b} can be divided evenly by ${g}.`
                            ],
                            explain: `${a} = ${g} × ${m} and ${b} = ${g} × ${n}, and ${m}, ${n} share no common factor, so GCF = ${g}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g6-expressions',
            grade: 6,
            title: 'Expressions & Equations',
            icon: '🔤',
            standard: 'NC.6.EE',
            prereq: 'g6-negatives',
            skills: [
                {
                    id: 'exponents-intro',
                    title: 'Exponents',
                    standard: 'NC.6.EE.1',
                    learnIntro: '<strong>An exponent counts repeated multiplying!</strong><br>2<sup>4</sup> means 2 × 2 × 2 × 2 = <strong>16</strong>.',
                    generate(level) {
                        let b, e;
                        if (level === 1) {
                            b = R.pick([2, 3]);
                            e = 2;
                        } else if (level === 2) {
                            b = R.pick([2, 3, 4, 5]);
                            e = R.int(2, 3);
                        } else {
                            b = R.pick([2, 3, 4, 5, 10]);
                            e = b === 10 ? R.int(2, 3) : R.int(2, 4);
                        }
                        const answer = Math.pow(b, e);
                        const expansion = Array(e).fill(b).join(' × ');
                        return {
                            prompt: `${b}<sup>${e}</sup> = ?`,
                            visual: null,
                            answerType: 'number',
                            answer,
                            hints: [
                                `The exponent tells you how many times to multiply the base by itself.`,
                                `${b}<sup>${e}</sup> means ${expansion}.`,
                                `${expansion} = ?`
                            ],
                            explain: `${b}<sup>${e}</sup> = ${expansion} = ${answer}.`
                        };
                    }
                },
                {
                    id: 'evaluate-expressions',
                    title: 'Evaluate Expressions',
                    standard: 'NC.6.EE.2',
                    learnIntro: '<strong>Substitute, then solve!</strong><br>3x + 4 when x = 5 → 3(5) + 4 = 15 + 4 = <strong>19</strong>.',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            const m1 = R.int(2, 6), m2 = R.int(2, 6);
                            const a = R.int(1, 9), b = R.int(1, 9);
                            return {
                                prompt: `What is ${m1}a + ${m2}b when a = ${a}, b = ${b}?`,
                                visual: null,
                                answerType: 'number',
                                answer: m1 * a + m2 * b,
                                hints: [
                                    `Substitute the numbers in for the letters.`,
                                    `${m1} × ${a} = ${m1 * a}, and ${m2} × ${b} = ${m2 * b}.`,
                                    `${m1 * a} + ${m2 * b} = ?`
                                ],
                                explain: `${m1}(${a}) + ${m2}(${b}) = ${m1 * a} + ${m2 * b} = ${m1 * a + m2 * b}.`
                            };
                        }
                        const m = R.int(2, 9);
                        const c = R.int(1, 15);
                        const x = level === 1 ? R.int(1, 5) : R.int(1, 10);
                        return {
                            prompt: `What is ${m}x + ${c} when x = ${x}?`,
                            visual: null,
                            answerType: 'number',
                            answer: m * x + c,
                            hints: [
                                `Substitute ${x} in for x.`,
                                `${m} × ${x} = ${m * x}.`,
                                `${m * x} + ${c} = ?`
                            ],
                            explain: `${m}(${x}) + ${c} = ${m * x} + ${c} = ${m * x + c}.`
                        };
                    }
                },
                {
                    id: 'one-step-equations',
                    title: 'One-Step Equations',
                    standard: 'NC.6.EE.7',
                    learnIntro: '<strong>Undo it to find x!</strong><br>x + 6 = 10 → undo the + 6 by subtracting: x = 10 − 6 = <strong>4</strong>.',
                    generate(level) {
                        const type = level === 1 ? R.pick(['add', 'sub']) : R.pick(['add', 'sub', 'mul', 'div']);
                        const small = () => level === 1 ? R.int(1, 10) : R.int(2, 20);
                        if (type === 'add') {
                            const x = small();
                            const a = R.int(1, 20);
                            const b = x + a;
                            return {
                                prompt: `Solve for x: x + ${a} = ${b}`,
                                visual: null,
                                answerType: 'number',
                                answer: x,
                                hints: [
                                    `Undo the "+ ${a}" by subtracting ${a} from both sides.`,
                                    `${b} − ${a} = ?`
                                ],
                                explain: `x + ${a} = ${b}, so x = ${b} − ${a} = ${x}.`
                            };
                        }
                        if (type === 'sub') {
                            const a = R.int(1, 15);
                            const b = level === 1 ? R.int(1, 10) : R.int(1, 20);
                            const x = a + b;
                            return {
                                prompt: `Solve for x: x − ${a} = ${b}`,
                                visual: null,
                                answerType: 'number',
                                answer: x,
                                hints: [
                                    `Undo the "− ${a}" by adding ${a} to both sides.`,
                                    `${b} + ${a} = ?`
                                ],
                                explain: `x − ${a} = ${b}, so x = ${b} + ${a} = ${x}.`
                            };
                        }
                        if (type === 'mul') {
                            const a = R.int(2, 9);
                            const x = level === 2 ? R.int(2, 9) : R.int(2, 12);
                            const b = a * x;
                            return {
                                prompt: `Solve for x: ${a}x = ${b}`,
                                visual: null,
                                answerType: 'number',
                                answer: x,
                                hints: [
                                    `Undo the multiplication by dividing both sides by ${a}.`,
                                    `${b} ÷ ${a} = ?`
                                ],
                                explain: `${a}x = ${b}, so x = ${b} ÷ ${a} = ${x}.`
                            };
                        }
                        const a = R.int(2, 9);
                        const q = level === 2 ? R.int(2, 9) : R.int(2, 12);
                        const x = a * q;
                        return {
                            prompt: `Solve for x: x ÷ ${a} = ${q}`,
                            visual: null,
                            answerType: 'number',
                            answer: x,
                            hints: [
                                `Undo the division by multiplying both sides by ${a}.`,
                                `${q} × ${a} = ?`
                            ],
                            explain: `x ÷ ${a} = ${q}, so x = ${q} × ${a} = ${x}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g6-geometry-data',
            grade: 6,
            title: 'Area & Data',
            icon: '📊',
            standard: 'NC.6.G, 6.SP',
            prereq: 'g6-expressions',
            skills: [
                {
                    id: 'area-triangles',
                    title: 'Area of Parallelograms & Triangles',
                    standard: 'NC.6.G.1',
                    learnIntro: '<strong>Triangles are HALF a parallelogram!</strong><br>Area of a parallelogram = base × height.<br>Area of a triangle = ½ × base × height.',
                    generate(level) {
                        if (level === 1) {
                            const b = R.int(3, 12), h = R.int(3, 12);
                            return {
                                prompt: `A parallelogram has a base of ${b} units and a height of ${h} units. What is its area?`,
                                visual: null,
                                answerType: 'number',
                                answer: b * h,
                                hints: [
                                    `Area of a parallelogram = base × height.`,
                                    `${b} × ${h} = ?`
                                ],
                                explain: `Area = ${b} × ${h} = ${b * h} square units.`
                            };
                        }
                        const b = R.int(2, level === 2 ? 8 : 14) * 2;
                        const h = level === 2 ? R.int(3, 10) : R.int(3, 16);
                        const area = b * h / 2;
                        return {
                            prompt: `A triangle has a base of ${b} units and a height of ${h} units. What is its area?`,
                            visual: null,
                            answerType: 'number',
                            answer: area,
                            hints: [
                                `Area of a triangle = ½ × base × height.`,
                                `${b} × ${h} = ${b * h}. Now take half.`,
                                `${b * h} ÷ 2 = ?`
                            ],
                            explain: `Area = ½ × ${b} × ${h} = ${b * h} ÷ 2 = ${area}.`
                        };
                    }
                },
                {
                    id: 'mean-median',
                    title: 'Mean & Median',
                    standard: 'NC.6.SP.5',
                    learnIntro: '<strong>Mean = share it out evenly. Median = the middle number.</strong><br>For 2, 4, 6: mean = (2+4+6)÷3 = 4. Median (sorted, middle) = 4 too!',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            const nums = Array.from({ length: 5 }, () => R.int(1, 30));
                            const sorted = nums.slice().sort((x, y) => x - y);
                            const median = sorted[2];
                            return {
                                prompt: `Find the median of this set: ${nums.join(', ')}`,
                                visual: null,
                                answerType: 'number',
                                answer: median,
                                hints: [
                                    `Put the numbers in order from smallest to largest first.`,
                                    `In order: ${sorted.join(', ')}.`,
                                    `The median is the MIDDLE number.`
                                ],
                                explain: `Sorted: ${sorted.join(', ')}. The middle number is ${median}.`
                            };
                        }
                        const count = level === 1 ? 4 : R.pick([4, 5]);
                        const mean = R.int(15, 30);
                        const devs = [];
                        let total = 0;
                        for (let i = 0; i < count - 1; i++) {
                            const d = R.int(-3, 3);
                            devs.push(d);
                            total += d;
                        }
                        devs.push(-total);
                        const nums = R.shuffle(devs.map(d => mean + d));
                        return {
                            prompt: `Find the mean (average) of this set: ${nums.join(', ')}`,
                            visual: null,
                            answerType: 'number',
                            answer: mean,
                            hints: [
                                `Add up all the numbers first.`,
                                `The sum is ${mean * count}. Now divide by how many numbers there are (${count}).`,
                                `${mean * count} ÷ ${count} = ?`
                            ],
                            explain: `Sum = ${mean * count}; ${mean * count} ÷ ${count} = ${mean}.`
                        };
                    }
                }
            ]
        },
        // ============ GRADE 7 ============
        {
            id: 'g7-proportions',
            grade: 7,
            title: 'Proportions & Percent Power',
            icon: '💰',
            standard: 'NC.7.RP',
            prereq: null,
            skills: [
                {
                    id: 'solve-proportions',
                    title: 'Solve Proportions',
                    standard: 'NC.7.RP.2',
                    learnIntro: '<strong>Cross-multiply, or scale it!</strong><br>3/4 = x/12 → 4 was scaled to 12 by ×3, so 3 × 3 = <strong>9</strong> = x.',
                    generate(level) {
                        const b = level === 1 ? R.pick([2, 3, 4]) : R.int(2, level === 2 ? 8 : 12);
                        const a = R.int(1, b - 1);
                        const k = level === 1 ? R.int(2, 4) : R.int(2, 8);
                        const d = b * k;
                        const c = a * k;
                        if (Math.random() < 0.5) {
                            return {
                                prompt: `Solve: ${a}/${b} = x/${d}`,
                                visual: null,
                                answerType: 'number',
                                answer: c,
                                hints: [
                                    `What was ${b} multiplied by to get ${d}?`,
                                    `${d} ÷ ${b} = ${k}. Multiply the top by ${k} too.`,
                                    `${a} × ${k} = ?`
                                ],
                                explain: `${b} × ${k} = ${d}, so ${a} × ${k} = ${c}. x = ${c}.`
                            };
                        }
                        return {
                            prompt: `Solve: ${a}/${b} = ${c}/x`,
                            visual: null,
                            answerType: 'number',
                            answer: d,
                            hints: [
                                `What was ${a} multiplied by to get ${c}?`,
                                `${c} ÷ ${a} = ${k}. Multiply the bottom by ${k} too.`,
                                `${b} × ${k} = ?`
                            ],
                            explain: `${a} × ${k} = ${c}, so ${b} × ${k} = ${d}. x = ${d}.`
                        };
                    }
                },
                {
                    id: 'percent-change',
                    title: 'Discounts & Tips',
                    standard: 'NC.7.RP.3',
                    learnIntro: '<strong>Find the percent, then add or subtract!</strong><br>A 40-coin toy, 25% off → 25% of 40 = 10 → 40 − 10 = <strong>30</strong> coins.',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            const percent = R.pick([10, 15, 20, 25]);
                            const base = R.int(1, 10) * 20;
                            const tip = base * percent / 100;
                            const total = base + tip;
                            return {
                                prompt: `A meal costs ${base} coins. Add a ${percent}% tip. What is the total?`,
                                visual: null,
                                answerType: 'number',
                                answer: total,
                                hints: [
                                    `First find ${percent}% of ${base}.`,
                                    `${percent}% of ${base} = ${tip}.`,
                                    `Add the tip to the meal: ${base} + ${tip} = ?`
                                ],
                                explain: `${percent}% of ${base} = ${tip}; ${base} + ${tip} = ${total}.`
                            };
                        }
                        const percent = level === 1 ? R.pick([10, 50]) : R.pick([10, 20, 25, 50]);
                        const base = R.int(1, 10) * 20;
                        const discount = base * percent / 100;
                        const salePrice = base - discount;
                        return {
                            prompt: `A toy costs ${base} coins. It is ${percent}% off. What is the sale price?`,
                            visual: null,
                            answerType: 'number',
                            answer: salePrice,
                            hints: [
                                `First find ${percent}% of ${base} — that's the discount.`,
                                `${percent}% of ${base} = ${discount}.`,
                                `Subtract the discount from the price: ${base} − ${discount} = ?`
                            ],
                            explain: `${percent}% of ${base} = ${discount}; ${base} − ${discount} = ${salePrice}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g7-integers',
            grade: 7,
            title: 'Integer Operations',
            icon: '➖',
            standard: 'NC.7.NS',
            prereq: 'g7-proportions',
            skills: [
                {
                    id: 'add-sub-integers',
                    title: 'Adding & Subtracting Integers',
                    standard: 'NC.7.NS.1',
                    learnIntro: '<strong>Think of a number line!</strong><br>3 − 9 → start at 3, move LEFT 9 → <strong>−6</strong>.<br>Subtracting a negative means moving RIGHT instead!',
                    generate(level) {
                        const range = level === 1 ? 10 : level === 2 ? 15 : 20;
                        const forms = level === 3 ? ['posminus', 'negplusneg', 'doubleneg'] : ['posminus', 'negplusneg'];
                        const form = R.pick(forms);
                        if (form === 'posminus') {
                            const a = R.int(0, range);
                            const b = R.int(1, range);
                            return {
                                prompt: `${a} − ${b} = ?`,
                                visual: null,
                                answerType: 'number',
                                allowNegative: true,
                                answer: a - b,
                                hints: [
                                    `Start at ${a} on the number line and move LEFT ${b} spaces.`,
                                    `If you go past zero, you land on a negative number.`
                                ],
                                explain: `${a} − ${b} = ${a - b}.`
                            };
                        }
                        if (form === 'negplusneg') {
                            const a = -R.int(1, range);
                            const b = -R.int(1, range);
                            return {
                                prompt: `${a} + (${b}) = ?`,
                                visual: null,
                                answerType: 'number',
                                allowNegative: true,
                                answer: a + b,
                                hints: [
                                    `Adding two negatives moves further LEFT on the number line.`,
                                    `${a} + (${b}) = ${a} − ${Math.abs(b)}.`
                                ],
                                explain: `${a} + (${b}) = ${a + b}.`
                            };
                        }
                        const a = R.int(-range, range) || 1;
                        const b = R.int(1, range);
                        return {
                            prompt: `${a} − (${-b}) = ?`,
                            visual: null,
                            answerType: 'number',
                            allowNegative: true,
                            answer: a + b,
                            hints: [
                                `Subtracting a negative is the same as ADDING a positive!`,
                                `${a} − (${-b}) = ${a} + ${b}.`
                            ],
                            explain: `${a} − (${-b}) = ${a} + ${b} = ${a + b}.`
                        };
                    }
                },
                {
                    id: 'mult-div-integers',
                    title: 'Multiplying & Dividing Integers',
                    standard: 'NC.7.NS.2',
                    learnIntro: '<strong>Same signs → positive. Different signs → negative!</strong><br>(−4) × 6 = <strong>−24</strong>. (−24) ÷ (−6) = <strong>4</strong>.',
                    generate(level) {
                        const fmt = n => n < 0 ? `(${n})` : `${n}`;
                        const cap = level === 1 ? 9 : level === 2 ? 12 : 15;
                        let sA, sB;
                        do {
                            sA = R.pick([-1, 1]);
                            sB = R.pick([-1, 1]);
                        } while (sA === 1 && sB === 1);
                        const isMul = Math.random() < 0.5;
                        if (isMul) {
                            const mag1 = R.int(2, cap), mag2 = R.int(2, cap);
                            const a = sA * mag1, b = sB * mag2;
                            const answer = a * b;
                            return {
                                prompt: `${fmt(a)} × ${fmt(b)} = ?`,
                                visual: null,
                                answerType: 'number',
                                allowNegative: true,
                                answer,
                                hints: [
                                    `Same signs multiply to a POSITIVE answer; different signs give a NEGATIVE answer.`,
                                    `${mag1} × ${mag2} = ${mag1 * mag2}. Now figure out the sign.`
                                ],
                                explain: `${fmt(a)} × ${fmt(b)} = ${answer}. ${sA === sB ? 'Same signs → positive.' : 'Different signs → negative.'}`
                            };
                        }
                        const db = R.int(2, cap), q = R.int(2, cap);
                        const dividend = sA * db * q, divisor = sB * db;
                        const quotient = dividend / divisor;
                        return {
                            prompt: `${fmt(dividend)} ÷ ${fmt(divisor)} = ?`,
                            visual: null,
                            answerType: 'number',
                            allowNegative: true,
                            answer: quotient,
                            hints: [
                                `Same signs divide to a POSITIVE answer; different signs give a NEGATIVE answer.`,
                                `${db * q} ÷ ${db} = ${q}. Now figure out the sign.`
                            ],
                            explain: `${fmt(dividend)} ÷ ${fmt(divisor)} = ${quotient}. ${sA === sB ? 'Same signs → positive.' : 'Different signs → negative.'}`
                        };
                    }
                }
            ]
        },
        {
            id: 'g7-equations',
            grade: 7,
            title: 'Two-Step Equations',
            icon: '⚖️',
            standard: 'NC.7.EE',
            prereq: 'g7-integers',
            skills: [
                {
                    id: 'two-step-equations',
                    title: 'Two-Step Equations',
                    standard: 'NC.7.EE.4',
                    learnIntro: '<strong>Undo addition/subtraction FIRST, then multiplication/division!</strong><br>2x + 3 = 11 → 2x = 8 → x = <strong>4</strong>.',
                    generate(level) {
                        const allowNeg = level === 3 && Math.random() < 0.4;
                        const x = allowNeg ? -R.int(1, 10) : (level === 1 ? R.int(1, 8) : R.int(1, 12));
                        const a = R.int(2, 9);
                        const b = R.int(1, 20) * (Math.random() < 0.5 ? 1 : -1);
                        const c = a * x + b;
                        const bStr = b < 0 ? `− ${Math.abs(b)}` : `+ ${b}`;
                        return {
                            prompt: `Solve for x: ${a}x ${bStr} = ${c}`,
                            visual: null,
                            answerType: 'number',
                            allowNegative: allowNeg,
                            answer: x,
                            hints: [
                                `Undo the ${b < 0 ? 'subtraction' : 'addition'} first: ${b < 0 ? `add ${Math.abs(b)} to` : `subtract ${b} from`} both sides.`,
                                `${c} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${a * x}.`,
                                `Now divide both sides by ${a}: ${a * x} ÷ ${a} = ?`
                            ],
                            explain: `${a}x ${bStr} = ${c} → ${a}x = ${a * x} → x = ${x}.`
                        };
                    }
                },
                {
                    id: 'distributive',
                    title: 'Distributive Property',
                    standard: 'NC.7.EE.1',
                    learnIntro: '<strong>Multiply through the parentheses!</strong><br>4(x + 3) = 4x + 4×3 = 4x + <strong>12</strong>.<br>Like terms combine: 3x + 2x = <strong>5x</strong>.',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            const m1 = R.int(2, 6), c1 = R.int(1, 9);
                            const m2 = R.int(2, 6), c2 = R.int(1, 9);
                            const totalC = c1 + c2;
                            return {
                                prompt: `${m1}x + ${c1} + ${m2}x + ${c2} = ?x + ${totalC} — what number goes in the ?x blank?`,
                                visual: null,
                                answerType: 'number',
                                answer: m1 + m2,
                                hints: [
                                    `Combine the x-terms together: ${m1}x + ${m2}x.`,
                                    `${m1} + ${m2} = ?`
                                ],
                                explain: `${m1}x + ${m2}x = ${m1 + m2}x, and ${c1} + ${c2} = ${totalC}.`
                            };
                        }
                        const a = R.int(2, 9);
                        const c = R.int(1, 12);
                        return {
                            prompt: `${a}(x + ${c}) = ${a}x + ?`,
                            visual: null,
                            answerType: 'number',
                            answer: a * c,
                            hints: [
                                `Distribute the ${a} to BOTH terms inside the parentheses.`,
                                `${a} × ${c} = ?`
                            ],
                            explain: `${a}(x + ${c}) = ${a}x + ${a * c}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g7-geometry-prob',
            grade: 7,
            title: 'Circles, Angles & Chance',
            icon: '🎲',
            standard: 'NC.7.G, 7.SP',
            prereq: 'g7-equations',
            skills: [
                {
                    id: 'circles',
                    title: 'Circumference & Area of Circles',
                    standard: 'NC.7.G.4',
                    learnIntro: '<strong>Use π ≈ 3.14!</strong><br>Circumference = 2πr. Area = πr².<br>A radius-3 circle: circumference ≈ 2 × 3.14 × 3 = <strong>18.84</strong>.',
                    generate(level) {
                        if (level === 3) {
                            const r = R.int(1, 7);
                            const answer = (314 * r * r) / 100;
                            return {
                                prompt: `A circle has a radius of ${r} units. What is its area? (Use π ≈ 3.14)`,
                                visual: null,
                                answerType: 'number',
                                allowDecimal: true,
                                answer,
                                hints: [
                                    `Area of a circle = π × r².`,
                                    `${r}² = ${r * r}. Now multiply by 3.14.`,
                                    `3.14 × ${r * r} = ?`
                                ],
                                explain: `Area = 3.14 × ${r}² = 3.14 × ${r * r} = ${answer} square units.`
                            };
                        }
                        const r = R.int(1, 9);
                        const answer = (2 * 314 * r) / 100;
                        return {
                            prompt: `A circle has a radius of ${r} units. What is its circumference? (Use π ≈ 3.14)`,
                            visual: null,
                            answerType: 'number',
                            allowDecimal: true,
                            answer,
                            hints: [
                                `Circumference = 2 × π × r.`,
                                `2 × ${r} = ${2 * r}. Now multiply by 3.14.`,
                                `3.14 × ${2 * r} = ?`
                            ],
                            explain: `Circumference = 2 × 3.14 × ${r} = ${answer} units.`
                        };
                    }
                },
                {
                    id: 'angle-pairs',
                    title: 'Angle Pairs',
                    standard: 'NC.7.G.5',
                    learnIntro: '<strong>Special angle pairs!</strong><br>Vertical angles are EQUAL. Complementary angles add to 90°. Supplementary angles add to 180°.',
                    generate(level) {
                        const type = level === 1 ? 'vertical' : R.pick(['vertical', 'complementary', 'supplementary']);
                        if (type === 'vertical') {
                            const x = R.int(10, 170);
                            return {
                                prompt: `Two angles are vertical angles. One measures ${x}°. What is the measure of the other?`,
                                visual: null,
                                answerType: 'number',
                                answer: x,
                                hints: [
                                    `Vertical angles are always EQUAL.`,
                                    `The other angle is also ${x}°.`
                                ],
                                explain: `Vertical angles are equal, so the other angle is ${x}°.`
                            };
                        }
                        if (type === 'complementary') {
                            const x = R.int(10, 80);
                            return {
                                prompt: `Two angles are complementary. One measures ${x}°. What is the other angle's measure?`,
                                visual: null,
                                answerType: 'number',
                                answer: 90 - x,
                                hints: [
                                    `Complementary angles add up to 90°.`,
                                    `90 − ${x} = ?`
                                ],
                                explain: `90° − ${x}° = ${90 - x}°.`
                            };
                        }
                        const x = R.int(10, 170);
                        return {
                            prompt: `Two angles are supplementary. One measures ${x}°. What is the other angle's measure?`,
                            visual: null,
                            answerType: 'number',
                            answer: 180 - x,
                            hints: [
                                `Supplementary angles add up to 180°.`,
                                `180 − ${x} = ?`
                            ],
                            explain: `180° − ${x}° = ${180 - x}°.`
                        };
                    }
                },
                {
                    id: 'probability',
                    title: 'Probability',
                    standard: 'NC.7.SP.5',
                    learnIntro: '<strong>Probability = favorable ÷ total!</strong><br>A bag with 3 red, 5 blue marbles: P(red) = 3/8.',
                    generate(level) {
                        const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
                        const chosen = R.shuffle(colors).slice(0, level === 1 ? 2 : 3);
                        const counts = chosen.map(() => R.int(1, 8));
                        const total = counts.reduce((s, n) => s + n, 0);
                        const idx = R.int(0, chosen.length - 1);
                        const target = chosen[idx];
                        const favorable = counts[idx];
                        const desc = chosen.map((c, i) => `${counts[i]} ${c}`).join(', ');
                        if (level === 3 && Math.random() < 0.5) {
                            return Object.assign({
                                prompt: `A bag has ${desc} marbles. What is P(NOT ${target})? (Type it like 3/4)`,
                                visual: null,
                                answerType: 'fraction',
                                hints: [
                                    `"NOT ${target}" means any marble that ISN'T ${target}.`,
                                    `${total} − ${favorable} = ${total - favorable} marbles are not ${target}, out of ${total} total.`
                                ],
                                explain: `P(NOT ${target}) = ${fracStr(total - favorable, total)}.`
                            }, frac(total - favorable, total));
                        }
                        return Object.assign({
                            prompt: `A bag has ${desc} marbles. What is P(${target})? (Type it like 3/4)`,
                            visual: null,
                            answerType: 'fraction',
                            hints: [
                                `Probability = favorable outcomes ÷ total outcomes.`,
                                `There are ${favorable} ${target} marbles out of ${total} total.`
                            ],
                            explain: `P(${target}) = ${fracStr(favorable, total)}.`
                        }, frac(favorable, total));
                    }
                }
            ]
        },
        // ============ GRADE 8 ============
        {
            id: 'g8-powers',
            grade: 8,
            title: 'Powers, Roots & Scientific Notation',
            icon: '🔬',
            standard: 'NC.8.EE, 8.NS',
            prereq: null,
            skills: [
                {
                    id: 'exponent-rules',
                    title: 'Exponent Rules',
                    standard: 'NC.8.EE.1',
                    learnIntro: '<strong>Same base? Just work with the exponents!</strong><br>2<sup>3</sup> × 2<sup>4</sup> = 2<sup>3+4</sup> = 2<sup>7</sup>. Multiplying → ADD exponents.',
                    generate(level) {
                        const b = R.pick([2, 3, 4, 5]);
                        if (level === 3) {
                            const type = R.pick(['power', 'divide']);
                            if (type === 'power') {
                                const a = R.int(2, 3), c = R.int(2, 3);
                                return {
                                    prompt: `(${b}<sup>${a}</sup>)<sup>${c}</sup> = ${b}<sup>?</sup>`,
                                    visual: null,
                                    answerType: 'number',
                                    answer: a * c,
                                    hints: [
                                        `Power of a power: MULTIPLY the exponents.`,
                                        `${a} × ${c} = ?`
                                    ],
                                    explain: `(${b}<sup>${a}</sup>)<sup>${c}</sup> = ${b}<sup>${a * c}</sup>.`
                                };
                            }
                            const c = R.int(2, 4), a = R.int(c + 1, c + 4);
                            return {
                                prompt: `${b}<sup>${a}</sup> ÷ ${b}<sup>${c}</sup> = ${b}<sup>?</sup>`,
                                visual: null,
                                answerType: 'number',
                                answer: a - c,
                                hints: [
                                    `Dividing powers with the same base: SUBTRACT the exponents.`,
                                    `${a} − ${c} = ?`
                                ],
                                explain: `${b}<sup>${a}</sup> ÷ ${b}<sup>${c}</sup> = ${b}<sup>${a - c}</sup>.`
                            };
                        }
                        const a = level === 1 ? R.int(2, 4) : R.int(2, 5);
                        const c = level === 1 ? R.int(2, 4) : R.int(2, 5);
                        return {
                            prompt: `${b}<sup>${a}</sup> × ${b}<sup>${c}</sup> = ${b}<sup>?</sup>`,
                            visual: null,
                            answerType: 'number',
                            answer: a + c,
                            hints: [
                                `Multiplying powers with the same base: ADD the exponents.`,
                                `${a} + ${c} = ?`
                            ],
                            explain: `${b}<sup>${a}</sup> × ${b}<sup>${c}</sup> = ${b}<sup>${a + c}</sup>.`
                        };
                    }
                },
                {
                    id: 'roots',
                    title: 'Square & Cube Roots',
                    standard: 'NC.8.NS.2',
                    learnIntro: '<strong>A root asks "what number squared/cubed gives this?"</strong><br>√36 = 6 because 6 × 6 = 36. ∛27 = 3 because 3 × 3 × 3 = 27.',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            const lo = R.int(2, 14);
                            const hi = lo + 1;
                            const n = R.int(lo * lo + 1, hi * hi - 1);
                            const correct = `${lo} and ${hi}`;
                            const distractor1 = `${lo - 1} and ${lo}`;
                            const distractor2 = `${hi} and ${hi + 1}`;
                            const choices = R.shuffle([correct, distractor1, distractor2]);
                            return {
                                prompt: `√${n} is between which two whole numbers?`,
                                visual: null,
                                answerType: 'choice',
                                choices,
                                answer: correct,
                                hints: [
                                    `Find the perfect squares just below and above ${n}.`,
                                    `${lo}² = ${lo * lo} and ${hi}² = ${hi * hi}.`,
                                    `${n} is between ${lo * lo} and ${hi * hi}.`
                                ],
                                explain: `${lo}² = ${lo * lo} and ${hi}² = ${hi * hi}, and ${lo * lo} < ${n} < ${hi * hi}, so √${n} is between ${lo} and ${hi}.`
                            };
                        }
                        const useCube = level === 3 ? Math.random() < 0.5 : (level === 2 && Math.random() < 0.3);
                        if (useCube) {
                            const cubes = [[2, 8], [3, 27], [4, 64], [5, 125], [10, 1000]];
                            const [root, n] = R.pick(cubes);
                            return {
                                prompt: `∛${n} = ?`,
                                visual: null,
                                answerType: 'number',
                                answer: root,
                                hints: [
                                    `What number times itself THREE times makes ${n}?`,
                                    `Try small numbers: 2³=8, 3³=27, 4³=64, 5³=125...`
                                ],
                                explain: `${root}³ = ${n}, so ∛${n} = ${root}.`
                            };
                        }
                        const root = level === 1 ? R.int(2, 10) : R.int(2, 15);
                        const n = root * root;
                        return {
                            prompt: `√${n} = ?`,
                            visual: null,
                            answerType: 'number',
                            answer: root,
                            hints: [
                                `What number times itself makes ${n}?`,
                                `Try counting up: 1×1, 2×2, 3×3...`
                            ],
                            explain: `${root}² = ${n}, so √${n} = ${root}.`
                        };
                    }
                },
                {
                    id: 'scientific-notation',
                    title: 'Scientific Notation',
                    standard: 'NC.8.EE.3',
                    learnIntro: '<strong>Scientific notation writes BIG numbers compactly!</strong><br>3.5 × 10<sup>4</sup> → move the point 4 places right → <strong>35,000</strong>.',
                    generate(level) {
                        if (level === 3 && Math.random() < 0.5) {
                            let lead;
                            do { lead = R.int(10, 99); } while (lead % 10 === 0);
                            const exp = R.int(2, 5);
                            const n = lead * Math.pow(10, exp - 1);
                            const mantissa = `${Math.floor(lead / 10)}.${lead % 10}`;
                            return {
                                prompt: `${withCommas(n)} = ${mantissa} × 10<sup>?</sup>`,
                                visual: null,
                                answerType: 'number',
                                answer: exp,
                                hints: [
                                    `Count how many places the decimal point moves to get from ${mantissa} to ${withCommas(n)}.`,
                                    `${mantissa} needs to move ${exp} places to the right.`
                                ],
                                explain: `${mantissa} × 10<sup>${exp}</sup> = ${withCommas(n)}.`
                            };
                        }
                        let lead;
                        do { lead = R.int(10, 99); } while (lead % 10 === 0);
                        const exp = R.int(2, 5);
                        const answer = lead * Math.pow(10, exp - 1);
                        const mantissa = `${Math.floor(lead / 10)}.${lead % 10}`;
                        return {
                            prompt: `${mantissa} × 10<sup>${exp}</sup> = ?`,
                            visual: null,
                            answerType: 'number',
                            answer,
                            hints: [
                                `Multiplying by 10<sup>${exp}</sup> moves the decimal point ${exp} places to the right.`,
                                `${mantissa} → move the point ${exp} times.`
                            ],
                            explain: `${mantissa} × 10<sup>${exp}</sup> = ${answer}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g8-linear',
            grade: 8,
            title: 'Slopes & Equations',
            icon: '📈',
            standard: 'NC.8.EE, 8.F',
            prereq: 'g8-powers',
            skills: [
                {
                    id: 'slope',
                    title: 'Slope',
                    standard: 'NC.8.EE.6',
                    learnIntro: '<strong>Slope = rise over run!</strong><br>A line that rises 6 for every 2 across has slope 6 ÷ 2 = <strong>3</strong>.',
                    generate(level) {
                        if (level === 1) {
                            const run = R.int(1, 6);
                            const rise = run * R.int(1, 5);
                            return {
                                prompt: `A line rises ${rise} for every ${run} across. What is its slope?`,
                                visual: null,
                                answerType: 'number',
                                answer: rise / run,
                                hints: [
                                    `Slope = rise ÷ run.`,
                                    `${rise} ÷ ${run} = ?`
                                ],
                                explain: `Slope = ${rise} ÷ ${run} = ${rise / run}.`
                            };
                        }
                        const dx = R.int(1, level === 2 ? 5 : 6);
                        const slope = level === 3 && Math.random() < 0.5 ? -R.int(1, 5) : R.int(1, 5);
                        const x1 = R.int(-5, 5), y1 = R.int(-5, 5);
                        const x2 = x1 + dx;
                        const y2 = y1 + slope * dx;
                        return {
                            prompt: `Find the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`,
                            visual: null,
                            answerType: 'number',
                            allowNegative: slope < 0,
                            answer: slope,
                            hints: [
                                `Slope = (change in y) ÷ (change in x).`,
                                `Change in y: ${y2} − ${y1} = ${y2 - y1}. Change in x: ${x2} − ${x1} = ${x2 - x1}.`,
                                `${y2 - y1} ÷ ${x2 - x1} = ?`
                            ],
                            explain: `Slope = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${y2 - y1} ÷ ${dx} = ${slope}.`
                        };
                    }
                },
                {
                    id: 'multi-step-equations',
                    title: 'Multi-Step Equations',
                    standard: 'NC.8.EE.7',
                    learnIntro: '<strong>Distribute or collect x-terms first!</strong><br>2(x + 3) = 16 → 2x + 6 = 16 → 2x = 10 → x = <strong>5</strong>.',
                    generate(level) {
                        const allowNeg = level === 3 && Math.random() < 0.4;
                        const x = allowNeg ? -R.int(1, 9) : R.int(1, level === 1 ? 8 : 12);
                        const type = level === 1 ? 'distribute' : R.pick(['distribute', 'bothsides']);
                        if (type === 'distribute') {
                            const a = R.int(2, 6);
                            const c = R.int(1, 10);
                            const total = a * x + a * c;
                            return {
                                prompt: `Solve for x: ${a}(x + ${c}) = ${total}`,
                                visual: null,
                                answerType: 'number',
                                allowNegative: allowNeg,
                                answer: x,
                                hints: [
                                    `Distribute the ${a} first: ${a}x + ${a * c} = ${total}.`,
                                    `Undo the + ${a * c}: ${total} − ${a * c} = ${a * x}.`,
                                    `Divide both sides by ${a}: ${a * x} ÷ ${a} = ?`
                                ],
                                explain: `${a}(x + ${c}) = ${total} → ${a}x = ${a * x} → x = ${x}.`
                            };
                        }
                        const m1 = R.int(3, 9);
                        let m2 = R.int(1, 8);
                        if (m2 === m1) m2 = m1 - 1;
                        const b1 = R.int(1, 15);
                        const b2 = b1 + (m1 - m2) * x;
                        const b2Str = b2 < 0 ? `− ${Math.abs(b2)}` : `+ ${b2}`;
                        return {
                            prompt: `Solve for x: ${m1}x + ${b1} = ${m2}x ${b2Str}`,
                            visual: null,
                            answerType: 'number',
                            allowNegative: allowNeg,
                            answer: x,
                            hints: [
                                `Get the x-terms together: subtract ${m2}x from both sides.`,
                                `${m1 - m2}x + ${b1} = ${b2}.`,
                                `Now undo the + ${b1}, then divide by ${m1 - m2}.`
                            ],
                            explain: `${m1}x + ${b1} = ${m2}x ${b2Str} → ${m1 - m2}x = ${b2 - b1} → x = ${x}.`
                        };
                    }
                },
                {
                    id: 'evaluate-functions',
                    title: 'Evaluate Functions',
                    standard: 'NC.8.F.4',
                    learnIntro: '<strong>Plug the x-value into the function!</strong><br>y = 3x − 2, when x = 4 → y = 3(4) − 2 = 12 − 2 = <strong>10</strong>.',
                    generate(level) {
                        let m;
                        do { m = R.int(-9, 9); } while (m === 0);
                        const b = R.int(-9, 9);
                        const x = R.int(-9, 9);
                        const y = m * x + b;
                        const mStr = m === 1 ? 'x' : m === -1 ? '−x' : (m < 0 ? `−${Math.abs(m)}x` : `${m}x`);
                        const bStr = b === 0 ? '' : b < 0 ? ` − ${Math.abs(b)}` : ` + ${b}`;
                        return {
                            prompt: `y = ${mStr}${bStr}. What is y when x = ${x}?`,
                            visual: null,
                            answerType: 'number',
                            allowNegative: true,
                            answer: y,
                            hints: [
                                `Substitute ${x} in for x.`,
                                `${m} × (${x}) = ${m * x}.`,
                                `${m * x} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ?`
                            ],
                            explain: `y = ${m}(${x}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${m * x} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${y}.`
                        };
                    }
                }
            ]
        },
        {
            id: 'g8-geometry',
            grade: 8,
            title: 'Right Triangles & Volume',
            icon: '📐',
            standard: 'NC.8.G',
            prereq: 'g8-linear',
            skills: [
                {
                    id: 'pythagorean',
                    title: 'The Pythagorean Theorem',
                    standard: 'NC.8.G.7',
                    learnIntro: '<strong>a² + b² = c² for right triangles!</strong><br>Legs 3 and 4: 3² + 4² = 9 + 16 = 25 = 5². Hypotenuse = <strong>5</strong>.',
                    generate(level) {
                        const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]];
                        const [a, b, c] = R.pick(triples);
                        if (level === 3 && Math.random() < 0.5) {
                            const missing = R.pick(['a', 'b']);
                            const known = missing === 'a' ? b : a;
                            const answer = missing === 'a' ? a : b;
                            return {
                                prompt: `A right triangle has a hypotenuse of ${c} and one leg of ${known}. What is the length of the other leg?`,
                                visual: null,
                                answerType: 'number',
                                answer,
                                hints: [
                                    `Use the Pythagorean theorem: leg² + leg² = hypotenuse².`,
                                    `${c}² − ${known}² = ${c * c} − ${known * known} = ${c * c - known * known}.`,
                                    `√${c * c - known * known} = ?`
                                ],
                                explain: `${known}² + ?² = ${c}²; ${c * c} − ${known * known} = ${c * c - known * known}, and √${c * c - known * known} = ${answer}.`
                            };
                        }
                        return {
                            prompt: `A right triangle has legs of ${a} and ${b}. What is the length of the hypotenuse?`,
                            visual: null,
                            answerType: 'number',
                            answer: c,
                            hints: [
                                `Use the Pythagorean theorem: a² + b² = c².`,
                                `${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}.`,
                                `√${a * a + b * b} = ?`
                            ],
                            explain: `${a}² + ${b}² = ${a * a + b * b} = ${c}², so the hypotenuse is ${c}.`
                        };
                    }
                },
                {
                    id: 'volume-round',
                    title: 'Volume in Terms of π',
                    standard: 'NC.8.G.9',
                    learnIntro: '<strong>Cylinders and cones use π too!</strong><br>Cylinder: V = π r² h. Cone: V = (1/3) π r² h.<br>Just find the number in front of π!',
                    generate(level) {
                        if (level === 3) {
                            const r = R.int(2, 6);
                            let h;
                            do { h = R.int(2, 9); } while ((r * r * h) % 3 !== 0);
                            const coeff = (r * r * h) / 3;
                            return {
                                prompt: `A cone has a radius of ${r} and a height of ${h}. What is its volume in terms of π? (V = ?π cubic units)`,
                                visual: null,
                                answerType: 'number',
                                answer: coeff,
                                hints: [
                                    `Volume of a cone = (1/3) × π × r² × h.`,
                                    `${r}² × ${h} = ${r * r * h}.`,
                                    `${r * r * h} ÷ 3 = ?`
                                ],
                                explain: `V = (1/3)π(${r})²(${h}) = ${coeff}π cubic units.`
                            };
                        }
                        const r = R.int(2, 5), h = R.int(2, 6);
                        const coeff = r * r * h;
                        return {
                            prompt: `A cylinder has a radius of ${r} and a height of ${h}. What is its volume in terms of π? (V = ?π cubic units)`,
                            visual: null,
                            answerType: 'number',
                            answer: coeff,
                            hints: [
                                `Volume of a cylinder = π × r² × h.`,
                                `${r}² × ${h} = ?`
                            ],
                            explain: `V = π(${r})²(${h}) = ${coeff}π cubic units.`
                        };
                    }
                }
            ]
        },
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
