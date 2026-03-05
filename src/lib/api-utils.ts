import { NextResponse } from 'next/server';

/**
 * Security headers for all API responses
 */
const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
  code?: string;
}

interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

/**
 * Create a secure error response with appropriate status code
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: SECURITY_HEADERS,
    }
  );
}

/**
 * Create a secure success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: SECURITY_HEADERS,
    }
  );
}

/**
 * Extract client identifier (IP address) for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try various header options used by different proxies
  const forwardedFor =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  return forwardedFor || realIp || cfConnectingIp || 'unknown';
}

/**
 * Convert Firestore Timestamp to JSON-serializable format
 */
export function serializeTimestamp(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp.toDate instanceof Function) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Log API request with sanitization
 */
export function logApiRequest(
  method: string,
  url: string,
  details?: Record<string, any>
) {
  const sanitized = { ...details };

  // Remove sensitive data from logs
  if (sanitized) {
    delete sanitized.razorpay_signature;
    delete sanitized.razorpay_key_secret;
    if (sanitized.userProfile) {
      delete sanitized.userProfile.email;
    }
  }

  console.log(
    `[${new Date().toISOString()}] ${method} ${url}`,
    sanitized ? JSON.stringify(sanitized) : ''
  );
}

/**
 * Log payment transaction for audit trail
 */
export function logPaymentTransaction(
  action: 'initiated' | 'verified' | 'failed' | 'completed',
  bookingId: string,
  details: {
    userId?: string;
    paymentId?: string;
    orderId?: string;
    amount?: number;
    error?: string;
  }
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    bookingId,
    ...details,
  };

  console.log('[PAYMENT_TRANSACTION]', JSON.stringify(logEntry));

  // In production, send to external logging service (e.g., Sentry, DataDog)
  // await logService.log(logEntry);
}
