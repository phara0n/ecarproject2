"use client"

import type * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CarIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react"

import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Client",
      url: "#",
      icon: UsersIcon,
    },
    {
      title: "Voitures",
      url: "#",
      icon: CarIcon,
    },
    {
      title: "Service",
      url: "#",
      icon: WrenchIcon,
    },
    {
      title: "Analytics",
      url: "#",
      icon: BarChartIcon,
    },
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
  ],
  navClouds: [],
  navSecondary: [],
  documents: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">eCar Garage</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
