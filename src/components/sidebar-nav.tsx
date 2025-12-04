"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Home, CalendarDays, User, Shield, Gem, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

const CricketBallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-7.5 16.8" />
      <path d="M12 22a10 10 0 0 1-7.5-16.8" />
      <path d="M2.2 12h19.6" />
    </svg>
)

export function SidebarNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CricketBallIcon />
            </div>
            <div className="overflow-hidden">
                <h2 className="truncate font-headline text-lg font-semibold">AVIT Booker</h2>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
            <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/" passHref>
                <SidebarMenuButton isActive={isActive("/")} tooltip="Dashboard">
                    <Home />
                    <span>Dashboard</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="#" passHref>
                <SidebarMenuButton isActive={isActive("/bookings")} tooltip="My Bookings">
                    <CalendarDays />
                    <span>My Bookings</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="#" passHref>
                <SidebarMenuButton isActive={isActive("/profile")} tooltip="Profile">
                    <User />
                    <span>Profile</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="#" passHref>
                <SidebarMenuButton isActive={isActive("/loyalty")} tooltip="Loyalty Program">
                    <Gem />
                    <span>Loyalty</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/admin" passHref>
                <SidebarMenuButton isActive={isActive("/admin")} tooltip="Admin Dashboard">
                    <Shield />
                    <span>Admin Panel</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
