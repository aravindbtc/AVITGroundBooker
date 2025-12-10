
'use client';

import { useUser } from "@/firebase";
import { Header } from "./header";
import { Footer } from "./footer";
import { Loader2 } from "lucide-react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isUserLoading } = useUser();

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-background">
                <div className='container mx-auto px-4 py-8'>
                    {isUserLoading ? (
                        <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 8rem)' }}>
                            <div className="text-center">
                                <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                                <p className="ml-4 mt-4 text-muted-foreground">Loading App...</p>
                            </div>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

    