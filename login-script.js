/**
 * مشروع إدارة المطاعم - سكريبت تسجيل الدخول
 * Login Script for Restaurant Management System
 * Integrated with Supabase PostgreSQL Users Table
 */

document.addEventListener('DOMContentLoaded', function() {
    loading.init();
    initializeLoginForm();
    initializeAuth();
});

/**
 * Initialize login form functionality
 */
function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleSignup = document.getElementById('toggleSignup');
    const toggleLogin = document.getElementById('toggleLogin');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');

    // Toggle between login and signup
    if (toggleSignup) {
        toggleSignup.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.classList.add('hidden');
            if (signupForm) signupForm.classList.remove('hidden');
        });
    }

    if (toggleLogin) {
        toggleLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupForm) signupForm.classList.add('hidden');
            if (loginForm) loginForm.classList.remove('hidden');
        });
    }

    // Password visibility toggle
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            passwordToggle.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSignup();
        });
    }
}

/**
 * Hash password using SHA-256
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Verify password against hash - supports multiple hashing methods
 */
async function verifyPassword(password, hash) {
    console.log('🔍 التحقق من كلمة المرور...');
    console.log('كلمة المرور المدخلة:', password);
    console.log('التجزئة المحفوظة:', hash);
    console.log('طول التجزئة:', hash.length);

    // Method 1: SHA-256 (new method)
    const sha256Hash = await hashPassword(password);
    console.log('SHA-256:', sha256Hash);
    if (sha256Hash === hash) {
        console.log('✅ تطابق SHA-256');
        return true;
    }

    // Method 2: Base64 (legacy method)
    const base64Hash = btoa(password);
    console.log('Base64:', base64Hash);
    if (base64Hash === hash) {
        console.log('✅ تطابق Base64');
        return true;
    }

    // Method 3: Plain text (for testing only - should be removed in production)
    console.log('plain text comparison:', password === hash);
    if (password === hash) {
        console.log('✅ تطابق نص عادي');
        return true;
    }

    console.log('❌ لم يتطابق أي تجزئة');
    return false;
}

/**
 * Fetch API helper for Supabase
 */
