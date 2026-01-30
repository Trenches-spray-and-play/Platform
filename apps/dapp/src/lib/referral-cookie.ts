/**
 * Referral Cookie Utility
 * 
 * Handles setting and getting referral codes via cookies.
 * Cookies persist through OAuth redirects unlike localStorage/sessionStorage.
 */

const REFERRAL_COOKIE_NAME = 'referralCode';
const COOKIE_MAX_AGE_DAYS = 7;

/**
 * Set the referral code cookie (client-side)
 */
export function setReferralCookie(code: string): void {
    if (typeof document === 'undefined') return;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + COOKIE_MAX_AGE_DAYS);
    
    // Set cookie with proper attributes for OAuth persistence
    document.cookie = `${REFERRAL_COOKIE_NAME}=${code.toUpperCase()}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Get the referral code cookie (client-side)
 */
export function getReferralCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === REFERRAL_COOKIE_NAME) {
            return value || null;
        }
    }
    return null;
}

/**
 * Clear the referral code cookie (client-side)
 */
export function clearReferralCookie(): void {
    if (typeof document === 'undefined') return;
    
    // Clear by setting expiry in the past
    document.cookie = `${REFERRAL_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

/**
 * Store referral code in all storage mechanisms (client-side)
 * This ensures maximum compatibility across different flows
 */
export function storeReferralCode(code: string): void {
    const upperCode = code.toUpperCase();
    
    // localStorage: Persists across sessions
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('referralCode', upperCode);
    }
    
    // sessionStorage: For same-session backup
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('referralCode', upperCode);
    }
    
    // Cookie: Persists through OAuth redirects
    setReferralCookie(upperCode);
}

/**
 * Retrieve referral code from any available storage (client-side)
 * Priority: cookie > localStorage > sessionStorage
 */
export function getReferralCode(): string | null {
    // Try cookie first (most reliable for OAuth)
    const cookieCode = getReferralCookie();
    if (cookieCode) return cookieCode;
    
    // Fall back to localStorage
    if (typeof localStorage !== 'undefined') {
        const localCode = localStorage.getItem('referralCode');
        if (localCode) return localCode;
    }
    
    // Last resort: sessionStorage
    if (typeof sessionStorage !== 'undefined') {
        const sessionCode = sessionStorage.getItem('referralCode');
        if (sessionCode) return sessionCode;
    }
    
    return null;
}

/**
 * Clear referral code from all storage mechanisms (client-side)
 */
export function clearReferralCode(): void {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('referralCode');
    }
    
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('referralCode');
    }
    
    clearReferralCookie();
}
