// ====================================
// UTILS - Helper Functions
// ====================================

/**
 * Log info to console if debug mode is on
 */
function logInfo(message, data = '') {
    if (DEBUG_MODE) {
        console.log(`ℹ️ [Info] ${message}`, data);
    }
}

/**
 * Log error to console
 */
function logError(error, context = '') {
    console.error(`❌ [Error] ${context}:`, error);
}

/**
 * Get query parameter from URL
 */
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// ===== PHONE FORMATTING =====

/**
 * Format phone number for display
 * Input: "08012345678" → Output: "080 1234 5678"
 */
function formatPhoneDisplay(phone) {
    let cleaned = phone.replace(/\D/g, '');

    // If it's 11 digits starting with 0, or 10 digits (we'll add leading 0 for display)
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return `0${cleaned.slice(1, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
    }
    if (cleaned.length === 10) {
        return `0${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
}

/**
 * Format phone with country code
 * Input: "08012345678" → Output: "+2348012345678"
 */
function formatPhoneWithCode(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return '+234' + cleaned;
    }
    return phone;
}

/**
 * Validate phone number
 * Returns true if 10 digits
 */
function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    // Accept 10 digits (e.g. 803...) or 11 digits starting with 0 (e.g. 0803...)
    return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('0'));
}

/**
 * Remove formatting from phone
 * Input: "080 1234 5678" → Output: "08012345678"
 */
function cleanPhone(phone) {
    let cleaned = phone.replace(/\D/g, '');
    // If 11 digits starting with 0, strip the 0 for internal consistency
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    return cleaned;
}

// ===== CURRENCY FORMATTING =====

/**
 * Format amount as Nigerian currency
 * Input: 2500 → Output: "₦2,500"
 */
function formatCurrency(amount) {
    if (!amount) return '₦0';
    return CURRENCY + parseInt(amount).toLocaleString('en-NG');
}

/**
 * Parse currency string to number
 * Input: "₦2,500" → Output: 2500
 */
function parseCurrency(currencyStr) {
    return parseInt(currencyStr.replace(/[^0-9]/g, '')) || 0;
}

// ===== DATE & TIME FORMATTING =====

/**
 * Format date to readable format
 * Input: new Date() → Output: "Jan 11, 2025"
 */
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time to readable format
 * Input: new Date() → Output: "4:31 PM"
 */
