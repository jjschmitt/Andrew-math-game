// ============================================================
// Mastery Engine
//
// Learning-science design:
//  • Mastery before moving on — skills unlock sequentially; a skill
//    is mastered only after enough correct answers INCLUDING a
//    finishing streak, so lucky guesses can't unlock the next skill.
//  • Effortful retrieval — answers are typed (free recall), hints
//    only appear on request, and mastered skills come back as
//    spaced "Flashback" questions on an expanding schedule.
//  • Cognitive load management — new skills start in a Learn phase
//    with a worked example and visual models; scaffolds fade as the
//    child succeeds and automatically return after repeated errors.
// ============================================================

const STORAGE_KEY = 'math-adventure-grade2-v1';

const LEARN_TARGET = 3;      // correct answers to leave the Learn phase
const PRACTICE_TARGET = 12;  // correct answers in Practice phase to master
const STREAK_TO_MASTER = 4;  // ...and the last N must be consecutive
const METER_TOTAL = LEARN_TARGET + PRACTICE_TARGET;
const REVIEW_GAP = 4;        // every Nth question during practice is a review
const REVIEW_FIRST_INTERVAL = 15;   // measured in total questions answered
const REVIEW_GROWTH = 2.5;
const REVIEW_MAX_INTERVAL = 250;
const WARMUP_LENGTH = 5;

