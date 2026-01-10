/**
 * مشروع إدارة المطاعم - سكريبت تسجيل الدخول
 * Login Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase config inputs
    document.getElementById('supabaseUrl').value = localStorage.getItem('supabaseUrl') || SUPABASE_CONFIG.URL;
    document.getElementById('supabaseKey').value = localStorage.getItem('supabaseKey') || '';
});

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.target;
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => errorDiv.classList.remove('show'), 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.add('show');
    setTimeout(() => successDiv.classList.remove('show'), 5000);
}

// Clear messages
function clearMessages() {
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('successMessage').classList.remove('show');
}

// Save Supabase configuration
function saveSupabaseConfig() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();

    if (!url || !key) {
        showError('الرجاء إدخال جميع حقول الإعدادات');
        return;
    }

    localStorage.setItem('supabaseUrl', url);
    localStorage.setItem('supabaseKey', key);
    
    showSuccess('تم حفظ الإعدادات بنجاح');
    
    // Update global config
    SUPABASE_CONFIG.URL = url;
    SUPABASE_CONFIG.KEY = key;
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    clearMessages();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email || !password) {
        showError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading-spinner"></span>جاري تسجيل الدخول...';

    try {
        // Check if Supabase config is set
        if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.KEY) {
            throw new Error('الرجاء تكوين إعدادات Supabase أولاً');
        }

        // Authenticate user
        const user = await db.authenticateUser(email, password);

        if (user) {
            // Set session
            session.setSession(user.id, user.restaurant_id, user.role, user.full_name, email);
            
            // Save restaurant ID if remember me is checked
            if (rememberMe) {
                localStorage.setItem('restaurantId', user.restaurant_id);
            }

            showSuccess('تم تسجيل الدخول بنجاح');

            // Redirect based on role
            setTimeout(() => {
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'menu.html';
                }
            }, 1000);
        } else {
            showError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('فشل تسجيل الدخول: ' + error.message);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
    }
}
