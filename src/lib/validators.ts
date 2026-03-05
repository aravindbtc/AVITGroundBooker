import { z } from 'zod';

/**
 * Validation schemas for API requests
 */

export const SlotValidationSchema = z.object({
  id: z.string().min(1, 'Slot ID is required'),
  startAt: z.string().datetime('Invalid start time'),
  endAt: z.string().datetime('Invalid end time'),
  price: z.number().positive('Price must be positive'),
  durationMins: z.number().optional(),
  status: z.enum(['available', 'booked', 'pending', 'blocked']).optional(),
});

export const AddonValidationSchema = z.object({
  id: z.string().min(1, 'Addon ID is required'),
  name: z.string().min(1, 'Addon name is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  price: z.number().positive('Price must be positive'),
  type: z.enum(['item', 'manpower']).optional(),
});

export const BookingPayloadSchema = z.object({
  slots: z
    .array(SlotValidationSchema)
    .min(1, 'At least one slot is required'),
  addons: z.array(AddonValidationSchema).optional().default([]),
  totalAmount: z.number().optional(), // Client-calculated, will be verified server-side
});

export const PaymentVerificationSchema = z.object({
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
});

/**
 * Type exports for use in components/API routes
 */
export type Slot = z.infer<typeof SlotValidationSchema>;
export type Addon = z.infer<typeof AddonValidationSchema>;
export type BookingPayload = z.infer<typeof BookingPayloadSchema>;
export type PaymentVerification = z.infer<typeof PaymentVerificationSchema>;

/**
 * Validation helper functions
 */

export function validateBookingPayload(data: unknown) {
  return BookingPayloadSchema.safeParse(data);
}

export function validatePaymentVerification(data: unknown) {
  return PaymentVerificationSchema.safeParse(data);
}

/**
 * Additional security checks
 */

export function isValidISO8601Date(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date < new Date();
}

export function isValidPriceFormatINR(price: number): boolean {
  return (
    Number.isFinite(price) &&
    price > 0 &&
    price <= 999999 && // Max 10 lakhs
    (price * 100) % 1 === 0 // Valid paise amount
  );
}
