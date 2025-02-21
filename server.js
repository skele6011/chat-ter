const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

app.use(express.json());
app.use(express.static('.'));

// Data storage
const USER_DB_PATH = path.join(__dirname, 'data', 'users.json');

async function initializeDB() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        try {
            await fs.access(USER_DB_PATH);
        } catch {
            await fs.writeFile(USER_DB_PATH, '[]');
        }
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

async function getUsers() {
    const data = await fs.readFile(USER_DB_PATH, 'utf8');
    return JSON.parse(data);
}

async function saveUsers(users) {
    await fs.writeFile(USER_DB_PATH, JSON.stringify(users, null, 2));
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
}

// Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await getUsers();

        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            username,
            password: hashedPassword
        };

        users.push(newUser);
        await saveUsers(users);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await getUsers();
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Protected route example
app.get('/api/user', authenticateToken, (req, res) => {
    res.json(req.user);
});

// Initialize and start server
initializeDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
