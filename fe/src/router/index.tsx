import { createBrowserRouter, RouterProvider } from "react-router-dom";

import StoreLayout from "@/layouts/StoreLayout";
import AuthLayout from "@/layouts/AuthLayout";
import PrivateRoute from "@/components/PrivateRoute";

import HomePage from "@/pages/HomePage";
import ProductListPage from "@/pages/ProductListPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import WishlistPage from "@/pages/WishlistPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import AddressPage from "@/pages/AddressPage";
import PaymentReturnPage from "@/pages/PaymentReturnPage";
import VNPayPaymentPage from "@/pages/VNPayPaymentPage";
import MyReviewsPage from "@/pages/MyReviewsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AccountPage from "@/pages/AccountPage";
import ChatPage from "@/pages/ChatPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ReturnRequestPage from "@/pages/ReturnRequestPage";
import ReturnHistoryPage from "@/pages/ReturnHistoryPage";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import GuestOrderLookupPage from "@/pages/GuestOrderLookupPage";

const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/products", element: <ProductListPage /> },
      { path: "/products/:productCode/:slug", element: <ProductDetailPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/tra-cuu-don-hang", element: <GuestOrderLookupPage /> },

      { path: "/payment/vnpay-return", element: <PaymentReturnPage /> },
      { path: "/payment/vnpay/:orderId", element: <VNPayPaymentPage /> },

      {
        element: <PrivateRoute />,
        children: [
          { path: "/wishlist", element: <WishlistPage /> },
          { path: "/orders", element: <OrdersPage /> },
          { path: "/orders/:id", element: <OrderDetailPage /> },
          { path: "/orders/:id/return", element: <ReturnRequestPage /> },
          { path: "/returns", element: <ReturnHistoryPage /> },
          { path: "/addresses", element: <AddressPage /> },
          { path: "/reviews", element: <MyReviewsPage /> },
          { path: "/account", element: <AccountPage /> },
          { path: "/chat", element: <ChatPage /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },

  {
    element: <StoreLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
