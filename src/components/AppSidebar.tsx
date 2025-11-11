import { Home, FileText, Calendar, MessageSquare, BarChart3, Settings, Users, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "لوحة القيادة", url: "/dashboard", icon: Home },
  { title: "الطلاب", url: "/students", icon: Users },
  { title: "ملفات الحالات", url: "/cases", icon: FileText },
  { title: "الجلسات", url: "/sessions", icon: Calendar },
  { title: "التواصل", url: "/communications", icon: MessageSquare },
  { title: "التحليلات", url: "/analytics", icon: TrendingUp },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={`${isCollapsed ? 'w-16' : 'w-72'} transition-all`}>
      <SidebarTrigger className="absolute top-4 left-4" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={`transition-all ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent transition-smooth"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-center p-4">
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}