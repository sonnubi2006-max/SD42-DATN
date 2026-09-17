import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";

export default function MainLayout() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <Navbar />
          <div className="px-2 pt-2 sm:px-4 sm:pt-4">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </>
  );
}
