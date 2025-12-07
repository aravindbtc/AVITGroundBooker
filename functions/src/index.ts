/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import { defineString } from "firebase-functions/params";
import crypto from "crypto";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Define Razorpay API keys as parameters
const razorpayKeyId = defineString("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineString("RAZORPAY_KEY_SECRET");
const razorpayWebhookSecret = defineString("RAZORPAY_WEBHOOK_SECRET");


// Cloud Function to create a Razorpay order
export const createRazorpayOrder = onCall(async (request) => {
    // Check for authentication
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to create an order.");
    }

    const { amount, currency, receipt, notes } = request.data;
    const userId = request.auth.uid;

    logger.info(`Creating order for user ${userId} with amount ${amount}`);

    try {
        const razorpay = new Razorpay({
            key_id: razorpayKeyId.value(),
            key_secret: razorpayKeySecret.value(),
        });

        const options = {
            amount: amount * 100, // Amount in paise
            currency: currency || "INR",
            receipt,
            notes: { ...notes, userId }, // Add userId to notes for tracking
        };

        const order = await razorpay.orders.create(options);

        logger.info(`Razorpay order created: ${order.id} for user ${userId}`);

        // Store the Razorpay order ID in a new booking document
        const bookingRef = db.collection("bookings").doc();
        await bookingRef.set({
            id: bookingRef.id,
            userId,
            razorpayOrderId: order.id,
            status: "pending",
            total: amount,
            bookingDate: admin.firestore.FieldValue.serverTimestamp(),
            ...notes, // slotIds, addons, etc.
        });

        logger.info(`Firestore booking document created: ${bookingRef.id}`);

        return {
            orderId: order.id,
            bookingId: bookingRef.id,
            amount: order.amount,
        };
    } catch (error) {
        logger.error("Error creating Razorpay order:", error);
        throw new HttpsError("internal", "Could not create Razorpay order.", error);
    }
});


// Cloud Function to handle Razorpay webhook
export const razorpayWebhook = onCall(async (request) => {
  logger.info("Razorpay webhook received");

  const secret = razorpayWebhookSecret.value();
  const signature = request.headers["x-razorpay-signature"] as string;
  const body = JSON.stringify(request.body);

  // 1. Validate the webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  
  if (signature !== expectedSignature) {
    logger.error("Invalid webhook signature.");
    throw new HttpsError("permission-denied", "Invalid signature.");
  }
  
  logger.info("Webhook signature validated successfully.");
  
  const event = request.body;

  // 2. Handle the 'payment.captured' event
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const customerEmail = payment.email;
    const customerPhone = payment.contact;

    logger.info(`Processing payment captured for order: ${orderId}`);

    try {
      // Find the booking document using the Razorpay order ID
      const bookingsQuery = await db.collection("bookings").where("razorpayOrderId", "==", orderId).limit(1).get();

      if (bookingsQuery.empty) {
        logger.error(`No booking found for Razorpay order ID: ${orderId}`);
        throw new HttpsError("not-found", "Booking not found.");
      }

      const bookingDoc = bookingsQuery.docs[0];
      const booking = bookingDoc.data();
      const bookingId = bookingDoc.id;
      const userId = booking.userId;

      // Use a transaction to ensure atomicity
      await db.runTransaction(async (transaction) => {
        // 3. Update the booking status to 'paid'
        transaction.update(bookingDoc.ref, { status: "paid", paymentTimestamp: admin.firestore.FieldValue.serverTimestamp() });

        // 4. Update the status of each booked slot to 'booked'
        if (booking.slotIds && Array.isArray(booking.slotIds)) {
          booking.slotIds.forEach((slotId: string) => {
            const slotRef = db.collection("slots").doc(slotId);
            transaction.update(slotRef, { status: "booked", bookedById: userId });
          });
        }
        
        // 5. Decrement stock for addons
        if (booking.addons && Array.isArray(booking.addons)) {
            for (const item of booking.addons) {
                if (item.type === 'addon') {
                    const itemRef = db.collection('accessories').doc(item.id);
                    const itemDoc = await transaction.get(itemRef);
                    if(itemDoc.exists) {
                       const currentQuantity = itemDoc.data()?.quantity ?? 0;
                       transaction.update(itemRef, { quantity: currentQuantity - item.quantity });
                    }
                }
            }
        }
        
        // 6. Update user's loyalty points
        const userRef = db.collection("users").doc(userId);
        const userDoc = await transaction.get(userRef);
        if(userDoc.exists){
            const currentPoints = userDoc.data()?.loyaltyPoints ?? 0;
            transaction.update(userRef, { loyaltyPoints: currentPoints + booking.total });
        }
      });

      logger.info(`Booking ${bookingId} successfully updated for user ${userId}.`);
      
    } catch (error) {
      logger.error(`Failed to process booking for order ${orderId}:`, error);
      // Depending on the error, you might want to retry or send a notification
      throw new HttpsError("internal", "Failed to update booking after payment.", error);
    }
  }

  return { status: "success" };
});

    