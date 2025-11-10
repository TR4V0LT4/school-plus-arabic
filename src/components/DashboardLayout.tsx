import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
         <AppSidebar className=" top-0 right-0 h-full z-20" />
        <main className="flex-1 mr-16 items-center">
          {/* <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1" />
          </header> */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
     
    </SidebarProvider>
  );
};