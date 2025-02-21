const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

loginBtn.addEventListener('click', () => {
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
});

signupBtn.addEventListener('click', () => {
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
});

const validateUsername = (username) => {
    if (username.length < 3) return 'Username must be at least 3 characters long';
    if (username.length > 20) return 'Username must be at most 20 characters long';
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, underscores, and hyphens';
    return '';
};

const validatePassword = (password) => {
    if (password.length < 6) return 'Password must be at least 6 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return '';
};

const setLoading = (form, isLoading) => {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.toggle('loading', isLoading);
    submitBtn.disabled = isLoading;
};

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm.querySelector('input[type="text"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));

    setLoading(loginForm, true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            window.location.href = '/home/home.html';
        } else {
            loginForm.querySelector('#loginPasswordError').textContent = data.error;
            loginForm.querySelector('input[type="password"]').classList.add('error');
        }
    } catch (error) {
        alert('Error connecting to server');
    } finally {
        setLoading(loginForm, false);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = signupForm.querySelector('input[type="text"]').value;
    const password = signupForm.querySelector('input[type="password"]').value;
    const confirmPassword = signupForm.querySelectorAll('input[type="password"]')[1].value;

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));

    if (password !== confirmPassword) {
        signupForm.querySelector('#confirmPasswordError').textContent = 'Passwords do not match';
        return;
    }

    setLoading(signupForm, true);
    
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Account created successfully! Please login.');
            loginBtn.click();
        } else {
            signupForm.querySelector('#signupUsernameError').textContent = data.error;
            signupForm.querySelector('input[type="text"]').classList.add('error');
        }
    } catch (error) {
        alert('Error connecting to server');
    } finally {
        setLoading(signupForm, false);
    }
});