async function fetchAPI(endpoint, options = {}) {
    const SUPABASE_URL = 'https://putgtsdgeyqyptamwpnx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGd0c2RnZXlxeXB0YW13cG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODMxMzAsImV4cCI6MjA4Mjk1OTEzMH0.bo30DP6UxtpHSvKTCwtaUmkJR8aT-BNEhyrW35IKsVE';
    const method = (options.method || 'GET').toUpperCase();
    
    let resourcePath = endpoint;
    if (method === 'GET' && !/select=/i.test(endpoint)) {
        const separator = endpoint.includes('?') ? '&' : '?';
        resourcePath = `${endpoint}${separator}select=*`;
    }

    const url = `${SUPABASE_URL}/rest/v1/${resourcePath}`;

    try {
        const response = await fetch(url, {
            method: method,
            ...options,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        console.error('Fetch API Error:', error);
        return null;
    }
}

/**
 * Handle user login
 */
async function handleLogin() {
    console.log('🚀 handleLogin تم استدعاؤها');
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const restaurantId = document.getElementById('restaurantId')?.value.trim();

    console.log('📝 البيانات المدخلة:', { email, password: '****', restaurantId });

    const emailError = document.getElementById('emailError');
    const loginError = document.getElementById('loginError');

    // Clear previous errors
    if (emailError) emailError.classList.remove('show');
    if (loginError) loginError.classList.remove('show');

    // Validation
    if (!email || !password) {
        console.error('❌ بيانات فارغة');
        showError(loginError, '⚠️ الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }

    if (!utils.isValidEmail(email)) {
        console.error('❌ بريد غير صحيح');
        showError(emailError, '❌ البريد الإلكتروني غير صحيح');
        return;
    }

    loading.show();

    try {
        // Search for user by email in the users table
        let query = `users?email=eq.${encodeURIComponent(email)}&select=*`;
        console.log('🔍 البحث عن المستخدم بالبريد:', email);
        const users = await fetchAPI(query);

        console.log('📋 النتائج:', users);

        if (!users || users.length === 0) {
            console.error('❌ لم يتم العثور على المستخدم');
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        const user = users[0];
        console.log('👤 بيانات المستخدم:', user);

        // Verify password
        console.log('🔐 التحقق من كلمة المرور...');
        console.log('كلمة المرور المدخلة:', password);
        console.log('التجزئة المحفوظة:', user.password_hash);
        
        const passwordMatch = await verifyPassword(password, user.password_hash);
        console.log('✓ نتيجة التحقق:', passwordMatch);
        
        if (!passwordMatch) {
            console.error('❌ كلمة المرور غير صحيحة');
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('حسابك غير مفعل. يرجى التواصل مع الإدارة');
        }

        // Update last login
        await fetchAPI(`users?id=eq.${user.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                last_login: new Date().toISOString()
            })
        });

        // Store in localStorage
        localStorage.setItem('userId', user.id);
        localStorage.setItem('restaurantId', user.restaurant_id);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userFullName', user.full_name || '');
        localStorage.setItem('userRole', user.role || 'staff');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('supabaseUrl', 'https://putgtsdgeyqyptamwpnx.supabase.co');
        localStorage.setItem('supabaseKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGd0c2RnZXlxeXB0YW13cG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODMxMzAsImV4cCI6MjA4Mjk1OTEzMH0.bo30DP6UxtpHSvKTCwtaUmkJR8aT-BNEhyrW35IKsVE');

        // Login successful
        showSuccess('✅ تم تسجيل الدخول بنجاح!');
        
        // Redirect based on role
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'menu.html';
            }
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showError(loginError, `❌ ${error.message || 'خطأ في تسجيل الدخول'}`);
    } finally {
        loading.hide();
    }
}

/**
 * Handle user signup
 */
async function handleSignup() {
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const fullName = document.getElementById('fullName')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const restaurantName = document.getElementById('restaurantName')?.value.trim();

    const signupError = document.getElementById('signupError');
    if (signupError) signupError.classList.remove('show');

    // Validation
    if (!email || !password || !confirmPassword || !fullName || !restaurantName) {
        showError(signupError, '⚠️ الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    if (!utils.isValidEmail(email)) {
        showError(signupError, '❌ البريد الإلكتروني غير صحيح');
        return;
    }

    if (password !== confirmPassword) {
        showError(signupError, '❌ كلمات المرور غير متطابقة');
        return;
    }

    if (password.length < 8) {
        showError(signupError, '❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        return;
    }

    if (phone && !utils.isValidPhone(phone)) {
        showError(signupError, '❌ رقم الهاتف غير صحيح');
        return;
    }

    loading.show();

    try {
        // 1. Check if email already exists
        const existingUsers = await fetchAPI(`users?email=eq.${encodeURIComponent(email)}`);
        if (existingUsers && existingUsers.length > 0) {
            throw new Error('هذا البريد الإلكتروني مسجل بالفعل');
        }

        // 2. Create restaurant
        const restaurantResponse = await db.createRestaurant({
            name_ar: restaurantName,
            name_en: restaurantName,
            currency: 'ج.م',
            primary_color: '#5bbfc6'
        });

        if (!restaurantResponse || restaurantResponse.length === 0) {
            throw new Error('فشل إنشاء المطعم');
        }

        const newRestaurant = restaurantResponse[0];
        const restaurantId = newRestaurant.id;

        // 3. Create restaurant settings
        await db.createSettings({
            restaurant_id: restaurantId,
            restaurant_name_ar: restaurantName,
            restaurant_name_en: restaurantName,
            currency: 'ج.م',
            primary_color: '#5bbfc6'
        });

        // 4. Hash password
        const passwordHash = await hashPassword(password);

        // 5. Create user account in users table
        const newUserResponse = await fetchAPI('users', {
            method: 'POST',
            body: JSON.stringify({
                restaurant_id: restaurantId,
                email: email,
                password_hash: passwordHash,
                full_name: fullName,
                phone: phone || null,
                role: 'admin',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (!newUserResponse || newUserResponse.length === 0) {
            throw new Error('فشل إنشاء حساب المستخدم');
        }

        const newUser = newUserResponse[0];

        // 6. Store in localStorage
        localStorage.setItem('userId', newUser.id);
        localStorage.setItem('restaurantId', restaurantId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userFullName', fullName);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('supabaseUrl', 'https://putgtsdgeyqyptamwpnx.supabase.co');
        localStorage.setItem('supabaseKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGd0c2RnZXlxeXB0YW13cG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODMxMzAsImV4cCI6MjA4Mjk1OTEzMH0.bo30DP6UxtpHSvKTCwtaUmkJR8aT-BNEhyrW35IKsVE');

        showSuccess('✅ تم إنشاء الحساب بنجاح!');
        
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);
        showError(signupError, `❌ ${error.message || 'خطأ في إنشاء الحساب'}`);
    } finally {
        loading.hide();
    }
}

/**
 * Initialize authentication state
 */
function initializeAuth() {
    // Check if user is already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const role = localStorage.getItem('userRole');
        if (role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'menu.html';
        }
    }

    // Setup logout button if exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userId');
            localStorage.removeItem('restaurantId');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userFullName');
            localStorage.removeItem('userRole');
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }
}

/**
 * Show error message
 */
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
    console.error(message);
}

/**
 * Show success message
 */
function showSuccess(message) {
    utils.notify(message, 'success');
}

/**
 * Demo login for testing
 */
function demoLogin() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput && passwordInput) {
        emailInput.value = 'admin@restaurant.com';
        passwordInput.value = 'password123';
        handleLogin();
    }
}

