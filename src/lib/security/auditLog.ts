/**
 * Security Audit Logging
 * 
 * Provides structured logging for security-relevant events.
 * In production, these logs can be shipped to a SIEM or log aggregation service.
 */

// Event types for categorization
export type AuditEventType = 
    | 'AUTH_SUCCESS'
    | 'AUTH_FAILURE'
    | 'RATE_LIMITED'
    | 'SESSION_CREATED'
    | 'SESSION_JOINED'
    | 'SESSION_ENDED'
    | 'SESSION_EVICTED'
    | 'RECONNECT_SUCCESS'
    | 'RECONNECT_FAILURE'
    | 'SUSPICIOUS_ACTIVITY'
    | 'VALIDATION_FAILURE'
    | 'TOKEN_EXPIRED'
    | 'BRUTE_FORCE_ATTEMPT';

// Severity levels
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

// Audit event structure
export interface AuditEvent {
    timestamp: Date;
    eventType: AuditEventType;
    severity: AuditSeverity;
    clientIp: string;
    sessionId?: string;
    userId?: string;
    socketId?: string;
    details: Record<string, unknown>;
    userAgent?: string;
}

// Map event types to default severities
const eventSeverityMap: Record<AuditEventType, AuditSeverity> = {
    'AUTH_SUCCESS': 'info',
    'AUTH_FAILURE': 'warning',
    'RATE_LIMITED': 'warning',
    'SESSION_CREATED': 'info',
    'SESSION_JOINED': 'info',
    'SESSION_ENDED': 'info',
    'SESSION_EVICTED': 'info',
    'RECONNECT_SUCCESS': 'info',
    'RECONNECT_FAILURE': 'warning',
    'SUSPICIOUS_ACTIVITY': 'critical',
    'VALIDATION_FAILURE': 'warning',
    'TOKEN_EXPIRED': 'info',
    'BRUTE_FORCE_ATTEMPT': 'critical',
};

/**
 * Format an audit event for logging
 */
function formatAuditEvent(event: AuditEvent): string {
    return JSON.stringify({
        level: 'SECURITY',
        severity: event.severity,
        eventType: event.eventType,
        timestamp: event.timestamp.toISOString(),
        clientIp: event.clientIp,
        sessionId: event.sessionId || null,
        userId: event.userId || null,
        socketId: event.socketId || null,
        details: event.details,
        userAgent: event.userAgent || null,
    });
}

/**
 * Log a security event
 * In production, this could send to an external logging service
 */
export function logSecurityEvent(event: Omit<AuditEvent, 'timestamp' | 'severity'> & { severity?: AuditSeverity }): void {
    const fullEvent: AuditEvent = {
        ...event,
        timestamp: new Date(),
        severity: event.severity || eventSeverityMap[event.eventType] || 'info',
    };

    // Log based on severity
    const logMessage = formatAuditEvent(fullEvent);
    
    switch (fullEvent.severity) {
        case 'critical':
            console.error(`[SECURITY:CRITICAL] ${logMessage}`);
            break;
        case 'error':
            console.error(`[SECURITY:ERROR] ${logMessage}`);
            break;
        case 'warning':
            console.warn(`[SECURITY:WARNING] ${logMessage}`);
            break;
        default:
            console.log(`[SECURITY:INFO] ${logMessage}`);
    }

    // In production, you might want to:
    // - Send to external logging service (Datadog, Splunk, etc.)
    // - Store in database for audit trail
    // - Trigger alerts for critical events
    // - Send to SIEM for security monitoring
}

/**
 * Log an authentication failure
 */
export function logAuthFailure(
    clientIp: string,
    reason: string,
    details: Record<string, unknown> = {},
    socketId?: string
): void {
    logSecurityEvent({
        eventType: 'AUTH_FAILURE',
        clientIp,
        socketId,
        details: {
            reason,
            ...details,
        },
    });
}

/**
 * Log a rate limit event
 */
export function logRateLimited(
    clientIp: string,
    operation: string,
    retryAfter: number,
    socketId?: string
): void {
    logSecurityEvent({
        eventType: 'RATE_LIMITED',
        clientIp,
        socketId,
        details: {
            operation,
            retryAfter,
        },
    });
}

/**
 * Log a session creation
 */
export function logSessionCreated(
    clientIp: string,
    sessionId: string,
    userId: string,
    hostName: string
): void {
    logSecurityEvent({
        eventType: 'SESSION_CREATED',
        clientIp,
        sessionId,
        userId,
        details: {
            hostName,
        },
    });
}

/**
 * Log a session join
 */
export function logSessionJoined(
    clientIp: string,
    sessionId: string,
    userId: string,
    userName: string
): void {
    logSecurityEvent({
        eventType: 'SESSION_JOINED',
        clientIp,
        sessionId,
        userId,
        details: {
            userName,
        },
    });
}

/**
 * Log a potential brute force attempt
 */
export function logBruteForceAttempt(
    clientIp: string,
    attemptedSessionId: string,
    attemptCount: number,
    socketId?: string
): void {
    logSecurityEvent({
        eventType: 'BRUTE_FORCE_ATTEMPT',
        severity: 'critical',
        clientIp,
        socketId,
        details: {
            attemptedSessionId,
            attemptCount,
        },
    });
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
    clientIp: string,
    description: string,
    details: Record<string, unknown> = {},
    socketId?: string
): void {
    logSecurityEvent({
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'critical',
        clientIp,
        socketId,
        details: {
            description,
            ...details,
        },
    });
}

/**
 * Log a validation failure (potential injection attempt)
 */
export function logValidationFailure(
    clientIp: string,
    field: string,
    value: string,
    reason: string,
    socketId?: string
): void {
    // Truncate value to prevent log injection
    const truncatedValue = value.length > 100 ? value.slice(0, 100) + '...' : value;
    
    logSecurityEvent({
        eventType: 'VALIDATION_FAILURE',
        clientIp,
        socketId,
        details: {
            field,
            value: truncatedValue,
            reason,
        },
    });
}

/**
 * Log successful reconnection
 */
export function logReconnectSuccess(
    clientIp: string,
    sessionId: string,
    userId: string,
    socketId?: string
): void {
    logSecurityEvent({
        eventType: 'RECONNECT_SUCCESS',
        clientIp,
        sessionId,
        userId,
        socketId,
        details: {},
    });
}

/**
 * Log failed reconnection attempt
 */
export function logReconnectFailure(
    clientIp: string,
    sessionId: string,
    reason: string,
    socketId?: string
): void {
    logSecurityEvent({
        eventType: 'RECONNECT_FAILURE',
        clientIp,
        sessionId,
        socketId,
        details: {
            reason,
        },
    });
}
