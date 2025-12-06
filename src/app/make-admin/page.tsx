
'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MakeAdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMakeAdmin = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to perform this action.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const userProfileRef = doc(firestore, 'users', user.uid);
      const adminRoleRef = doc(firestore, 'roles_admin', user.uid);

      // Update the user's profile
      await setDoc(userProfileRef, { role: 'admin' }, { merge: true });
      
      // Create the document in roles_admin to satisfy security rules
      await setDoc(adminRoleRef, { grantedAt: new Date() });

      toast({
        title: 'Success!',
        description: 'You have been granted admin privileges. Please refresh the page.',
      });
      // You may want to redirect or refresh to see the changes in the UI (e.g., admin link in header)
    } catch (error: any) {
      console.error('Error granting admin privileges:', error);
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: error.message || 'Could not grant admin privileges.',
      });
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

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center"><AlertCircle className="h-6 w-6 text-destructive"/> Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">You must be logged in to grant yourself admin privileges.</p>
                <Button asChild>
                    <Link href="/login">Login</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Grant Admin Privileges
          </CardTitle>
          <CardDescription>
            Click the button below to grant administrative privileges to your account ({user.email}). This is a one-time action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleMakeAdmin}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Make Me an Admin'
            )}
          </Button>
           <p className="text-xs text-muted-foreground mt-4 text-center">
            After clicking, refresh the application. The "Admin" link will appear in the user menu at the top right.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
