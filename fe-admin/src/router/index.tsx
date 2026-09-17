import { createBrowserRouter, RouterProvider } from "react-router-dom";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import HomePage from "@/pages/HomePage";
import LandingPage from "@/pages/LandingPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import CategoryPage from "@/pages/CategoryPage";

import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import BrandPage from "@/pages/BrandPage";
import BannerPage from "@/pages/BannerPage";
import ProductPage from "@/pages/ProductPage";
import ProductCreatePage from "@/pages/ProductCreatePage";
import ProductEditPage from "@/pages/ProductEditPage";
import SupplierPage from "@/pages/SupplierPage";
import PrivateRoute from "@/components/PrivateRoute";
import CouponPage from "@/pages/CouponPage";
import UserPage from "@/pages/UserPage";
import UserCreatePage from "@/pages/UserCreatePage";
import UserUpdatePage from "@/pages/UserDetailPage";
import MarketingEmailPage from "@/pages/MarketingEmailPage";

import OrderPage from "@/pages/OrderPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import ReturnPage from "@/pages/ReturnPage";
import ReturnDetailPage from "@/pages/ReturnDetailPage";
import POSPage from "@/pages/POSPage";
import RoleRoute from "@/layouts/RoleRoute";
import { CouponCreatePage } from "@/pages/CouponCreatePage";
import CustomerPage from "@/pages/CustomerPage";
import CustomerCreatePage from "@/pages/CustomerCreatePage";
import CustomerUpdatePage from "@/pages/CustomerUpdatePage";
import ChatPage from "@/pages/ChatPage";
import ReviewPage from "@/pages/ReviewPage/index";

import PromotionPage from "@/pages/PromotionPage";
import { PromotionCreatePage } from "@/pages/PromotionCreatePage";
import ListProductVariantPage from "@/pages/ListProductVariantPage";
import ProductVariantPage from "@/pages/ProductVariantPage";
import ExchangeDeliveryPage from "@/pages/ExchangeDeliveryPage";

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
    ],
  },

  {
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            element: <RoleRoute roles={["ADMIN"]} />,
            children: [
              { path: "/suppliers", element: <SupplierPage /> },
              { path: "/banners", element: <BannerPage /> },
              {
                path: "/coupons",
                children: [
                  { path: "/coupons", element: <CouponPage /> },
                  { path: "/coupons/create", element: <CouponCreatePage /> },
                  { path: "/coupons/:id", element: <CouponCreatePage /> },
                ],
              },
              {
                path: "/promotions",
                children: [
                  { path: "/promotions", element: <PromotionPage /> },
                  {
                    path: "/promotions/create",
                    element: <PromotionCreatePage />,
                  },
                  { path: "/promotions/:id", element: <PromotionCreatePage /> },
                ],
              },
              { path: "/marketing-emails", element: <MarketingEmailPage /> },
              { path: "/reviews", element: <ReviewPage /> },
              {
                path: "/users",
                children: [
                  { path: "/users/", element: <UserPage /> },
                  { path: "/users/create", element: <UserCreatePage /> },
                  { path: "/users/:id", element: <UserUpdatePage /> },
                ],
              },
              { path: "*", element: <NotFoundPage /> },
            ],
          },
          {
            element: <RoleRoute roles={["ADMIN", "STAFF"]} />,
            children: [
              { path: "/", element: <LandingPage /> },
              { path: "/statistics", element: <HomePage /> },
              { path: "/profile", element: <ProfilePage /> },
              { path: "/categories", element: <CategoryPage /> },
              { path: "/brands", element: <BrandPage /> },
              {
                path: "/products",
                children: [
                  { path: "/products/", element: <ProductPage /> },
                  { path: "/products/create", element: <ProductCreatePage /> },
                  { path: "/products/:id/edit", element: <ProductEditPage /> },
                  { path: "/products/:id", element: <ProductVariantPage /> },
                  {
                    path: "/products/variants",
                    element: <ListProductVariantPage />,
                  },
                ],
              },
              {
                path: "/customers",
                children: [
                  { path: "/customers", element: <CustomerPage /> },
                  {
                    path: "/customers/create",
                    element: <CustomerCreatePage />,
                  },
                  {
                    path: "/customers/:id/edit",
                    element: <CustomerUpdatePage />,
                  },
                ],
              },
              {
                path: "/orders",
                children: [
                  { path: "", element: <OrderPage /> },
                  { path: ":id", element: <OrderDetailPage /> },
                ],
              },
              {
                path: "/returns",
                children: [
                  { path: "", element: <ReturnPage /> },
                  { path: ":id", element: <ReturnDetailPage /> },
                ],
              },
              { path: "/exchange-deliveries", element: <ExchangeDeliveryPage /> },
              { path: "/pos", element: <POSPage /> },
              { path: "/chat", element: <ChatPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
