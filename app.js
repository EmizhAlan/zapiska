// app.js
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import {
    getDatabase,
    ref,
    push,
    onValue,
    query,
    orderByChild,
    limitToLast
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD2oybJHi0sumge2iTf2MHpytxDtZV27Ic",
    authDomain: "my-chat-app-e0f5c.firebaseapp.com",
    projectId: "my-chat-app-e0f5c",
    storageBucket: "my-chat-app-e0f5c.firebasestorage.app",
    messagingSenderId: "1079125306499",
    appId: "1:1079125306499:web:b6e51161e1b342d1c73fb6",
    measurementId: "G-75L93RZ386"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM-элементы
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const usernameInput = document.getElementById('username');
const authError = document.getElementById('auth-error');
const chatError = document.getElementById('chat-error');
const signUpBtn = document.getElementById('sign-up');
const signInBtn = document.getElementById('sign-in');
const signOutBtn = document.getElementById('sign-out');
const sendMessageBtn = document.getElementById('send-message');

// Слушатель аутентификации
onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        loadMessages();
    } else {
        authContainer.style.display = 'block';
        chatContainer.style.display = 'none';
        messagesDiv.innerHTML = '';
    }
});

// Регистрация с именем
signUpBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const username = usernameInput.value.trim() || 'Аноним';

    authError.textContent = '';
    if (!email || !password) {
        authError.textContent = 'Введите email и пароль';
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return updateProfile(userCredential.user, {
                displayName: username
            });
        })
        .then(() => {
            authError.textContent = `✅ Добро пожаловать, ${auth.currentUser.displayName}!`;
        })
        .catch((error) => {
            authError.textContent = 'Ошибка: ' + error.message;
        });
});

// Вход
signInBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    authError.textContent = '';
    if (!email || !password) {
        authError.textContent = 'Введите email и пароль';
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            authError.textContent = 'Ошибка: ' + error.message;
        });
});

// Выход
signOutBtn.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            authError.textContent = 'Вы вышли из чата';
        })
        .catch((error) => {
            authError.textContent = 'Ошибка: ' + error.message;
        });
});

// Отправка сообщения
function sendMessage() {
    const text = messageInput.value.trim();
    chatError.textContent = '';
    if (!text) {
        chatError.textContent = 'Введите сообщение';
        return;
    }
    const user = auth.currentUser;
    if (!user) {
        chatError.textContent = 'Сначала войдите!';
        return;
    }

    const messageData = {
        text,
        userId: user.uid,
        userName: user.displayName || 'Аноним',
        timestamp: Date.now()
    };

    push(ref(database, 'messages'), messageData)
        .then(() => {
            messageInput.value = '';
        })
        .catch((error) => {
            chatError.textContent = 'Ошибка: ' + error.message;
        });
}

// Кнопка "Отправить"
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Загрузка сообщений
function loadMessages() {
    const messagesRef = ref(database, 'messages');
    const q = query(messagesRef, orderByChild('timestamp'), limitToLast(100));
    onValue(q, (snapshot) => {
        messagesDiv.innerHTML = '';
        snapshot.forEach((child) => {
            const message = child.val();
            displayMessage(message);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Отображение сообщения
function displayMessage(message) {
    const user = auth.currentUser;
    const el = document.createElement('div');
    el.classList.add('message');
    el.classList.add(message.userId === user?.uid ? 'my-message' : 'other-message');

    const time = new Date(message.timestamp).toLocaleTimeString();
    el.innerHTML = `
        <strong>${message.userName}</strong> <small>(${time})</small><br>
        ${message.text}
    `;
    messagesDiv.appendChild(el);
}