const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db_config');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// JWT secret key
const JWT_SECRET = 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Error creating user' });
            }
            res.status(201).json({ message: 'User created successfully' });
        });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, balance: user.balance });
    });
});

// Get user balance
app.get('/api/balance', authenticateToken, (req, res) => {
    db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ balance: row.balance });
    });
});

// Cash in
app.post('/api/cash-in', authenticateToken, (req, res) => {
    const { amount } = req.body;
    
    db.run('UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, row) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                db.run('INSERT INTO transactions (user_id, type, amount, balance_after) VALUES (?, ?, ?, ?)',
                    [req.user.id, 'cash_in', amount, row.balance]);
                
                res.json({ balance: row.balance });
            });
        });
});

// Cash out
app.post('/api/cash-out', authenticateToken, (req, res) => {
    const { amount } = req.body;
    
    db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (row.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        db.run('UPDATE users SET balance = balance - ? WHERE id = ?',
            [amount, req.user.id],
            function(err) {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, row) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    
                    db.run('INSERT INTO transactions (user_id, type, amount, balance_after) VALUES (?, ?, ?, ?)',
                        [req.user.id, 'cash_out', amount, row.balance]);
                    
                    res.json({ balance: row.balance });
                });
            });
    });
});

// Record game result
app.post('/api/game-result', authenticateToken, (req, res) => {
    const { betAmount, level, won, prizeAmount } = req.body;
    
    db.run('INSERT INTO game_history (user_id, bet_amount, level, won, prize_amount) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, betAmount, level, won, prizeAmount],
        function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Game result recorded' });
        });
});

// Get transaction history
app.get('/api/transactions', authenticateToken, (req, res) => {
    db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(rows);
        });
});

// Get game history
app.get('/api/game-history', authenticateToken, (req, res) => {
    db.all('SELECT * FROM game_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(rows);
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 