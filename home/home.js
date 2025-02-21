document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.querySelector('.message-input input');
    const sendButton = document.querySelector('.send-btn');
    const messagesContainer = document.querySelector('.messages-container');
    const chatItems = document.querySelectorAll('.chat-item');

    // Sample messages for demo
    const messages = [
        { 
            text: 'Welcome to Chatter! 👋\n\nThis is a modern chat application where you can:\n• Connect with friends\n• Share messages and files\n• Create group chats\n• And much more!\n\nGet started by adding contacts or joining groups. Happy chatting! 🚀', 
            sent: false, 
            timestamp: 'Just now' 
        }
    ];

    function createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.sent ? 'sent' : 'received'}`;
        div.innerHTML = `
            <div class="message-content">
                <p>${message.text}</p>
                <span class="timestamp">${message.timestamp}</span>
            </div>
        `;
        return div;
    }

    // Display initial messages
    messages.forEach(message => {
        messagesContainer.appendChild(createMessageElement(message));
    });

    // Send message functionality
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text) {
            const message = {
                text,
                sent: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            messagesContainer.appendChild(createMessageElement(message));
            messageInput.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Chat item selection
    chatItems.forEach(item => {
        item.addEventListener('click', () => {
            chatItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Add these styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .message {
            display: flex;
            margin-bottom: 10px;
        }
        .message.sent {
            justify-content: flex-end;
        }
        .message-content {
            max-width: 70%;
            padding: 10px;
            border-radius: 10px;
            background-color: var(--gray);
            color: var(--primary-green);
        }
        .message.sent .message-content {
            background-color: var(--primary-green);
            color: var(--lighter-gray);
        }
        .timestamp {
            font-size: 0.7em;
            color: var(--light-gray);
            margin-top: 5px;
            display: block;
        }
    `;
    document.head.appendChild(style);
});
