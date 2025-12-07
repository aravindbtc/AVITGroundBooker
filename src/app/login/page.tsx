
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { setDoc, doc, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';

const ADMIN_EMAIL = 'admin@avit.ac.in';
const ADMIN_PASSWORD = 'AVIT@2025';

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
        if (user) {
            if (user.email === ADMIN_EMAIL) {
                router.replace('/admin');
            } else {
                router.replace('/');
            }
        }
    }, [user, router]);


    const handleAdminFirstLogin = async () => {
        if (!firestore) return;
        setIsProcessing(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
            const user = userCredential.user;
            
            const batch = writeBatch(firestore);

            const userProfileRef = doc(firestore, 'users', user.uid);
            batch.set(userProfileRef, {
                id: user.uid,
                email: user.email,
                name: 'AVIT Admin',
                collegeId: 'ADMIN001',
                role: 'admin',
                loyaltyPoints: 0
            });
            
            const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
            batch.set(adminRoleRef, { grantedAt: new Date() });

            await batch.commit();

            toast({ title: "Admin Account Created", description: "Welcome, Admin! Redirecting to dashboard." });
            router.push('/admin');

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                // If admin already exists, just sign in and redirect
                await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
                router.push('/admin');
            } else {
                toast({ variant: "destructive", title: "Admin Setup Failed", description: error.message });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogin = async () => {
        setIsProcessing(true);

        // Special check for admin login
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                toast({ title: "Admin Login Successful", description: "Redirecting to Admin Dashboard..." });
                router.push('/admin');
            } catch (error: any) {
                 if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    // If the admin user doesn't exist yet, create it.
                    await handleAdminFirstLogin();
                } else {
                    toast({ variant: "destructive", title: "Admin Login Failed", description: error.message });
                }
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // Regular user login
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({ title: "Login Successful", description: "Welcome back!" });
            router.push('/');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Login Failed", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };


    const handleSignUp = async () => {
        if (!firestore) {
             toast({ variant: "destructive", title: "Database not ready", description: "Please try again in a moment."});
             return;
        }
        if (email === ADMIN_EMAIL) {
            toast({ variant: "destructive", title: "Registration Error", description: "This email is reserved for administration." });
            return;
        }
        setIsProcessing(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await setDoc(doc(firestore, "users", user.uid), {
                id: user.uid,
                email: user.email,
                name: user.email?.split('@')[0] || 'New User',
                collegeId: '',
                role: 'user',
                loyaltyPoints: 0
            });

            toast({ title: "Sign Up Successful", description: "Your account has been created." });
            router.push('/');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handlePasswordReset = async () => {
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
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    if (user) {
        return (
             <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p className="ml-4">Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center py-12">
            <Tabs defaultValue="login" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">User Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login</CardTitle>
                            <CardDescription>Enter your credentials to login. For admin access, use the designated admin credentials.</CardDescription>
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
