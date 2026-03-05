
'use client';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailWarning, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { UserProfile } from '@/lib/types';

export function EmailVerificationGate({ children }: { children: React.ReactNode }) {
    // --- DEVELOPER NOTE ON EMAIL DELIVERY ---
    // If users report not receiving this verification email, the issue is almost always
    // email deliverability from Firebase's default servers. The definitive fix is to configure
    // a Custom SMTP server in the Firebase Console under Authentication > Templates > SMTP settings.
    // This routes emails through a trusted provider (like your own Gmail account with an App Password)
    // to guarantee delivery and avoid spam folders.
    // --- END OF NOTE ---
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isResending, setIsResending] = useState(false);
    
    // Fetch user profile to check role
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    if (isUserLoading || (user && isProfileLoading)) {
        return (
             <div className="flex justify-center items-center" style={{height: 'calc(100vh - 8rem)'}}>
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                    <p className="mt-4 text-muted-foreground">Checking authentication status...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Should be handled by parent, but as a fallback
    }

    // Admins and already verified users can pass
    if ((userProfile && userProfile.role === 'admin') || user.emailVerified) {
        return <>{children}</>;
    }

    const handleResendVerification = async () => {
        if (!auth || !user) return;
        setIsResending(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: "Verification Email Sent",
                description: "A new verification link has been sent to your email address.",
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || "Failed to resend verification email."
            });
        } finally {
            setIsResending(false);
        }
    };
    
    // reload the user object to get the latest emailVerified status
    const handleRefresh = async () => {
        if (user) {
            await user.reload();
            // This won't automatically re-render the component because the user object reference from useUser()
            // might not change immediately. onAuthStateChanged is the real source of truth.
            // A simple page reload is more reliable for the user.
            window.location.reload();
        }
    }


    return (
        <div className="container mx-auto max-w-2xl text-center py-16">
            <Alert variant="default" className="text-left">
                <MailWarning className="h-4 w-4" />
                <AlertTitle className="font-bold">Verify Your Email Address</AlertTitle>
                <AlertDescription>
                    <p className="mb-4">A verification link has been sent to <strong>{user.email}</strong>. Please click the link to activate your account.</p>
                    <p className="mb-4">If you don't see the email, please check your Spam or Junk folder.</p>
                    <p className="mt-6">Once you've clicked the link in the email, click the refresh button below.</p>
                    <div className="mt-6 flex items-center gap-4">
                        <Button onClick={handleResendVerification} disabled={isResending}>
                            {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Resend Verification Email
                        </Button>
                        <Button variant="secondary" onClick={handleRefresh}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            I've Verified, Refresh
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
}
