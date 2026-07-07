// manipulatives.js
//
// Interactive "manipulative" widgets used during the Learn phase of the
// math game. Each manipulative is a small guided scaffold that lets a kid
// physically (via tap/drag) work through a concept before typing their
// answer into the normal answer box elsewhere in the UI.
//
// Contract (depended on by engine.js):
//   window.Manipulatives[type].mount(container, config, api) -> handle
//     - `container` is an empty <div> the engine has already cleared.
//       mount() builds all DOM for the widget inside it.
//     - `config` is a plain object describing the specific instance
//       (numbers, icons, targets, etc.) — see each section below.
//     - `api` is `{ complete(message) }`. Call `api.complete(config.done)`
//       EXACTLY ONCE, the moment the kid successfully finishes the
//       manipulative. This does not submit any answer — it just tells the
//       engine to show its "done" coaching state. The kid still types the
//       real answer separately.
//     - mount() must return a `handle` object with a `destroy()` method.
//       destroy() is called by the engine before it wipes the container's
//       innerHTML for the next problem. destroy() is only responsible for
//       cleaning up things OUTSIDE the container's own DOM subtree: any
//       document-level pointer listeners and any pending setTimeout
//       timers. (The container's child nodes are thrown away by the
//       engine, so listeners attached directly to elements inside the
//       container do not need manual removal.)
//
// Every mount() call gets its own fresh closure holding all state for that
// instance (a `done` boolean, timers, drag state, etc.) — nothing is
// shared between problems. Once `done` becomes true, every handler must
// early-return so no further taps/drags can do anything or double-fire
// api.complete().

