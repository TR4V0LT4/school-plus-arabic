import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const LayoutContent = ({ children }: DashboardLayoutProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex min-h-screen w-full relative">
      <AppSidebar className="fixed top-0 right-0 h-full z-20" />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "mr-16" : "mr-0"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <SidebarProvider>
    <LayoutContent>{children}</LayoutContent>
  </SidebarProvider>
);
