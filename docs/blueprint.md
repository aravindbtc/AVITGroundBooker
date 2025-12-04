# **App Name**: AVIT Cricket Booker

## Core Features:

- User Authentication: Secure user registration and login via email/password and Google OAuth. Users will be verified based on the @avit.ac.in domain.
- Real-time Booking Calendar: Interactive calendar to display available and booked slots for the cricket ground. Slots auto-lock upon selection for a short period using Firestore timestamps.
- Accessory and Manpower Booking: Allows users to book accessories (bats, balls, helmets) and manpower (umpires, coaches) alongside the ground slot, updating Firestore in real time.
- Automated Notification System: Real-time push notifications via Firebase Cloud Messaging (FCM) for booking confirmations, reminders, cancellations, and loyalty point updates.
- Loyalty Points Management: Tracks loyalty points earned per booking and allows redemption for discounts. Different loyalty tiers unlock additional perks, managed automatically.
- Weather-Aware Rescheduling Tool: Integrates with the OpenWeatherMap API to fetch weather forecasts and provide automated alerts for rain, offering users the option to reschedule their bookings using a smart AI tool.
- Admin Dashboard: Admin interface to manage users, venue settings, pricing rules, and add-on inventory, with analytics on bookings, revenue, and occupancy.

## Style Guidelines:

- Primary color: AVIT Green (#228B22) to represent the college's brand and the cricket ground.
- Background color: Off-white (#F5F5F5) to provide a clean and neutral backdrop.
- Accent color: Gold (#FFD700) to highlight interactive elements and call-to-action buttons, providing a premium feel.
- Headline font: 'Poppins', a geometric sans-serif font, for headings and prominent text to give a contemporary look.
- Body font: 'PT Sans', a humanist sans-serif font, for body text and descriptions to ensure readability and a modern feel.
- Use clear, intuitive icons from Material-UI to represent various actions and categories, with AVIT green as the primary color for icons.
- Responsive design using Material-UI Grid to adapt to different screen sizes, ensuring usability on both desktop and mobile devices.