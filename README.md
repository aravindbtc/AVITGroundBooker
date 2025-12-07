# AVIT Cricket Booker

## Application Overview

The **AVIT Cricket Booker** is a comprehensive web application designed to modernize and simplify the process of booking the ICC-standard cricket ground at the Aarupadai Veedu Institute of Technology (AVIT). It provides a seamless, real-time interface for students, faculty, and staff to view ground availability, book time slots, reserve equipment, and complete payments securely online.

The application is built on a robust, modern technology stack:
- **Frontend:** Next.js and React for a fast, server-rendered user interface.
- **UI Components:** ShadCN UI and Tailwind CSS for a professional and responsive design.
- **Backend & Database:** Firebase (Firestore, Authentication, Cloud Functions) for a scalable, real-time, and secure backend.
- **Payments:** Razorpay, a leading Indian payment gateway, to handle UPI and other online payments.

---

### Core Features and Working Flow

#### 1. **User Authentication & Roles**
- **Feature:** Secure sign-up and login with email/password and Google OAuth. The system supports two distinct roles: `user` (for the general student/faculty body) and `admin` (for system management).
- **Working Flow:**
    1.  **Login/Sign-up:** Users access the application via the `/login` page. They can create a new account or sign in using their email and password or their Google account.
    2.  **Admin Access:** A pre-configured admin account (`admin@avit.ac.in`) provides special access. When this user logs in, they are automatically redirected to the `/admin` dashboard, which contains management tools not visible to regular users. This is secured by Firestore rules that check for a corresponding document in the `roles_admin` collection.
    3.  **User Profile:** A profile is created in the `users` Firestore collection upon a user's first login. Users can later visit the `/profile` page to update personal details like their name and College ID.

#### 2. **Real-time Ground Booking**
- **Feature:** A dynamic booking dashboard that displays time slots for the cricket ground in real-time.
- **Working Flow:**
    1.  **Date Selection:** On the main page, the user selects a desired booking date from a calendar, which shows availability for the next 30 days.
    2.  **View Slots:** The application fetches and displays all hourly slots for the selected date (from 5 AM to 10 PM), categorized into Morning, Afternoon, and Evening. The status of each slot is clearly indicated:
        - **Available (White):** Open for booking.
        - **Booked (Grayed out):** Already reserved.
        - **Selected (Green):** Chosen by the current user for booking.
        - **Peak Hour (⚡ Icon):** Slots during high-demand times (e.g., after 5 PM) that may have a surcharge.
    3.  **Slot Selection:** Users can click on one or more available slots to add them to their current booking.

#### 3. **Add-on & Manpower Booking**
- **Feature:** In addition to the ground, users can book accessories (bats, balls, helmets) and manpower (umpires, coaches).
- **Working Flow:**
    1.  **Browse Add-ons:** In the "Book Add-Ons" section, users can see a list of available accessories and manpower.
    2.  **Add to Booking:** Users can add items to their booking by clicking the `+` button. The system tracks available stock for accessories and the availability of manpower in real-time from Firestore.

#### 4. **Booking Summary & Payment**
- **Feature:** An integrated checkout flow powered by Razorpay for secure online payments.
- **Working Flow:**
    1.  **Live Summary:** A "Booking Summary" card appears at the bottom of the screen as soon as a user selects a slot or an add-on. It provides a line-item view of all selections and calculates the total cost in real-time.
    2.  **Initiate Payment:** Clicking "Proceed to Pay" triggers a Firebase Cloud Function (`createRazorpayOrder`). This secure backend function communicates with Razorpay to create a payment order and a corresponding `booking` document in Firestore with a `pending` status.
    3.  **Complete Payment:** The Razorpay checkout modal opens, allowing the user to pay via UPI, card, or other methods.
    4.  **Confirmation & Webhooks:** Upon successful payment, a secure Razorpay webhook notifies another Firebase Cloud Function (`razorpayWebhook`). This function verifies the payment's authenticity and then atomically updates the system:
        - The `booking` status is changed to `paid`.
        - The booked `slots` are marked as `booked`.
        - The stock quantity for booked `accessories` is decremented.
        - Loyalty points are credited to the user's profile.

#### 5. **Admin Dashboard**
- **Feature:** A dedicated, secure dashboard for administrators to manage the entire booking system.
- **Working Flow:**
    1.  **Venue Management:** Admins can update core details about the venue, such as its name, address, contact info, and base pricing.
    2.  **Slot Generation:** Admins can generate the time slots for the next 30 days with a single click.
    3.  **Price & Stock Management:** Admins have full control over the pricing and available stock of all accessories and the availability of manpower.
    4.  **View All Bookings:** The dashboard includes a comprehensive table listing all bookings made by all users, providing a complete overview of ground utilization.

---

This project was generated in **Firebase Studio**. To get started with development, explore the code in the `src/app` directory.
