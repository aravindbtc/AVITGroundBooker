
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
            toast({ title: "Sign Up Successful", description: "Your account has been created." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!auth) return;
        if (!resetEmail) {
            toast({ variant: "destructive", title: "Email required", description: "Please enter your email address to reset your password." });
            return;
        }
        setIsProcessing(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            toast({ title: "Password Reset Email Sent", description: "Please check your inbox for instructions." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to Send Email", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center" style={{height: 'calc(100vh - 8rem)'}}>
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                    <p className="ml-4 mt-4 text-muted-foreground">Initializing...</p>
                </div>
            </div>
        );
    }

    if (user) {
         return (
            <div className="flex justify-center items-center" style={{height: 'calc(100vh - 8rem)'}}>
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                    <p className="ml-4 mt-4 text-muted-foreground">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center py-12">
            <Tabs defaultValue="login" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login</CardTitle>
                            <CardDescription>Enter your credentials to login.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input id="login-email" type="email" placeholder="user@avit.ac.in" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                             <div className="relative">
                                <Separator className="my-6" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-background text-sm text-muted-foreground">OR</div>
                            </div>
                             <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={isProcessing}>
                                <GoogleIcon />
                                Sign in with Google
                            </Button>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleLogin} disabled={isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Login
                            </Button>
                        </CardFooter>
                    </Card>
                     <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Forgot Password?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <Input id="reset-email" type="email" placeholder="Enter your email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter>
                             <Button variant="outline" onClick={handlePasswordReset} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Send Reset Link
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="signup">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign Up</CardTitle>
                            <CardDescription>Create a new account to start booking.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" type="email" placeholder="user@avit.ac.in" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                             <div className="relative">
                                <Separator className="my-6" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-background text-sm text-muted-foreground">OR</div>
                            </div>
                             <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={isProcessing}>
                                <GoogleIcon />
                                Sign up with Google
                            </Button>
                        </CardContent>
                        <CardFooter>
                             <Button onClick={handleSignUp} disabled={isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign Up
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
