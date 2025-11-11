import { Home, FileText, Calendar, Users, MessageSquare, BarChart3, TrendingUp, Settings, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";
   const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const MenuItem = ({ item }: { item: typeof items[0] }) => {
    const isActive = location.pathname === item.url;
    
    const content = (
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={`
            flex items-center transition-all duration-200 rounded-lg
            ${isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3"}
            ${isActive 
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm" 
              : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
            }
          `}
        >
          <item.icon 
            className={`h-5 w-5 ${isCollapsed ? "" : "shrink-0"}`}
          />
          {!isCollapsed && (
            <span className="text-sm font-medium">{item.title}</span>
          )}
        </NavLink>
      </SidebarMenuButton>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="left" className="font-medium">
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <Sidebar
      className={`${className} ${
        isCollapsed ? "w-16" : "w-64"
      } transition-all duration-300 flex flex-col border-l`}
    >
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div
            className={`flex ${
              isCollapsed ? "justify-center w-full" : "items-center gap-3"
            }`}
          >
            <div className="rounded-lg bg-primary/10 p-2 flex justify-center items-center">
              <GraduationCap className="h-6 w-6 text-primary" />
               {!isCollapsed && (
                 <SidebarTrigger className="hover:bg-sidebar-primary/20 rounded-md absolute shrink-0" />
                )}
                {isCollapsed && (
              <div className="absolute mt-2">
                <SidebarTrigger className=" hover:bg-sidebar-primary/20 rounded-md  " />
              </div>
            )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-sidebar-foreground truncate">
                  School+
                </h2>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  نظام الإدارة
                </p>
              </div>
            )}
          </div>
         
        </div>
        
      </SidebarHeader>

      {/* Menu */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              القائمة الرئيسية
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <MenuItem item={item} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-2 ">
        <div
          className={`flex ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {isCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ThemeToggle />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  تبديل المظهر
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-accent transition-colors"
             onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
             {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">تبديل المظهر</span>
          </Button>
          )}
        </div>
        
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-destructive transition-colors"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                تسجيل الخروج
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">تسجيل الخروج</span>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}