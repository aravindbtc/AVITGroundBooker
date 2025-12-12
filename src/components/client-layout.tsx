
'use client';

import { useUser } from "@/firebase";
import { Header } from "./header";
import { Footer } from "./footer";
import { Loader2 } from "lucide-react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center" style={{ height: '100vh' }}>
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                    <p className="ml-4 mt-4 text-muted-foreground">Loading App...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-background">
                <div className='container mx-auto px-4 py-8'>
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
}
