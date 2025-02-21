document.addEventListener('DOMContentLoaded', async () => {
    const messageInput = document.querySelector('.message-input input');
    const sendButton = document.querySelector('.send-btn');
    const messagesContainer = document.querySelector('.messages-container');
    const chatList = document.querySelector('.chat-list');
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar-btn');
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    const ws = new WebSocket('ws://localhost:3001');
    let currentChat = null;
    let users = [];

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'auth',
            token
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'history':
                displayMessages(data.messages);
                break;
            case 'message':
                if (currentChat === data.message.from) {
                    appendMessage(data.message);
                }
                updateChatPreview(data.message);
                break;
        }
    };

    const welcomeChat = document.querySelector('.chat-item');
    welcomeChat.addEventListener('click', () => {
        document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
        welcomeChat.classList.add('active');
        currentChat = null;
        document.querySelector('.current-chat-info h3').textContent = 'Welcome!';
        messagesContainer.innerHTML = '';
        const welcomeMessage = createMessageElement({
            text: 'Welcome to Chatter! 👋\n\nThis is a modern chat application where you can:\n• Connect with friends\n• Share messages and files\n• Create group chats\n• And much more!\n\nGet started by clicking on a user to start chatting! 🚀',
            sent: false,
            timestamp: 'Just now'
        });
        messagesContainer.appendChild(welcomeMessage);
    });

    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error fetching users:', error);
    }

    function displayUsers(users) {
        const currentUsername = localStorage.getItem('username');
        users.forEach(user => {
            if (user.username === currentUsername) return;
            
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.userId = user.id;
            chatItem.innerHTML = `
                <img src="https://via.placeholder.com/32" alt="${user.username}">
                <div class="chat-info">
                    <h4>${user.username}</h4>
                    <p>Click to start chatting</p>
                </div>
            `;
            chatList.appendChild(chatItem);

            chatItem.addEventListener('click', () => {
                document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
                chatItem.classList.add('active');
                currentChat = user.id;
                document.querySelector('.current-chat-info h3').textContent = user.username;
                ws.send(JSON.stringify({
                    type: 'auth',
                    token: localStorage.getItem('token')
                }));
            });
        });
    }

    function createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.sent ? 'sent' : 'received'}`;
        div.innerHTML = `
            <div class="message-bubble">
                <p>${message.text}</p>
                <span class="timestamp">${message.timestamp}</span>
            </div>
        `;
        return div;
    }

    function displayMessages(messages) {
        if (!currentChat) return; 
        
        messagesContainer.innerHTML = '';
        const relevantMessages = messages.filter(msg => 
            (msg.from === currentChat && msg.to === getUserId()) || 
            (msg.to === currentChat && msg.from === getUserId())
        );

        relevantMessages.forEach(message => {
            const messageElement = createMessageElement({
                text: message.text,
                sent: message.from === getUserId(),
                timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            messagesContainer.appendChild(messageElement);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function getUserId() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    }

    function appendMessage(message) {
        if (!currentChat) return; 
        
        const messageElement = createMessageElement({
            text: message.text,
            sent: message.from === getUserId(),
            timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function updateChatPreview(message) {
        const chatItem = document.querySelector(`.chat-item[data-user-id="${message.from}"]`);
        if (chatItem) {
            const preview = chatItem.querySelector('p');
            preview.textContent = message.text.substring(0, 30) + (message.text.length > 30 ? '...' : '');
        }
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (text && currentChat) {
            const message = {
                type: 'message',
                to: currentChat,
                text,
                timestamp: new Date().toISOString()
            };

            // Send to server
            ws.send(JSON.stringify(message));

            // Immediately display the message
            const messageElement = createMessageElement({
                text: message.text,
                sent: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Clear input
            messageInput.value = '';
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Remove this block as it's using undefined chatItems
    // chatItems.forEach(item => {
    //     item.addEventListener('click', () => {
    //         chatItems.forEach(i => i.classList.remove('active'));
    //         item.classList.add('active');
    //     });
    // });

    // Replace with this updated toggle button listener
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        const icon = toggleSidebarBtn.querySelector('i');
        if (sidebar.classList.contains('hidden')) {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        }
        console.log('Sidebar toggled'); // Add this to debug
    });

    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.add('hidden');
            }
        });
    });

    const style = document.createElement('style');
    style.textContent = `
        .messages-container {
            padding: 20px;
        }
        
        .message {
            display: flex;
            margin-bottom: 16px;
            padding: 0 10px;
        }
        
        .message.sent {
            justify-content: flex-end;
        }
        
        .message.received {
            justify-content: flex-start;
        }
        
        .message-content {
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 18px;
            position: relative;
        }
        
        .message.sent .message-content {
            background-color: var(--primary-green);
            color: var(--black);
            margin-left: auto;
            border-bottom-right-radius: 4px;
        }
        
        .message.received .message-content {
            background-color: var(--gray);
            color: var(--primary-green);
            margin-right: auto;
            border-bottom-left-radius: 4px;
        }
        
        .message-content p {
            margin: 0;
            line-height: 1.4;
        }
        
        .timestamp {
            font-size: 0.7em;
            margin-top: 4px;
            display: block;
            color: var(--light-gray);
            text-align: right;
        }
        
        .messages-container::-webkit-scrollbar {
            width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-track {
            background: var(--lighter-gray);
        }
        
        .messages-container::-webkit-scrollbar-thumb {
            background: var(--gray);
            border-radius: 3px;
        }

        // Add this CSS modification to make the toggle button always visible
        .toggle-sidebar-btn {
            display: block !important; // Override the previous display: none
        }
    `;
    document.head.appendChild(style);
});