// On touch devices (iPad!) the OS keyboard covers half the game, so we
// suppress it and provide our own big-button keypad instead.
const IS_TOUCH = (typeof navigator !== 'undefined') &&
    (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

// Skills whose numeric answers can be decimals — their keypad gets a "." key.
const DECIMAL_PAD_SKILLS = new Set(['powers-of-ten', 'add-sub-decimals', 'multiply-decimals', 'divide-decimals']);

const THEMES = {
    pokemon: {
        id: 'pokemon',
        name: 'Pokémon',
        mascot: '⚡',
        currencyName: 'Poké Balls',
        currencyIcon: '🔴',
        heroes: ['Ash', 'Misty', 'Brock'],
        items: [
            { name: 'Poké Balls', icon: '🔴' },
            { name: 'berries', icon: '🍓' },
            { name: 'gym badges', icon: '🏅' },
            { name: 'Pokémon cards', icon: '🎴' }
        ],
        praise: [
            '⚡ Super effective!',
            '🌟 Great catch, Trainer!',
            '🎉 Critical hit!',
            '💫 Professor Oak would be proud!',
            '🏆 You leveled up your brain!'
        ],
        oops: [
            'So close! Take another look. 💪',
            'Not this time — you can do it! ⚡',
            'Good try, Trainer! Think it through. 🌟'
        ]
    },
    mario: {
        id: 'mario',
        name: 'Mario',
        mascot: '🍄',
        currencyName: 'Coins',
        currencyIcon: '🪙',
        heroes: ['Mario', 'Luigi', 'Peach', 'Toad'],
        items: [
            { name: 'coins', icon: '🪙' },
            { name: 'super stars', icon: '⭐' },
            { name: 'mushrooms', icon: '🍄' },
            { name: 'fire flowers', icon: '🌼' }
        ],
        praise: [
            '🍄 Wahoo! Let\'s-a-go!',
            '⭐ Super star answer!',
            '🎉 1-UP for your brain!',
            '🪙 Cha-ching! Perfect!',
            '🏰 Bowser doesn\'t stand a chance!'
        ],
        oops: [
            'Mamma mia! Try once more. 💪',
            'Almost! Even Mario misses a jump sometimes. 🍄',
            'Good try! Take another look. ⭐'
        ]
    }
};

class MasteryEngine {
    constructor() {
        this.state = this.loadState();
        this.reconcileUnlockedGrade();
        window.MathTheme = THEMES[this.state.theme];
        this.session = null;
        this.pendingTimeout = null;
        this.activeManipulative = null;
        this.cacheDom();
        this.bindEvents();
        this.showStart();
    }

    // ---------- persistence ----------

    defaultState() {
        return {
            theme: 'pokemon',
            stars: 0,
            totalAnswered: 0,
            unlockedGrade: 2, // highest level tier ever opened — never goes back down
            skills: {}, // id -> {phase, learnCount, practiceCount, streak, wrongStreak, review:{due, interval}, refresh, reviewMisses}
            misses: [] // log of missed problems, newest-last, capped at 200
        };
    }

    loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return Object.assign(this.defaultState(), JSON.parse(raw));
        } catch (e) { /* fresh start */ }
        return this.defaultState();
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) { /* storage unavailable */ }
    }

    skillState(id) {
        if (!this.state.skills[id]) {
            this.state.skills[id] = {
                phase: 'learn', learnCount: 0, practiceCount: 0,
                streak: 0, wrongStreak: 0, review: null, refresh: false, reviewMisses: 0,
                right: 0, wrong: 0
            };
        }
        const st = this.state.skills[id];
        if (st.right == null) st.right = 0;
        if (st.wrong == null) st.wrong = 0;
        return st;
    }

    // ---------- unlock / mastery rules ----------

    isUnitMastered(unitId) {
        const unit = CURRICULUM.units.find(u => u.id === unitId);
        return unit.skills.every(s => this.skillState(s.id).phase === 'mastered');
    }

    // A grade tier stays completely hidden until every unit of the
    // grades below it is mastered. Once opened it is persisted and never
    // relocks — a rusty flashback can demote a skill back to practice
    // without hiding levels the child already earned.
    gradeRequirementsMet(grade) {
        return CURRICULUM.units
            .filter(u => u.grade < grade)
            .every(u => this.isUnitMastered(u.id));
    }

    gradeUnlocked(grade) {
        return grade <= this.state.unlockedGrade;
    }

    highestUnlockedGrade() {
        return this.state.unlockedGrade;
    }

    // Sync the persisted tier with mastery state (covers saves from
    // before unlockedGrade existed).
    reconcileUnlockedGrade() {
        const grades = [...new Set(CURRICULUM.units.map(u => u.grade))].sort((a, b) => a - b);
        for (const g of grades) {
            if (g > this.state.unlockedGrade && this.gradeRequirementsMet(g)) {
                this.state.unlockedGrade = g;
            }
        }
    }

    visibleUnits() {
        return CURRICULUM.units.filter(u => this.gradeUnlocked(u.grade));
    }

    isUnitUnlocked(unit) {
        if (!this.gradeUnlocked(unit.grade)) return false;
        return !unit.prereq || this.isUnitMastered(unit.prereq);
    }

    isSkillUnlocked(skillId) {
        const { unit, indexInUnit } = SKILL_INDEX[skillId];
        if (!this.isUnitUnlocked(unit)) return false;
        if (indexInUnit === 0) return true;
        return this.skillState(unit.skills[indexInUnit - 1].id).phase === 'mastered';
    }

    masteredSkillIds() {
        return allSkillIds().filter(id => this.skillState(id).phase === 'mastered');
    }

    dueReviewIds() {
        return this.masteredSkillIds().filter(id => {
            const s = this.skillState(id);
            return s.refresh || (s.review && s.review.due <= this.state.totalAnswered);
        });
    }

    nextUnlockedSkillId() {
        for (const unit of CURRICULUM.units) {
            for (const skill of unit.skills) {
                if (this.skillState(skill.id).phase !== 'mastered' && this.isSkillUnlocked(skill.id)) {
                    return skill.id;
                }
            }
        }
        return null;
    }

    // ---------- DOM ----------

    cacheDom() {
        this.el = {};
        [
            'start-screen', 'path-screen', 'problem-screen',
            'star-count', 'currency-icon', 'progress-summary',
            'path-btn', 'warmup-btn', 'home-btn', 'path-units',
            'skill-title', 'phase-badge', 'standard-tag', 'mastery-meter',
            'review-banner', 'strategy-card', 'problem-prompt', 'problem-visual',
            'answer-number', 'answer-text', 'choice-buttons', 'submit-btn', 'keypad',
            'hint-btn', 'hint-area', 'feedback', 'back-to-path-btn',
            'celebration', 'celebration-title', 'celebration-message', 'celebration-actions',
            'number-input-row', 'text-input-row',
            'dashboard-btn', 'dashboard-back-btn', 'dashboard-content'
        ].forEach(id => {
            this.el[id] = document.getElementById(id);
        });
    }

    bindEvents() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
        });
        this.el['path-btn'].addEventListener('click', () => this.showPath());
        this.el['warmup-btn'].addEventListener('click', () => this.startWarmup());
        this.el['home-btn'].addEventListener('click', () => this.showStart());
        this.el['back-to-path-btn'].addEventListener('click', () => this.showPath());
        this.el['dashboard-btn'].addEventListener('click', () => this.showDashboard());
        this.el['dashboard-back-btn'].addEventListener('click', () => this.showStart());
        this.el['submit-btn'].addEventListener('click', () => this.submit());
        this.el['hint-btn'].addEventListener('click', () => this.showHint());
        this.el['answer-number'].addEventListener('keydown', e => {
            if (e.key === 'Enter') this.submit();
        });
        this.el['answer-text'].addEventListener('keydown', e => {
            if (e.key === 'Enter') this.submit();
        });
        this.el['keypad'].addEventListener('click', e => {
            const key = e.target.closest('.keypad-key');
            if (key) this.pressKeypad(key.dataset.key);
        });
        if (IS_TOUCH) {
            // Never summon the OS keyboard — the in-game keypad handles input.
            [this.el['answer-number'], this.el['answer-text']].forEach(input => {
                input.setAttribute('inputmode', 'none');
            });
        }
    }

    activeInput() {
        const p = this.session && this.session.problem;
        return p && p.answerType === 'number' ? this.el['answer-number'] : this.el['answer-text'];
    }

    pressKeypad(key) {
        const input = this.activeInput();
        if (!input) return;
        if (key === 'back') {
            input.value = input.value.slice(0, -1);
        } else if (input.value.length < 8) {
            input.value += key;
        }
    }

    renderKeypad(p, skillId) {
        const pad = this.el['keypad'];
        if (p.answerType === 'choice') {
            pad.style.display = 'none';
            pad.innerHTML = '';
            return;
        }
        const extras = [];
        if (p.answerType === 'time') extras.push(':');
        if (p.answerType === 'fraction') extras.push('/');
        if (p.answerType === 'text') extras.push('.');
        if (p.answerType === 'number' && DECIMAL_PAD_SKILLS.has(skillId)) extras.push('.');
        if (p.answerType === 'number' && p.allowDecimal && !extras.includes('.')) extras.push('.');
        if (p.answerType === 'number' && p.allowNegative) extras.push('-');
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ...extras, '0'];
        pad.innerHTML = keys.map(k =>
            `<button type="button" class="keypad-key${'./:-'.includes(k) ? ' extra' : ''}" data-key="${k}">${k}</button>`
        ).join('') + '<button type="button" class="keypad-key action" data-key="back">⌫</button>';
        pad.style.display = 'grid';
    }

    setTheme(themeId) {
        this.state.theme = themeId;
        window.MathTheme = THEMES[themeId];
        this.save();
        this.renderStart();
    }

    clearPending() {
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }
    }

    plainText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent.replace(/\s+/g, ' ').trim();
    }

    esc(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    destroyManipulative() {
        if (this.activeManipulative) {
            try { this.activeManipulative.destroy(); } catch (e) { /* ignore */ }
            this.activeManipulative = null;
        }
    }

    showScreen(id) {
        this.clearPending();
        this.destroyManipulative();
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        this.renderHeader();
    }

    renderHeader() {
        const theme = THEMES[this.state.theme];
        this.el['star-count'].textContent = this.state.stars;
        this.el['currency-icon'].textContent = theme.currencyIcon;
    }

    // ---------- start screen ----------

    showStart() {
        this.session = null;
        this.showScreen('start-screen');
        this.renderStart();
    }

    renderStart() {
        const theme = THEMES[this.state.theme];
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.theme === this.state.theme);
        });
        // Show only the skills the child can currently see — future
        // grades stay invisible until they unlock.
        const visible = this.visibleUnits().flatMap(u => u.skills.map(s => s.id));
        const mastered = visible.filter(id => this.skillState(id).phase === 'mastered').length;
        const total = visible.length;
        const due = this.dueReviewIds().length;
        const grade = this.highestUnlockedGrade();
        const allDone = mastered === total;
        const maxGrade = Math.max(...CURRICULUM.units.map(u => u.grade));
        document.getElementById('welcome-title').textContent =
            allDone && grade === maxGrade ? 'Math Champion! 🏆' : `Level ${grade} Mastery Quest 🚀`;
        this.el['progress-summary'].innerHTML =
            `<div class="summary-line">⭐ Skills mastered: <strong>${mastered} / ${total}</strong></div>` +
            `<div class="summary-line">${theme.currencyIcon} ${theme.currencyName} earned: <strong>${this.state.stars}</strong></div>` +
            (mastered > 0 ? `<div class="summary-line">🔄 Flashbacks ready: <strong>${due}</strong></div>` : '');
        const warmupBtn = this.el['warmup-btn'];
        warmupBtn.disabled = mastered === 0;
        warmupBtn.querySelector('.btn-sub').textContent = mastered === 0
            ? 'Master a skill first to unlock'
            : (due > 0 ? `${due} flashback${due > 1 ? 's' : ''} waiting!` : 'Keep your skills strong');
        this.renderHeader();
    }

    // ---------- parent dashboard ----------

    showDashboard() {
        this.session = null;
        this.showScreen('dashboard-screen');
        this.renderDashboard();
    }

    renderDashboard() {
        let right = 0, wrong = 0;
        Object.values(this.state.skills).forEach(st => {
            right += st.right || 0;
            wrong += st.wrong || 0;
        });
        const accuracy = right + wrong > 0 ? Math.round(right / (right + wrong) * 100) + '%' : '—';
        let html = `<div class="dashboard-tiles">
            <div class="dashboard-tile"><span class="tile-number">${this.state.totalAnswered}</span><span class="tile-label">Problems answered</span></div>
            <div class="dashboard-tile"><span class="tile-number">${right}</span><span class="tile-label">Correct</span></div>
            <div class="dashboard-tile"><span class="tile-number">${wrong}</span><span class="tile-label">Missed</span></div>
            <div class="dashboard-tile"><span class="tile-number">${accuracy}</span><span class="tile-label">Accuracy</span></div>
        </div>`;

        this.visibleUnits().forEach(unit => {
            html += `<div class="dashboard-unit-card">
                <div class="dashboard-unit-title">${unit.icon} ${unit.title}</div>`;
            unit.skills.forEach(skill => {
                const st = this.skillState(skill.id);
                let chip;
                if (st.phase === 'mastered') chip = '⭐ Mastered';
                else if (st.phase === 'practice') chip = '💪 Practicing';
                else if (st.learnCount + st.practiceCount > 0) chip = '📖 Learning';
                else chip = '✨ Not started';
                const total = st.right + st.wrong;
                const pct = total > 0 ? Math.round(st.right / total * 100) : 0;
                const needsPractice = total >= 3 && pct < 70;
                html += `<div class="dashboard-skill-row">
                    <div class="dashboard-skill-top">
                        <span class="dashboard-skill-name">${skill.title}</span>
                        <span class="dashboard-chip">${chip}</span>
                        ${needsPractice ? '<span class="dashboard-warn">⚠️ needs practice</span>' : ''}
                        <span class="dashboard-counts">✅ ${st.right} · ❌ ${st.wrong}</span>
                    </div>
                    ${total > 0
                        ? `<div class="dashboard-acc-row">
                            <span class="dashboard-acc-track"><span class="dashboard-acc-fill" style="width:${pct}%"></span></span>
                            <span class="dashboard-acc-pct">${pct}%</span>
                        </div>`
                        : '<div class="dashboard-no-data">no data yet</div>'}
                </div>`;
            });
            html += '</div>';
        });

        html += '<h3 class="dashboard-misses-title">❌ Recently missed problems</h3>';
        const misses = (this.state.misses || []).slice().reverse();
        if (misses.length === 0) {
            html += '<p class="dashboard-empty">No missed problems yet — great job! 🎉</p>';
        } else {
            html += '<div class="dashboard-miss-list">';
            misses.slice(0, 50).forEach(m => {
                const entry = SKILL_INDEX[m.skillId];
                const skillTitle = entry ? entry.skill.title : m.skillId;
                const date = new Date(m.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                html += `<div class="dashboard-miss">
                    <div class="dashboard-miss-meta">
                        <span class="dashboard-miss-date">${date}</span>
                        <span class="dashboard-miss-skill">${this.esc(skillTitle)}</span>
                        ${m.review ? '<span class="dashboard-miss-review">🔄 flashback</span>' : ''}
                    </div>
                    <div class="dashboard-miss-prompt">${this.esc(m.prompt)}</div>
                    <div class="dashboard-miss-answers">Answered: <span class="miss-given">${this.esc(m.given.join(', '))}</span> · Correct answer: <span class="miss-correct">${this.esc(m.answer)}</span></div>
                </div>`;
            });
            if (misses.length > 50) {
                html += `<div class="dashboard-older">…and ${misses.length - 50} older</div>`;
            }
            html += '</div>';
        }

        this.el['dashboard-content'].innerHTML = html;
    }

    // ---------- path screen ----------

    showPath() {
        this.session = null;
        this.showScreen('path-screen');
        this.renderPath();
    }

    renderPath() {
        const container = this.el['path-units'];
        container.innerHTML = '';
        this.visibleUnits().forEach(unit => {
            const unlocked = this.isUnitUnlocked(unit);
            const card = document.createElement('div');
            card.className = 'unit-card' + (unlocked ? '' : ' locked');

            const masteredCount = unit.skills.filter(s => this.skillState(s.id).phase === 'mastered').length;
            let html = `<div class="unit-header">
                <span class="unit-icon">${unit.icon}</span>
                <div class="unit-titles">
                    <div class="unit-title">${unit.title}</div>
                    <div class="unit-standard">${unit.standard} · ${masteredCount}/${unit.skills.length} mastered</div>
                </div>
                ${unlocked ? '' : '<span class="unit-lock">🔒</span>'}
            </div>`;

            if (!unlocked) {
                const prereq = CURRICULUM.units.find(u => u.id === unit.prereq);
                html += `<div class="unit-locked-note">Master “${prereq.title}” to unlock</div>`;
            } else {
                html += '<div class="skill-list">';
                unit.skills.forEach(skill => {
                    const st = this.skillState(skill.id);
                    const skillUnlocked = this.isSkillUnlocked(skill.id);
                    let icon, statusCls;
                    if (!skillUnlocked) { icon = '🔒'; statusCls = 'locked'; }
                    else if (st.phase === 'mastered') { icon = st.refresh ? '🔄' : '⭐'; statusCls = 'mastered'; }
                    else if (st.phase === 'practice') { icon = '💪'; statusCls = 'practice'; }
                    else if (st.learnCount > 0 || st.practiceCount > 0) { icon = '📖'; statusCls = 'learning'; }
                    else { icon = '✨'; statusCls = 'fresh'; }
                    const filled = Math.min(METER_TOTAL, st.learnCount + st.practiceCount);
                    const pct = st.phase === 'mastered' ? 100 : Math.round(filled / METER_TOTAL * 100);
                    html += `<button class="skill-row ${statusCls}" data-skill="${skill.id}" ${skillUnlocked ? '' : 'disabled'}>
                        <span class="skill-status">${icon}</span>
                        <span class="skill-name">${skill.title}</span>
                        <span class="skill-meter"><span class="skill-meter-fill" style="width:${pct}%"></span></span>
                    </button>`;
                });
                html += '</div>';
            }
            card.innerHTML = html;
            container.appendChild(card);
        });

        container.querySelectorAll('.skill-row:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => this.openSkill(btn.dataset.skill));
        });
    }

    // ---------- sessions ----------

    openSkill(skillId) {
        this.session = {
            mode: 'skill',
            skillId,
            answeredThisSession: 0,
            sinceReview: 0,
            correctRun: 0,
            scaffold: false,
            problem: null,
            isReview: false,
            reviewSkillId: null,
            attemptsOnProblem: 0,
            hintIndex: 0,
            warmupQueue: null,
            warmupRight: 0,
            warmupTotal: 0
        };
        this.showScreen('problem-screen');
        this.nextProblem();
    }

    startWarmup() {
        const mastered = this.masteredSkillIds();
        if (mastered.length === 0) return;
        const due = this.dueReviewIds();
        const rest = R.shuffle(mastered.filter(id => !due.includes(id)));
        const queue = due.concat(rest).slice(0, WARMUP_LENGTH);
        // pad by cycling if fewer mastered skills than warmup length
        while (queue.length < WARMUP_LENGTH) queue.push(R.pick(mastered));
        this.session = {
            mode: 'warmup',
            skillId: null,
            warmupQueue: queue,
            warmupRight: 0,
            warmupTotal: queue.length,
            answeredThisSession: 0,
            sinceReview: 0,
            correctRun: 0,
            scaffold: false,
            problem: null,
            isReview: true,
            reviewSkillId: null,
            attemptsOnProblem: 0,
            hintIndex: 0
        };
        this.showScreen('problem-screen');
        this.nextProblem();
    }

    levelForSkill(skillId) {
        const phase = this.skillState(skillId).phase;
        return phase === 'learn' ? 1 : phase === 'practice' ? 2 : 3;
    }

    nextProblem() {
        this.clearPending();
        const s = this.session;
        s.attemptsOnProblem = 0;
        s.wrongAnswers = [];
        s.hintIndex = 0;

        if (s.mode === 'warmup') {
            if (s.warmupQueue.length === 0) {
                this.finishWarmup();
                return;
            }
            s.reviewSkillId = s.warmupQueue.shift();
            s.isReview = true;
            s.problem = SKILL_INDEX[s.reviewSkillId].skill.generate(3);
            this.renderProblem();
            return;
        }

        // Interleaved retrieval: every REVIEW_GAP-th question is a flashback
        const due = this.dueReviewIds().filter(id => id !== s.skillId);
        if (s.sinceReview >= REVIEW_GAP - 1 && due.length > 0) {
            s.isReview = true;
            s.reviewSkillId = R.pick(due);
            s.sinceReview = 0;
            s.problem = SKILL_INDEX[s.reviewSkillId].skill.generate(3);
            this.renderProblem();
            return;
        }

        s.isReview = false;
        s.reviewSkillId = null;
        s.sinceReview++;
        const level = s.scaffold ? 1 : this.levelForSkill(s.skillId);
        s.problem = SKILL_INDEX[s.skillId].skill.generate(level);
        this.renderProblem();
    }

    renderProblem() {
        const s = this.session;
        const p = s.problem;
        const activeSkillId = s.isReview ? s.reviewSkillId : s.skillId;
        const { skill, unit } = SKILL_INDEX[activeSkillId];
        const st = this.skillState(activeSkillId);

        // Header
        this.el['skill-title'].textContent = skill.title;
        this.el['standard-tag'].textContent = skill.standard;

        const badge = this.el['phase-badge'];
        if (s.isReview) {
            badge.textContent = '🔄 Flashback';
            badge.className = 'phase-badge review';
        } else if (st.phase === 'learn') {
            badge.textContent = '📖 Learning';
            badge.className = 'phase-badge learn';
        } else if (st.phase === 'practice') {
            badge.textContent = '💪 Practicing';
            badge.className = 'phase-badge practice';
        } else {
            badge.textContent = '⭐ Mastered';
            badge.className = 'phase-badge mastered';
        }

        // Review banner
        const banner = this.el['review-banner'];
        if (s.isReview && s.mode === 'skill') {
            banner.innerHTML = `🔄 <strong>Flashback!</strong> Quick — do you still remember <em>${skill.title}</em>?`;
            banner.style.display = 'block';
        } else if (s.mode === 'warmup') {
            const done = s.warmupTotal - s.warmupQueue.length;
            banner.innerHTML = `🔥 <strong>Warm-Up</strong> · Question ${done} of ${s.warmupTotal}`;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }

        // Strategy card: worked example, only while learning (or when scaffold kicked back in)
        const strat = this.el['strategy-card'];
        if (!s.isReview && (st.phase === 'learn' || s.scaffold) && skill.learnIntro) {
            strat.innerHTML = skill.learnIntro;
            strat.style.display = 'block';
        } else {
            strat.style.display = 'none';
        }

        this.renderMeter(activeSkillId, s.isReview);

        // Problem body
        this.el['problem-prompt'].innerHTML = p.prompt;
        const visualEl = this.el['problem-visual'];
        this.destroyManipulative();
        visualEl.innerHTML = '';
        if (p.interactive && window.Manipulatives && window.Manipulatives[p.interactive.type]) {
            visualEl.style.display = 'block';
            this.activeManipulative = window.Manipulatives[p.interactive.type].mount(
                visualEl, p.interactive, { complete: msg => this.manipulativeComplete(msg) }
            );
        } else if (p.visual) {
            visualEl.innerHTML = p.visual;
            visualEl.style.display = 'block';
        } else {
            visualEl.style.display = 'none';
        }

        // Inputs
        this.el['number-input-row'].style.display = 'none';
        this.el['text-input-row'].style.display = 'none';
        this.el['choice-buttons'].style.display = 'none';
        this.el['choice-buttons'].innerHTML = '';

        if (p.answerType === 'number') {
            this.el['number-input-row'].style.display = 'flex';
            this.el['answer-number'].value = '';
            if (!IS_TOUCH) this.el['answer-number'].focus();
        } else if (p.answerType === 'time' || p.answerType === 'text' || p.answerType === 'fraction') {
            this.el['text-input-row'].style.display = 'flex';
            this.el['answer-text'].value = '';
            this.el['answer-text'].placeholder =
                p.answerType === 'time' ? 'like 3:45' :
                p.answerType === 'fraction' ? 'like 3/4' : 'type your answer';
            if (!IS_TOUCH) this.el['answer-text'].focus();
        } else if (p.answerType === 'choice') {
            const box = this.el['choice-buttons'];
            box.style.display = 'flex';
            p.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = choice;
                btn.addEventListener('click', () => this.submitChoice(choice, btn));
                box.appendChild(btn);
            });
        }

        this.renderKeypad(p, activeSkillId);

        // Feedback & hints reset
        this.el['feedback'].textContent = '';
        this.el['feedback'].className = 'feedback';
        this.el['hint-area'].innerHTML = '';
        this.el['hint-btn'].disabled = false;

        // Auto-scaffold after repeated struggle: open the first hint for free
        if (s.scaffold && !s.isReview) {
            this.revealHint();
        }
    }

    renderMeter(skillId, isReview) {
        const st = this.skillState(skillId);
        const meter = this.el['mastery-meter'];
        meter.innerHTML = '';
        const filled = st.phase === 'mastered' ? METER_TOTAL : Math.min(METER_TOTAL, st.learnCount + st.practiceCount);
        for (let i = 0; i < METER_TOTAL; i++) {
            const seg = document.createElement('span');
            seg.className = 'meter-seg' + (i < filled ? ' on' : '');
            meter.appendChild(seg);
        }
        const star = document.createElement('span');
        star.className = 'meter-star' + (st.phase === 'mastered' ? ' on' : '');
        star.textContent = '⭐';
        meter.appendChild(star);
        meter.style.opacity = isReview ? 0.45 : 1;
    }

    // ---------- answering ----------

    currentUserAnswer() {
        const p = this.session.problem;
        if (p.answerType === 'number') {
            const v = this.el['answer-number'].value.trim();
            if (v === '') return null;
            const n = Number(v);
            return Number.isNaN(n) ? null : n;
        }
        const v = this.el['answer-text'].value.trim();
        return v === '' ? null : v;
    }

    isCorrect(userAnswer) {
        const p = this.session.problem;
        if (p.answerType === 'number') return userAnswer === p.answer;
        if (p.answerType === 'time') {
            const m = String(userAnswer).match(/^(\d{1,2})\s*[:.]\s*(\d{1,2})$/);
            if (!m) return false;
            return Number(m[1]) === p.timeValue.h && Number(m[2]) === p.timeValue.m;
        }
        if (p.answerType === 'fraction') {
            // Accept any equivalent form: 3/4, 6/8, "1 1/2", or a whole number
            const s = String(userAnswer).trim();
            const { n, d } = p.fracValue;
            let m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
            if (m) {
                const un = Number(m[1]), ud = Number(m[2]);
                return ud > 0 && un * d === n * ud;
            }
            m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
            if (m) {
                const w = Number(m[1]), un = Number(m[2]), ud = Number(m[3]);
                return ud > 0 && (w * ud + un) * d === n * ud;
            }
            m = s.match(/^(\d+)$/);
            if (m) return Number(m[1]) * d === n;
            return false;
        }
        const norm = String(userAnswer).toLowerCase().replace(/\s+/g, '');
        if (norm === String(p.answer).toLowerCase()) return true;
        return Array.isArray(p.accept) && p.accept.some(a => norm === String(a).toLowerCase());
    }

    submit() {
        if (!this.session || !this.session.problem) return;
        if (this.session.problem.answerType === 'choice') return;
        const userAnswer = this.currentUserAnswer();
        if (userAnswer === null) {
            this.setFeedback('Type your answer first! ✏️', 'nudge');
            return;
        }
        this.grade(this.isCorrect(userAnswer), userAnswer);
    }

    submitChoice(choice, btn) {
        if (!this.session || !this.session.problem) return;
        const correct = choice === this.session.problem.answer;
        document.querySelectorAll('.choice-btn').forEach(b => { b.disabled = correct; });
        btn.classList.add(correct ? 'right' : 'wrong');
        if (!correct) {
            setTimeout(() => btn.classList.remove('wrong'), 900);
        }
        this.grade(correct, choice);
    }

    setFeedback(msg, cls) {
        const fb = this.el['feedback'];
        fb.innerHTML = msg;
        fb.className = 'feedback ' + (cls || '');
    }

    grade(correct, userAnswer) {
        if (correct) {
            this.onCorrect();
        } else {
            this.onWrong(userAnswer);
        }
    }

    onCorrect() {
        const s = this.session;
        const activeSkillId = s.isReview ? s.reviewSkillId : s.skillId;
        this.skillState(activeSkillId).right++;
        const theme = THEMES[this.state.theme];
        this.state.totalAnswered++;
        this.state.stars++;
        s.answeredThisSession++;
        s.correctRun++;
        if (s.correctRun >= 2) s.scaffold = false;

        this.setFeedback(R.pick(theme.praise), 'correct');
        this.renderHeader();

        if (s.isReview) {
            this.recordReviewResult(s.reviewSkillId, true);
            if (s.mode === 'warmup') s.warmupRight++;
            this.save();
            this.pendingTimeout = setTimeout(() => this.nextProblem(), 1300);
            return;
        }

        const st = this.skillState(s.skillId);
        st.wrongStreak = 0;
        st.streak++;
        if (st.phase === 'learn') {
            st.learnCount++;
            if (st.learnCount >= LEARN_TARGET) {
                st.phase = 'practice';
                st.streak = 0;
                this.setFeedback(R.pick(theme.praise) + '<br><span class="sub-note">Training wheels off — Practice time! 💪</span>', 'correct');
            }
        } else if (st.phase === 'practice') {
            st.practiceCount++;
            if (st.practiceCount >= PRACTICE_TARGET && st.streak >= STREAK_TO_MASTER) {
                this.masterSkill(s.skillId);
                return;
            }
        }
        this.renderMeter(s.skillId, false);
        this.save();
        this.pendingTimeout = setTimeout(() => this.nextProblem(), 1300);
    }

    onWrong(userAnswer) {
        const s = this.session;
        const p = s.problem;
        const theme = THEMES[this.state.theme];
        s.attemptsOnProblem++;
        s.correctRun = 0;
        if (!s.wrongAnswers) s.wrongAnswers = [];
        s.wrongAnswers.push(String(userAnswer));

        if (s.attemptsOnProblem === 1 && p.answerType !== 'choice') {
            // First miss: encourage a second effortful attempt before revealing anything
            this.setFeedback(R.pick(theme.oops), 'incorrect');
            if (s.hintIndex === 0) this.revealHint();
            const input = p.answerType === 'number' ? this.el['answer-number'] : this.el['answer-text'];
            input.value = '';
            if (!IS_TOUCH) input.focus();
            return;
        }

        // Second miss (or any miss on a 2-4 option choice): teach, then move on
        this.state.totalAnswered++;
        s.answeredThisSession++;
        const answerShown = p.answerType === 'time' ? p.answer : p.answer;
        this.setFeedback(
            `The answer is <strong>${answerShown}</strong>.<br><span class="explain-note">${p.explain}</span>`,
            'reveal'
        );

        const activeSkillId = s.isReview ? s.reviewSkillId : s.skillId;
        this.skillState(activeSkillId).wrong++;
        if (!this.state.misses) this.state.misses = [];
        this.state.misses.push({
            t: Date.now(),
            skillId: activeSkillId,
            prompt: this.plainText(p.prompt),
            answer: String(p.answer),
            given: s.wrongAnswers.slice(),
            review: !!s.isReview
        });
        if (this.state.misses.length > 200) this.state.misses.splice(0, this.state.misses.length - 200);

        if (s.isReview) {
            this.recordReviewResult(s.reviewSkillId, false);
        } else {
            const st = this.skillState(s.skillId);
            st.streak = 0;
            st.wrongStreak++;
            if (st.wrongStreak >= 2) {
                s.scaffold = true; // bring visual supports back on the next problem
            }
        }
        this.save();
        this.pendingTimeout = setTimeout(() => this.nextProblem(), 3200);
    }

    recordReviewResult(skillId, correct) {
        const st = this.skillState(skillId);
        if (!st.review) st.review = { due: 0, interval: REVIEW_FIRST_INTERVAL };
        if (correct) {
            st.refresh = false;
            st.reviewMisses = 0;
            st.review.interval = Math.min(REVIEW_MAX_INTERVAL, Math.round(st.review.interval * REVIEW_GROWTH));
            st.review.due = this.state.totalAnswered + st.review.interval;
        } else {
            st.refresh = true;
            st.reviewMisses++;
            st.review.interval = REVIEW_FIRST_INTERVAL;
            st.review.due = this.state.totalAnswered + 5;
            if (st.reviewMisses >= 2) {
                // Forgotten — reopen the skill for re-practice
                st.phase = 'practice';
                st.practiceCount = Math.max(0, PRACTICE_TARGET - 3);
                st.streak = 0;
                st.refresh = false;
                st.reviewMisses = 0;
            }
        }
    }

    masterSkill(skillId) {
        const st = this.skillState(skillId);
        const theme = THEMES[this.state.theme];
        st.phase = 'mastered';
        st.refresh = false;
        st.review = { due: this.state.totalAnswered + REVIEW_FIRST_INTERVAL, interval: REVIEW_FIRST_INTERVAL };
        this.state.stars += 5;
        this.save();
        this.renderMeter(skillId, false);
        this.renderHeader();

        const { skill, unit } = SKILL_INDEX[skillId];
        const nextId = this.nextUnlockedSkillId();
        const actions = [];
        if (nextId) {
            actions.push({ label: `Next: ${SKILL_INDEX[nextId].skill.title} →`, handler: () => this.openSkill(nextId) });
        }
        actions.push({ label: 'Back to the Map 🗺️', handler: () => this.showPath() });

        // Did this mastery finish the whole tier and reveal the next one?
        const nextGrade = unit.grade + 1;
        const nextGradeExists = CURRICULUM.units.some(u => u.grade === nextGrade);
        if (nextGradeExists && nextGrade > this.state.unlockedGrade && this.gradeRequirementsMet(nextGrade)) {
            this.state.unlockedGrade = nextGrade;
            this.save();
            this.showCelebration(
                '🎓 LEVEL UP!',
                `You mastered EVERY skill — incredible!<br>` +
                `A whole new world of <strong>Level ${nextGrade} math</strong> just appeared on your map! +5 ${theme.currencyName} ${theme.currencyIcon}`,
                actions
            );
            return;
        }
        if (!nextGradeExists && this.masteredSkillIds().length === allSkillIds().length) {
            this.showCelebration(
                '👑 MATH CHAMPION!',
                `You mastered every single skill in the whole game — every level, every unit!<br>` +
                `Keep your powers sharp with Flashback Warm-Ups. +5 ${theme.currencyName} ${theme.currencyIcon}`,
                actions
            );
            return;
        }
        this.showCelebration(
            '🏆 Skill Mastered!',
            `You mastered <strong>${skill.title}</strong>! +5 ${theme.currencyName} ${theme.currencyIcon}<br>` +
            `It will come back later as a Flashback — that's how your brain makes it stick!`,
            actions
        );
    }

    finishWarmup() {
        const s = this.session;
        const perfect = s.warmupRight === s.warmupTotal;
        this.showCelebration(
            perfect ? '🔥 Perfect Warm-Up!' : '🔥 Warm-Up Done!',
            `You got <strong>${s.warmupRight} of ${s.warmupTotal}</strong> flashbacks right.` +
            (perfect ? '<br>Your memory is SUPER strong today!' : '<br>The tricky ones will come back soon — that\'s how you grow!'),
            [
                { label: 'Go to the Map 🗺️', handler: () => this.showPath() },
                { label: 'Home', handler: () => this.showStart() }
            ]
        );
    }

    showCelebration(title, messageHTML, actions) {
        this.clearPending();
        this.el['celebration-title'].textContent = title;
        this.el['celebration-message'].innerHTML = messageHTML;
        const box = this.el['celebration-actions'];
        box.innerHTML = '';
        actions.forEach(a => {
            const btn = document.createElement('button');
            btn.className = 'celebration-btn';
            btn.textContent = a.label;
            btn.addEventListener('click', () => {
                this.el['celebration'].classList.add('hidden');
                a.handler();
            });
            box.appendChild(btn);
        });
        this.el['celebration'].classList.remove('hidden');
    }

    // ---------- hints ----------

    showHint() {
        this.revealHint();
    }

    manipulativeComplete(msg) {
        const div = document.createElement('div');
        div.className = 'hint-line coach';
        div.innerHTML = `🌟 ${msg}`;
        this.el['hint-area'].appendChild(div);
    }

    revealHint() {
        const s = this.session;
        const p = s.problem;
        if (!p || s.hintIndex >= p.hints.length) return;
        const hint = p.hints[s.hintIndex];
        s.hintIndex++;
        const div = document.createElement('div');
        div.className = 'hint-line';
        div.innerHTML = `💡 ${hint}`;
        this.el['hint-area'].appendChild(div);
        if (s.hintIndex >= p.hints.length) {
            this.el['hint-btn'].disabled = true;
        }
        // Show the visual model as part of deeper hints when it was hidden
        if (s.hintIndex >= 2 && p.visual && !p.interactive && this.el['problem-visual'].style.display === 'none') {
            this.el['problem-visual'].innerHTML = p.visual;
            this.el['problem-visual'].style.display = 'block';
        }
    }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MasteryEngine();
});
