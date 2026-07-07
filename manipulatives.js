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
        const { total, groups, icon, done: doneMessage } = config;
        const fairShare = total / groups;
        let done = false;
        let poolCount = total;

        const root = el('div', 'manip manip-share');
        const pool = el('div', 'manip-pool');
        const platesWrap = el('div', 'manip-plates');

        // Pending wiggle timers, tracked so destroy() can clear all of them.
        const wiggleTimers = new Set();

        const poolChips = [];
        for (let i = 0; i < total; i++) {
            const chip = el('span', 'manip-chip', icon);
            poolChips.push(chip);
            pool.appendChild(chip);
        }

        const plateItemCounts = new Array(groups).fill(0);
        const plateEls = [];
        const plateItemsEls = [];

        function checkComplete() {
            if (done) return;
            if (poolCount === 0 && plateItemCounts.every(c => c === fairShare)) {
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
                    }
                } else if (poolCount > 0) {
                    // Deal one item from the pool onto this plate.
                    const chip = pool.lastElementChild;
                    if (chip) {
                        pool.removeChild(chip);
                        itemsWrap.appendChild(chip);
                        plateItemCounts[idx]++;
                        poolCount--;
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

    window.Manipulatives = {
        'build-array': { mount: mountBuildArray },
        'share-groups': { mount: mountShareGroups },
        'shade-fraction': { mount: mountShadeFraction },
        'number-line': { mount: mountNumberLine }
    };
})();
