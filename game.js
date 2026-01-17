class MathGame {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.level = 1;
        this.currentQuestion = null;
        this.currentAnswer = null;
        this.gameMode = null;
        this.questionCount = 0;

        this.encouragements = {
            correct: [
                "🌟 Awesome!",
                "🎉 Perfect!",
                "⭐ You're a math star!",
                "🚀 Amazing!",
                "💫 Brilliant!",
                "🎯 Excellent!",
                "🏆 Outstanding!",
                "✨ Fantastic!",
                "🎪 Spectacular!",
                "🌈 Wonderful!"
            ],
            incorrect: [
                "Not quite! Try again! 💪",
                "Almost there! Keep going! 🌟",
                "Good try! You can do it! 💫",
                "So close! One more time! ⭐",
                "Nice effort! Try again! 🚀"
            ],
            milestone: [
                "🎉 You've reached 10 points! Keep going!",
                "🌟 Amazing! 25 points! You're doing great!",
                "🚀 Wow! 50 points! You're a math superstar!",
                "🏆 Incredible! 100 points! You're unstoppable!"
            ]
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showStartScreen();
    }

    setupEventListeners() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.startGame(e.target.dataset.mode);
            });
        });

        // Answer submission
        document.getElementById('submit-btn').addEventListener('click', () => {
            this.checkAnswer();
        });

        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // Game controls
        document.getElementById('skip-btn').addEventListener('click', () => {
            this.skipQuestion();
        });

        document.getElementById('hint-btn').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitGame();
        });
    }

    showStartScreen() {
        document.getElementById('start-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
    }

    startGame(mode) {
        this.gameMode = mode;
        this.score = 0;
        this.streak = 0;
        this.level = 1;
        this.questionCount = 0;

        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');

        this.updateScoreBoard();
        this.generateQuestion();
    }

    generateQuestion() {
        this.questionCount++;
        const mode = this.gameMode === 'mixed' ? this.getRandomMode() : this.gameMode;

        let num1, num2, operator, answer;

        switch (mode) {
            case 'addition':
                num1 = this.getRandomNumber(1, 10 + this.level * 5);
                num2 = this.getRandomNumber(1, 10 + this.level * 5);
                operator = '+';
                answer = num1 + num2;
                break;

            case 'subtraction':
                num1 = this.getRandomNumber(10 + this.level * 5, 20 + this.level * 5);
                num2 = this.getRandomNumber(1, num1);
                operator = '-';
                answer = num1 - num2;
                break;

            case 'multiplication':
                num1 = this.getRandomNumber(1, 5 + Math.floor(this.level / 2));
                num2 = this.getRandomNumber(1, 10);
                operator = '×';
                answer = num1 * num2;
                break;
        }

        this.currentQuestion = `${num1} ${operator} ${num2}`;
        this.currentAnswer = answer;

        document.getElementById('question').textContent = `${this.currentQuestion} = ?`;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').className = 'feedback';

        // Clear options container for typed answers
        document.getElementById('options-container').innerHTML = '';

        // Occasionally show multiple choice for variety
        if (this.questionCount % 5 === 0) {
            this.showMultipleChoice(answer);
        }
    }

    showMultipleChoice(correctAnswer) {
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        // Hide input and submit button
        document.querySelector('.answer-input-container').style.display = 'none';

        // Generate 4 options
        const options = [correctAnswer];
        while (options.length < 4) {
            const offset = this.getRandomNumber(-10, 10);
            const wrongAnswer = correctAnswer + offset;
            if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
                options.push(wrongAnswer);
            }
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        // Create option buttons
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => {
                this.checkAnswerValue(option);
            });
            optionsContainer.appendChild(btn);
        });
    }

    getRandomMode() {
        const modes = ['addition', 'subtraction', 'multiplication'];
        return modes[Math.floor(Math.random() * modes.length)];
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    checkAnswer() {
        const userAnswer = parseInt(document.getElementById('answer-input').value);
        this.checkAnswerValue(userAnswer);
    }

    checkAnswerValue(userAnswer) {
        const feedback = document.getElementById('feedback');

        if (userAnswer === this.currentAnswer) {
            // Correct answer
            this.score += 10 * this.level;
            this.streak++;

            if (this.streak % 5 === 0) {
                this.level++;
            }

            feedback.textContent = this.getRandomEncouragement('correct');
            feedback.className = 'feedback correct';

            this.updateScoreBoard();

            // Check for milestones
            this.checkMilestone();

            setTimeout(() => {
                document.querySelector('.answer-input-container').style.display = 'flex';
                this.generateQuestion();
            }, 1500);
        } else {
            // Incorrect answer
            this.streak = 0;
            feedback.textContent = this.getRandomEncouragement('incorrect');
            feedback.className = 'feedback incorrect';

            this.updateScoreBoard();
        }
    }

    getRandomEncouragement(type) {
        const encouragements = this.encouragements[type];
        return encouragements[Math.floor(Math.random() * encouragements.length)];
    }

    checkMilestone() {
        const milestones = [10, 25, 50, 100];
        const milestoneIndex = milestones.findIndex(m => this.score >= m && this.score < m + 10);

        if (milestoneIndex !== -1) {
            this.showCelebration(this.encouragements.milestone[milestoneIndex]);
        }
    }

    showCelebration(message) {
        const celebration = document.getElementById('celebration');
        const celebrationMessage = document.getElementById('celebration-message');

        celebrationMessage.textContent = message;
        celebration.classList.remove('hidden');

        setTimeout(() => {
            celebration.classList.add('hidden');
        }, 2000);
    }

    skipQuestion() {
        const feedback = document.getElementById('feedback');
        feedback.textContent = `The answer was ${this.currentAnswer}! 📝`;
        feedback.className = 'feedback';
        feedback.style.color = '#ff9800';

        this.streak = 0;
        this.updateScoreBoard();

        setTimeout(() => {
            document.querySelector('.answer-input-container').style.display = 'flex';
            this.generateQuestion();
        }, 2000);
    }

    showHint() {
        const feedback = document.getElementById('feedback');
        const answer = this.currentAnswer;

        // Give a range hint
        const lower = Math.max(0, answer - 5);
        const upper = answer + 5;

        feedback.textContent = `💡 Hint: The answer is between ${lower} and ${upper}!`;
        feedback.className = 'feedback';
        feedback.style.color = '#2196f3';
    }

    updateScoreBoard() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('level').textContent = this.level;
    }

    quitGame() {
        if (confirm('Are you sure you want to quit? Your progress will be saved!')) {
            this.showStartScreen();
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MathGame();
});
