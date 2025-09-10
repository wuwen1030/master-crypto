"use client"

import * as React from "react"
import {
  LineChart,
  LayoutDashboard,
  Coins,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from 'next/image'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "@/hooks/useSession"


const items = [
  {
    title: "Overview",
    url: "/funding-rate",
    icon: LayoutDashboard,
  },
  {
    title: "Trend",
    url: "/funding-rate/trend",
    icon: LineChart,
  },
  {
    title: "Symbols",
    url: "/symbols",
    icon: Coins,
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton>
          <Link href="/">
            <div className="flex items-center space-x-2">
              <Image src="/logo.jpeg" alt="logo" width="32" height="32" className="rounded-lg" />
              <span className="font-semibold">Crypto Master</span>
            </div>
          </Link>
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
      <SidebarFooter>
        {loading ? (
          <div className="px-2 py-1 text-sm text-muted-foreground">Loading...</div>
        ) : user ? (
          <div className="flex items-center justify-between px-2">
            <span className="text-sm truncate">{user.email}</span>
            <Button size="sm" variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2 gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/login?redirect=${encodeURIComponent(pathname || '/')}`}>Login</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/register?redirect=${encodeURIComponent(pathname || '/')}`}>Register</Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
