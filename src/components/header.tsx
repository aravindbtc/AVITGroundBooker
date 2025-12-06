"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useUser } from "@/firebase";
import { LogOut, User, Settings, LayoutGrid, CalendarDays, Gem, MapPin, Shield } from "lucide-react";
import { cn } from "@/lib/utils";


const CricketBallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-7.5 16.8" />
      <path d="M12 22a10 10 0 0 1-7.5-16.8" />
      <path d="M2.2 12h19.6" />
    </svg>
)

export function Header() {
  const { user, isUserLoading } = useUser();
  const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('') || 'G';
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/bookings", label: "Find Ground" },
    { href: "/profile", label: "Categories" },
    { href: "/loyalty", label: "Contact" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CricketBallIcon />
                </div>
                <span className="font-headline text-xl font-bold">AVIT Booker</span>
            </Link>
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
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Paiyanoor, Chennai</span>
            </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Guest'} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{isUserLoading ? 'Loading...' : user?.displayName || 'Guest User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
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
                 <Link href="/loyalty"><Gem className="mr-2 h-4 w-4" /><span>Loyalty</span></Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <Link href="/admin"><Shield className="mr-2 h-4 w-4" /><span>Admin</span></Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

           <Button className="hidden sm:inline-flex bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                Login
            </Button>
        </div>
      </div>
    </header>
  );
}
