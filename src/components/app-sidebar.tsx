"use client"

import * as React from "react"
import {
  LineChart
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  // SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from 'next/image'


const items = [
  {
    title: "Fundating Rate",
    url: "/dashboard/funding-rate",
    icon: LineChart,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton>
          <Image src="/logo.jpeg" alt="logo" width="32" height="32" className="rounded-lg" />
          <span className="font-semibold">Crypto Master</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  )
}
