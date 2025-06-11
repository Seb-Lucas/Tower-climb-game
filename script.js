class TowerGame {
    constructor() {
        this.balance = 0;
        this.currentLevel = 0;
        this.stackedPrize = 0;
        this.betAmount = 10;
        this.maxLevels = 10;
        this.multiplier = 1.5;
        this.levelMultipliers = [];
        this.lastMultiplier = null;
        this.initializeElements();
        this.initializeEventListeners();
        this.showGameContent();
    }

    initializeElements() {
        this.gameContent = document.getElementById('gameContent');
        this.balanceElement = document.getElementById('balance');
        this.currentPrizeElement = document.getElementById('currentPrize');
        this.currentLevelElement = document.getElementById('currentLevel');
        this.betAmountInput = document.getElementById('betAmount');
        this.towerElement = document.getElementById('tower');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.transactionsList = document.getElementById('transactionsList');
        this.gameHistoryList = document.getElementById('gameHistoryList');
        this.takePrizeBtn = document.getElementById('takePrizeBtn');
        this.cashOutAmountInput = document.getElementById('cashOutAmount');
        this.lastMultiplierElement = document.getElementById('lastMultiplier');
        this.balanceCashOutAmountInput = document.getElementById('balanceCashOutAmount');
    }

    initializeEventListeners() {
        document.getElementById('cashInBtn').addEventListener('click', () => this.showCashInModal());
        document.getElementById('cashOutBtn').addEventListener('click', () => this.cashOut());
        document.getElementById('topUpBtn').addEventListener('click', () => this.topUp());
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.hideModal());
        this.betAmountInput.addEventListener('change', (e) => this.updateBetAmount(e.target.value));
        this.takePrizeBtn.addEventListener('click', () => this.takePrize());
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e));
        });
    }

    showGameContent() {
        this.gameContent.classList.remove('hidden');
        this.generateTower();
        this.updateUI();
    }

    generateTower() {
        this.towerElement.innerHTML = '';
        for (let i = 0; i < this.maxLevels; i++) {
            const level = document.createElement('div');
            level.className = 'tower-level';
            level.textContent = `Level ${i + 1}`;
            level.dataset.level = i;
            level.addEventListener('click', () => this.handleLevelClick(i));
            this.towerElement.appendChild(level);
        }
        this.updateTowerUI();
    }

    updateBetAmount(amount) {
        this.betAmount = Math.max(1, Math.min(amount, this.balance));
        this.betAmountInput.value = this.betAmount;
    }

    showCashInModal() {
        const amount = prompt('Enter amount to cash in:');
        if (amount && !isNaN(amount) && amount > 0) {
            this.balance += parseFloat(amount);
            this.updateUI();
        }
    }

    cashOut() {
        const amount = parseFloat(this.balanceCashOutAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            this.showModal('Info', 'Please enter a valid cash out amount.');
            return;
        }
        if (amount > this.balance) {
            this.showModal('Info', 'You cannot cash out more than your balance.');
            return;
        }
        if (this.balance > 0 && amount > 0) {
            this.balance -= amount;
            this.showModal('Success', `You have cashed out $${amount.toFixed(2)}`);
            this.resetGame();
        } else {
            this.showModal('Error', 'No balance to cash out');
        }
        this.updateUI();
    }

    topUp() {
        const amount = prompt('Enter amount to top up:');
        if (amount && !isNaN(amount) && amount > 0) {
            this.balance += parseFloat(amount);
            this.updateUI();
        }
    }

    async handleLevelClick(level) {
        if (level !== this.currentLevel) return;
        if (this.currentLevel === 0) {
            if (this.balance < this.betAmount) {
                this.showModal('Error', 'Insufficient balance');
                return;
            }
            this.balance -= this.betAmount;
            this.stackedPrize = 0;
            this.lastMultiplier = null;
            this.levelMultipliers = [];
        }
        // Generate a random multiplier between 1.1 and 2.0 (rounded to 2 decimals)
        const multiplier = Math.round((Math.random() * 0.9 + 1.1) * 100) / 100;
        this.lastMultiplier = multiplier;
        this.levelMultipliers[this.currentLevel] = multiplier;
        const levelPrize = this.betAmount * multiplier;
        const isSuccess = Math.random() < 0.7;
        if (isSuccess) {
            this.stackedPrize = (this.stackedPrize + levelPrize) * multiplier;
            this.currentLevel++;
            this.showModal(
                'Success',
                `You climbed to level ${this.currentLevel}!<br>Multiplier: <b>x${multiplier}</b><br>Prize stacked: $${this.stackedPrize.toFixed(2)}`,
                { bigMultiplier: `x${multiplier}` }
            );
        } else {
            this.showModal('Game Over', `You fell! You lost your stacked prize of $${this.stackedPrize.toFixed(2)}.`);
            this.stackedPrize = 0;
            this.resetGame();
        }
        this.updateUI();
        this.updateTowerUI();
    }

    takePrize() {
        const amount = parseFloat(this.cashOutAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            this.showModal('Info', 'Please enter a valid cash out amount.');
            return;
        }
        if (amount > this.stackedPrize) {
            this.showModal('Info', 'You cannot cash out more than your stacked prize.');
            return;
        }
        if (this.stackedPrize > 0 && amount > 0) {
            this.balance += amount;
            this.stackedPrize -= amount;
            this.showModal('Congratulations!', `You took $${amount.toFixed(2)} from your stacked prize! Remaining stack: $${this.stackedPrize.toFixed(2)}`);
            if (this.stackedPrize === 0) {
                this.resetGame();
            }
            this.updateUI();
        } else {
            this.showModal('Info', 'No stacked prize to take.');
        }
    }

    resetGame() {
        this.currentLevel = 0;
        this.stackedPrize = 0;
        this.generateTower();
        this.updateUI();
    }

    updateUI() {
        this.balanceElement.textContent = this.balance.toFixed(2);
        this.currentPrizeElement.textContent = this.stackedPrize.toFixed(2);
        this.currentLevelElement.textContent = this.currentLevel;
        this.lastMultiplierElement.textContent = this.lastMultiplier ? `x${this.lastMultiplier}` : '-';
        this.updateTowerUI();
    }

    updateTowerUI() {
        const levels = this.towerElement.querySelectorAll('.tower-level');
        levels.forEach((level, index) => {
            level.className = 'tower-level';
            let multiplierText = '';
            if (this.levelMultipliers[index] && (index < this.currentLevel || index === this.currentLevel)) {
                multiplierText = `<span class='level-multiplier'>x${this.levelMultipliers[index]}</span>`;
            }
            level.innerHTML = `${index === this.currentLevel ? '<span class=\"player-icon\">🧗</span> ' : ''}Level ${index + 1} ${multiplierText}`;
            if (index < this.currentLevel) {
                level.classList.add('completed');
            } else if (index === this.currentLevel) {
                level.classList.add('active');
            }
        });
    }

    switchTab(e) {
        const tabName = e.target.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    showModal(title, message, options = {}) {
        this.modalTitle.textContent = title;
        if (options.bigMultiplier) {
            // Insert big multiplier and confetti
            this.modalMessage.innerHTML = `
                <span class="big-multiplier">${options.bigMultiplier}</span>
                <div style="margin-bottom:1rem;"></div>
                ${message}
            `;
            this.launchConfetti();
        } else {
            this.modalMessage.innerHTML = message;
        }
        this.modal.style.display = 'flex';
    }

    launchConfetti() {
        // Remove old confetti if any
        const old = document.querySelector('.confetti');
        if (old) old.remove();
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.background = `hsl(${Math.random()*360},90%,60%)`;
            piece.style.animationDelay = (Math.random() * 0.7) + 's';
            confetti.appendChild(piece);
        }
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1800);
    }

    hideModal() {
        this.modal.style.display = 'none';
    }
}

window.addEventListener('load', () => {
    const game = new TowerGame();
}); 