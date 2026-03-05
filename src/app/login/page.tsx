
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    type User as FirebaseUser,
    sendEmailVerification,
} from 'firebase/auth';
import { setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);


export default function LoginPage() {
    // --- URGENT DEVELOPER NOTE ON EMAIL DELIVERY ---
    // If password reset or email verification links are not arriving, the problem is almost always
    // email deliverability, NOT the application code. Firebase's default email servers are often
    // flagged as spam or blocked entirely. The definitive fix is to configure a custom SMTP server
    // to route all authentication emails through a trusted provider (like your own Gmail account).
    //
    // THE DEFINITIVE FIX: Configure a Custom SMTP Server
    // 1.  Go to your Google Account security settings (myaccount.google.com/security).
    // 2.  Ensure 2-Step Verification is ON.
    // 3.  Click "App passwords", generate a password for "Mail" on "Other (Custom name)". Copy the 16-digit password.
    // 4.  In Firebase Console > Authentication > Templates > SMTP settings, enter:
    //     - SMTP server: smtp.gmail.com
    //     - Port: 465, Security: SSL
    //     - SMTP username: Your full Gmail address.
    //     - SMTP password: The 16-character App Password you generated.
    // This is a one-time setup that permanently resolves delivery issues.
    // --- END OF NOTE ---

    const auth = useAuth();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    useEffect(() => {
        if (!isUserLoading && user && firestore) {
            const userDocRef = doc(firestore, "users", user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists() && docSnap.data().role === 'admin') {
                    router.replace('/admin');
                } else {
                    router.replace('/');
                }
            }).catch(error => {
                console.error("Error fetching user document:", error);
                router.replace('/');
            });
        }
    }, [user, isUserLoading, router, firestore]);

    const createProfileIfNotExists = async (user: FirebaseUser) => {
        if (!firestore) return;
        const userDocRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            const isPotentialAdmin = user.email === 'admin@avit.ac.in';
            const userRole = isPotentialAdmin ? 'admin' : 'user';

            await setDoc(userDocRef, {
                uid: user.uid,
                fullName: user.displayName || user.email?.split('@')[0] || 'New User',
                collegeId: '',
                email: user.email,
                role: userRole,
                loyaltyPoints: 0,
                createdAt: serverTimestamp(),
            });
        }
    };


    const handleOAuthSignIn = async (provider: 'google') => {
        if (!auth || !firestore) return;
        setIsProcessing(true);

        const authProvider = provider === 'google' ? new GoogleAuthProvider() : null;
        if (!authProvider) {
            setIsProcessing(false);
            return;
        }

        try {
            const result = await signInWithPopup(auth, authProvider);
            await createProfileIfNotExists(result.user);
            toast({ title: "Sign In Successful", description: "Welcome!" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sign In Failed", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };


    const handleLogin = async () => {
        if (!auth || !firestore) return;
        setIsProcessing(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await createProfileIfNotExists(userCredential.user);
            toast({ title: "Login Successful", description: "Welcome back!" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Login Failed", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };


    const handleSignUp = async () => {
        if (!firestore || !auth) return;
        setIsProcessing(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createProfileIfNotExists(userCredential.user);
            await sendEmailVerification(userCredential.user);
            toast({ title: "Account Created", description: "Please check your inbox to verify your email." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!auth) return;
        if (!resetEmail) {
            toast({ variant: "destructive", title: "Email Required", description: "Please enter your email to reset your password." });
            return;
        }
        setIsProcessing(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            toast({ title: "Password Reset Email Sent", description: "Please check your inbox for a reset link." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Reset Failed", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };


    if (!isUserLoading && user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"/>
                <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl"/>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 shadow-lg mb-4">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6v12M12 6v12M18 6v12"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">AVIT Ground Booker</h1>
                    <p className="text-blue-200 text-sm">Book Your Perfect Pitch</p>
                </div>

            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-md border border-white/20">
                    <TabsTrigger value="login" className="text-white data-[state=active]:bg-white/20">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Welcome Back</CardTitle>
                            <CardDescription className="text-gray-600">
                                Sign in to book your cricket ground slots
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-200 h-11 font-medium" onClick={() => handleOAuthSignIn('google')} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                                Continue with Google
                            </Button>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500 font-medium">
                                    Or use email
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email" className="text-gray-700 font-medium">Email Address</Label>
                                    <Input 
                                        id="login-email" 
                                        type="email" 
                                        placeholder="" 
                                        required 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        disabled={isProcessing}
                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password" className="text-gray-700 font-medium">Password</Label>
                                    <Input 
                                        id="login-password" 
                                        type="password" 
                                        placeholder="Enter your password"
                                        required 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        disabled={isProcessing}
                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button 
                                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg" 
                                onClick={handleLogin} 
                                disabled={isProcessing}
                            >
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isProcessing ? 'Signing In...' : 'Sign In'}
                            </Button>
                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200" />
                                </div>
                            </div>
                            <div className="space-y-3 w-full">
                                <p className="text-sm text-gray-600 font-medium text-center">Forgot your password?</p>
                                <div className="space-y-2">
                                    <Input 
                                        type="email" 
                                        placeholder="Enter your email to reset" 
                                        value={resetEmail} 
                                        onChange={(e) => setResetEmail(e.target.value)} 
                                        disabled={isProcessing}
                                        className="h-10 border-gray-200 text-sm"
                                    />
                                    <Button 
                                        variant="secondary" 
                                        className="w-full h-10 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
                                        onClick={handlePasswordReset} 
                                        disabled={isProcessing}
                                    >
                                        <Mail className="mr-2 h-4 w-4" /> Reset Password
                                    </Button>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="signup">
                    <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Create Account</CardTitle>
                            <CardDescription className="text-gray-600">
                                Join us to book the AVIT cricket ground
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-200 h-11 font-medium" onClick={() => handleOAuthSignIn('google')} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                                Sign up with Google
                            </Button>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500 font-medium">
                                    Or use email
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email Address</Label>
                                    <Input 
                                        id="signup-email" 
                                        type="email" 
                                        placeholder="your@avit.ac.in" 
                                        required 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        disabled={isProcessing}
                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password" className="text-gray-700 font-medium">Password</Label>
                                    <Input 
                                        id="signup-password" 
                                        type="password" 
                                        placeholder="Create a strong password"
                                        required 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        disabled={isProcessing}
                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        • At least 6 characters • Mix of letters and numbers
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg"
                                onClick={handleSignUp} 
                                disabled={isProcessing}
                            >
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isProcessing ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer Info */}
            <div className="mt-8 text-center text-sm text-blue-100">
                <p>⚽ 🏏 Book. Play. Enjoy. At AVIT Cricket Ground</p>
            </div>
            </div>
        </div>
    );
}
