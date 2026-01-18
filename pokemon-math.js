// Pokemon Math Adventures - NC 1st Grade Math Standards Implementation

class PokemonMath {
    constructor() {
        this.pokeballCount = 0;
        this.currentCategory = null;
        this.currentProblem = null;
        this.currentAnswer = null;
        this.selectedStrategy = null;
        this.problemHistory = [];

        // Pokemon names for theming
        this.pokemonNames = [
            'Pikachu', 'Charmander', 'Squirtle', 'Bulbasaur', 'Eevee',
            'Meowth', 'Psyduck', 'Jigglypuff', 'Snorlax', 'Charizard',
            'Blastoise', 'Venusaur', 'Rattata', 'Pidgey', 'Caterpie'
        ];

        this.trainerNames = ['Ash', 'Misty', 'Brock', 'Professor Oak', 'Gary'];

        this.encouragements = {
            correct: [
                "🌟 Great job, Trainer! You're a Pokemon Math Master!",
                "⚡ Perfect! You caught the right answer!",
                "🎉 Excellent work! You earned a Pokeball!",
                "💫 Amazing! Professor Oak is proud of you!",
                "✨ Fantastic! You're leveling up fast!",
                "🏆 Outstanding! That's what I call Pokemon power!"
            ],
            incorrect: [
                "💪 Not quite! Try using a different strategy!",
                "🌟 Good effort! Let's think about it another way!",
                "⭐ Almost there! Use the hint if you need help!",
                "🚀 Keep trying, Trainer! You can do it!"
            ]
        };

        this.init();
    }

    init() {
        this.setupPokemonEventListeners();
    }

