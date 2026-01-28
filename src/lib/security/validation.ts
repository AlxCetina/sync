import validator from 'validator';

/**
 * Security validation and sanitization utilities
 * 
 * SECURITY PRINCIPLE: Use ALLOWLIST validation (what IS allowed) rather than
 * blocklist validation (what is NOT allowed). Blocklists can always be bypassed.
 */

// Maximum lengths for user inputs
const MAX_LENGTHS = {
    userName: 30,
    sessionCode: 6,
    placeId: 100,
    searchQuery: 200,
} as const;

// Minimum lengths
const MIN_LENGTHS = {
    userName: 1,
} as const;

// Allowed characters for session codes
const SESSION_CODE_REGEX = /^[A-Z0-9]{6}$/;

/**
 * ALLOWLIST regex for user names
 * Allows:
 * - Unicode letters (any language): \p{L}
 * - Unicode numbers: \p{N}
 * - Spaces
 * - Common punctuation: - ' . _
 * 
 * This prevents XSS by NOT allowing: < > & " ' ` / \ and other special chars
 */
const SAFE_NAME_REGEX = /^[\p{L}\p{N}\s\-'._]+$/u;

/**
 * ALLOWLIST regex for search queries
 * Slightly more permissive than names to allow common search patterns
 */
const SAFE_SEARCH_REGEX = /^[\p{L}\p{N}\s\-'.,!?&]+$/u;

/**
 * Sanitize a user name - removes potentially dangerous characters
 * Uses allowlist approach: only keep characters that match the safe pattern
 */
export function sanitizeUserName(name: string): string {
    if (!name || typeof name !== 'string') {
        return '';
    }
    
    // Trim whitespace
    let sanitized = name.trim();
    
    // Remove any characters not in the allowlist
    // This is more secure than escaping because it completely removes dangerous chars
    sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-'._]/gu, '');
    
    // Collapse multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Trim again after processing
    sanitized = sanitized.trim();
    
    // Limit length
    sanitized = sanitized.slice(0, MAX_LENGTHS.userName);
    
    // Final escape for any edge cases (defense in depth)
    sanitized = validator.escape(sanitized);
    
    return sanitized;
}

/**
 * Validate a user name using ALLOWLIST approach
 * Only allows explicitly safe characters
 */
export function validateUserName(name: string): { valid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Name is required' };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Name cannot be empty' };
    }
    
    if (trimmed.length < MIN_LENGTHS.userName) {
        return { valid: false, error: 'Name is too short' };
    }
    
    if (trimmed.length > MAX_LENGTHS.userName) {
        return { valid: false, error: `Name must be ${MAX_LENGTHS.userName} characters or less` };
    }
    
    // ALLOWLIST validation: only accept characters we explicitly allow
    // This is more secure than checking for specific bad patterns
    if (!SAFE_NAME_REGEX.test(trimmed)) {
        return { valid: false, error: 'Name contains invalid characters. Use letters, numbers, spaces, and basic punctuation only.' };
    }
    
    // Check for suspicious patterns (double defense)
    // Even though the regex should block these, check explicitly
    const suspiciousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /on\w+\s*=/i,  // onclick=, onerror=, etc.
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(trimmed)) {
            return { valid: false, error: 'Name contains invalid characters' };
        }
    }
    
    return { valid: true };
}

/**
 * Validate a session code
 */
export function validateSessionCode(code: string): { valid: boolean; error?: string } {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Session code is required' };
    }
    
    const normalized = code.toUpperCase().trim();
    
    if (normalized.length !== 6) {
        return { valid: false, error: 'Session code must be 6 characters' };
    }
    
    if (!SESSION_CODE_REGEX.test(normalized)) {
        return { valid: false, error: 'Session code contains invalid characters' };
    }
    
    return { valid: true };
}

/**
 * Validate location coordinates
 * Includes checks for NaN, Infinity, and valid ranges
 */
export function validateLocation(location: unknown): { valid: boolean; error?: string; location?: { lat: number; lng: number } } {
    if (!location || typeof location !== 'object') {
        return { valid: false, error: 'Location is required' };
    }
    
    const loc = location as Record<string, unknown>;
    
    if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
        return { valid: false, error: 'Invalid location format' };
    }
    
    // Check for NaN and Infinity (these pass typeof 'number' check)
    if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
        return { valid: false, error: 'Invalid location values' };
    }
    
    // Validate latitude range (-90 to 90)
    if (loc.lat < -90 || loc.lat > 90) {
        return { valid: false, error: 'Invalid latitude' };
    }
    
    // Validate longitude range (-180 to 180)
    if (loc.lng < -180 || loc.lng > 180) {
        return { valid: false, error: 'Invalid longitude' };
    }
    
    return { valid: true, location: { lat: loc.lat, lng: loc.lng } };
}

/**
 * Validate place ID
 */
export function validatePlaceId(placeId: string): { valid: boolean; error?: string } {
    if (!placeId || typeof placeId !== 'string') {
        return { valid: false, error: 'Place ID is required' };
    }
    
    if (placeId.length > MAX_LENGTHS.placeId) {
        return { valid: false, error: 'Invalid place ID' };
    }
    
    // Place IDs should be alphanumeric with some special chars
    if (!/^[a-zA-Z0-9_-]+$/.test(placeId)) {
        return { valid: false, error: 'Invalid place ID format' };
    }
    
    return { valid: true };
}

/**
 * Validate swipe decision
 */
export function validateSwipeDecision(decision: string): { valid: boolean; error?: string } {
    if (decision !== 'yes' && decision !== 'no') {
        return { valid: false, error: 'Invalid swipe decision' };
    }
    return { valid: true };
}

/**
 * Validate search radius
 * Includes checks for NaN and Infinity
 */
export function validateSearchRadius(radius: number): { valid: boolean; error?: string } {
    if (typeof radius !== 'number') {
        return { valid: false, error: 'Invalid radius' };
    }
    
    // Check for NaN and Infinity
    if (!Number.isFinite(radius)) {
        return { valid: false, error: 'Invalid radius value' };
    }
    
    // Valid range: 1km to 50km
    if (radius < 1000 || radius > 50000) {
        return { valid: false, error: 'Radius must be between 1km and 50km' };
    }
    
    return { valid: true };
}

/**
 * Validate search query using ALLOWLIST approach
 */
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
    if (!query || typeof query !== 'string') {
        return { valid: false, error: 'Search query is required' };
    }
    
    const trimmed = query.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Search query cannot be empty' };
    }
    
    if (trimmed.length > MAX_LENGTHS.searchQuery) {
        return { valid: false, error: `Search query must be ${MAX_LENGTHS.searchQuery} characters or less` };
    }
    
    // ALLOWLIST validation for search queries
    if (!SAFE_SEARCH_REGEX.test(trimmed)) {
        return { valid: false, error: 'Search query contains invalid characters' };
    }
    
    return { valid: true };
}

/**
 * Sanitize search query using ALLOWLIST approach
 * Only keeps explicitly safe characters
 */
export function sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
        return '';
    }
    
    // Trim whitespace
    let sanitized = query.trim();
    
    // Remove any characters not in the allowlist
    sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-'.,!?&]/gu, '');
    
    // Collapse multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Trim again after processing
    sanitized = sanitized.trim();
    
    // Limit length
    sanitized = sanitized.slice(0, MAX_LENGTHS.searchQuery);
    
    // Final escape for defense in depth
    sanitized = validator.escape(sanitized);
    
    return sanitized;
}
