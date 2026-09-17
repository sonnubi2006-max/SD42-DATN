import { Outlet, ScrollRestoration } from "react-router-dom";
import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import ChatPopup from "@/components/chat/ChatPopup";

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter />
      <ChatPopup />
      <ScrollRestoration />
    </div>
  );
}
