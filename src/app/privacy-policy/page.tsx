
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Welcome to AVIT Ground Booker. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our
            application.
          </p>
          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p>
            We may collect personal information that you provide to us, such as
            your name, email address, and college ID when you register for an
            account. We also collect booking information and payment details
            processed through our payment gateway provider.
          </p>
          <h2 className="text-xl font-semibold">How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage your account.</li>
            <li>Process your bookings and payments.</li>
            <li>Communicate with you about your bookings or account.</li>
            <li>Improve our application and services.</li>
          </ul>
          <h2 className="text-xl font-semibold">Data Security</h2>
          <p>
            We use administrative, technical, and physical security measures to
            help protect your personal information. While we have taken reasonable
            steps to secure the personal information you provide to us, please be
            aware that despite our efforts, no security measures are perfect or
            impenetrable.
          </p>
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at the support email provided during sign-in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
