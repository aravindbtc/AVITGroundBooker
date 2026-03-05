
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Please read these Terms of Service carefully before using the AVIT
            Cricket Booker application.
          </p>
          <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
          <p>
            By using our application, you agree to be bound by these Terms. If you
            disagree with any part of the terms, then you do not have permission
            to access the service.
          </p>
          <h2 className="text-xl font-semibold">2. Bookings</h2>
          <p>
            Our application allows you to book cricket ground slots and related
            add-ons. All bookings are subject to availability and confirmation.
            Payments are processed through a third-party payment gateway, and we
            are not responsible for any issues arising from the payment process.
          </p>
          <h2 className="text-xl font-semibold">3. User Accounts</h2>
          <p>
            When you create an account with us, you guarantee that you are above
            the age of 18 and that the information you provide us is accurate,
            complete, and current at all times. You are responsible for
            safeguarding the password that you use to access the service.
          </p>
          <h2 className="text-xl font-semibold">4. Cancellation Policy</h2>
          <p>
            Booking cancellations are subject to the cancellation policy displayed
            at the time of booking. Please review the specific cancellation terms
            for your booking carefully.
          </p>
          <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
          <p>
            In no event shall AVIT Ground Booker, nor its directors, employees,
            partners, agents, suppliers, or affiliates, be liable for any
            indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill,
            or other intangible losses, resulting from your access to or use of
            or inability to access or use the service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