function formatTime(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format as date + time
 * Input: new Date() → Output: "Jan 11, 2025 at 4:31 PM"
 */
function formatDateTime(date) {
    return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Get time remaining (for countdown)
 * Input: 30 → Output: "30s"
 */
function formatTimeRemaining(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

// ===== VALIDATION =====

/**
 * Validate email format
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate name (min 2 chars, letters + spaces)
 */
function validateName(name) {
    return name && name.trim().length >= NAME_MIN_LENGTH;
}

/**
 * Validate address (min 5 chars)
 */
function validateAddress(address) {
    return address && address.trim().length >= 5;
}

/**
 * Validate OTP (4 digits)
 */
function validateOTP(otp) {
    return otp && otp.length === OTP_LENGTH && /^\d+$/.test(otp);
}

// ===== NOTIFICATIONS & UI =====

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'info', 'warning'
 * @param {number} duration - Time in ms (default 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    // Create toast
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    max-width: 500px;
    margin: 0 auto;
    padding: 16px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 9999;
    animation: slideUp 0.3s ease;
  `;

    // Set colors based on type
    const colors = {
        success: { bg: '#22c55e', text: '#fff' },
        error: { bg: '#ef4444', text: '#fff' },
        info: { bg: '#3b82f6', text: '#fff' },
        warning: { bg: '#eab308', text: '#000' }
    };

    const color = colors[type] || colors.info;
    toast.style.backgroundColor = color.bg;
    toast.style.color = color.text;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show loading spinner
 */
/**
 * Show premium loading utensil animation
 */
function showLoader() {
    let loaderOverlay = document.getElementById('loader-overlay');

    if (!loaderOverlay) {
        loaderOverlay = document.createElement('div');
        loaderOverlay.id = 'loader-overlay';
        loaderOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(5px);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        loaderOverlay.innerHTML = `
            <div class="premium-loader-container" style="position: relative; width: 100px; height: 100px; display: flex; justify-content: center; align-items: center;">
                <div class="utensil-anim">🍴</div>
                <div class="utensil-anim">🥄</div>
                <div class="utensil-anim">🔪</div>
                <div class="utensil-anim">🥢</div>
                <div class="utensil-anim">🍳</div>
                <div class="loader-text" style="position: absolute; bottom: -40px; color: #f97316; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-size: 13px; font-family: 'Inter', sans-serif;">Preparing...</div>
            </div>
        `;

        document.body.appendChild(loaderOverlay);

        // Trigger reflow then show
        requestAnimationFrame(() => {
            loaderOverlay.style.opacity = '1';
        });
    }
}

/**
 * Hide loading spinner with fade out
 */
function hideLoader() {
    const loaderOverlay = document.getElementById('loader-overlay');
    if (loaderOverlay) {
        loaderOverlay.style.opacity = '0';
        setTimeout(() => {
            if (loaderOverlay.parentNode) {
                loaderOverlay.remove();
            }
        }, 300);
    }
}

/**
 * Show confirmation dialog
 * @returns {Promise<boolean>}
 */
async function showConfirm(message) {
    return confirm(message);
}

/**
 * Show alert
 */
function showAlert(message, title = 'Alert') {
    alert(`${title}\n\n${message}`);
}

// ===== STORAGE =====

/**
 * Save to sessionStorage
 */
function saveSession(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
        if (DEBUG_MODE) console.log(`✅ Saved to session:`, key);
    } catch (error) {
        console.error('Storage error:', error);
    }
}

/**
 * Get from sessionStorage
 */
function getSession(key) {
    try {
        const value = sessionStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Storage error:', error);
        return null;
    }
}

/**
 * Remove from sessionStorage
 */
function removeSession(key) {
    try {
        sessionStorage.removeItem(key);
        if (DEBUG_MODE) console.log(`✅ Removed from session:`, key);
    } catch (error) {
        console.error('Storage error:', error);
    }
}

/**
 * Clear all session
 */
function clearSession() {
    try {
        sessionStorage.clear();
        if (DEBUG_MODE) console.log('✅ Session cleared');
    } catch (error) {
        console.error('Storage error:', error);
    }
}

// ===== LOCAL STORAGE (PERSISTENT) =====

/**
 * Save to localStorage
 */
function saveLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        if (DEBUG_MODE) console.log(`✅ Saved to local:`, key);
    } catch (error) {
        console.error('Local Storage error:', error);
    }
}

/**
 * Get from localStorage
 */
function getLocal(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Local Storage error:', error);
        return null;
    }
}

/**
 * Remove from localStorage
 */
function removeLocal(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Local Storage error:', error);
    }
}

// ===== CART OPERATIONS =====

/**
 * Get cart from session
 */
function getCart() {
    return getSession('cart') || [];
}

/**
 * Save cart to session
 */
function saveCart(cart) {
    saveSession('cart', cart);
}

/**
 * Add item to cart
 */
function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(c => c.id === item.id);

    if (existing) {
        existing.qty += (item.qty || 1);
    } else {
        cart.push({ ...item, qty: item.qty || 1 });
    }

    saveCart(cart);
    return cart;
}

/**
 * Remove item from cart
 */
function removeFromCart(itemId) {
    let cart = getCart();
    cart = cart.filter(c => c.id !== itemId);
    saveCart(cart);
    return cart;
}

/**
 * Update item quantity in cart
 */
function updateCartQty(itemId, qty) {
    const cart = getCart();
    const item = cart.find(c => c.id === itemId);

    if (item) {
        if (qty <= 0) {
            return removeFromCart(itemId);
        }
        item.qty = qty;
        saveCart(cart);
    }

    return cart;
}

/**
 * Calculate cart total
 */
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/**
 * Clear cart
 */
function clearCart() {
    removeSession('cart');
}

// ===== HELPERS =====

/**
 * Generate order number
 * Output: "ORD-20250111-001"
 */
function generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${dateStr}-${random}`;
}

/**
 * Debounce function
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Sleep function (for delays)
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== CSS ANIMATIONS =====

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { transform: translateY(100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideDown {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(100px); opacity: 0; }
  }
  @keyframes utensilFade {
    0% { opacity: 0; transform: rotate(-45deg) scale(0.5); }
    5% { opacity: 1; transform: rotate(0deg) scale(1.2); }
    15% { opacity: 1; transform: rotate(15deg) scale(1); }
    20% { opacity: 0; transform: rotate(45deg) scale(0.5); }
    100% { opacity: 0; }
  }
  .utensil-anim {
    position: absolute;
    font-size: 3rem;
    opacity: 0;
    animation: utensilFade 2.5s infinite linear;
  }
  .utensil-anim:nth-child(1) { animation-delay: 0s; }
  .utensil-anim:nth-child(2) { animation-delay: 0.5s; }
  .utensil-anim:nth-child(3) { animation-delay: 1.0s; }
  .utensil-anim:nth-child(4) { animation-delay: 1.5s; }
  .utensil-anim:nth-child(5) { animation-delay: 2.0s; }
`;
document.head.appendChild(style);

console.log('✅ Utils loaded');