// Super Mario Math World - NC 1st Grade Math Standards Implementation

class MarioMath {
    constructor() {
        this.starCount = 0;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentAnswer = null;
        this.selectedStrategy = null;
        this.problemHistory = [];

        this.encouragements = {
            correct: [
                "🌟 Wahoo! You got it! Let's-a-go!",
                "⭐ Super! You're a math champion!",
                "🍄 Mamma mia! That's-a perfect!",
                "🎉 Excellent! You earned a star!",
                "💫 Amazing! Mario would be proud!",
                "🏆 Outstanding! You're a Super Star!"
            ],
            incorrect: [
                "💪 Not quite! Try again, you can do it!",
                "🌟 Good try! Use a power-up (hint) if you need help!",
                "⭐ Almost there! Jump to it and try once more!",
                "🚀 Keep going! Every great plumber started somewhere!"
            ]
        };

        this.init();
    }

    init() {
        this.setupMarioEventListeners();
    }

    setupMarioEventListeners() {
        // Main Mario button
        const marioModeBtn = document.getElementById('mario-mode-btn');
        if (marioModeBtn) {
            marioModeBtn.addEventListener('click', () => {
                this.showMarioCategories();
            });
        }

        // Category selection
        document.querySelectorAll('.mario-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.startCategory(category);
            });
        });

        // Back buttons
        const marioBackBtn = document.getElementById('mario-back-btn');
        if (marioBackBtn) {
            marioBackBtn.addEventListener('click', () => {
                this.showStartScreen();
            });
        }

        const marioCategoryBackBtn = document.getElementById('mario-category-back-btn');
        if (marioCategoryBackBtn) {
            marioCategoryBackBtn.addEventListener('click', () => {
                this.showMarioCategories();
            });
        }

        // Answer submission
        const marioCheckBtn = document.getElementById('mario-check-btn');
        if (marioCheckBtn) {
            marioCheckBtn.addEventListener('click', () => {
                this.checkMarioAnswer();
            });
        }

        const marioAnswerInput = document.getElementById('mario-answer');
        if (marioAnswerInput) {
            marioAnswerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkMarioAnswer();
                }
            });
        }

        // Strategy selection
        document.querySelectorAll('.mario-strategy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectStrategy(e.target.dataset.strategy);
            });
        });

        // Problem controls
        const marioHintBtn = document.getElementById('mario-hint-btn');
        if (marioHintBtn) {
            marioHintBtn.addEventListener('click', () => {
                this.showMarioHint();
            });
        }

        const marioSkipBtn = document.getElementById('mario-skip-btn');
        if (marioSkipBtn) {
            marioSkipBtn.addEventListener('click', () => {
                this.skipMarioProblem();
            });
        }

        const marioNextBtn = document.getElementById('mario-next-btn');
        if (marioNextBtn) {
            marioNextBtn.addEventListener('click', () => {
                this.generateNewProblem();
            });
        }
    }

    showStartScreen() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('start-screen').classList.add('active');
    }

    showMarioCategories() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('mario-category-screen').classList.add('active');
        this.updateStarDisplay();
    }

    startCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('mario-problem-screen').classList.add('active');
        this.generateNewProblem();
    }

    generateNewProblem() {
        this.selectedStrategy = null;
        document.querySelectorAll('.mario-strategy-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        document.getElementById('mario-answer').value = '';
        document.getElementById('mario-feedback').textContent = '';
        document.getElementById('mario-feedback').className = 'mario-feedback';
        document.getElementById('mario-next-btn').style.display = 'none';
        document.getElementById('mario-check-btn').style.display = 'inline-block';
        document.getElementById('mario-answer').disabled = false;

        let problem;
        switch(this.currentCategory) {
            case 'operations':
                problem = this.generateOperationsProblem();
                break;
            case 'place-value':
                problem = this.generatePlaceValueProblem();
                break;
            case 'measurement':
                problem = this.generateMeasurementProblem();
                break;
            case 'geometry':
                problem = this.generateGeometryProblem();
                break;
            default:
                problem = this.generateOperationsProblem();
        }

        this.currentProblem = problem;
        this.currentAnswer = problem.answer;
        this.displayProblem(problem);
    }

    // ============================================
    // NC.1.OA - OPERATIONS AND ALGEBRAIC THINKING
    // ============================================

    generateOperationsProblem() {
        const problemTypes = [
            'add-to-change-unknown',
            'put-together-addend-unknown',
            'compare-difference-unknown',
            'add-three-numbers',
            'subtraction-within-20'
        ];

        const type = problemTypes[Math.floor(Math.random() * problemTypes.length)];

        switch(type) {
            case 'add-to-change-unknown':
                return this.generateAddToChangeUnknown();
            case 'put-together-addend-unknown':
                return this.generatePutTogetherAddendUnknown();
            case 'compare-difference-unknown':
                return this.generateCompareDifferenceUnknown();
            case 'add-three-numbers':
                return this.generateAddThreeNumbers();
            case 'subtraction-within-20':
                return this.generateSubtractionWithin20();
            default:
                return this.generateAddToChangeUnknown();
        }
    }

    generateAddToChangeUnknown() {
        const start = this.getRandomInt(5, 12);
        const total = this.getRandomInt(start + 3, 20);
        const change = total - start;

        const scenarios = [
            {
                text: `Mario collected ${start} coins in World 1. He found more coins and now has ${total} coins total. How many more coins did Mario find?`,
                visual: this.createCoinsVisual(start, total)
            },
            {
                text: `Luigi had ${start} power-up mushrooms. He found some more and now has ${total} mushrooms. How many mushrooms did Luigi find?`,
                visual: this.createMushroomsVisual(start, change)
            }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        return {
            standard: 'NC.1.OA.1',
            text: scenario.text,
            answer: change,
            visual: scenario.visual,
            hint: `Start with ${start}. Count up to ${total}. How many did you add?`,
            showStrategy: true,
            type: 'add-to-change-unknown'
        };
    }

    generatePutTogetherAddendUnknown() {
        const total = this.getRandomInt(10, 18);
        const known = this.getRandomInt(4, total - 3);
        const unknown = total - known;

        return {
            standard: 'NC.1.OA.1',
            text: `There are ${total} blocks in the level. ${known} are brick blocks and the rest are question blocks. How many question blocks are there?`,
            answer: unknown,
            visual: this.createBlocksVisual(known, unknown),
            hint: `You have ${total} total blocks. ${known} are brick blocks. How many are left?`,
            showStrategy: true,
            type: 'put-together-addend-unknown'
        };
    }

    generateCompareDifferenceUnknown() {
        const larger = this.getRandomInt(12, 20);
        const smaller = this.getRandomInt(5, larger - 3);
        const difference = larger - smaller;

        const scenarios = [
            {
                text: `Mario collected ${larger} stars. Luigi collected ${smaller} stars. How many more stars does Mario have than Luigi?`,
                visual: this.createStarsComparisonVisual(larger, smaller)
            },
            {
                text: `In World 1, there are ${larger} coins. In World 2, there are ${smaller} coins. How many more coins are in World 1?`,
                visual: this.createCoinsComparisonVisual(larger, smaller)
            }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        return {
            standard: 'NC.1.OA.1',
            text: scenario.text,
            answer: difference,
            visual: scenario.visual,
            hint: `Compare ${larger} and ${smaller}. How many more?`,
            showStrategy: true,
            type: 'compare-difference-unknown'
        };
    }

    generateAddThreeNumbers() {
        const num1 = this.getRandomInt(2, 7);
        const num2 = this.getRandomInt(3, 8);
        const num3 = this.getRandomInt(2, 6);
        const total = num1 + num2 + num3;

        const scenarios = [
            `Mario jumped on ${num1} Goombas, ${num2} Koopa Troopas, and ${num3} Piranha Plants. How many enemies did he defeat total?`,
            `You collected ${num1} coins from blocks, ${num2} coins from enemies, and ${num3} coins from pipes. How many coins in all?`,
            `Luigi found ${num1} mushrooms, ${num2} fire flowers, and ${num3} stars. How many power-ups total?`
        ];

        return {
            standard: 'NC.1.OA.2',
            text: scenarios[Math.floor(Math.random() * scenarios.length)],
            answer: total,
            visual: this.createThreeGroupsVisual(num1, num2, num3),
            hint: `Try adding two numbers first, then add the third. Look for numbers that make 10!`,
            showStrategy: true,
            type: 'add-three-numbers'
        };
    }

    generateSubtractionWithin20() {
        const start = this.getRandomInt(10, 20);
        const subtract = this.getRandomInt(3, start - 2);
        const result = start - subtract;

        const scenarios = [
            `Mario had ${start} coins. He used ${subtract} coins to continue after Game Over. How many coins does he have left?`,
            `There were ${start} enemies in the castle. Mario defeated ${subtract} of them. How many enemies are left?`,
            `Peach baked ${start} cakes. Mario ate ${subtract} cakes. How many cakes are left?`
        ];

        return {
            standard: 'NC.1.OA.6',
            text: scenarios[Math.floor(Math.random() * scenarios.length)],
            answer: result,
            visual: this.createSubtractionVisual(start, subtract),
            hint: `Start with ${start}. Take away ${subtract}. What's left?`,
            showStrategy: true,
            type: 'subtraction-within-20'
        };
    }

    // ============================================
    // NC.1.NBT - NUMBER AND OPERATIONS IN BASE TEN
    // ============================================

    generatePlaceValueProblem() {
        const problemTypes = [
            'counting-to-150',
            'tens-and-ones',
            'comparing-numbers',
            'adding-within-100',
            'ten-more-less'
        ];

        const type = problemTypes[Math.floor(Math.random() * problemTypes.length)];

        switch(type) {
            case 'counting-to-150':
                return this.generateCountingProblem();
            case 'tens-and-ones':
                return this.generateTensAndOnesProblem();
            case 'comparing-numbers':
                return this.generateComparingProblem();
            case 'adding-within-100':
                return this.generateAddingWithin100();
            case 'ten-more-less':
                return this.generateTenMoreLess();
            default:
                return this.generateTensAndOnesProblem();
        }
    }

    generateCountingProblem() {
        const start = this.getRandomInt(50, 140);
        const answer = start + 1;

        return {
            standard: 'NC.1.NBT.1',
            text: `Mario is counting his coins. He counted up to ${start}. What number comes next?`,
            answer: answer,
            visual: this.createCountingVisual(start),
            hint: `What number comes after ${start}?`,
            showStrategy: false,
            type: 'counting'
        };
    }

    generateTensAndOnesProblem() {
        const tens = this.getRandomInt(2, 9);
        const ones = this.getRandomInt(0, 9);
        const number = tens * 10 + ones;

        const questionTypes = [
            {
                text: `Mario collected ${number} coins. If he organizes them in bags of 10, how many full bags will he have?`,
                answer: tens,
                hint: `Look at the tens place. How many 10s are in ${number}?`
            },
            {
                text: `You have ${number} coins organized in bags of 10. How many extra coins are not in a bag?`,
                answer: ones,
                hint: `Look at the ones place. What digit is in the ones place of ${number}?`
            }
        ];

        const question = questionTypes[Math.floor(Math.random() * questionTypes.length)];

        return {
            standard: 'NC.1.NBT.2',
            text: question.text,
            answer: question.answer,
            visual: this.createTensOnesVisual(tens, ones),
            hint: question.hint,
            showStrategy: false,
            type: 'tens-and-ones'
        };
    }

    generateComparingProblem() {
        const num1 = this.getRandomInt(10, 50);
        let num2 = this.getRandomInt(10, 50);
        while (num1 === num2) {
            num2 = this.getRandomInt(10, 50);
        }

        const larger = Math.max(num1, num2);

        const scenarios = [
            {
                text: `Mario collected ${num1} coins. Luigi collected ${num2} coins. Who collected more coins? Enter ${num1} or ${num2}.`,
                answer: larger
            },
            {
                text: `World 1 has ${num1} levels. World 2 has ${num2} levels. Which world has more levels? Enter ${num1} or ${num2}.`,
                answer: larger
            }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        return {
            standard: 'NC.1.NBT.3',
            text: scenario.text,
            answer: scenario.answer,
            visual: this.createNumberComparisonVisual(num1, num2),
            hint: `Compare the tens place first. ${num1} and ${num2}. Which is bigger?`,
            showStrategy: false,
            type: 'comparing-numbers'
        };
    }

    generateAddingWithin100() {
        const start = this.getRandomInt(20, 45);
        const add = this.getRandomInt(5, 15);
        const total = start + add;

        return {
            standard: 'NC.1.NBT.4',
            text: `Mario had ${start} coins. He collected ${add} more coins from breaking blocks. How many coins does he have now?`,
            answer: total,
            visual: this.createAdditionVisual(start, add),
            hint: `Start at ${start} and count on ${add} more.`,
            showStrategy: true,
            type: 'adding-within-100'
        };
    }

    generateTenMoreLess() {
        const start = this.getRandomInt(20, 90);
        const isMore = Math.random() > 0.5;
        const answer = isMore ? start + 10 : start - 10;

        const text = isMore
            ? `Mario had ${start} coins. He found a 10-coin block. How many coins does he have now?`
            : `Luigi had ${start} lives saved up. He used 10 lives trying to beat the boss. How many lives does he have now?`;

        return {
            standard: 'NC.1.NBT.5',
            text: text,
            answer: answer,
            visual: this.createTenMoreLessVisual(start, isMore),
            hint: isMore ? `Add 10 to ${start}. The ones stay the same!` : `Subtract 10 from ${start}. The ones stay the same!`,
            showStrategy: false,
            type: 'ten-more-less'
        };
    }

    // ============================================
    // NC.1.MD - MEASUREMENT AND DATA
    // ============================================

    generateMeasurementProblem() {
        const problemTypes = [
            'ordering-length',
            'measuring-units',
            'telling-time',
            'data-categories'
        ];

        const type = problemTypes[Math.floor(Math.random() * problemTypes.length)];

        switch(type) {
            case 'ordering-length':
                return this.generateOrderingProblem();
            case 'measuring-units':
                return this.generateMeasuringProblem();
            case 'telling-time':
                return this.generateTellingTimeProblem();
            case 'data-categories':
                return this.generateDataProblem();
            default:
                return this.generateDataProblem();
        }
    }

    generateOrderingProblem() {
        return {
            standard: 'NC.1.MD.1',
            text: `Three pipes in the Mushroom Kingdom have different heights: Green pipe is 50cm, Blue pipe is 120cm, Red pipe is 75cm. Enter the height of the tallest pipe.`,
            answer: 120,
            visual: this.createPipesVisual(),
            hint: `Which number is largest? 50, 120, or 75?`,
            showStrategy: false,
            type: 'ordering-length'
        };
    }

    generateMeasuringProblem() {
        const length = this.getRandomInt(5, 12);

        return {
            standard: 'NC.1.MD.2',
            text: `A warp pipe is about ${length} blocks long. How many blocks is that? (Enter the number)`,
            answer: length,
            visual: this.createMeasurementVisual(length),
            hint: `Count the blocks!`,
            showStrategy: false,
            type: 'measuring-units'
        };
    }

    generateTellingTimeProblem() {
        const times = [
            { hour: 9, minute: 0, text: '9:00' },
            { hour: 3, minute: 30, text: '3:30' },
            { hour: 12, minute: 0, text: '12:00' },
            { hour: 6, minute: 30, text: '6:30' }
        ];

        const time = times[Math.floor(Math.random() * times.length)];

        return {
            standard: 'NC.1.MD.3',
            text: `Mario starts his adventure at ${time.text}. What hour does he start? (Enter just the hour number, like 9 or 3)`,
            answer: time.hour,
            visual: this.createClockVisual(time.hour, time.minute),
            hint: `Look at the hour hand. It points to ${time.hour}.`,
            showStrategy: false,
            type: 'telling-time'
        };
    }

    generateDataProblem() {
        const world1 = this.getRandomInt(5, 12);
        const world2 = this.getRandomInt(3, 10);
        const world3 = this.getRandomInt(4, 11);

        const questions = [
            {
                text: `Mario collected ${world1} stars in World 1, ${world2} stars in World 2, and ${world3} stars in World 3. How many stars total?`,
                answer: world1 + world2 + world3
            },
            {
                text: `Luigi found ${world1} coins in the castle, ${world2} coins in the desert, and ${world3} coins underwater. How many more coins in the castle than the desert?`,
                answer: Math.abs(world1 - world2)
            }
        ];

        const question = questions[Math.floor(Math.random() * questions.length)];

        return {
            standard: 'NC.1.MD.4',
            text: question.text,
            answer: question.answer,
            visual: this.createDataVisual(world1, world2, world3),
            hint: `Look at the chart. Count carefully!`,
            showStrategy: false,
            type: 'data-categories'
        };
    }

    // ============================================
    // NC.1.G - GEOMETRY
    // ============================================

    generateGeometryProblem() {
        const problemTypes = [
            'shape-attributes',
            'composite-shapes',
            'partitioning-shapes'
        ];

        const type = problemTypes[Math.floor(Math.random() * problemTypes.length)];

        switch(type) {
            case 'shape-attributes':
                return this.generateShapeAttributesProblem();
            case 'composite-shapes':
                return this.generateCompositeShapesProblem();
            case 'partitioning-shapes':
                return this.generatePartitioningProblem();
            default:
                return this.generateShapeAttributesProblem();
        }
    }

    generateShapeAttributesProblem() {
        const shapes = [
            { name: 'rectangle', sides: 4, corners: 4 },
            { name: 'triangle', sides: 3, corners: 3 },
            { name: 'square', sides: 4, corners: 4 }
        ];

        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        const questions = [
            {
                text: `A Mario block is shaped like a ${shape.name}. How many sides does it have?`,
                answer: shape.sides
            },
            {
                text: `A power-up box is shaped like a ${shape.name}. How many corners does it have?`,
                answer: shape.corners
            }
        ];

        const question = questions[Math.floor(Math.random() * questions.length)];

        return {
            standard: 'NC.1.G.1',
            text: question.text,
            answer: question.answer,
            visual: this.createShapeVisual(shape.name),
            hint: `Count the ${question.text.includes('sides') ? 'sides' : 'corners'} on the ${shape.name}.`,
            showStrategy: false,
            type: 'shape-attributes'
        };
    }

    generateCompositeShapesProblem() {
        return {
            standard: 'NC.1.G.2',
            text: `Mario built a castle using 4 rectangular blocks and 2 triangular roofs. How many blocks did he use in total?`,
            answer: 6,
            visual: this.createCastleVisual(),
            hint: `Count all the shapes: rectangles plus triangles!`,
            showStrategy: false,
            type: 'composite-shapes'
        };
    }

    generatePartitioningProblem() {
        const total = this.getRandomInt(8, 16);
        const players = [2, 4][Math.floor(Math.random() * 2)];
        const each = total / players;

        if (each !== Math.floor(each)) {
            return this.generatePartitioningProblem();
        }

        const playerNames = players === 2 ? 'Mario and Luigi' : `${players} players`;

        return {
            standard: 'NC.1.G.3',
            text: `${playerNames} want to share ${total} power stars equally. How many stars does each player get?`,
            answer: each,
            visual: this.createPartitioningVisual(total, players),
            hint: `Divide ${total} into ${players} equal groups.`,
            showStrategy: false,
            type: 'partitioning-shapes'
        };
    }

    // ============================================
    // VISUAL CREATION METHODS
    // ============================================

    createCoinsVisual(start, total) {
        let html = '<div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; justify-content: center;">';
        html += '<div style="text-align: center;"><p>Started with:</p>';
        for (let i = 0; i < start; i++) {
            html += '<div class="mario-coin">💰</div>';
            if ((i + 1) % 5 === 0 && i < start - 1) html += '<br>';
        }
        html += '</div><div style="font-size: 3em; margin: 0 20px;">→</div>';
        html += '<div style="text-align: center;"><p>Now has:</p>';
        for (let i = 0; i < total; i++) {
            html += '<div class="mario-coin">💰</div>';
            if ((i + 1) % 5 === 0 && i < total - 1) html += '<br>';
        }
        html += '</div></div>';
        return html;
    }

    createMushroomsVisual(start, change) {
        let html = '<div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">';
        for (let i = 0; i < start + change; i++) {
            html += '<div class="mario-mushroom"></div>';
        }
        html += '</div>';
        return html;
    }

    createBlocksVisual(brick, question) {
        let html = '<div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">';
        html += '<div style="text-align: center;"><p>Brick Blocks</p>';
        for (let i = 0; i < brick; i++) {
            html += '<div class="mario-ground-block"></div>';
        }
        html += '</div>';
        html += '<div style="text-align: center;"><p>Question Blocks</p>';
        for (let i = 0; i < question; i++) {
            html += '<div class="mario-block"></div>';
        }
        html += '</div>';
        html += '</div>';
        return html;
    }

    createStarsComparisonVisual(num1, num2) {
        let html = '<div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">';
        html += '<div style="text-align: center;"><p style="font-weight: bold;">Mario</p>';
        for (let i = 0; i < num1; i++) {
            html += '<span style="font-size: 2em; margin: 5px;">⭐</span>';
            if ((i + 1) % 5 === 0) html += '<br>';
        }
        html += '</div>';
        html += '<div style="text-align: center;"><p style="font-weight: bold;">Luigi</p>';
        for (let i = 0; i < num2; i++) {
            html += '<span style="font-size: 2em; margin: 5px;">⭐</span>';
            if ((i + 1) % 5 === 0) html += '<br>';
        }
        html += '</div>';
        html += '</div>';
        return html;
    }

    createCoinsComparisonVisual(num1, num2) {
        return `
            <div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap;">
                <div style="text-align: center;">
                    <p style="font-weight: bold; font-size: 1.3em;">World 1</p>
                    <div style="font-size: 3em; color: #FFD700;">${num1}</div>
                    <p>coins</p>
                </div>
                <div style="font-size: 3em; align-self: center;">VS</div>
                <div style="text-align: center;">
                    <p style="font-weight: bold; font-size: 1.3em;">World 2</p>
                    <div style="font-size: 3em; color: #FFD700;">${num2}</div>
                    <p>coins</p>
                </div>
            </div>
        `;
    }

    createThreeGroupsVisual(num1, num2, num3) {
        let html = '<div style="display: flex; gap: 25px; justify-content: center; flex-wrap: wrap;">';

        const groups = [
            { count: num1, emoji: '🍄', label: 'Group 1' },
            { count: num2, emoji: '🌟', label: 'Group 2' },
            { count: num3, emoji: '🔥', label: 'Group 3' }
        ];

        groups.forEach(group => {
            html += `<div style="text-align: center;"><p style="font-weight: bold;">${group.label}</p>`;
            for (let i = 0; i < group.count; i++) {
                html += `<span style="font-size: 2.5em; margin: 5px;">${group.emoji}</span>`;
            }
            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    createSubtractionVisual(start, subtract) {
        let html = '<div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">';
        for (let i = 0; i < start; i++) {
            if (i < subtract) {
                html += '<div class="mario-coin" style="opacity: 0.3; filter: grayscale(100%);">💰</div>';
            } else {
                html += '<div class="mario-coin">💰</div>';
            }
            if ((i + 1) % 5 === 0) html += '<br>';
        }
        html += '</div>';
        return html;
    }

    createCountingVisual(start) {
        return `<div style="font-size: 3em; text-align: center;">
            ${start - 2}, ${start - 1}, ${start}, <strong style="color: #E74C3C;">?</strong>
        </div>`;
    }

    createTensOnesVisual(tens, ones) {
        let html = '<div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">';

        if (tens > 0) {
            html += '<div style="text-align: center;">';
            html += '<p style="font-weight: bold; margin-bottom: 10px;">Bags of 10 Coins</p>';
            for (let i = 0; i < tens; i++) {
                html += '<div style="display: inline-block; margin: 5px; padding: 15px; border: 4px solid #8B4513; border-radius: 10px; background: #D2691E;">';
                for (let j = 0; j < 10; j++) {
                    html += '<span style="font-size: 1.2em;">💰</span>';
                    if ((j + 1) % 5 === 0) html += '<br>';
                }
                html += '</div>';
            }
            html += '</div>';
        }

        if (ones > 0) {
            html += '<div style="text-align: center;">';
            html += '<p style="font-weight: bold; margin-bottom: 10px;">Extra Coins</p>';
            for (let i = 0; i < ones; i++) {
                html += '<div class="mario-coin" style="display: inline-block;">💰</div>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    createNumberComparisonVisual(num1, num2) {
        return `<div style="display: flex; gap: 50px; justify-content: center; align-items: center; font-size: 4em; flex-wrap: wrap;">
            <div style="padding: 20px; background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%); border-radius: 15px; border: 4px solid #922B21; color: white;">${num1}</div>
            <div style="font-size: 0.8em;">VS</div>
            <div style="padding: 20px; background: linear-gradient(135deg, #3498DB 0%, #2874A6 100%); border-radius: 15px; border: 4px solid #1B4F72; color: white;">${num2}</div>
        </div>`;
    }

    createAdditionVisual(start, add) {
        return `<div style="text-align: center; font-size: 2.5em; margin: 20px;">
            <span style="color: #E74C3C;">${start}</span> +
            <span style="color: #F39C12;">${add}</span> =
            <strong style="color: #27AE60;">?</strong>
        </div>`;
    }

    createTenMoreLessVisual(start, isMore) {
        const operator = isMore ? '+' : '-';
        const color = isMore ? '#27AE60' : '#E74C3C';
        return `<div style="text-align: center; font-size: 2.5em; margin: 20px;">
            <span style="color: #3498DB;">${start}</span>
            <span style="color: ${color};">${operator} 10</span> =
            <strong style="color: #8E44AD;">?</strong>
        </div>`;
    }

    createPipesVisual() {
        return `<div style="display: flex; gap: 30px; justify-content: center; align-items: flex-end;">
            <div style="text-align: center;">
                <div class="pipe" style="height: 100px; background: linear-gradient(90deg, #2ECC71 0%, #27AE60 100%);"></div>
                <p style="font-weight: bold;">Green: 50cm</p>
            </div>
            <div style="text-align: center;">
                <div class="pipe" style="height: 240px; background: linear-gradient(90deg, #3498DB 0%, #2874A6 100%);"></div>
                <p style="font-weight: bold;">Blue: 120cm</p>
            </div>
            <div style="text-align: center;">
                <div class="pipe" style="height: 150px; background: linear-gradient(90deg, #E74C3C 0%, #C0392B 100%);"></div>
                <p style="font-weight: bold;">Red: 75cm</p>
            </div>
        </div>`;
    }

    createMeasurementVisual(length) {
        let html = '<div style="display: flex; align-items: center; gap: 5px; justify-content: center; flex-wrap: wrap;">';
        html += '<div class="pipe" style="width: 300px; height: 60px;"></div>';
        html += '<div style="font-size: 2em;">➡️</div>';
        for (let i = 0; i < length; i++) {
            html += '<div class="mario-ground-block" style="width: 40px; height: 40px;"></div>';
        }
        html += '</div>';
        return html;
    }

    createClockVisual(hour, minute) {
        return `<div style="text-align: center;">
            <div style="font-size: 5em;">🕐</div>
            <div style="font-size: 3em; font-weight: bold; color: #E74C3C;">${hour}:${minute === 0 ? '00' : minute}</div>
        </div>`;
    }

    createDataVisual(val1, val2, val3) {
        const max = Math.max(val1, val2, val3);
        return `<div style="display: flex; gap: 20px; justify-content: center; align-items: flex-end;">
            <div style="text-align: center;">
                <div style="background: linear-gradient(180deg, #E74C3C, #C0392B); width: 60px; height: ${(val1 / max) * 200}px; border-radius: 10px 10px 0 0;"></div>
                <div style="font-weight: bold; margin-top: 10px;">World 1</div>
                <div style="font-size: 1.5em; color: #E74C3C;">${val1}</div>
            </div>
            <div style="text-align: center;">
                <div style="background: linear-gradient(180deg, #F39C12, #E67E22); width: 60px; height: ${(val2 / max) * 200}px; border-radius: 10px 10px 0 0;"></div>
                <div style="font-weight: bold; margin-top: 10px;">World 2</div>
                <div style="font-size: 1.5em; color: #F39C12;">${val2}</div>
            </div>
            <div style="text-align: center;">
                <div style="background: linear-gradient(180deg, #3498DB, #2874A6); width: 60px; height: ${(val3 / max) * 200}px; border-radius: 10px 10px 0 0;"></div>
                <div style="font-weight: bold; margin-top: 10px;">World 3</div>
                <div style="font-size: 1.5em; color: #3498DB;">${val3}</div>
            </div>
        </div>`;
    }

    createShapeVisual(shapeName) {
        const shapes = {
            'rectangle': '<div style="width: 200px; height: 120px; background: linear-gradient(135deg, #D4A373, #8B4513); border: 4px solid #654321; border-radius: 10px;"></div>',
            'triangle': '<div style="width: 0; height: 0; border-left: 100px solid transparent; border-right: 100px solid transparent; border-bottom: 170px solid #E74C3C;"></div>',
            'square': '<div style="width: 150px; height: 150px; background: linear-gradient(135deg, #F39C12, #E67E22); border: 4px solid #D35400; border-radius: 10px;"></div>'
        };
        return `<div style="display: flex; justify-content: center; align-items: center; padding: 30px;">${shapes[shapeName]}</div>`;
    }

    createCastleVisual() {
        return `<div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
            <div style="display: flex; gap: 5px;">
                <div style="width: 0; height: 0; border-left: 40px solid transparent; border-right: 40px solid transparent; border-bottom: 60px solid #E74C3C;"></div>
                <div style="width: 0; height: 0; border-left: 40px solid transparent; border-right: 40px solid transparent; border-bottom: 60px solid #E74C3C;"></div>
            </div>
            <div style="display: flex; gap: 5px;">
                <div style="width: 70px; height: 100px; background: #8B4513; border: 3px solid #654321;"></div>
                <div style="width: 70px; height: 100px; background: #8B4513; border: 3px solid #654321;"></div>
            </div>
            <div style="display: flex; gap: 5px;">
                <div style="width: 70px; height: 80px; background: #A0522D; border: 3px solid #654321;"></div>
                <div style="width: 70px; height: 80px; background: #A0522D; border: 3px solid #654321;"></div>
            </div>
        </div>`;
    }

    createPartitioningVisual(total, players) {
        let html = '<div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">';
        const each = total / players;

        for (let p = 0; p < players; p++) {
            html += '<div style="padding: 15px; border: 3px solid #E74C3C; border-radius: 15px; background: #FFEBEE; text-align: center;">';
            html += `<div style="font-weight: bold; margin-bottom: 10px;">Player ${p + 1}</div>`;
            for (let i = 0; i < each; i++) {
                html += '<div class="mario-star" style="display: inline-block; width: 50px; height: 50px; animation: none;"><span style="font-size: 2.5em;">⭐</span></div>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    // ============================================
    // DISPLAY AND INTERACTION METHODS
    // ============================================

    displayProblem(problem) {
        document.getElementById('mario-standard-tag').textContent = problem.standard;
        document.getElementById('mario-problem-text').innerHTML = problem.text;
        document.getElementById('mario-visual').innerHTML = problem.visual;

        const strategySelector = document.getElementById('mario-strategy-selector');
        if (problem.showStrategy) {
            strategySelector.style.display = 'block';
        } else {
            strategySelector.style.display = 'none';
        }

        document.getElementById('mario-work-area').innerHTML = '';
    }

    selectStrategy(strategy) {
        this.selectedStrategy = strategy;
        document.querySelectorAll('.mario-strategy-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');

        const workArea = document.getElementById('mario-work-area');
        workArea.innerHTML = '';

        switch(strategy) {
            case 'number-line':
                this.showNumberLine();
                break;
            case 'make-ten':
                this.showTenFrame();
                break;
            case 'count-on':
                workArea.innerHTML = '<p style="font-size: 1.2em;">Count on your fingers or out loud!</p>';
                break;
            case 'draw':
                workArea.innerHTML = '<p style="font-size: 1.2em;">Draw coins or stars to solve!</p>';
                break;
        }
    }

    showNumberLine() {
        const workArea = document.getElementById('mario-work-area');
        let html = '<div class="number-line">';
        for (let i = 0; i <= 20; i++) {
            html += `<div class="number-line-item"><span style="font-size: 1.5em;">💰</span><div class="number-line-number">${i}</div></div>`;
        }
        html += '</div>';
        workArea.innerHTML = html;
    }

    showTenFrame() {
        const workArea = document.getElementById('mario-work-area');
        let html = '<div class="ten-frame">';
        for (let i = 0; i < 10; i++) {
            html += `<div class="ten-frame-cell" onclick="marioMath.toggleTenFrame(this)"></div>`;
        }
        html += '</div>';
        html += '<div class="ten-frame" style="margin-top: 15px;">';
        for (let i = 0; i < 10; i++) {
            html += `<div class="ten-frame-cell" onclick="marioMath.toggleTenFrame(this)"></div>`;
        }
        html += '</div>';
        workArea.innerHTML = html;
    }

    toggleTenFrame(cell) {
        if (cell.classList.contains('filled')) {
            cell.classList.remove('filled');
            cell.textContent = '';
        } else {
            cell.classList.add('filled');
            cell.textContent = '⭐';
        }
    }

    checkMarioAnswer() {
        const userAnswer = parseInt(document.getElementById('mario-answer').value);
        const feedback = document.getElementById('mario-feedback');

        if (isNaN(userAnswer)) {
            feedback.textContent = 'Please enter a number!';
            feedback.className = 'mario-feedback';
            feedback.style.background = 'linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%)';
            feedback.style.color = '#F57C00';
            return;
        }

        if (userAnswer === this.currentAnswer) {
            this.starCount++;
            this.updateStarDisplay();

            feedback.textContent = this.getRandomEncouragement('correct');
            feedback.className = 'mario-feedback correct';

            document.getElementById('mario-answer').disabled = true;
            document.getElementById('mario-check-btn').style.display = 'none';
            document.getElementById('mario-next-btn').style.display = 'inline-block';

            if (this.starCount % 5 === 0) {
                this.showCelebration(`🎉 ${this.starCount} Stars! You're a Super Star! 🎉`);
            }
        } else {
            feedback.textContent = this.getRandomEncouragement('incorrect');
            feedback.className = 'mario-feedback incorrect';
        }
    }

    showMarioHint() {
        const feedback = document.getElementById('mario-feedback');
        feedback.textContent = `💡 Hint: ${this.currentProblem.hint}`;
        feedback.className = 'mario-feedback';
        feedback.style.background = 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)';
        feedback.style.color = '#1976D2';
    }

    skipMarioProblem() {
        const feedback = document.getElementById('mario-feedback');
        feedback.textContent = `The answer was ${this.currentAnswer}! Let's try another one! 🍄`;
        feedback.className = 'mario-feedback';
        feedback.style.background = 'linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%)';
        feedback.style.color = '#F57C00';

        setTimeout(() => {
            this.generateNewProblem();
        }, 2000);
    }

    getRandomEncouragement(type) {
        const messages = this.encouragements[type];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    updateStarDisplay() {
        document.getElementById('star-count').textContent = this.starCount;
    }

    showCelebration(message) {
        const celebration = document.getElementById('celebration');
        const celebrationMessage = document.getElementById('celebration-message');

        celebrationMessage.textContent = message;
        celebration.classList.remove('hidden');

        setTimeout(() => {
            celebration.classList.add('hidden');
        }, 2500);
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Initialize Mario Math when page loads
let marioMath;
document.addEventListener('DOMContentLoaded', () => {
    marioMath = new MarioMath();
});
