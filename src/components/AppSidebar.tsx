import { Home, FileText, Users, MessageSquare, BarChart3, Settings, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {  SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const menuItems = [
  { title: "لوحة القيادة", url: "/dashboard", icon: Home },
  { title: "ملفات الحالات", url: "/cases", icon: FileText },
  { title: "الجلسات", url: "/sessions", icon: Users },
  { title: "التواصل", url: "/communications", icon: MessageSquare },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={`${className} ${isCollapsed ? 'w-16' : 'w-72'} transition-all`}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <SidebarTrigger className="absolute top-4 right-4  hover:bg-primary/40"/>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">School+</h2>
              <p className="text-xs text-sidebar-foreground/60">نظام إدارة الحالات</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel
            className={`transition-all ${isCollapsed ? 'opacity-0' : 'opacity-100'} hover:opacity-0`}
          >
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className={`${isCollapsed ? ' pr-1 h-8 ' : ''}`}
                  >
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent transition-smooth"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-8 w-8  " />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 ml-3" />
          {!isCollapsed && <span>تسجيل الخروج</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}