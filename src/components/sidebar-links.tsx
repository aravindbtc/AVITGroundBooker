"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Home, CalendarDays, User, Shield, Gem } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarLinks() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <>
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
            <Link href="/bookings" passHref>
              <SidebarMenuButton
                isActive={isActive("/bookings")}
                tooltip="My Bookings"
              >
                <CalendarDays />
                <span>My Bookings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/profile" passHref>
              <SidebarMenuButton
                isActive={isActive("/profile")}
                tooltip="Profile"
              >
                <User />
                <span>Profile</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/loyalty" passHref>
              <SidebarMenuButton
                isActive={isActive("/loyalty")}
                tooltip="Loyalty Program"
              >
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
              <SidebarMenuButton
                isActive={isActive("/admin")}
                tooltip="Admin Dashboard"
              >
                <Shield />
                <span>Admin Panel</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
