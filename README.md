
# AVIT Cricket Booker

## Application Overview

The **AVIT Cricket Booker** is a comprehensive web application designed to modernize and simplify the process of booking the ICC-standard cricket ground at the Aarupadai Veedu Institute of Technology (AVIT). It provides a seamless, real-time interface for students, faculty, and staff to view ground availability, book time slots, reserve equipment, and complete payments securely online.

The application is built on a robust, modern technology stack:
- **Frontend:** Next.js and React for a fast, server-rendered user interface.
- **UI Components:** ShadCN UI and Tailwind CSS for a professional and responsive design.
- **Backend & Database:** Firebase (Firestore, Authentication, Cloud Functions) for a scalable, real-time, and secure backend.
- **Payments:** Razorpay, a leading Indian payment gateway, to handle UPI and other online payments.

---

### Core Features & Modules

#### 1. **User Module & Authentication**
- **Feature:** Secure sign-up and login with email/password and Google OAuth. The system supports two distinct roles: `user` (for the general student/faculty body) and `admin` (for system management). Users can manage their profile information, including contact details.
- **Working Flow:**
    1.  **Login/Sign-up:** Users access the application via the `/login` page. They can create a new account or sign in using their email and password or their Google account.
    2.  **User Profile:** A profile is created in the `users` Firestore collection upon a user's first login. Users can later visit the `/profile` page to update personal details like their name, College ID, and contact number.

#### 2. **Admin Module**
- **Feature:** A dedicated, secure dashboard for administrators to manage the entire booking system.
- **Working Flow:**
    1.  **Admin Access:** A pre-configured admin account (`admin@avit.ac.in`) provides special access. When this user logs in, they are automatically redirected to the `/admin` dashboard.
    2.  **Venue Management:** Admins can update core details about the venue, such as its name, address, contact info, and base pricing.
    3.  **Slot Management:** Admins can generate time slots for the next 30 days and view all bookings. They have the authority to cancel any booking.
    4.  **Price & Stock Management:** Admins have full control over the pricing and available stock of all accessories and the availability of manpower (e.g., umpires, coaches).
    5.  **User Management:** Admins can view a complete list of all registered users in the system.

#### 3. **Booking & Availability Module**
- **Feature:** A dynamic booking dashboard that displays time slots for the cricket ground in real-time.
- **Working Flow:**
    1.  **View Slots:** On the main page, the user selects a desired booking date. The application fetches and displays all hourly slots, clearly indicating their status (Available, Booked, Selected).
    2.  **Slot Selection:** Users can click on one or more available slots to add them to their current booking.
    3.  **Book Add-ons:** Users can book accessories (bats, balls) and manpower (umpires, coaches) along with their ground booking.
    4.  **Booking History:** Users can view their complete booking history, including current and past bookings, on the `/bookings` page.

#### 4. **Search Module**
- **Feature:** Users can easily find available slots.
- **Working Flow:** The main dashboard includes a calendar that allows users to filter the view by date, effectively searching for availability over the next 30 days.

#### 5. **Payment Module**
- **Feature:** An integrated checkout flow powered by Razorpay for secure online payments.
- **Working Flow:**
    1.  **Live Summary:** A "Booking Summary" card provides a line-item view of all selections and calculates the total cost.
    2.  **Initiate Payment:** Clicking "Proceed to Pay" triggers a secure Firebase Cloud Function that creates a Razorpay order.
    3.  **Complete Payment:** The Razorpay checkout modal opens for payment.
    4.  **Confirmation:** Upon successful payment, a secure webhook updates the booking status to `paid`, decrements stock for any add-ons, and credits loyalty points to the user's profile.

---

This project was generated in **Firebase Studio**. To get started with development, explore the code in the `src/app` directory.