(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function svgEl(tag, attrs) {
        const el = document.createElementNS(SVG_NS, tag);
        if (attrs) {
            for (const k in attrs) {
                el.setAttribute(k, attrs[k]);
            }
        }
        return el;
    }

    function el(tag, className, text) {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function pad2(n) {
        return n < 10 ? '0' + n : String(n);
    }

    // ---------------------------------------------------------------
    // 1. build-array — { type:'build-array', rows, cols, icon, done }
    // ---------------------------------------------------------------
    function mountBuildArray(container, config, api) {
        const { rows, cols, icon, done: doneMessage } = config;
        const total = rows * cols;
        let filled = 0;
        let done = false;

        const root = el('div', 'manip manip-array');
        const counter = el('div', 'manip-count');
        const grid = el('div', 'manip-grid');
        grid.style.gridTemplateColumns = `repeat(${cols}, 48px)`;

        function updateCounter() {
            counter.textContent = `${filled} / ${total}`;
        }

        const cells = [];
        for (let i = 0; i < total; i++) {
            const cell = el('button', 'manip-cell');
            cell.type = 'button';
            cell.addEventListener('click', () => {
                if (done) return;
                if (cell.classList.contains('filled')) {
                    cell.classList.remove('filled');
                    cell.textContent = '';
                    filled--;
                } else {
                    cell.classList.add('filled');
                    cell.textContent = icon;
                    filled++;
                }
                updateCounter();
                if (filled === total) {
                    cells.forEach(c => c.classList.add('manip-pulse'));
                    root.classList.add('manip-locked');
                    done = true;
                    api.complete(doneMessage);
                }
            });
            cells.push(cell);
            grid.appendChild(cell);
        }

        updateCounter();
        root.appendChild(counter);
        root.appendChild(grid);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up;
                // all listeners are on elements inside `container`.
            }
        };
    }

    // ---------------------------------------------------------------
    // 2. share-groups — { type:'share-groups', total, groups, icon, itemName, done }
    // ---------------------------------------------------------------
    function mountShareGroups(container, config, api) {
        const { total, groups, icon, share, remainder, done: doneMessage } = config;
        const fairShare = (config.share !== undefined) ? config.share : total / groups;
        let done = false;
        let poolCount = total;

        const root = el('div', 'manip manip-share');
        const pool = el('div', 'manip-pool');
        const showPoolCount = typeof config.remainder === 'number' && config.remainder > 0;
        const poolCountEl = showPoolCount ? el('div', 'manip-pool-count') : null;
        const platesWrap = el('div', 'manip-plates');

        // Pending wiggle timers, tracked so destroy() can clear all of them.
        const wiggleTimers = new Set();

        const poolChips = [];
        for (let i = 0; i < total; i++) {
            const chip = el('span', 'manip-chip', icon);
            poolChips.push(chip);
            pool.appendChild(chip);
        }

        function updatePoolCount() {
            if (poolCountEl) {
                poolCountEl.textContent = `Pool: ${poolCount}`;
            }
        }

        const plateItemCounts = new Array(groups).fill(0);
        const plateEls = [];
        const plateItemsEls = [];

        function checkComplete() {
            if (done) return;
            if (plateItemCounts.every(c => c === fairShare) && poolCount === (config.remainder || 0)) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        function scheduleWiggle(plate) {
            plate.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                plate.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        for (let g = 0; g < groups; g++) {
            const plate = el('button', 'manip-plate');
            plate.type = 'button';
            const face = el('div', 'manip-plate-face', '\u{1F37D}️'); // 🍽️
            const itemsWrap = el('div', 'manip-plate-items');
            plate.appendChild(face);
            plate.appendChild(itemsWrap);

            plate.addEventListener('click', () => {
                if (done) return;
                const idx = g;
                if (plateItemCounts[idx] > fairShare) {
                    // Take one item back from this plate to the pool.
                    const chip = itemsWrap.lastElementChild;
                    if (chip) {
                        itemsWrap.removeChild(chip);
                        pool.appendChild(chip);
                        plateItemCounts[idx]--;
                        poolCount++;
                        updatePoolCount();
                    }
                } else if (poolCount > 0) {
                    // Deal one item from the pool onto this plate.
                    const chip = pool.lastElementChild;
                    if (chip) {
                        pool.removeChild(chip);
                        itemsWrap.appendChild(chip);
                        plateItemCounts[idx]++;
                        poolCount--;
                        updatePoolCount();
                        if (plateItemCounts[idx] > fairShare) {
                            scheduleWiggle(plate);
                        }
                    }
                } else {
                    // Pool empty, plate at/below fair share: advisory wiggle
                    // (nudges the kid that there's nothing left to deal here).
                    scheduleWiggle(plate);
                }
                checkComplete();
            });

            plateEls.push(plate);
            plateItemsEls.push(itemsWrap);
            platesWrap.appendChild(plate);
        }

        root.appendChild(pool);
        if (poolCountEl) {
            updatePoolCount();
            root.appendChild(poolCountEl);
        }
        root.appendChild(platesWrap);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 3. shade-fraction — { type:'shade-fraction', parts, target, mode, done }
    // ---------------------------------------------------------------
    function mountShadeFraction(container, config, api) {
        const { parts, target, mode, done: doneMessage } = config;
        let done = false;
        let shadedCount = 0;
        let nextCountNum = 1;

        const W = Math.max(264, parts * 48);
        const H = 88;

        const root = el('div', 'manip manip-frac');
        const counter = el('div', 'manip-count');

        const svg = svgEl('svg', {
            class: 'manip-frac-svg',
            viewBox: `0 0 ${W} ${H}`,
            width: '100%'
        });

        const partWidth = W / parts;
        const rectHeight = H * 0.7;
        const rectY = (H - rectHeight) / 2;

        function updateCounter() {
            if (mode === 'count') {
                counter.textContent = `${shadedCount} / ${parts}`;
            } else {
                counter.textContent = `${shadedCount} / ${parts}`;
            }
        }

        for (let i = 0; i < parts; i++) {
            const x = i * partWidth;
            const rect = svgEl('rect', {
                class: 'manip-frac-part',
                x: x.toFixed(1),
                y: rectY.toFixed(1),
                width: partWidth.toFixed(1),
                height: rectHeight.toFixed(1)
            });

            if (mode === 'shade') {
                rect.addEventListener('click', () => {
                    if (done) return;
                    if (rect.classList.contains('shaded')) {
                        rect.classList.remove('shaded');
                        shadedCount--;
                    } else {
                        rect.classList.add('shaded');
                        shadedCount++;
                    }
                    updateCounter();
                    if (shadedCount === target) {
                        done = true;
                        root.classList.add('manip-locked');
                        api.complete(doneMessage);
                    }
                });
            } else {
                // mode === 'count'
                rect.addEventListener('click', () => {
                    if (done) return;
                    if (rect.dataset.counted === '1') return; // already stamped
                    rect.dataset.counted = '1';
                    rect.classList.add('shaded');

                    const num = nextCountNum++;
                    const text = svgEl('text', {
                        class: 'manip-frac-num',
                        x: (x + partWidth / 2).toFixed(1),
                        y: (H / 2 + 6).toFixed(1),
                        'text-anchor': 'middle'
                    });
                    text.textContent = String(num);
                    svg.appendChild(text);

                    shadedCount++;
                    updateCounter();
                    if (shadedCount === parts) {
                        done = true;
                        root.classList.add('manip-locked');
                        api.complete(doneMessage);
                    }
                });
            }

            svg.appendChild(rect);
        }

        updateCounter();
        root.appendChild(svg);
        root.appendChild(counter);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up.
            }
        };
    }

    // ---------------------------------------------------------------
    // 4. number-line — { type:'number-line', ticks, targetTick, endLabels,
    //                     done, refTick?, refLabel? }
    // ---------------------------------------------------------------
    function mountNumberLine(container, config, api) {
        const { ticks, targetTick, endLabels, done: doneMessage, refTick, refLabel } = config;

        // Geometry mirrors curriculum.js's fractionNumberLine() exactly.
        const x0 = 20, x1 = 300, y = 34;
        const VIEWBOX_W = 320, VIEWBOX_H = 66;

        let done = false;
        let activePointerId = null;

        const root = el('div', 'manip manip-numline-wrap');
        const svg = svgEl('svg', {
            class: 'manip-numline',
            viewBox: `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`,
            width: VIEWBOX_W,
            height: VIEWBOX_H
        });
        // Required so touch dragging works without the page hijacking the
        // gesture (scroll, etc.).
        svg.style.touchAction = 'none';

        function tickX(i) {
            return x0 + (x1 - x0) * i / ticks;
        }

        // Baseline.
        svg.appendChild(svgEl('line', {
            class: 'manip-nl-line',
            x1: x0, y1: y, x2: x1, y2: y
        }));

        // Tick marks.
        for (let i = 0; i <= ticks; i++) {
            const tx = tickX(i);
            svg.appendChild(svgEl('line', {
                class: 'manip-nl-tick',
                x1: tx.toFixed(1), y1: (y - 9).toFixed(1),
                x2: tx.toFixed(1), y2: (y + 9).toFixed(1)
            }));
        }

        // End labels.
        const leftLabel = svgEl('text', {
            class: 'manip-nl-label',
            x: x0, y: y + 26,
            'text-anchor': 'middle'
        });
        leftLabel.textContent = endLabels && endLabels[0] !== undefined ? endLabels[0] : '';
        svg.appendChild(leftLabel);

        const rightLabel = svgEl('text', {
            class: 'manip-nl-label',
            x: x1, y: y + 26,
            'text-anchor': 'middle'
        });
        rightLabel.textContent = endLabels && endLabels[1] !== undefined ? endLabels[1] : '';
        svg.appendChild(rightLabel);

        // Optional static reference dot (non-interactive).
        if (refTick !== undefined && refTick !== null) {
            const rx = tickX(refTick);
            svg.appendChild(svgEl('circle', {
                class: 'manip-nl-ref',
                cx: rx.toFixed(1), cy: y, r: 6
            }));
            const refText = svgEl('text', {
                class: 'manip-nl-ref-label',
                x: rx.toFixed(1), y: y - 14,
                'text-anchor': 'middle'
            });
            refText.textContent = refLabel !== undefined ? refLabel : '';
            svg.appendChild(refText);
        }

        // Ghost circle: highlights nearest tick while dragging.
        const ghost = svgEl('circle', {
            class: 'manip-nl-ghost',
            cx: tickX(0).toFixed(1), cy: y, r: 8
        });
        ghost.style.visibility = 'hidden';
        svg.appendChild(ghost);

        // Draggable marker + invisible larger hit target, starting at tick 0.
        const startX = tickX(0);
        const marker = svgEl('circle', {
            class: 'manip-nl-marker',
            cx: startX.toFixed(1), cy: y, r: 8
        });
        const hit = svgEl('circle', {
            class: 'manip-nl-hit',
            cx: startX.toFixed(1), cy: y, r: 24,
            fill: 'transparent'
        });
        svg.appendChild(marker);
        svg.appendChild(hit);

        function clamp(v, lo, hi) {
            return Math.max(lo, Math.min(hi, v));
        }

        function clientXToSvgX(clientX) {
            const rect = svg.getBoundingClientRect();
            return (clientX - rect.left) / rect.width * VIEWBOX_W;
        }

        function nearestTick(svgX) {
            const idx = Math.round((svgX - x0) / (x1 - x0) * ticks);
            return clamp(idx, 0, ticks);
        }

        function setMarkerX(x) {
            marker.setAttribute('cx', x.toFixed(1));
            hit.setAttribute('cx', x.toFixed(1));
        }

        function onPointerMove(event) {
            if (done) return;
            if (event.pointerId !== activePointerId) return;
            let svgX = clientXToSvgX(event.clientX);
            svgX = clamp(svgX, x0, x1);
            setMarkerX(svgX);

            const nearest = nearestTick(svgX);
            const gx = tickX(nearest);
            ghost.setAttribute('cx', gx.toFixed(1));
            ghost.style.visibility = 'visible';
        }

        function endDrag(event) {
            if (event.pointerId !== activePointerId) return;

            const svgX = clamp(clientXToSvgX(event.clientX), x0, x1);
            const nearest = nearestTick(svgX);
            const snapX = tickX(nearest);
            setMarkerX(snapX);
            ghost.style.visibility = 'hidden';

            try {
                hit.releasePointerCapture(activePointerId);
            } catch (e) {
                // Ignore — capture may already be released (e.g. after cancel).
            }

            hit.removeEventListener('pointermove', onPointerMove);
            hit.removeEventListener('pointerup', endDrag);
            hit.removeEventListener('pointercancel', endDrag);
            activePointerId = null;

            if (!done && nearest === targetTick) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        function onPointerDown(event) {
            if (done) return;
            if (activePointerId !== null) return; // ignore other pointers mid-drag
            activePointerId = event.pointerId;
            try {
                hit.setPointerCapture(activePointerId);
            } catch (e) {
                // Some environments may not support capture; drag still
                // works via the listeners below.
            }
            hit.addEventListener('pointermove', onPointerMove);
            hit.addEventListener('pointerup', endDrag);
            hit.addEventListener('pointercancel', endDrag);
        }

        hit.addEventListener('pointerdown', onPointerDown);

        root.appendChild(svg);
        container.appendChild(root);

        return {
            destroy() {
                // Listeners above are attached to `hit`, which lives inside
                // `container` and is discarded by the engine — but clean up
                // defensively in case a drag is mid-flight, and in case any
                // future change moves these to document-level listeners.
                hit.removeEventListener('pointermove', onPointerMove);
                hit.removeEventListener('pointerup', endDrag);
                hit.removeEventListener('pointercancel', endDrag);
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', endDrag);
                document.removeEventListener('pointercancel', endDrag);
                activePointerId = null;
            }
        };
    }

    // ---------------------------------------------------------------
    // 5. compare-bars — { type:'compare-bars', top:{parts,target,label},
    //                      bottom:{parts,target,label}, correct, done }
    // ---------------------------------------------------------------
    function mountCompareBars(container, config, api) {
        const { top, bottom, correct, done: doneMessage } = config;
        let done = false;
        let topLocked = false;
        let bottomLocked = false;

        const root = el('div', 'manip manip-compare');

        // Pending wiggle timers, tracked so destroy() can clear all of them.
        const wiggleTimers = new Set();

        const questionEl = el('div', 'manip-compare-question');

        function maybeRevealQuestion() {
            if (topLocked && bottomLocked && !questionEl.parentNode) {
                root.appendChild(questionEl);
            }
        }

        function buildRow(bar, onLocked) {
            const rowEl = el('div', 'manip-compare-row');
            const label = el('div', 'manip-compare-label', bar.label);

            const W = Math.max(264, bar.parts * 48);
            const H = 88;
            const svg = svgEl('svg', {
                class: 'manip-compare-svg',
                viewBox: `0 0 ${W} ${H}`,
                width: '100%'
            });

            const partWidth = W / bar.parts;
            const rectHeight = H * 0.7;
            const rectY = (H - rectHeight) / 2;

            const counter = el('div', 'manip-count');
            let shadedCount = 0;
            let locked = false;

            function updateCounter() {
                counter.textContent = `${shadedCount} / ${bar.parts}`;
            }

            const cells = [];
            for (let i = 0; i < bar.parts; i++) {
                const x = i * partWidth;
                const rect = svgEl('rect', {
                    class: 'manip-frac-part',
                    x: x.toFixed(1),
                    y: rectY.toFixed(1),
                    width: partWidth.toFixed(1),
                    height: rectHeight.toFixed(1)
                });
                rect.addEventListener('click', () => {
                    if (done || locked) return;
                    if (rect.classList.contains('shaded')) {
                        rect.classList.remove('shaded');
                        shadedCount--;
                    } else {
                        rect.classList.add('shaded');
                        shadedCount++;
                    }
                    updateCounter();
                    if (shadedCount === bar.target) {
                        locked = true;
                        rowEl.classList.add('manip-row-locked');
                        cells.forEach(c => c.classList.add('manip-pulse'));
                        onLocked();
                    }
                });
                cells.push(rect);
                svg.appendChild(rect);
            }

            updateCounter();
            rowEl.appendChild(label);
            rowEl.appendChild(svg);
            rowEl.appendChild(counter);
            return rowEl;
        }

        const topRow = buildRow(top, () => {
            topLocked = true;
            maybeRevealQuestion();
        });
        const bottomRow = buildRow(bottom, () => {
            bottomLocked = true;
            maybeRevealQuestion();
        });

        const options = [
            { value: 'top', text: '🔼 Top is bigger' },
            { value: 'bottom', text: '🔽 Bottom is bigger' },
            { value: 'equal', text: '⚖️ Equal' }
        ];
        options.forEach(opt => {
            const btn = el('button', 'manip-compare-btn', opt.text);
            btn.type = 'button';
            btn.addEventListener('click', () => {
                if (done) return;
                if (opt.value === correct) {
                    done = true;
                    root.classList.add('manip-locked');
                    api.complete(doneMessage);
                } else {
                    btn.classList.add('manip-wiggle');
                    const timer = setTimeout(() => {
                        btn.classList.remove('manip-wiggle');
                        wiggleTimers.delete(timer);
                    }, 500);
                    wiggleTimers.add(timer);
                }
            });
            questionEl.appendChild(btn);
        });

        root.appendChild(topRow);
        root.appendChild(bottomRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 6. equiv-bars — { type:'equiv-bars', topParts, topShaded,
    //                    bottomParts, done }
    // ---------------------------------------------------------------
    function mountEquivBars(container, config, api) {
        const { topParts, topShaded, bottomParts, done: doneMessage } = config;
        const target = topShaded * bottomParts / topParts;
        let done = false;
        let shadedCount = 0;

        const root = el('div', 'manip manip-equiv');
        const rowEl = el('div', 'manip-equiv-row');
        const label = el('div', 'manip-equiv-label', `${topShaded}/${topParts}`);

        const W = Math.max(264, Math.max(topParts, bottomParts) * 48);
        const topPartWidth = W / topParts;
        const bottomPartWidth = W / bottomParts;
        const barH = 56, gap = 16;
        const H = 10 + barH + gap + barH + 10;

        const svg = svgEl('svg', {
            class: 'manip-equiv-svg',
            viewBox: `0 0 ${W} ${H}`,
            width: '100%'
        });

        // Top bar: fixed visual reference, fully non-interactive.
        for (let i = 0; i < topParts; i++) {
            const x = i * topPartWidth;
            const rect = svgEl('rect', {
                class: i < topShaded ? 'manip-frac-part pre-shaded' : 'manip-frac-part',
                x: x.toFixed(1),
                y: 10,
                width: topPartWidth.toFixed(1),
                height: barH
            });
            svg.appendChild(rect);
        }

        // Dashed guide line dropping from the right edge of the top bar's
        // shaded region down past the bottom bar.
        const guideX = (topShaded * topPartWidth).toFixed(1);
        svg.appendChild(svgEl('line', {
            class: 'manip-equiv-guide',
            x1: guideX, y1: 10,
            x2: guideX, y2: 10 + barH + gap + barH
        }));

        const counter = el('div', 'manip-count');

        function updateCounter() {
            counter.textContent = `${shadedCount} / ${bottomParts}`;
        }

        // Bottom bar: interactive, kid shades to match the equivalent fraction.
        for (let i = 0; i < bottomParts; i++) {
            const x = i * bottomPartWidth;
            const rect = svgEl('rect', {
                class: 'manip-frac-part',
                x: x.toFixed(1),
                y: 10 + barH + gap,
                width: bottomPartWidth.toFixed(1),
                height: barH
            });
            rect.addEventListener('click', () => {
                if (done) return;
                if (rect.classList.contains('shaded')) {
                    rect.classList.remove('shaded');
                    shadedCount--;
                } else {
                    rect.classList.add('shaded');
                    shadedCount++;
                }
                updateCounter();
                if (shadedCount === target) {
                    done = true;
                    root.classList.add('manip-locked');
                    api.complete(doneMessage);
                }
            });
            svg.appendChild(rect);
        }

        updateCounter();
        rowEl.appendChild(label);
        rowEl.appendChild(svg);
        root.appendChild(rowEl);
        root.appendChild(counter);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up.
            }
        };
    }

    // ---------------------------------------------------------------
    // 7. shade-two — { type:'shade-two', parts, preShaded, change, mode,
    //                   preLabel?, done }
    // ---------------------------------------------------------------
    function mountShadeTwo(container, config, api) {
        const { parts, preShaded, change, mode, preLabel, done: doneMessage } = config;
        let done = false;
        let addedCount = 0;
        let crossedCount = 0;

        const W = Math.max(264, parts * 48);
        const H = 88;
        const partWidth = W / parts;
        const rectHeight = H * 0.7;
        const rectY = (H - rectHeight) / 2;

        const root = el('div', 'manip manip-shade-two');

        if (config.preLabel) {
            root.appendChild(el('div', 'manip-shade-two-caption', config.preLabel));
        }

        const svg = svgEl('svg', {
            class: 'manip-shade-two-svg',
            viewBox: `0 0 ${W} ${H}`,
            width: '100%'
        });

        const counter = el('div', 'manip-count');

        function updateCounter() {
            if (mode === 'add') {
                counter.textContent = `added ${addedCount} of ${change}`;
            } else {
                counter.textContent = `taken away ${crossedCount} of ${change}`;
            }
        }

        for (let i = 0; i < parts; i++) {
            const x = i * partWidth;
            const isPreShaded = i < preShaded;
            const rect = svgEl('rect', {
                class: isPreShaded ? 'manip-frac-part pre-shaded' : 'manip-frac-part',
                x: x.toFixed(1),
                y: rectY.toFixed(1),
                width: partWidth.toFixed(1),
                height: rectHeight.toFixed(1)
            });
            svg.appendChild(rect);

            if (mode === 'remove' && isPreShaded) {
                // Always-present X mark; CSS reveals it only when the
                // preceding rect sibling carries the `crossed` class.
                svg.appendChild(svgEl('line', {
                    class: 'manip-cross-mark',
                    x1: (x + 6).toFixed(1), y1: (rectY + 6).toFixed(1),
                    x2: (x + partWidth - 6).toFixed(1), y2: (rectY + rectHeight - 6).toFixed(1)
                }));
                svg.appendChild(svgEl('line', {
                    class: 'manip-cross-mark',
                    x1: (x + 6).toFixed(1), y1: (rectY + rectHeight - 6).toFixed(1),
                    x2: (x + partWidth - 6).toFixed(1), y2: (rectY + 6).toFixed(1)
                }));

                rect.addEventListener('click', () => {
                    if (done) return;
                    if (rect.classList.contains('crossed')) {
                        rect.classList.remove('crossed');
                        crossedCount--;
                    } else {
                        rect.classList.add('crossed');
                        crossedCount++;
                    }
                    updateCounter();
                    if (crossedCount === change) {
                        done = true;
                        root.classList.add('manip-locked');
                        api.complete(doneMessage);
                    }
                });
            } else if (mode === 'add' && !isPreShaded) {
                rect.addEventListener('click', () => {
                    if (done) return;
                    if (rect.classList.contains('added-shaded')) {
                        rect.classList.remove('added-shaded');
                        addedCount--;
                    } else {
                        rect.classList.add('added-shaded');
                        addedCount++;
                    }
                    updateCounter();
                    if (addedCount === change) {
                        done = true;
                        root.classList.add('manip-locked');
                        api.complete(doneMessage);
                    }
                });
            }
        }

        updateCounter();
        root.appendChild(svg);
        root.appendChild(counter);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up.
            }
        };
    }

    // ---------------------------------------------------------------
    // 8. trace-sides — { type:'trace-sides', l, w, done }
    // ---------------------------------------------------------------
    function mountTraceSides(container, config, api) {
        const { l, w, done: doneMessage } = config;
        let done = false;
        let countedSides = 0;
        const terms = [];

        // Geometry mirrors curriculum.js's perimeterRectSVG().
        const s = 18, W = l * s, H = w * s, pad = 34;
        const VW = W + pad * 2, VH = H + pad * 2;

        const root = el('div', 'manip manip-trace');
        const svg = svgEl('svg', {
            class: 'manip-trace-svg',
            viewBox: `0 0 ${VW} ${VH}`,
            width: VW,
            height: VH
        });

        // Filled face of the rectangle; the 4 sides are drawn on top so
        // each can light up independently as the kid walks the perimeter.
        svg.appendChild(svgEl('rect', {
            class: 'manip-trace-rect',
            x: pad, y: pad, width: W, height: H
        }));

        const sumLine = el('div', 'manip-trace-sum', 'Tap each side!');

        function updateSum() {
            const total = terms.reduce((a, b) => a + b, 0);
            sumLine.textContent = terms.length < 2
                ? terms.join(' + ')
                : `${terms.join(' + ')} = ${total}`;
        }

        // Each side: length + endpoints + where its label sits (outside).
        const sides = [
            { len: l, x1: pad, y1: pad, x2: pad + W, y2: pad,
              lx: pad + W / 2, ly: pad - 10, text: `${l} units` },
            { len: w, x1: pad + W, y1: pad, x2: pad + W, y2: pad + H,
              lx: pad + W + 16, ly: pad + H / 2 + 5, text: `${w}` },
            { len: l, x1: pad, y1: pad + H, x2: pad + W, y2: pad + H,
              lx: pad + W / 2, ly: pad + H + 22, text: `${l}` },
            { len: w, x1: pad, y1: pad, x2: pad, y2: pad + H,
              lx: pad - 16, ly: pad + H / 2 + 5, text: `${w}` }
        ];

        sides.forEach(side => {
            const line = svgEl('line', {
                class: 'manip-side',
                x1: side.x1, y1: side.y1, x2: side.x2, y2: side.y2
            });
            const label = svgEl('text', {
                class: 'manip-side-label',
                x: side.lx, y: side.ly,
                'text-anchor': 'middle'
            });
            label.textContent = side.text;
            // Invisible wide hit line on top of the visible stroke, so a
            // kid's finger doesn't need pixel accuracy.
            const hit = svgEl('line', {
                class: 'manip-side-hit',
                x1: side.x1, y1: side.y1, x2: side.x2, y2: side.y2
            });
            hit.addEventListener('click', () => {
                if (done) return;
                if (line.classList.contains('counted')) return; // already walked
                line.classList.add('counted');
                label.classList.add('pop');
                countedSides++;
                terms.push(side.len);
                updateSum();
                if (countedSides === 4) {
                    done = true;
                    root.classList.add('manip-locked');
                    api.complete(doneMessage);
                }
            });
            svg.appendChild(line);
            svg.appendChild(label);
            svg.appendChild(hit);
        });

        root.appendChild(svg);
        root.appendChild(sumLine);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up.
            }
        };
    }

    // ---------------------------------------------------------------
    // 9. frac-mult-grid — { type:'frac-mult-grid', aNum, aDen, bNum, bDen, done }
    // ---------------------------------------------------------------
    function mountFracMultGrid(container, config, api) {
        const { aNum, aDen, bNum, bDen, done: doneMessage } = config;
        let done = false;
        let shadedRows = 0;

        const W = Math.max(264, aDen * 44);
        const H = Math.max(132, bDen * 44);
        const cellW = W / aDen;
        const cellH = H / bDen;

        const root = el('div', 'manip manip-fmg');
        root.appendChild(el('div', 'manip-fmg-label', `${aNum}/${aDen} shaded across`));

        const svg = svgEl('svg', {
            class: 'manip-fmg-svg',
            viewBox: `0 0 ${W} ${H}`,
            width: '100%'
        });

        const counter = el('div', 'manip-count');

        function updateCounter() {
            counter.textContent = `overlap: ${shadedRows * aNum} of ${aDen * bDen}`;
        }

        // Grid of cells: the first aNum COLUMNS are pre-shaded (first
        // fraction, static); the kid toggles whole ROWS (second fraction).
        // Where a shaded row crosses a shaded column = the product.
        const rowCells = [];
        const rowShaded = new Array(bDen).fill(false);
        for (let r = 0; r < bDen; r++) {
            const cells = [];
            for (let c = 0; c < aDen; c++) {
                const rect = svgEl('rect', {
                    class: c < aNum ? 'manip-fmg-cell col-shaded' : 'manip-fmg-cell',
                    x: (c * cellW).toFixed(1),
                    y: (r * cellH).toFixed(1),
                    width: cellW.toFixed(1),
                    height: cellH.toFixed(1)
                });
                rect.addEventListener('click', () => {
                    if (done) return;
                    const row = rowCells[r];
                    if (rowShaded[r]) {
                        rowShaded[r] = false;
                        row.forEach(cell => cell.classList.remove('row-shaded'));
                        shadedRows--;
                    } else {
                        rowShaded[r] = true;
                        row.forEach(cell => cell.classList.add('row-shaded'));
                        shadedRows++;
                    }
                    updateCounter();
                    if (shadedRows === bNum) {
                        done = true;
                        root.classList.add('manip-locked');
                        api.complete(doneMessage);
                    }
                });
                cells.push(rect);
                svg.appendChild(rect);
            }
            rowCells.push(cells);
        }

        updateCounter();
        root.appendChild(svg);
        root.appendChild(counter);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up.
            }
        };
    }

    // ---------------------------------------------------------------
    // 10. split-wholes — { type:'split-wholes', wholes, per, done }
    // ---------------------------------------------------------------
    function mountSplitWholes(container, config, api) {
        const { wholes, per, done: doneMessage } = config;
        let done = false;
        let splitCount = 0;
        let pieces = 0;

        const root = el('div', 'manip manip-split');
        const counter = el('div', 'manip-count manip-split-count');
        const row = el('div', 'manip-split-row');

        // Pending pulse timers, tracked so destroy() can clear all of them.
        const pulseTimers = new Set();

        function updateCounter() {
            counter.textContent = `${pieces} pieces`;
        }

        function pulseCounter() {
            counter.classList.remove('manip-pulse');
            void counter.offsetWidth; // restart the animation
            counter.classList.add('manip-pulse');
            const timer = setTimeout(() => {
                counter.classList.remove('manip-pulse');
                pulseTimers.delete(timer);
            }, 450);
            pulseTimers.add(timer);
        }

        // One big square per whole; tapping it slices it into `per` equal
        // shaded pieces so the kid can SEE why wholes ÷ 1/per = wholes*per.
        for (let i = 0; i < wholes; i++) {
            const svg = svgEl('svg', {
                class: 'manip-whole-svg',
                viewBox: '0 0 72 72',
                width: 72,
                height: 72
            });
            const face = svgEl('rect', {
                class: 'manip-whole-rect',
                x: 2, y: 2, width: 68, height: 68
            });
            svg.appendChild(face);

            let split = false;
            svg.addEventListener('click', () => {
                if (done) return;
                if (split) return; // already sliced
                split = true;
                svg.classList.add('split');
                const sliceW = 68 / per;
                for (let k = 0; k < per; k++) {
                    svg.appendChild(svgEl('rect', {
                        class: 'manip-whole-slice',
                        x: (2 + k * sliceW).toFixed(1),
                        y: 2,
                        width: sliceW.toFixed(1),
                        height: 68
                    }));
                }
                splitCount++;
                pieces += per;
                updateCounter();
                pulseCounter();
                if (splitCount === wholes) {
                    done = true;
                    root.classList.add('manip-locked');
                    api.complete(doneMessage);
                }
            });
            row.appendChild(svg);
        }

        updateCounter();
        root.appendChild(counter);
        root.appendChild(row);
        container.appendChild(root);

        return {
            destroy() {
                pulseTimers.forEach(t => clearTimeout(t));
                pulseTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 11. clock-adder — { type:'clock-adder', h, m, addMinutes, done }
    // ---------------------------------------------------------------
    function mountClockAdder(container, config, api) {
        const { h, m, addMinutes, done: doneMessage } = config;
        let done = false;
        let elapsed = 0;

        const root = el('div', 'manip manip-clock');

        const svg = svgEl('svg', {
            class: 'clock manip-clock-svg',
            viewBox: '0 0 120 120', width: 170, height: 170,
            role: 'img', 'aria-label': 'analog clock'
        });
        svg.appendChild(svgEl('circle', { cx: 60, cy: 60, r: 56, class: 'clock-face' }));
        for (let i = 0; i < 12; i++) {
            const ang = (i * 30) * Math.PI / 180;
            const nx = 60 + Math.sin(ang) * 44;
            const ny = 60 - Math.cos(ang) * 44;
            const numText = svgEl('text', {
                x: nx.toFixed(1), y: (ny + 4).toFixed(1),
                'text-anchor': 'middle', class: 'clock-num'
            });
            numText.textContent = String(i === 0 ? 12 : i);
            svg.appendChild(numText);
        }
        // Hand endpoints are updated live by render(); start pointing at 12.
        const hourHand = svgEl('line', { x1: 60, y1: 60, x2: 60, y2: 36, class: 'hand hour' });
        const minuteHand = svgEl('line', { x1: 60, y1: 60, x2: 60, y2: 24, class: 'hand minute' });
        svg.appendChild(hourHand);
        svg.appendChild(minuteHand);
        svg.appendChild(svgEl('circle', { cx: 60, cy: 60, r: 3.5, class: 'clock-center' }));

        const readout = el('div', 'manip-clock-readout');
        const counter = el('div', 'manip-count');
        const btnRow = el('div', 'manip-clock-btns');

        // Pending wiggle/pulse timers, tracked so destroy() can clear them.
        const wiggleTimers = new Set();
        const pulseTimers = new Set();

        function wiggle(target) {
            target.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                target.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function pulse(target) {
            target.classList.remove('manip-pulse');
            void target.offsetWidth; // restart the animation
            target.classList.add('manip-pulse');
            const timer = setTimeout(() => {
                target.classList.remove('manip-pulse');
                pulseTimers.delete(timer);
            }, 450);
            pulseTimers.add(timer);
        }

        function currentTime() {
            const total = h * 60 + m + elapsed;
            const mm = total % 60;
            let hh = Math.floor(total / 60) % 12;
            if (hh <= 0) hh += 12; // 1-12, never 0
            return { hh, mm };
        }

        function render() {
            const { hh, mm } = currentTime();
            // Mirrors curriculum.js's clockSVG() hand-angle math exactly.
            const mAng = (mm * 6) * Math.PI / 180;
            const hAng = ((hh % 12) * 30 + mm / 2) * Math.PI / 180;
            const mx = 60 + Math.sin(mAng) * 36, my = 60 - Math.cos(mAng) * 36;
            const hx = 60 + Math.sin(hAng) * 24, hy = 60 - Math.cos(hAng) * 24;
            hourHand.setAttribute('x2', hx.toFixed(1));
            hourHand.setAttribute('y2', hy.toFixed(1));
            minuteHand.setAttribute('x2', mx.toFixed(1));
            minuteHand.setAttribute('y2', my.toFixed(1));
            readout.textContent = `${hh}:${pad2(mm)}`;
            counter.textContent = `+${elapsed} minutes so far`;
        }

        function press(delta, btn) {
            if (done) return;
            const next = elapsed + delta;
            if (next < 0) {
                wiggle(btn);
                return;
            }
            elapsed = next;
            render();
            pulse(readout);
            if (elapsed === addMinutes) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        [
            { text: '+1 hour', delta: 60 },
            { text: '+5 min', delta: 5 },
            { text: '−5 min', delta: -5 },
            { text: '−1 hour', delta: -60 }
        ].forEach(spec => {
            const btn = el('button', 'manip-clock-btn', spec.text);
            btn.type = 'button';
            btn.addEventListener('click', () => press(spec.delta, btn));
            btnRow.appendChild(btn);
        });

        render();
        root.appendChild(svg);
        root.appendChild(readout);
        root.appendChild(counter);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
                pulseTimers.forEach(t => clearTimeout(t));
                pulseTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 12. partial-products — { type:'partial-products', aParts, bParts, done }
    // ---------------------------------------------------------------
    function mountPartialProducts(container, config, api) {
        const { aParts, bParts, done: doneMessage } = config;
        let done = false;
        let revealedCount = 0;
        const totalRegions = aParts.length * bParts.length;

        const root = el('div', 'manip manip-pp');

        const PAD_L = 50, PAD_T = 34, W = 280, H = 200;
        const VW = PAD_L + W + 10, VH = PAD_T + H + 10;

        const svg = svgEl('svg', {
            class: 'manip-pp-svg',
            viewBox: `0 0 ${VW} ${VH}`,
            width: '100%'
        });

        // Column/row sizes are proportional to their value, but floored at
        // ~22% of the total so small parts (e.g. the ones digit) stay
        // tappable. The model is schematic, not to scale.
        function proportionalSizes(parts, total) {
            const sum = parts.reduce((a, b) => a + b, 0);
            const minSize = 0.22 * total;
            const extra = total - parts.length * minSize;
            return parts.map(v => minSize + (v / sum) * extra);
        }

        const colWidths = proportionalSizes(aParts, W);
        const rowHeights = proportionalSizes(bParts, H);

        const colX = [];
        let cx = PAD_L;
        colWidths.forEach(cw => { colX.push(cx); cx += cw; });

        const rowY = [];
        let ry = PAD_T;
        rowHeights.forEach(rh => { rowY.push(ry); ry += rh; });

        // Column labels across the top edge, row labels down the left edge.
        aParts.forEach((val, i) => {
            const label = svgEl('text', {
                class: 'manip-pp-toplabel',
                x: (colX[i] + colWidths[i] / 2).toFixed(1),
                y: (PAD_T - 10).toFixed(1),
                'text-anchor': 'middle'
            });
            label.textContent = String(val);
            svg.appendChild(label);
        });
        bParts.forEach((val, j) => {
            const label = svgEl('text', {
                class: 'manip-pp-sidelabel',
                x: (PAD_L - 10).toFixed(1),
                y: (rowY[j] + rowHeights[j] / 2 + 5).toFixed(1),
                'text-anchor': 'end'
            });
            label.textContent = String(val);
            svg.appendChild(label);
        });

        // Fixed reading order (top-to-bottom, left-to-right) for the final
        // equation line, independent of the order the kid taps regions in.
        const allProducts = [];
        bParts.forEach(bVal => aParts.forEach(aVal => allProducts.push(aVal * bVal)));

        const equation = el('div', 'manip-pp-equation');

        bParts.forEach((bVal, j) => {
            aParts.forEach((aVal, i) => {
                const rect = svgEl('rect', {
                    class: 'manip-pp-region',
                    x: colX[i].toFixed(1), y: rowY[j].toFixed(1),
                    width: colWidths[i].toFixed(1), height: rowHeights[j].toFixed(1)
                });
                const text = svgEl('text', {
                    class: 'manip-pp-text',
                    x: (colX[i] + colWidths[i] / 2).toFixed(1),
                    y: (rowY[j] + rowHeights[j] / 2 + 5).toFixed(1),
                    'text-anchor': 'middle'
                });
                svg.appendChild(rect);
                svg.appendChild(text);

                rect.addEventListener('click', () => {
                    if (done) return;
                    if (rect.classList.contains('revealed')) return; // already revealed
                    rect.classList.add('revealed');
                    text.textContent = `${aVal} × ${bVal} = ${aVal * bVal}`;
                    text.classList.add('manip-pulse');
                    revealedCount++;
                    if (revealedCount === totalRegions) {
                        done = true;
                        const total = allProducts.reduce((a, b) => a + b, 0);
                        equation.textContent = `${allProducts.join(' + ')} = ${total}`;
                        root.appendChild(equation);
                        root.classList.add('manip-locked');
                        api.complete(doneMessage);
                    }
                });
            });
        });

        root.appendChild(svg);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up.
            }
        };
    }

    // ---------------------------------------------------------------
    // 13. place-shift — { type:'place-shift', start, target, done }
    // ---------------------------------------------------------------
    function mountPlaceShift(container, config, api) {
        const { start, target, done: doneMessage } = config;
        let done = false;
        // Kept as an integer count of thousandths so ×10/÷10 never drifts
        // via float error; ÷10 rounds defensively at the extreme edge of
        // the allowed range (see MIN below).
        let value = Math.round(start * 1000);
        const targetValue = Math.round(target * 1000);
        const MIN = 1, MAX = 9999999 * 1000; // real value bounds: 0.001 .. 9,999,999

        const root = el('div', 'manip manip-place');
        const readout = el('div', 'manip-place-readout');
        const trail = el('div', 'manip-place-trail');
        const btnRow = el('div', 'manip-place-btns');

        const wiggleTimers = new Set();
        const pulseTimers = new Set();
        const history = [];

        function wiggle(elm) {
            elm.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function pulse(elm) {
            elm.classList.remove('manip-pulse');
            void elm.offsetWidth; // restart the animation
            elm.classList.add('manip-pulse');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-pulse');
                pulseTimers.delete(timer);
            }, 450);
            pulseTimers.add(timer);
        }

        function format(v) {
            let s = (v / 1000).toFixed(3);
            s = s.replace(/0+$/, '').replace(/\.$/, '');
            return s === '' ? '0' : s;
        }

        function render() {
            readout.textContent = format(value);
            trail.textContent = history.join(' → ');
        }

        history.push(format(value));

        function press(op, btn) {
            if (done) return;
            const candidate = op === 'mul' ? value * 10 : Math.round(value / 10);
            if (candidate > MAX || candidate < MIN) {
                wiggle(btn);
                return;
            }
            value = candidate;
            history.push(format(value));
            if (history.length > 4) history.shift();
            render();
            pulse(readout);
            if (value === targetValue) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        const mulBtn = el('button', 'manip-place-btn', '× 10');
        mulBtn.type = 'button';
        mulBtn.addEventListener('click', () => press('mul', mulBtn));
        const divBtn = el('button', 'manip-place-btn', '÷ 10');
        divBtn.type = 'button';
        divBtn.addEventListener('click', () => press('div', divBtn));
        btnRow.appendChild(mulBtn);
        btnRow.appendChild(divBtn);

        render();
        root.appendChild(readout);
        root.appendChild(trail);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
                pulseTimers.forEach(t => clearTimeout(t));
                pulseTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 14. decimal-build — { type:'decimal-build', startTenths, deltaTenths,
    //                        op:'add'|'sub', done }
    // ---------------------------------------------------------------
    function mountDecimalBuild(container, config, api) {
        const { startTenths, deltaTenths, op, done: doneMessage } = config;
        let done = false;
        let current = startTenths;

        const root = el('div', 'manip manip-decimal');
        const readout = el('div', 'manip-decimal-readout');
        const progress = el('div', 'manip-count');
        const btnRow = el('div', 'manip-decimal-btns');

        const pulseTimers = new Set();

        function pulse(elm) {
            elm.classList.remove('manip-pulse');
            void elm.offsetWidth; // restart the animation
            elm.classList.add('manip-pulse');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-pulse');
                pulseTimers.delete(timer);
            }, 450);
            pulseTimers.add(timer);
        }

        function fmt(tenths) {
            return (tenths / 10).toFixed(1);
        }

        function render() {
            readout.textContent = fmt(current);
            const change = current - startTenths;
            const amount = fmt(Math.abs(change));
            const target = fmt(deltaTenths);
            progress.textContent = op === 'add'
                ? `you've added ${amount} of ${target}`
                : `you've taken away ${amount} of ${target}`;
        }

        function press(delta) {
            if (done) return;
            // Wrong-direction presses are allowed (they're how a kid
            // corrects overshoot); only clamp so the value can't go
            // negative.
            current = Math.max(0, current + delta);
            render();
            pulse(readout);
            const change = current - startTenths;
            if ((op === 'add' && change === deltaTenths) ||
                (op === 'sub' && change === -deltaTenths)) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        [
            { text: '+1', delta: 10, primary: op === 'add' },
            { text: '+0.1', delta: 1, primary: op === 'add' },
            { text: '−0.1', delta: -1, primary: op === 'sub' },
            { text: '−1', delta: -10, primary: op === 'sub' }
        ].forEach(spec => {
            const btn = el('button', spec.primary ? 'manip-decimal-btn manip-decimal-btn-primary' : 'manip-decimal-btn', spec.text);
            btn.type = 'button';
            btn.addEventListener('click', () => press(spec.delta));
            btnRow.appendChild(btn);
        });

        render();
        root.appendChild(readout);
        root.appendChild(progress);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                pulseTimers.forEach(t => clearTimeout(t));
                pulseTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 15. angle-drag — { type:'angle-drag', deg, done }
    // ---------------------------------------------------------------
    function mountAngleDrag(container, config, api) {
        const { deg: targetDeg, done: doneMessage } = config;

        // Vertex/base-ray/target-ray geometry mirrors curriculum.js's
        // angleSVG() exactly; the measuring ray uses a shorter radius so
        // both it and the fixed rays stay visible at once.
        const cx = 78, cy = 100, r = 64, mr = 48, sweepR = 34;
        const VW = 156, VH = 116;

        let done = false;
        let activePointerId = null;
        let currentDeg = 0;

        const root = el('div', 'manip manip-angle');

        const svg = svgEl('svg', {
            class: 'angle-svg manip-angle-svg',
            viewBox: `0 0 ${VW} ${VH}`, width: 195, height: 145
        });
        // Required so touch dragging works without the page hijacking the
        // gesture (scroll, etc.).
        svg.style.touchAction = 'none';

        function pointAt(radius, degrees) {
            const rad = degrees * Math.PI / 180;
            return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
        }

        // Sweep arc (base ray -> measuring ray), drawn first so it sits
        // beneath the rays.
        const sweep = svgEl('path', { class: 'manip-angle-sweep' });
        svg.appendChild(sweep);

        // Fixed base ray (0°).
        const basePt = pointAt(r, 0);
        svg.appendChild(svgEl('line', {
            class: 'angle-ray',
            x1: cx, y1: cy, x2: basePt.x.toFixed(1), y2: basePt.y.toFixed(1)
        }));

        // Fixed target ray — the angle actually being measured, drawn
        // statically since the engine hides curriculum.js's own angleSVG
        // visual whenever a manipulative is mounted.
        const targetPt = pointAt(r, targetDeg);
        svg.appendChild(svgEl('line', {
            class: 'angle-ray',
            x1: cx, y1: cy, x2: targetPt.x.toFixed(1), y2: targetPt.y.toFixed(1)
        }));

        svg.appendChild(svgEl('circle', { cx, cy, r: 3, class: 'angle-vertex' }));

        // Draggable measuring ray, starting on top of the base ray (0°).
        const measurePt0 = pointAt(mr, 0);
        const measureRay = svgEl('line', {
            class: 'manip-angle-measure',
            x1: cx, y1: cy, x2: measurePt0.x.toFixed(1), y2: measurePt0.y.toFixed(1)
        });
        const handle = svgEl('circle', {
            class: 'manip-angle-handle',
            cx: measurePt0.x.toFixed(1), cy: measurePt0.y.toFixed(1), r: 7
        });
        const hit = svgEl('circle', {
            class: 'manip-angle-hit',
            cx: measurePt0.x.toFixed(1), cy: measurePt0.y.toFixed(1), r: 22,
            fill: 'transparent'
        });
        svg.appendChild(measureRay);
        svg.appendChild(handle);
        svg.appendChild(hit);

        const readout = el('div', 'manip-angle-readout');
        const zone = el('div', 'manip-angle-zone');

        function zoneWord(d) {
            return d < 90 ? 'acute' : d === 90 ? 'right' : 'obtuse';
        }

        function setMeasuringAngle(d) {
            currentDeg = d;
            const pt = pointAt(mr, d);
            measureRay.setAttribute('x2', pt.x.toFixed(1));
            measureRay.setAttribute('y2', pt.y.toFixed(1));
            handle.setAttribute('cx', pt.x.toFixed(1));
            handle.setAttribute('cy', pt.y.toFixed(1));
            hit.setAttribute('cx', pt.x.toFixed(1));
            hit.setAttribute('cy', pt.y.toFixed(1));

            const arcPt = pointAt(sweepR, d);
            sweep.setAttribute('d',
                `M ${(cx + sweepR).toFixed(1)} ${cy} A ${sweepR} ${sweepR} 0 0 0 ${arcPt.x.toFixed(1)} ${arcPt.y.toFixed(1)}`);

            readout.textContent = `${d}°`;
            const word = zoneWord(d);
            zone.textContent = word;
            zone.className = `manip-angle-zone manip-angle-zone-${word}`;
        }

        function clientToAngle(clientX, clientY) {
            const rect = svg.getBoundingClientRect();
            const px = (clientX - rect.left) / rect.width * VW;
            const py = (clientY - rect.top) / rect.height * VH;
            const dx = px - cx, dy = cy - py;
            const a = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
            return Math.max(0, Math.min(180, a));
        }

        function onPointerMove(event) {
            if (done) return;
            if (event.pointerId !== activePointerId) return;
            setMeasuringAngle(clientToAngle(event.clientX, event.clientY));
        }

        function endDrag(event) {
            if (event.pointerId !== activePointerId) return;
            const finalDeg = clientToAngle(event.clientX, event.clientY);
            setMeasuringAngle(finalDeg);

            try {
                hit.releasePointerCapture(activePointerId);
            } catch (e) {
                // Ignore — capture may already be released (e.g. after cancel).
            }
            hit.removeEventListener('pointermove', onPointerMove);
            hit.removeEventListener('pointerup', endDrag);
            hit.removeEventListener('pointercancel', endDrag);
            activePointerId = null;

            if (!done && Math.abs(finalDeg - targetDeg) <= 5) {
                setMeasuringAngle(targetDeg);
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        function onPointerDown(event) {
            if (done) return;
            if (activePointerId !== null) return; // ignore other pointers mid-drag
            activePointerId = event.pointerId;
            try {
                hit.setPointerCapture(activePointerId);
            } catch (e) {
                // Some environments may not support capture; drag still
                // works via the listeners below.
            }
            hit.addEventListener('pointermove', onPointerMove);
            hit.addEventListener('pointerup', endDrag);
            hit.addEventListener('pointercancel', endDrag);
            setMeasuringAngle(clientToAngle(event.clientX, event.clientY));
        }

        hit.addEventListener('pointerdown', onPointerDown);

        setMeasuringAngle(0);
        root.appendChild(svg);
        root.appendChild(readout);
        root.appendChild(zone);
        container.appendChild(root);

        return {
            destroy() {
                // Listeners above are attached to `hit`, which lives inside
                // `container` and is discarded by the engine — but clean up
                // defensively in case a drag is mid-flight.
                hit.removeEventListener('pointermove', onPointerMove);
                hit.removeEventListener('pointerup', endDrag);
                hit.removeEventListener('pointercancel', endDrag);
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', endDrag);
                document.removeEventListener('pointercancel', endDrag);
                activePointerId = null;
            }
        };
    }

    // ---------------------------------------------------------------
    // 16. cube-builder — { type:'cube-builder', l, w, h, done }
    // ---------------------------------------------------------------
    function mountCubeBuilder(container, config, api) {
        const { l, w, h, done: doneMessage } = config;
        let done = false;
        let layers = 0;

        // Geometry mirrors curriculum.js's boxSVG() isometric projection.
        const s = 16, L = l * s, H = h * s, D = w * 8;
        const x0 = 26, y0 = 26 + D;
        const VW = L + D + 84, VH = H + D + 60;

        const root = el('div', 'manip manip-cube');
        const svg = svgEl('svg', {
            class: 'box-svg manip-cube-svg',
            viewBox: `0 0 ${VW} ${VH}`, width: '100%'
        });

        // Dashed "ghost" outlines for every layer slot, bottom (index 0)
        // to top (index h-1). Real layers get drawn on top of these and
        // hide the matching ghost.
        const ghosts = [];
        for (let k = 0; k < h; k++) {
            const top = y0 + H - (k + 1) * s;
            const ghost = svgEl('rect', {
                class: 'manip-cube-ghost',
                x: x0, y: top.toFixed(1), width: L, height: s
            });
            ghosts.push(ghost);
            svg.appendChild(ghost);
        }

        const layerGroups = [];
        let topGroup = null;

        function topFacePoint(u, v, top) {
            return { x: x0 + u * L + v * D, y: top - v * D };
        }

        function buildTopGroup(top) {
            // The l×w grid on the current topmost layer's top face —
            // schematic, but reads clearly as "this layer has l×w cubes".
            const g = svgEl('g', { class: 'manip-cube-topgroup' });
            const corners = [
                topFacePoint(0, 0, top), topFacePoint(1, 0, top),
                topFacePoint(1, 1, top), topFacePoint(0, 1, top)
            ];
            g.appendChild(svgEl('polygon', {
                class: 'box-top',
                points: corners.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
            }));
            for (let i = 1; i < l; i++) {
                const a = topFacePoint(i / l, 0, top), b = topFacePoint(i / l, 1, top);
                g.appendChild(svgEl('line', {
                    class: 'manip-cube-top-grid',
                    x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1)
                }));
            }
            for (let j = 1; j < w; j++) {
                const a = topFacePoint(0, j / w, top), b = topFacePoint(1, j / w, top);
                g.appendChild(svgEl('line', {
                    class: 'manip-cube-top-grid',
                    x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1)
                }));
            }
            return g;
        }

        function buildLayerGroup(k) {
            const top = y0 + H - (k + 1) * s;
            const bottom = top + s;
            const g = svgEl('g', { class: 'manip-cube-layer' });
            for (let i = 0; i < l; i++) {
                g.appendChild(svgEl('rect', {
                    class: 'manip-cube-front-cell',
                    x: (x0 + i * s).toFixed(1), y: top.toFixed(1), width: s, height: s
                }));
            }
            g.appendChild(svgEl('polygon', {
                class: 'box-side',
                points: `${(x0 + L).toFixed(1)},${bottom.toFixed(1)} ${(x0 + L + D).toFixed(1)},${(bottom - D).toFixed(1)} ${(x0 + L + D).toFixed(1)},${(top - D).toFixed(1)} ${(x0 + L).toFixed(1)},${top.toFixed(1)}`
            }));
            return g;
        }

        function refreshTopGroup() {
            if (topGroup) {
                svg.removeChild(topGroup);
                topGroup = null;
            }
            if (layers > 0) {
                topGroup = buildTopGroup(y0 + H - layers * s);
                svg.appendChild(topGroup);
            }
        }

        const counter = el('div', 'manip-count');
        const btnRow = el('div', 'manip-cube-btns');
        const wiggleTimers = new Set();

        function wiggle(elm) {
            elm.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function updateCounter() {
            counter.textContent = `${layers} layer${layers === 1 ? '' : 's'} × ${l * w} cubes each = ${layers * l * w} cubes`;
        }

        function addLayer(btn) {
            if (done) return;
            if (layers >= h) {
                wiggle(btn);
                return;
            }
            const g = buildLayerGroup(layers);
            svg.appendChild(g);
            layerGroups.push(g);
            ghosts[layers].style.display = 'none';
            layers++;
            refreshTopGroup();
            updateCounter();
            if (layers === h) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        function removeLayer(btn) {
            if (done) return;
            if (layers <= 0) {
                wiggle(btn);
                return;
            }
            layers--;
            svg.removeChild(layerGroups.pop());
            ghosts[layers].style.display = '';
            refreshTopGroup();
            updateCounter();
        }

        const addBtn = el('button', 'manip-cube-btn', 'Add layer ➕');
        addBtn.type = 'button';
        addBtn.addEventListener('click', () => addLayer(addBtn));
        const removeBtn = el('button', 'manip-cube-btn', 'Remove layer ➖');
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', () => removeLayer(removeBtn));
        btnRow.appendChild(addBtn);
        btnRow.appendChild(removeBtn);

        updateCounter();
        root.appendChild(svg);
        root.appendChild(counter);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 17. coord-walk — { type:'coord-walk', x, y, min?, max?, done }
    //     min/max default to 0/8 (first-quadrant grid, unchanged legacy
    //     rendering). When min < 0, a full four-quadrant plane is drawn
    //     instead, with the walker starting at the origin in the middle.
    // ---------------------------------------------------------------
    function mountCoordWalk(container, config, api) {
        const { x: targetX, y: targetY, done: doneMessage } = config;
        const min = config.min !== undefined ? config.min : 0;
        const max = config.max !== undefined ? config.max : 8;
        const fourQuadrant = min < 0;
        let done = false;
        let wx = 0, wy = 0;

        // Geometry mirrors curriculum.js's coordPlaneSVG() exactly when
        // min/max are omitted (the legacy 0-8 first-quadrant grid).
        const s = 26, n = max - min, pad = 26;
        const size = n * s + pad * 2;

        const root = el('div', 'manip manip-coord');
        const svg = svgEl('svg', {
            class: 'coord-svg manip-coord-svg',
            viewBox: `0 0 ${size} ${size + 6}`, width: '100%'
        });

        function toXY(px, py) {
            return { x: pad + (px - min) * s, y: pad + (max - py) * s };
        }

        for (let i = min; i <= max; i++) {
            const gx = pad + (i - min) * s;
            const gy = pad + (max - i) * s;
            svg.appendChild(svgEl('line', { class: 'cp-grid', x1: gx, y1: pad, x2: gx, y2: pad + n * s }));
            svg.appendChild(svgEl('line', { class: 'cp-grid', x1: pad, y1: gy, x2: pad + n * s, y2: gy }));

            // Legacy grid labels every tick; four-quadrant labels at least
            // min, max, 0, ±1, and every other tick to stay readable.
            const showLabel = !fourQuadrant || i === min || i === max || Math.abs(i) <= 1 || i % 2 === 0;
            if (showLabel) {
                const xl = svgEl('text', { class: 'cp-label', x: gx, y: pad + n * s + 16, 'text-anchor': 'middle' });
                xl.textContent = String(i);
                svg.appendChild(xl);
                const yl = svgEl('text', { class: 'cp-label', x: pad - 10, y: gy + 4, 'text-anchor': 'middle' });
                yl.textContent = String(i);
                svg.appendChild(yl);
            }
        }

        if (fourQuadrant) {
            // Axes cross through the origin in the middle of the plane.
            const zero = toXY(0, 0);
            svg.appendChild(svgEl('line', { class: 'cp-axis', x1: pad, y1: zero.y, x2: pad + n * s, y2: zero.y }));
            svg.appendChild(svgEl('line', { class: 'cp-axis', x1: zero.x, y1: pad, x2: zero.x, y2: pad + n * s }));
        } else {
            svg.appendChild(svgEl('line', { class: 'cp-axis', x1: pad, y1: pad + n * s, x2: pad + n * s, y2: pad + n * s }));
            svg.appendChild(svgEl('line', { class: 'cp-axis', x1: pad, y1: pad, x2: pad, y2: pad + n * s }));
        }

        // Target point: prominent, fixed.
        const targetPos = toXY(targetX, targetY);
        svg.appendChild(svgEl('circle', {
            class: 'cp-point manip-coord-target',
            cx: targetPos.x.toFixed(1), cy: targetPos.y.toFixed(1), r: 8
        }));

        const crumbLayer = svgEl('g', { class: 'manip-coord-crumbs' });
        svg.appendChild(crumbLayer);
        const crumbSeen = new Set();

        function dropCrumb(px, py) {
            const key = `${px},${py}`;
            if (crumbSeen.has(key)) return;
            crumbSeen.add(key);
            const pos = toXY(px, py);
            crumbLayer.appendChild(svgEl('circle', {
                class: 'manip-coord-crumb',
                cx: pos.x.toFixed(1), cy: pos.y.toFixed(1), r: 4
            }));
        }

        const walkerPos0 = toXY(0, 0);
        const walker = svgEl('text', {
            class: 'manip-coord-walker',
            x: walkerPos0.x.toFixed(1), y: (walkerPos0.y + 6).toFixed(1),
            'text-anchor': 'middle'
        });
        walker.textContent = '\u{1F680}'; // 🚀
        svg.appendChild(walker);

        const readout = el('div', 'manip-coord-readout');
        const btnRow = el('div', 'manip-coord-btns');
        const wiggleTimers = new Set();

        function wiggle(elm) {
            elm.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function render() {
            const pos = toXY(wx, wy);
            walker.setAttribute('x', pos.x.toFixed(1));
            walker.setAttribute('y', (pos.y + 6).toFixed(1));
            readout.textContent = `over: ${wx} · up: ${wy}`;
        }

        function move(dx, dy, btn) {
            if (done) return;
            const nx = wx + dx, ny = wy + dy;
            if (nx < min || nx > max || ny < min || ny > max) {
                wiggle(btn);
                return;
            }
            wx = nx; wy = ny;
            dropCrumb(wx, wy);
            render();
            if (wx === targetX && wy === targetY) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        [
            { text: '⬆️', dx: 0, dy: 1, cls: 'manip-coord-up' },
            { text: '⬅️', dx: -1, dy: 0, cls: 'manip-coord-left' },
            { text: '➡️', dx: 1, dy: 0, cls: 'manip-coord-right' },
            { text: '⬇️', dx: 0, dy: -1, cls: 'manip-coord-down' }
        ].forEach(spec => {
            const btn = el('button', `manip-coord-btn ${spec.cls}`, spec.text);
            btn.type = 'button';
            btn.addEventListener('click', () => move(spec.dx, spec.dy, btn));
            btnRow.appendChild(btn);
        });

        render();
        root.appendChild(svg);
        root.appendChild(readout);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 18. ratio-groups — { type:'ratio-groups', a, b, k, iconA, iconB, done }
    // ---------------------------------------------------------------
    function mountRatioGroups(container, config, api) {
        const { a, b, k, iconA, iconB, done: doneMessage } = config;
        let done = false;
        let groups = 0;

        const root = el('div', 'manip manip-ratio');
        const countersRow = el('div', 'manip-ratio-counters');
        const counterA = el('div', 'manip-count', `${iconA} × 0`);
        const counterB = el('div', 'manip-count', `${iconB} × 0`);
        countersRow.appendChild(counterA);
        countersRow.appendChild(counterB);

        const clustersWrap = el('div', 'manip-ratio-clusters');
        const btnRow = el('div', 'manip-ratio-btns');
        const clusters = [];

        const wiggleTimers = new Set();

        function wiggle(elm) {
            elm.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function updateCounters() {
            counterA.textContent = `${iconA} × ${a * groups}`;
            counterB.textContent = `${iconB} × ${b * groups}`;
        }

        function addGroup(btn) {
            if (done) return;
            if (groups >= k) {
                wiggle(btn);
                return;
            }
            const cluster = el('div', 'manip-ratio-cluster');
            for (let i = 0; i < a; i++) cluster.appendChild(el('span', 'manip-chip', iconA));
            for (let i = 0; i < b; i++) cluster.appendChild(el('span', 'manip-chip', iconB));
            clustersWrap.appendChild(cluster);
            clusters.push(cluster);
            groups++;
            updateCounters();
            if (groups === k) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        function removeGroup(btn) {
            if (done) return;
            if (groups <= 0) {
                wiggle(btn);
                return;
            }
            groups--;
            clustersWrap.removeChild(clusters.pop());
            updateCounters();
        }

        const addBtn = el('button', 'manip-ratio-btn', 'Add a group ➕');
        addBtn.type = 'button';
        addBtn.addEventListener('click', () => addGroup(addBtn));
        const removeBtn = el('button', 'manip-ratio-btn', 'Remove a group ➖');
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', () => removeGroup(removeBtn));
        btnRow.appendChild(addBtn);
        btnRow.appendChild(removeBtn);

        root.appendChild(countersRow);
        root.appendChild(clustersWrap);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 19. percent-bar — { type:'percent-bar', base, percent, mode:'of'|'off', done }
    // ---------------------------------------------------------------
    function mountPercentBar(container, config, api) {
        const { base, percent, mode, done: doneMessage } = config;
        let done = false;
        let count = 0;
        const target = percent / 10;
        const segValue = base / 10;

        const W = 360, H = 60, LABEL_H = 30;
        const partWidth = W / 10;
        const rectY = 6;

        const root = el('div', 'manip manip-pctbar');
        const svg = svgEl('svg', {
            class: 'manip-pctbar-svg',
            viewBox: `0 0 ${W} ${H + LABEL_H}`,
            width: '100%'
        });
        const readout = el('div', 'manip-pctbar-readout');

        function formatValue(v) {
            if (Number.isInteger(v)) return String(v);
            return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
        }

        const segs = [];
        for (let i = 0; i < 10; i++) {
            const x = i * partWidth;
            const rect = svgEl('rect', {
                class: 'manip-pctbar-seg',
                x: x.toFixed(1), y: rectY, width: partWidth.toFixed(1), height: H
            });
            const label = svgEl('text', {
                class: 'manip-pctbar-val',
                x: (x + partWidth / 2).toFixed(1), y: (rectY + H + 18).toFixed(1),
                'text-anchor': 'middle'
            });
            label.textContent = formatValue(segValue);
            svg.appendChild(rect);
            svg.appendChild(label);

            if (mode === 'off') {
                svg.appendChild(svgEl('line', {
                    class: 'manip-pctbar-x',
                    x1: (x + 8).toFixed(1), y1: (rectY + 8).toFixed(1),
                    x2: (x + partWidth - 8).toFixed(1), y2: (rectY + H - 8).toFixed(1)
                }));
                svg.appendChild(svgEl('line', {
                    class: 'manip-pctbar-x',
                    x1: (x + 8).toFixed(1), y1: (rectY + H - 8).toFixed(1),
                    x2: (x + partWidth - 8).toFixed(1), y2: (rectY + 8).toFixed(1)
                }));
            }

            rect.addEventListener('click', () => {
                if (done) return;
                if (mode === 'of') {
                    if (rect.classList.contains('shaded')) {
                        rect.classList.remove('shaded');
                        count--;
                    } else {
                        rect.classList.add('shaded');
                        count++;
                    }
                } else {
                    if (rect.classList.contains('crossed')) {
                        rect.classList.remove('crossed');
                        count--;
                    } else {
                        rect.classList.add('crossed');
                        count++;
                    }
                    updateRemaining();
                }
                updateReadout();
                if (count === target) {
                    done = true;
                    root.classList.add('manip-locked');
                    api.complete(doneMessage);
                }
            });
            segs.push(rect);
        }

        function updateRemaining() {
            segs.forEach(r => {
                if (r.classList.contains('crossed')) {
                    r.classList.remove('manip-pctbar-remaining');
                } else {
                    r.classList.add('manip-pctbar-remaining');
                }
            });
        }

        function updateReadout() {
            if (mode === 'of') {
                const value = count * segValue;
                readout.textContent = `${count * 10}% shaded = ${formatValue(value)}`;
            } else {
                const takeAway = count * segValue;
                const leaving = base - takeAway;
                readout.textContent = `${count * 10}% off — take away ${formatValue(takeAway)}, leaving ${formatValue(leaving)}`;
            }
        }

        if (mode === 'off') updateRemaining();
        updateReadout();
        root.appendChild(svg);
        root.appendChild(readout);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up.
            }
        };
    }

    // ---------------------------------------------------------------
    // 20. tap-line — { type:'tap-line', min, max, targets:[{value,label}], done }
    // ---------------------------------------------------------------
    function mountTapLine(container, config, api) {
        const { min, max, targets, done: doneMessage } = config;
        let done = false;
        let targetIdx = 0;

        const x0 = 20, x1 = 300, y = 40;
        const VW = 320, VH = 90;

        const root = el('div', 'manip manip-tapline');
        const prompt = el('div', 'manip-tapline-prompt');
        const svg = svgEl('svg', {
            class: 'manip-tapline-svg',
            viewBox: `0 0 ${VW} ${VH}`,
            width: '100%'
        });

        function tickX(v) {
            return x0 + (x1 - x0) * (v - min) / (max - min);
        }

        svg.appendChild(svgEl('line', {
            class: 'manip-tapline-baseline',
            x1: x0, y1: y, x2: x1, y2: y
        }));

        const ghost = svgEl('circle', { class: 'manip-tapline-ghost', cx: x0, cy: y, r: 8 });
        ghost.style.visibility = 'hidden';

        const wiggleTimers = new Set();

        for (let v = min; v <= max; v++) {
            const tx = tickX(v);
            const isZero = v === 0;
            svg.appendChild(svgEl('line', {
                class: isZero ? 'manip-tapline-tick manip-tapline-tick-zero' : 'manip-tapline-tick',
                x1: tx.toFixed(1), y1: (y - (isZero ? 14 : 8)).toFixed(1),
                x2: tx.toFixed(1), y2: (y + (isZero ? 14 : 8)).toFixed(1)
            }));

            if (v === 0 || v === min || v === max || v % 5 === 0) {
                const label = svgEl('text', {
                    class: 'manip-tapline-label',
                    x: tx.toFixed(1), y: (y + 26).toFixed(1),
                    'text-anchor': 'middle'
                });
                label.textContent = String(v);
                svg.appendChild(label);
            }

            const hit = svgEl('rect', {
                class: 'manip-tapline-hit',
                x: (tx - 11).toFixed(1), y: (y - 24).toFixed(1),
                width: 22, height: 48,
                fill: 'transparent'
            });
            hit.addEventListener('click', () => {
                if (done) return;
                if (hit.dataset.placed === '1') return;
                const cur = targets[targetIdx];
                if (v === cur.value) {
                    hit.dataset.placed = '1';
                    const dot = svgEl('circle', {
                        class: 'manip-tapline-dot',
                        cx: tx.toFixed(1), cy: y, r: 7
                    });
                    const lbl = svgEl('text', {
                        class: 'manip-tapline-dot-label',
                        x: tx.toFixed(1), y: (y - 16).toFixed(1),
                        'text-anchor': 'middle'
                    });
                    lbl.textContent = cur.label;
                    svg.appendChild(dot);
                    svg.appendChild(lbl);
                    targetIdx++;
                    if (targetIdx >= targets.length) {
                        done = true;
                        root.classList.add('manip-locked');
                        api.complete(doneMessage);
                    } else {
                        updatePrompt();
                    }
                } else {
                    ghost.setAttribute('cx', tx.toFixed(1));
                    ghost.style.visibility = 'visible';
                    ghost.classList.add('manip-wiggle');
                    const timer = setTimeout(() => {
                        ghost.style.visibility = 'hidden';
                        ghost.classList.remove('manip-wiggle');
                        wiggleTimers.delete(timer);
                    }, 500);
                    wiggleTimers.add(timer);
                }
            });
            svg.appendChild(hit);
        }
        svg.appendChild(ghost);

        function updatePrompt() {
            prompt.textContent = `Place: ${targets[targetIdx].label}`;
        }
        updatePrompt();

        root.appendChild(prompt);
        root.appendChild(svg);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 21. int-walk — { type:'int-walk', min, max, start, target, done }
    // ---------------------------------------------------------------
    function mountIntWalk(container, config, api) {
        const { min, max, start, target, done: doneMessage } = config;
        let done = false;
        let pos = start;
        let steps = 0;

        const x0 = 20, x1 = 300, y = 40;
        const VW = 320, VH = 90;

        const root = el('div', 'manip manip-intwalk');
        const svg = svgEl('svg', {
            class: 'manip-intwalk-svg',
            viewBox: `0 0 ${VW} ${VH}`,
            width: '100%'
        });

        function tickX(v) {
            return x0 + (x1 - x0) * (v - min) / (max - min);
        }

        svg.appendChild(svgEl('line', {
            class: 'manip-intwalk-baseline',
            x1: x0, y1: y, x2: x1, y2: y
        }));

        for (let v = min; v <= max; v++) {
            const tx = tickX(v);
            const isZero = v === 0;
            svg.appendChild(svgEl('line', {
                class: isZero ? 'manip-intwalk-tick manip-intwalk-tick-zero' : 'manip-intwalk-tick',
                x1: tx.toFixed(1), y1: (y - (isZero ? 14 : 8)).toFixed(1),
                x2: tx.toFixed(1), y2: (y + (isZero ? 14 : 8)).toFixed(1)
            }));
            if (v === 0 || v === min || v === max || v % 5 === 0) {
                const label = svgEl('text', {
                    class: 'manip-intwalk-label',
                    x: tx.toFixed(1), y: (y + 26).toFixed(1),
                    'text-anchor': 'middle'
                });
                label.textContent = String(v);
                svg.appendChild(label);
            }
        }

        const crumbLayer = svgEl('g', { class: 'manip-intwalk-crumbs' });
        svg.appendChild(crumbLayer);
        const crumbSeen = new Set();

        function dropCrumb(v) {
            if (crumbSeen.has(v)) return;
            crumbSeen.add(v);
            crumbLayer.appendChild(svgEl('circle', {
                class: 'manip-intwalk-crumb',
                cx: tickX(v).toFixed(1), cy: y, r: 3
            }));
        }

        const startLabel = svgEl('text', {
            class: 'manip-intwalk-startlabel',
            x: tickX(start).toFixed(1), y: (y - 16).toFixed(1),
            'text-anchor': 'middle'
        });
        startLabel.textContent = 'start';
        svg.appendChild(startLabel);

        const marker = svgEl('circle', {
            class: 'manip-intwalk-marker',
            cx: tickX(start).toFixed(1), cy: y, r: 8
        });
        svg.appendChild(marker);

        dropCrumb(start);

        const counter = el('div', 'manip-count');
        const btnRow = el('div', 'manip-intwalk-btns');
        const wiggleTimers = new Set();

        function wiggle(elm) {
            elm.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function updateCounter() {
            counter.textContent = `steps taken: ${steps}`;
        }

        function move(delta, btn) {
            if (done) return;
            const next = pos + delta;
            if (next < min || next > max) {
                wiggle(btn);
                return;
            }
            pos = next;
            steps++;
            marker.setAttribute('cx', tickX(pos).toFixed(1));
            dropCrumb(pos);
            updateCounter();
            if (pos === target) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        const leftBtn = el('button', 'manip-intwalk-btn', '⬅️ 1 step');
        leftBtn.type = 'button';
        leftBtn.addEventListener('click', () => move(-1, leftBtn));
        const rightBtn = el('button', 'manip-intwalk-btn', '1 step ➡️');
        rightBtn.type = 'button';
        rightBtn.addEventListener('click', () => move(1, rightBtn));
        btnRow.appendChild(leftBtn);
        btnRow.appendChild(rightBtn);

        updateCounter();
        root.appendChild(svg);
        root.appendChild(counter);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 22. tap-count — { type:'tap-count', groups:[{label?, chips:[{text,target}]}],
    //                    separator?, done }
    // ---------------------------------------------------------------
    function mountTapCount(container, config, api) {
        const { groups, separator, done: doneMessage } = config;
        let done = false;
        let count = 0;
        let remaining = 0;
        groups.forEach(g => g.chips.forEach(c => { if (c.target) remaining++; }));

        const root = el('div', 'manip manip-tapcount');
        const counter = el('div', 'manip-count', '0');
        const row = el('div', 'manip-tapcount-row');

        const wiggleTimers = new Set();

        function wiggle(elm) {
            elm.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function updateCounter() {
            counter.textContent = String(count);
        }

        groups.forEach((g, gi) => {
            if (gi > 0 && separator) {
                row.appendChild(el('div', 'manip-tapcount-sep', separator));
            }
            const cluster = el('div', 'manip-tapcount-cluster');
            if (g.label) {
                cluster.appendChild(el('div', 'manip-tapcount-label', g.label));
            }
            const chipsWrap = el('div', 'manip-tapcount-chips');
            g.chips.forEach(chipSpec => {
                const chip = el('button', 'manip-tapcount-chip', chipSpec.text);
                chip.type = 'button';
                chip.addEventListener('click', () => {
                    if (done) return;
                    if (chip.classList.contains('counted')) return;
                    if (chipSpec.target) {
                        chip.classList.add('counted');
                        count++;
                        remaining--;
                        updateCounter();
                        if (remaining === 0) {
                            done = true;
                            root.classList.add('manip-locked');
                            api.complete(doneMessage);
                        }
                    } else {
                        wiggle(chip);
                    }
                });
                chipsWrap.appendChild(chip);
            });
            cluster.appendChild(chipsWrap);
            row.appendChild(cluster);
        });

        root.appendChild(counter);
        root.appendChild(row);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 23. square-builder — { type:'square-builder', n, done }
    // ---------------------------------------------------------------
    function mountSquareBuilder(container, config, api) {
        const { n, done: doneMessage } = config;
        let done = false;
        let k = 1;

        const CELL = 28, MAX_K = 10;
        const W = CELL * MAX_K, H = CELL * MAX_K;

        const root = el('div', 'manip manip-square');
        const svg = svgEl('svg', {
            class: 'manip-square-svg',
            viewBox: `0 0 ${W} ${H}`,
            width: '100%'
        });
        const readout = el('div', 'manip-count manip-square-readout');
        const btnRow = el('div', 'manip-square-btns');

        const wiggleTimers = new Set();

        function wiggle(elm) {
            elm.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function render() {
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            const side = k * CELL;
            const offsetX = (W - side) / 2;
            const offsetY = (H - side) / 2;
            for (let r = 0; r < k; r++) {
                for (let c = 0; c < k; c++) {
                    svg.appendChild(svgEl('rect', {
                        class: 'manip-square-cell',
                        x: (offsetX + c * CELL).toFixed(1), y: (offsetY + r * CELL).toFixed(1),
                        width: CELL, height: CELL
                    }));
                }
            }
            readout.textContent = `${k} × ${k} = ${k * k}`;
        }

        function press(delta, btn) {
            if (done) return;
            const next = k + delta;
            if (next < 1 || next > MAX_K) {
                wiggle(btn);
                return;
            }
            k = next;
            render();
            if (k * k === n) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        const biggerBtn = el('button', 'manip-square-btn', 'Bigger ➕');
        biggerBtn.type = 'button';
        biggerBtn.addEventListener('click', () => press(1, biggerBtn));
        const smallerBtn = el('button', 'manip-square-btn', 'Smaller ➖');
        smallerBtn.type = 'button';
        smallerBtn.addEventListener('click', () => press(-1, smallerBtn));
        btnRow.appendChild(biggerBtn);
        btnRow.appendChild(smallerBtn);

        render();
        root.appendChild(svg);
        root.appendChild(readout);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 24. row-stack — { type:'row-stack', cols, rows, done }
    // ---------------------------------------------------------------
    function mountRowStack(container, config, api) {
        const { cols, rows, done: doneMessage } = config;
        let done = false;
        let r = 0;

        const CELL = 28;
        const W = cols * CELL, H = rows * CELL;

        const root = el('div', 'manip manip-rowstack');
        const svg = svgEl('svg', {
            class: 'manip-rowstack-svg',
            viewBox: `0 0 ${W} ${H}`,
            width: '100%'
        });

        svg.appendChild(svgEl('rect', {
            class: 'manip-rowstack-ghost',
            x: 0, y: 0, width: W, height: H
        }));

        const rowGroups = [];

        function buildRow(rowIndex) {
            // Fills bottom-up: rowIndex 0 sits on the baseline.
            const y = H - (rowIndex + 1) * CELL;
            const g = svgEl('g', { class: 'manip-rowstack-row' });
            for (let c = 0; c < cols; c++) {
                g.appendChild(svgEl('rect', {
                    class: 'manip-rowstack-cell',
                    x: (c * CELL).toFixed(1), y: y.toFixed(1), width: CELL, height: CELL
                }));
            }
            return g;
        }

        const counter = el('div', 'manip-count');
        const btnRow = el('div', 'manip-rowstack-btns');
        const wiggleTimers = new Set();

        function wiggle(elm) {
            elm.classList.add('manip-wiggle');
            const timer = setTimeout(() => {
                elm.classList.remove('manip-wiggle');
                wiggleTimers.delete(timer);
            }, 500);
            wiggleTimers.add(timer);
        }

        function updateCounter() {
            counter.textContent = `${r} rows × ${cols} = ${r * cols} square units`;
        }

        function addRow(btn) {
            if (done) return;
            if (r >= rows) {
                wiggle(btn);
                return;
            }
            const g = buildRow(r);
            svg.appendChild(g);
            rowGroups.push(g);
            r++;
            updateCounter();
            if (r === rows) {
                done = true;
                root.classList.add('manip-locked');
                api.complete(doneMessage);
            }
        }

        function removeRow(btn) {
            if (done) return;
            if (r <= 0) {
                wiggle(btn);
                return;
            }
            r--;
            svg.removeChild(rowGroups.pop());
            updateCounter();
        }

        const addBtn = el('button', 'manip-rowstack-btn', 'Add a row ➕');
        addBtn.type = 'button';
        addBtn.addEventListener('click', () => addRow(addBtn));
        const removeBtn = el('button', 'manip-rowstack-btn', 'Remove a row ➖');
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', () => removeRow(removeBtn));
        btnRow.appendChild(addBtn);
        btnRow.appendChild(removeBtn);

        updateCounter();
        root.appendChild(svg);
        root.appendChild(counter);
        root.appendChild(btnRow);
        container.appendChild(root);

        return {
            destroy() {
                wiggleTimers.forEach(t => clearTimeout(t));
                wiggleTimers.clear();
            }
        };
    }

    // ---------------------------------------------------------------
    // 25. group-check — { type:'group-check', a, b, options, correct, done }
    // ---------------------------------------------------------------
    function mountGroupCheck(container, config, api) {
        const { a, b, options, correct, done: doneMessage } = config;
        let done = false;

        const root = el('div', 'manip manip-groupcheck');

        const rowA = el('div', 'manip-groupcheck-row');
        rowA.appendChild(el('div', 'manip-groupcheck-label', `${a} chips`));
        const chipsA = el('div', 'manip-groupcheck-chips');
        rowA.appendChild(chipsA);

        const rowB = el('div', 'manip-groupcheck-row');
        rowB.appendChild(el('div', 'manip-groupcheck-label', `${b} chips`));
        const chipsB = el('div', 'manip-groupcheck-chips');
        rowB.appendChild(chipsB);

        const optRow = el('div', 'manip-groupcheck-opts');
        const status = el('div', 'manip-groupcheck-status');

        function renderChips(wrap, total, k) {
            while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
            if (!k) {
                for (let i = 0; i < total; i++) {
                    wrap.appendChild(el('span', 'manip-groupcheck-chip', '●'));
                }
                return;
            }
            const numGroups = Math.floor(total / k);
            const leftover = total % k;
            for (let g = 0; g < numGroups; g++) {
                const cluster = el('span', 'manip-groupcheck-cluster');
                for (let i = 0; i < k; i++) {
                    cluster.appendChild(el('span', 'manip-groupcheck-chip', '●'));
                }
                wrap.appendChild(cluster);
            }
            for (let i = 0; i < leftover; i++) {
                wrap.appendChild(el('span', 'manip-groupcheck-chip manip-groupcheck-leftover', '●'));
            }
        }

        renderChips(chipsA, a, null);
        renderChips(chipsB, b, null);

        options.forEach(k => {
            const btn = el('button', 'manip-groupcheck-btn', `Groups of ${k}`);
            btn.type = 'button';
            btn.addEventListener('click', () => {
                if (done) return;
                renderChips(chipsA, a, k);
                renderChips(chipsB, b, k);
                if (a % k === 0 && b % k === 0) {
                    status.textContent = `✓ Groups of ${k} work for both! …but is it the BIGGEST that works?`;
                    status.className = 'manip-groupcheck-status manip-groupcheck-status-ok';
                } else {
                    status.textContent = `✗ Groups of ${k} leave leftovers.`;
                    status.className = 'manip-groupcheck-status manip-groupcheck-status-bad';
                }
                if (k === correct) {
                    done = true;
                    root.classList.add('manip-locked');
                    api.complete(doneMessage);
                }
            });
            optRow.appendChild(btn);
        });

        root.appendChild(rowA);
        root.appendChild(rowB);
        root.appendChild(optRow);
        root.appendChild(status);
        container.appendChild(root);

        return {
            destroy() {
                // No document-level listeners or timers to clean up.
            }
        };
    }

    window.Manipulatives = {
        'build-array': { mount: mountBuildArray },
        'share-groups': { mount: mountShareGroups },
        'shade-fraction': { mount: mountShadeFraction },
        'number-line': { mount: mountNumberLine },
        'compare-bars': { mount: mountCompareBars },
        'equiv-bars': { mount: mountEquivBars },
        'shade-two': { mount: mountShadeTwo },
        'trace-sides': { mount: mountTraceSides },
        'frac-mult-grid': { mount: mountFracMultGrid },
        'split-wholes': { mount: mountSplitWholes },
        'clock-adder': { mount: mountClockAdder },
        'partial-products': { mount: mountPartialProducts },
        'place-shift': { mount: mountPlaceShift },
        'decimal-build': { mount: mountDecimalBuild },
        'angle-drag': { mount: mountAngleDrag },
        'cube-builder': { mount: mountCubeBuilder },
        'coord-walk': { mount: mountCoordWalk },
        'ratio-groups': { mount: mountRatioGroups },
        'percent-bar': { mount: mountPercentBar },
        'tap-line': { mount: mountTapLine },
        'int-walk': { mount: mountIntWalk },
        'tap-count': { mount: mountTapCount },
        'square-builder': { mount: mountSquareBuilder },
        'row-stack': { mount: mountRowStack },
        'group-check': { mount: mountGroupCheck }
    };
})();