    setupPokemonEventListeners() {
        // Main Pokemon button
        const pokemonModeBtn = document.getElementById('pokemon-mode-btn');
        if (pokemonModeBtn) {
            pokemonModeBtn.addEventListener('click', () => {
                this.showPokemonCategories();
            });
        }

        // Category selection
        document.querySelectorAll('.pokemon-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.startCategory(category);
            });
        });

        // Back buttons
        const pokemonBackBtn = document.getElementById('pokemon-back-btn');
        if (pokemonBackBtn) {
            pokemonBackBtn.addEventListener('click', () => {
                this.showStartScreen();
            });
        }

        const pokemonCategoryBackBtn = document.getElementById('pokemon-category-back-btn');
        if (pokemonCategoryBackBtn) {
            pokemonCategoryBackBtn.addEventListener('click', () => {
                this.showPokemonCategories();
            });
        }

        // Answer submission
        const pokemonCheckBtn = document.getElementById('pokemon-check-btn');
        if (pokemonCheckBtn) {
            pokemonCheckBtn.addEventListener('click', () => {
                this.checkPokemonAnswer();
            });
        }

        const pokemonAnswerInput = document.getElementById('pokemon-answer');
        if (pokemonAnswerInput) {
            pokemonAnswerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkPokemonAnswer();
                }
            });
        }

        // Strategy selection
        document.querySelectorAll('.strategy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectStrategy(e.target.dataset.strategy);
            });
        });

        // Problem controls
        const pokemonHintBtn = document.getElementById('pokemon-hint-btn');
        if (pokemonHintBtn) {
            pokemonHintBtn.addEventListener('click', () => {
                this.showPokemonHint();
            });
        }

        const pokemonSkipBtn = document.getElementById('pokemon-skip-btn');
        if (pokemonSkipBtn) {
            pokemonSkipBtn.addEventListener('click', () => {
                this.skipPokemonProblem();
            });
        }

        const pokemonNextBtn = document.getElementById('pokemon-next-btn');
        if (pokemonNextBtn) {
            pokemonNextBtn.addEventListener('click', () => {
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

    showPokemonCategories() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('pokemon-category-screen').classList.add('active');
        this.updatePokeballDisplay();
    }

    startCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('pokemon-problem-screen').classList.add('active');
        this.generateNewProblem();
    }

    generateNewProblem() {
        this.selectedStrategy = null;
        document.querySelectorAll('.strategy-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        document.getElementById('pokemon-answer').value = '';
        document.getElementById('pokemon-feedback').textContent = '';
        document.getElementById('pokemon-feedback').className = 'pokemon-feedback';
        document.getElementById('pokemon-next-btn').style.display = 'none';
        document.getElementById('pokemon-check-btn').style.display = 'inline-block';
        document.getElementById('pokemon-answer').disabled = false;

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
        const pokemon = this.getRandomPokemon();

        return {
            standard: 'NC.1.OA.1',
            text: `You collected ${start} ${pokemon} cards from booster packs. You traded with friends and now have ${total} ${pokemon} cards. How many ${pokemon} cards did you get from trading?`,
            answer: change,
            visual: this.createPokemonCardsVisual(start, total),
            hint: `Start with ${start} cards. Count up to ${total}. How many did you add?`,
            showStrategy: true,
            type: 'add-to-change-unknown'
        };
    }

    generatePutTogetherAddendUnknown() {
        const total = this.getRandomInt(10, 18);
        const known = this.getRandomInt(4, total - 3);
        const unknown = total - known;
        const type1 = 'Fire-type';
        const type2 = 'Water-type';

        return {
            standard: 'NC.1.OA.1',
            text: `There are ${total} Pokemon in your deck. ${known} are ${type1} and the rest are ${type2}. How many ${type2} Pokemon do you have?`,
            answer: unknown,
            visual: this.createTypeCardsVisual(known, unknown),
            hint: `You have ${total} total Pokemon. ${known} are ${type1}. What's left?`,
            showStrategy: true,
            type: 'put-together-addend-unknown'
        };
    }

    generateCompareDifferenceUnknown() {
        const larger = this.getRandomInt(12, 20);
        const smaller = this.getRandomInt(5, larger - 3);
        const difference = larger - smaller;
        const trainer1 = this.getRandomTrainer();
        let trainer2 = this.getRandomTrainer();
        while (trainer2 === trainer1) {
            trainer2 = this.getRandomTrainer();
        }

        const scenarios = [
            {
                text: `${trainer1} has ${larger} Pokemon cards. ${trainer2} has ${smaller} Pokemon cards. How many more cards does ${trainer1} have?`,
                visual: this.createComparisonVisual(larger, smaller)
            },
            {
                text: `Charizard has ${larger} HP. Squirtle has ${smaller} HP. How much more HP does Charizard have than Squirtle?`,
                visual: this.createHPComparisonVisual(larger, smaller)
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
            `You caught ${num1} Pikachu, ${num2} Eevee, and ${num3} Bulbasaur cards in booster packs. How many Pokemon cards did you catch total?`,
            `In a Pokemon battle, you used ${num1} Fire Energy, ${num2} Water Energy, and ${num3} Grass Energy. How many Energy cards did you use?`,
            `You have ${num1} rare cards, ${num2} uncommon cards, and ${num3} common cards. How many cards do you have?`
        ];

        return {
            standard: 'NC.1.OA.2',
            text: scenarios[Math.floor(Math.random() * scenarios.length)],
            answer: total,
            visual: this.createThreeGroupsVisual(num1, num2, num3),
            hint: `Try adding two numbers first, then add the third. Or look for numbers that make 10!`,
            showStrategy: true,
            type: 'add-three-numbers'
        };
    }

    generateSubtractionWithin20() {
        const start = this.getRandomInt(10, 20);
        const subtract = this.getRandomInt(3, start - 2);
        const result = start - subtract;
        const pokemon = this.getRandomPokemon();

        return {
            standard: 'NC.1.OA.6',
            text: `You have ${start} ${pokemon} cards. You give ${subtract} cards to your friend. How many ${pokemon} cards do you have left?`,
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
            text: `Professor Oak is counting Pokemon in his lab. He counted up to ${start}. What number comes next?`,
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
                text: `You have ${number} Pokemon cards. How many groups of 10 cards do you have?`,
                answer: tens,
                hint: `Look at the tens place. How many 10s are in ${number}?`
            },
            {
                text: `You have ${number} Pokemon cards organized in groups of 10. How many single cards are left over?`,
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
        const smaller = Math.min(num1, num2);

        const scenarios = [
            {
                text: `You have ${num1} Pokemon cards. Your friend has ${num2} Pokemon cards. Who has more cards? Enter ${num1} or ${num2}.`,
                answer: larger
            },
            {
                text: `Charizard's Pokedex number is ${num1}. Blastoise's Pokedex number is ${num2}. Which number is greater? Enter ${num1} or ${num2}.`,
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
            text: `You have ${start} Pokemon cards. You get ${add} more in a booster pack. How many do you have now?`,
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
            ? `You have ${start} Pokemon cards. You buy a booster pack with 10 more cards. How many do you have now?`
            : `Professor Oak had ${start} Pokemon. He released 10 into the wild. How many does he have now?`;

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
        const pokemon = [
            { name: 'Pikachu', height: 40 },
            { name: 'Charizard', height: 170 },
            { name: 'Squirtle', height: 50 }
        ];

        return {
            standard: 'NC.1.MD.1',
            text: `These Pokemon have different heights: Pikachu is 40cm, Charizard is 170cm, Squirtle is 50cm. Enter the height of the tallest Pokemon.`,
            answer: 170,
            visual: this.createHeightComparisonVisual(),
            hint: `Which number is largest? 40, 170, or 50?`,
            showStrategy: false,
            type: 'ordering-length'
        };
    }

    generateMeasuringProblem() {
        const length = this.getRandomInt(5, 12);

        return {
            standard: 'NC.1.MD.2',
            text: `A Pokemon card is about ${length} paperclips long. How many paperclips is that? (Enter the number)`,
            answer: length,
            visual: this.createMeasurementVisual(length),
            hint: `Count the paperclips!`,
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
        const answerHour = time.minute === 0 ? time.hour : time.hour + 0.5;

        return {
            standard: 'NC.1.MD.3',
            text: `The Pokemon gym opens at ${time.text}. What hour does it open? (Enter just the hour number, like 9 or 3)`,
            answer: time.hour,
            visual: this.createClockVisual(time.hour, time.minute),
            hint: `Look at the hour hand. It points to ${time.hour}.`,
            showStrategy: false,
            type: 'telling-time'
        };
    }

    generateDataProblem() {
        const fire = this.getRandomInt(5, 12);
        const water = this.getRandomInt(3, 10);
        const grass = this.getRandomInt(4, 11);

        const questions = [
            {
                text: `You caught ${fire} Fire-type, ${water} Water-type, and ${grass} Grass-type Pokemon. How many Pokemon did you catch in total?`,
                answer: fire + water + grass
            },
            {
                text: `A trainer has ${fire} Fire-type, ${water} Water-type, and ${grass} Grass-type Pokemon. How many more Fire-type than Water-type?`,
                answer: Math.abs(fire - water)
            }
        ];

        const question = questions[Math.floor(Math.random() * questions.length)];

        return {
            standard: 'NC.1.MD.4',
            text: question.text,
            answer: question.answer,
            visual: this.createDataVisual(fire, water, grass),
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
            { name: 'circle', sides: 0, corners: 0 }
        ];

        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        const questions = [
            {
                text: `A Pokemon Energy card is shaped like a ${shape.name}. How many sides does it have?`,
                answer: shape.sides
            },
            {
                text: `A Pokemon Energy card is shaped like a ${shape.name}. How many corners does it have?`,
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
            text: `A Pokeball is made of 2 half-circles (one red, one white). How many half-circles make a Pokeball?`,
            answer: 2,
            visual: this.createPokeballVisual(),
            hint: `Count the half-circles in the Pokeball!`,
            showStrategy: false,
            type: 'composite-shapes'
        };
    }

    generatePartitioningProblem() {
        const total = this.getRandomInt(8, 16);
        const trainers = [2, 4][Math.floor(Math.random() * 2)];
        const each = total / trainers;

        if (each !== Math.floor(each)) {
            return this.generatePartitioningProblem();
        }

        return {
            standard: 'NC.1.G.3',
            text: `${trainers} trainers want to share ${total} Pokemon cards equally. How many cards does each trainer get?`,
            answer: each,
            visual: this.createPartitioningVisual(total, trainers),
            hint: `Divide ${total} into ${trainers} equal groups.`,
            showStrategy: false,
            type: 'partitioning-shapes'
        };
    }

    // ============================================
    // VISUAL CREATION METHODS
    // ============================================

    createPokemonCardsVisual(start, total) {
        let html = '<div style="display: flex; gap: 10px; flex-wrap: wrap;">';
        for (let i = 0; i < start; i++) {
            html += '<div class="pokemon-card">⚡</div>';
        }
        html += '<div style="font-size: 3em; margin: 0 15px;">→</div>';
        for (let i = 0; i < total; i++) {
            html += '<div class="pokemon-card">⚡</div>';
        }
        html += '</div>';
        return html;
    }

    createTypeCardsVisual(known, unknown) {
        let html = '<div style="display: flex; gap: 10px; flex-wrap: wrap;">';
        for (let i = 0; i < known; i++) {
            html += '<div class="energy-card energy-fire">🔥</div>';
        }
        for (let i = 0; i < unknown; i++) {
            html += '<div class="energy-card energy-water">💧</div>';
        }
        html += '</div>';
        return html;
    }

    createComparisonVisual(larger, smaller) {
        let html = '<div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">';
        html += '<div style="text-align: center;">';
        html += '<p style="font-weight: bold; margin-bottom: 10px;">First Amount</p>';
        for (let i = 0; i < larger; i++) {
            html += '<div class="pokeball-visual" style="display: inline-block;"></div>';
            if ((i + 1) % 5 === 0) html += '<br>';
        }
        html += '</div>';
        html += '<div style="text-align: center;">';
        html += '<p style="font-weight: bold; margin-bottom: 10px;">Second Amount</p>';
        for (let i = 0; i < smaller; i++) {
            html += '<div class="pokeball-visual" style="display: inline-block;"></div>';
            if ((i + 1) % 5 === 0) html += '<br>';
        }
        html += '</div>';
        html += '</div>';
        return html;
    }

    createHPComparisonVisual(hp1, hp2) {
        return `
            <div class="hp-bar-container">
                <div class="hp-label">First Pokemon: ${hp1} HP</div>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${(hp1 / 120) * 100}%">${hp1}</div>
                </div>
            </div>
            <div class="hp-bar-container">
                <div class="hp-label">Second Pokemon: ${hp2} HP</div>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${(hp2 / 120) * 100}%">${hp2}</div>
                </div>
            </div>
        `;
    }

    createThreeGroupsVisual(num1, num2, num3) {
        let html = '<div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">';

        const groups = [
            { count: num1, emoji: '⚡', color: 'energy-electric' },
            { count: num2, emoji: '🔥', color: 'energy-fire' },
            { count: num3, emoji: '🌿', color: 'energy-grass' }
        ];

        groups.forEach(group => {
            html += '<div style="text-align: center;">';
            for (let i = 0; i < group.count; i++) {
                html += `<div class="energy-card ${group.color}">${group.emoji}</div>`;
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
                html += '<div class="pokemon-card" style="opacity: 0.3; text-decoration: line-through;">⚡</div>';
            } else {
                html += '<div class="pokemon-card">⚡</div>';
            }
        }
        html += '</div>';
        return html;
    }

    createCountingVisual(start) {
        return `<div style="font-size: 3em; text-align: center;">
            ${start - 2}, ${start - 1}, ${start}, <strong style="color: #FF6B6B;">?</strong>
        </div>`;
    }

    createTensOnesVisual(tens, ones) {
        let html = '<div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">';

        if (tens > 0) {
            html += '<div style="text-align: center;">';
            html += '<p style="font-weight: bold; margin-bottom: 10px;">Groups of 10</p>';
            for (let i = 0; i < tens; i++) {
                html += '<div style="display: inline-block; margin: 5px; padding: 10px; border: 3px solid #3498DB; border-radius: 10px; background: #E3F2FD;">';
                for (let j = 0; j < 10; j++) {
                    html += '<span style="font-size: 1.5em;">⚡</span>';
                    if ((j + 1) % 5 === 0) html += '<br>';
                }
                html += '</div>';
            }
            html += '</div>';
        }

        if (ones > 0) {
            html += '<div style="text-align: center;">';
            html += '<p style="font-weight: bold; margin-bottom: 10px;">Single Cards</p>';
            for (let i = 0; i < ones; i++) {
                html += '<span style="font-size: 2.5em; margin: 5px;">⚡</span>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    createNumberComparisonVisual(num1, num2) {
        return `<div style="display: flex; gap: 50px; justify-content: center; align-items: center; font-size: 4em; flex-wrap: wrap;">
            <div style="padding: 20px; background: linear-gradient(135deg, #FFD93D 0%, #F39C12 100%); border-radius: 15px; border: 4px solid #E67E22;">${num1}</div>
            <div style="font-size: 0.8em;">VS</div>
            <div style="padding: 20px; background: linear-gradient(135deg, #6BCF7F 0%, #2ECC71 100%); border-radius: 15px; border: 4px solid #27AE60;">${num2}</div>
        </div>`;
    }

    createAdditionVisual(start, add) {
        let html = '<div style="text-align: center;">';
        html += `<div style="font-size: 2.5em; margin: 20px;">
            <span style="color: #3498DB;">${start}</span> +
            <span style="color: #E74C3C;">${add}</span> =
            <strong style="color: #2ECC71;">?</strong>
        </div>`;
        html += '</div>';
        return html;
    }

    createTenMoreLessVisual(start, isMore) {
        const operator = isMore ? '+' : '-';
        const color = isMore ? '#2ECC71' : '#E74C3C';
        return `<div style="text-align: center; font-size: 2.5em; margin: 20px;">
            <span style="color: #3498DB;">${start}</span>
            <span style="color: ${color};">${operator} 10</span> =
            <strong style="color: #9B59B6;">?</strong>
        </div>`;
    }

    createHeightComparisonVisual() {
        return `<div style="display: flex; gap: 30px; justify-content: center; align-items: flex-end;">
            <div style="text-align: center;">
                <div style="font-size: 3em;">⚡</div>
                <div style="background: #FFD93D; width: 60px; height: 80px; border-radius: 10px;"></div>
                <p>40cm</p>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 3em;">🔥</div>
                <div style="background: #FF6B6B; width: 60px; height: 200px; border-radius: 10px;"></div>
                <p>170cm</p>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 3em;">💧</div>
                <div style="background: #4ECDC4; width: 60px; height: 100px; border-radius: 10px;"></div>
                <p>50cm</p>
            </div>
        </div>`;
    }

    createMeasurementVisual(length) {
        let html = '<div style="display: flex; align-items: center; gap: 5px; justify-content: center; flex-wrap: wrap;">';
        html += '<div style="background: #FFD700; border: 2px solid #FFA500; border-radius: 5px; padding: 10px 20px;">📄 Card</div>';
        html += '<div style="font-size: 2em;">➡️</div>';
        for (let i = 0; i < length; i++) {
            html += '<div style="width: 30px; height: 8px; background: silver; border-radius: 4px; margin: 2px;"></div>';
        }
        html += '</div>';
        return html;
    }

    createClockVisual(hour, minute) {
        return `<div style="text-align: center;">
            <div style="font-size: 5em;">🕐</div>
            <div style="font-size: 3em; font-weight: bold; color: #3498DB;">${hour}:${minute === 0 ? '00' : minute}</div>
        </div>`;
    }

    createDataVisual(fire, water, grass) {
        const max = Math.max(fire, water, grass);
        return `<div style="display: flex; gap: 20px; justify-content: center; align-items: flex-end;">
            <div style="text-align: center;">
                <div style="background: linear-gradient(180deg, #FF6B6B, #E74C3C); width: 60px; height: ${(fire / max) * 200}px; border-radius: 10px 10px 0 0;"></div>
                <div style="font-weight: bold; margin-top: 10px;">🔥 Fire</div>
                <div style="font-size: 1.5em; color: #E74C3C;">${fire}</div>
            </div>
            <div style="text-align: center;">
                <div style="background: linear-gradient(180deg, #4ECDC4, #3498DB); width: 60px; height: ${(water / max) * 200}px; border-radius: 10px 10px 0 0;"></div>
                <div style="font-weight: bold; margin-top: 10px;">💧 Water</div>
                <div style="font-size: 1.5em; color: #3498DB;">${water}</div>
            </div>
            <div style="text-align: center;">
                <div style="background: linear-gradient(180deg, #95E1D3, #2ECC71); width: 60px; height: ${(grass / max) * 200}px; border-radius: 10px 10px 0 0;"></div>
                <div style="font-weight: bold; margin-top: 10px;">🌿 Grass</div>
                <div style="font-size: 1.5em; color: #2ECC71;">${grass}</div>
            </div>
        </div>`;
    }

    createShapeVisual(shapeName) {
        const shapes = {
            'rectangle': '<div style="width: 200px; height: 120px; background: linear-gradient(135deg, #FFD93D, #FFA500); border: 4px solid #333; border-radius: 10px;"></div>',
            'triangle': '<div style="width: 0; height: 0; border-left: 100px solid transparent; border-right: 100px solid transparent; border-bottom: 170px solid #4ECDC4;"></div>',
            'circle': '<div style="width: 150px; height: 150px; background: linear-gradient(135deg, #FF6B6B, #E74C3C); border-radius: 50%;"></div>'
        };
        return `<div style="display: flex; justify-content: center; align-items: center; padding: 30px;">${shapes[shapeName]}</div>`;
    }

    createPokeballVisual() {
        return `<div style="display: flex; justify-content: center; align-items: center;">
            <div class="pokeball-visual" style="width: 150px; height: 150px; animation: none;"></div>
        </div>`;
    }

    createPartitioningVisual(total, trainers) {
        let html = '<div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">';
        const each = total / trainers;

        for (let t = 0; t < trainers; t++) {
            html += '<div style="padding: 15px; border: 3px solid #3498DB; border-radius: 15px; background: #E3F2FD; text-align: center;">';
            html += `<div style="font-weight: bold; margin-bottom: 10px;">Trainer ${t + 1}</div>`;
            for (let i = 0; i < each; i++) {
                html += '<div class="pokemon-card" style="display: inline-block; margin: 5px; width: 50px; height: 70px; font-size: 1.5em;">⚡</div>';
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
        document.getElementById('standard-tag').textContent = problem.standard;
        document.getElementById('pokemon-problem-text').innerHTML = problem.text;
        document.getElementById('pokemon-visual').innerHTML = problem.visual;

        const strategySelector = document.getElementById('strategy-selector');
        if (problem.showStrategy) {
            strategySelector.style.display = 'block';
        } else {
            strategySelector.style.display = 'none';
        }

        document.getElementById('work-area').innerHTML = '';
    }

    selectStrategy(strategy) {
        this.selectedStrategy = strategy;
        document.querySelectorAll('.strategy-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');

        const workArea = document.getElementById('work-area');
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
                workArea.innerHTML = '<p style="font-size: 1.2em;">Draw circles or pictures to solve!</p>';
                break;
        }
    }

    showNumberLine() {
        const workArea = document.getElementById('work-area');
        let html = '<div class="number-line">';
        for (let i = 0; i <= 20; i++) {
            html += `<div class="number-line-item"><span style="font-size: 1.5em;">⚡</span><div class="number-line-number">${i}</div></div>`;
        }
        html += '</div>';
        workArea.innerHTML = html;
    }

    showTenFrame() {
        const workArea = document.getElementById('work-area');
        let html = '<div class="ten-frame">';
        for (let i = 0; i < 10; i++) {
            html += `<div class="ten-frame-cell" onclick="pokemonMath.toggleTenFrame(this)"></div>`;
        }
        html += '</div>';
        html += '<div class="ten-frame" style="margin-top: 15px;">';
        for (let i = 0; i < 10; i++) {
            html += `<div class="ten-frame-cell" onclick="pokemonMath.toggleTenFrame(this)"></div>`;
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
            cell.textContent = '⚡';
        }
    }

    checkPokemonAnswer() {
        const userAnswer = parseInt(document.getElementById('pokemon-answer').value);
        const feedback = document.getElementById('pokemon-feedback');

        if (isNaN(userAnswer)) {
            feedback.textContent = 'Please enter a number!';
            feedback.className = 'pokemon-feedback';
            feedback.style.color = '#FF9800';
            return;
        }

        if (userAnswer === this.currentAnswer) {
            this.pokeballCount++;
            this.updatePokeballDisplay();

            feedback.textContent = this.getRandomEncouragement('correct');
            feedback.className = 'pokemon-feedback correct';

            document.getElementById('pokemon-answer').disabled = true;
            document.getElementById('pokemon-check-btn').style.display = 'none';
            document.getElementById('pokemon-next-btn').style.display = 'inline-block';

            if (this.pokeballCount % 5 === 0) {
                this.showCelebration(`🎉 ${this.pokeballCount} Pokeballs! You're an amazing trainer! 🎉`);
            }
        } else {
            feedback.textContent = this.getRandomEncouragement('incorrect');
            feedback.className = 'pokemon-feedback incorrect';
        }
    }

    showPokemonHint() {
        const feedback = document.getElementById('pokemon-feedback');
        feedback.textContent = `💡 Hint: ${this.currentProblem.hint}`;
        feedback.className = 'pokemon-feedback';
        feedback.style.background = 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)';
        feedback.style.color = '#1976D2';
    }

    skipPokemonProblem() {
        const feedback = document.getElementById('pokemon-feedback');
        feedback.textContent = `The answer was ${this.currentAnswer}! Let's try another one! 📝`;
        feedback.className = 'pokemon-feedback';
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

    updatePokeballDisplay() {
        document.getElementById('pokeball-count').textContent = this.pokeballCount;
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

    getRandomPokemon() {
        return this.pokemonNames[Math.floor(Math.random() * this.pokemonNames.length)];
    }

    getRandomTrainer() {
        return this.trainerNames[Math.floor(Math.random() * this.trainerNames.length)];
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Initialize Pokemon Math when page loads
let pokemonMath;
document.addEventListener('DOMContentLoaded', () => {
    pokemonMath = new PokemonMath();
});
