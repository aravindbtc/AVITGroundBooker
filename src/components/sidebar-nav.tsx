"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { SidebarLinks } from "./sidebar-links";

const AppLogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        <path d="M6 6v12" />
        <path d="M12 6v12" />
        <path d="M18 6v12" />
        <path d="M7 6h4" />
        <path d="M13 6h4" />
    </svg>
)

export function SidebarNav() {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <AppLogoIcon />
            </div>
            <div className="overflow-hidden">
                <h2 className="truncate font-headline text-lg font-semibold">AVIT Booker</h2>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarLinks />
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
