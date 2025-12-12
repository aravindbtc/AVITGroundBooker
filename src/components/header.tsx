
"use client"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { LogOut, User, LayoutGrid, CalendarDays, Gem, Star, Shield, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";


const CricketBallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-7.5 16.8" />
      <path d="M12 22a10 10 0 0 1-7.5-16.8" />
      <path d="M2.2 12h19.6" />
    </svg>
)

function UserProfileDropdown() {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            toast({ title: "Logged out successfully." });
            router.push('/login');
        } catch (error) {
            console.error("Error logging out:", error);
            toast({ variant: 'destructive', title: "Logout Failed", description: "An error occurred while logging out." });
        }
    }

    if (isProfileLoading && user) {
        return <Skeleton className="h-10 w-10 rounded-full" />;
    }

    if (!user || !userProfile) {
        return null;
    }

    const userInitials = userProfile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || (user?.email ? user.email[0].toUpperCase() : '?');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || userProfile.profilePic || ''} alt={userProfile?.fullName || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">{userInitials}</AvatarFallback>
                </Avatar>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/"><LayoutGrid className="mr-2 h-4 w-4" /><span>Dashboard</span></Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/bookings"><CalendarDays className="mr-2 h-4 w-4" /><span>My Bookings</span></Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/profile"><User className="mr-2 h-4 w-4" /><span>Profile</span></Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/ratings"><Star className="mr-2 h-4 w-4" /><span>Provide Ratings</span></Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/loyalty"><Gem className="mr-2 h-4 w-4" /><span>Loyalty</span></Link>
            </DropdownMenuItem>
            {userProfile.role === 'admin' && (
              <DropdownMenuItem asChild>
                  <Link href="/admin"><Shield className="mr-2 h-4 w-4" /><span>Admin</span></Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header() {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/bookings", label: "My Bookings" },
    { href: "/profile", label: "Profile" },
    { href: "/ratings", label: "Ratings" },
  ]
  
  const isLandingPage = pathname === '/';

  return (
    <header className={cn(
        "sticky top-0 z-40 w-full border-b backdrop-blur-sm",
        isLandingPage && !user ? "bg-transparent border-transparent text-white" : "bg-background/95 border-border text-foreground"
    )}>
      <div className={cn(
        "container flex h-16 items-center justify-between px-4"
      )}>
        <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
                <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    isLandingPage && !user ? "bg-white text-primary" : "bg-primary text-primary-foreground"
                )}>
                    <CricketBallIcon />
                </div>
                <span className="font-headline text-xl font-bold">AVIT Booker</span>
            </Link>
            {user && (
                <nav className="hidden md:flex items-center gap-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            )}
        </div>
        
        <div className="flex items-center gap-4">
            {isUserLoading ? (
                 <Skeleton className="h-10 w-24 rounded-md" />
            ) : user ? (
                <UserProfileDropdown />
             ) : (
                <>
                    <Button asChild variant="outline" className="hidden sm:flex bg-transparent border-white text-white hover:bg-white hover:text-primary">
                        <Link href="/login">
                            Login
                        </Link>
                    </Button>
                    <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                        <Link href="/login">
                            Sign Up
                        </Link>
                    </Button>
                </>
             )}
        </div>
      </div>
    </header>
  );
}
