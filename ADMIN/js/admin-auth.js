// FoodHub Admin Auth Logic (Simple Mode)

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in or needs redirect
    checkSession();

    const loginForm = document.getElementById('loginForm');
    const authError = document.getElementById('authError');
    const loginBtn = document.getElementById('loginBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            // Reset state
            if (authError) {
                authError.style.display = 'none';
                authError.textContent = '';
            }

            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Verifying...';
            }

            try {
                // Query the 'admin_credentials' table directly
                const { data, error } = await supabase
                    .from('admin_credentials')
                    .select('*')
                    .eq('username', usernameInput)
                    .eq('password', passwordInput)
                    .single();

                if (error || !data) {
                    throw new Error('Invalid username or password');
                }

                // Success -> Set LocalStorage Session
                localStorage.setItem('foodhub_admin_session', 'true');
                localStorage.setItem('foodhub_admin_user', data.username);

                // Redirect
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error('Login Error:', error);
                if (authError) {
                    authError.textContent = 'Invalid credentials. Please try again.';
                    authError.style.display = 'block';
                }
            } finally {
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Login to Dashboard';
                }
            }
        });
    }

    // Bind Logout Button if present
    const logoutBtn = document.querySelector('.sidebar-user button') || document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

function checkSession() {
    const isLoggedIn = localStorage.getItem('foodhub_admin_session') === 'true';
    const path = window.location.pathname;
    const isLoginPage = path.includes('index.html') || path.endsWith('/ADMIN/') || path.endsWith('/admin/');

    if (isLoginPage) {
        if (isLoggedIn) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // We are on an internal page (dashboard, menu, etc)
        if (!isLoggedIn) {
            window.location.href = 'index.html';
        }
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('foodhub_admin_session');
        localStorage.removeItem('foodhub_admin_user');
        window.location.href = 'index.html';
    }
}
