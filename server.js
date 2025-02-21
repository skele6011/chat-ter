const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;
const WS_PORT = 3001;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

app.use(express.json());
app.use(express.static('.'));

// Data storage
const USER_DB_PATH = path.join(__dirname, 'data', 'users.json');
const CHATS_DB_PATH = path.join(__dirname, 'data', 'chats.json');

async function initializeDB() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        try {
            await fs.access(USER_DB_PATH);
            await fs.access(CHATS_DB_PATH);
        } catch {
            await fs.writeFile(USER_DB_PATH, '[]');
            await fs.writeFile(CHATS_DB_PATH, '{}');
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

async function getChats() {
    const data = await fs.readFile(CHATS_DB_PATH, 'utf8');
    return JSON.parse(data);
}

async function saveChats(chats) {
    await fs.writeFile(CHATS_DB_PATH, JSON.stringify(chats, null, 2));
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

// Add new REST endpoints
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await getUsers();
        const userList = users.map(u => ({
            id: u.id,
            username: u.username
        }));
        res.json(userList);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

// Store active connections
const clients = new Map();

// WebSocket connection handler
wss.on('connection', async (ws) => {
    let userId = null;

    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'auth':
                try {
                    const verified = jwt.verify(data.token, JWT_SECRET);
                    userId = verified.id;
                    clients.set(userId, ws);
                    
                    // Send existing messages
                    const chats = await getChats();
                    const userChats = chats[userId] || [];
                    ws.send(JSON.stringify({
                        type: 'history',
                        messages: userChats
                    }));
                } catch (error) {
                    ws.close();
                }
                break;

            case 'message':
                if (!userId) return;

                const newMessage = {
                    from: userId,
                    to: data.to,
                    text: data.text,
                    timestamp: new Date().toISOString()
                };

                // Save message
                const chats = await getChats();
                if (!chats[userId]) chats[userId] = [];
                if (!chats[data.to]) chats[data.to] = [];
                
                chats[userId].push(newMessage);
                chats[data.to].push(newMessage);
                await saveChats(chats);

                // Send to recipient if online
                const recipientWs = clients.get(data.to);
                if (recipientWs) {
                    recipientWs.send(JSON.stringify({
                        type: 'message',
                        message: newMessage
                    }));
                }
                break;
        }
    });

    ws.on('close', () => {
        if (userId) {
            clients.delete(userId);
        }
    });
});

// Initialize and start servers
initializeDB().then(() => {
    app.listen(PORT, () => {
        console.log(`HTTP Server running on http://localhost:${PORT}`);
        console.log(`WebSocket Server running on ws://localhost:${WS_PORT}`);
    });
});
