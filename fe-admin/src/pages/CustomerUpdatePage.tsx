import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerForm } from "@/components/customer/CustomerForm";
import { CustomerAddressManager } from "@/components/customer/CustomerAddressManager";
import CustomerOrderHistory from "@/components/customer/CustomerOrderHistory";
import CustomerReturnHistory from "@/components/customer/CustomerReturnHistory";
import CustomerStatistics from "@/components/customer/CustomerStatistics";
import { useCustomer, useUpdateCustomer } from "@/hooks/useCustomer";
import type { CustomerRequest } from "@/api/customerApi";

export default function CustomerUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const customerId = Number(id);
  const [activeTab, setActiveTab] = useState<"orders" | "returns">("orders");

  const { data: customer, isLoading } = useCustomer(customerId);
  const { mutate: update, isPending } = useUpdateCustomer();

  const onSubmit = (payload: CustomerRequest) => {
    update(
      { id: customerId, payload },
      {
        onSuccess: () => {
          toast.success("Cập nhật khách hàng thành công");
          navigate("/customers");
        },
        onError: (err: any) =>
          toast.error(err?.apiMessage ?? "Cập nhật thất bại"),
      },
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-medium text-foreground flex items-center gap-2">
            Cập nhật khách hàng
            {customer && (
              <Badge variant="outline" className="text-xs">
                {customer.source === "REGISTERED" ? "Có tài khoản" : "Vãng lai"}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {customer?.email ?? "Chỉnh sửa hồ sơ khách hàng"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base font-medium">
            Thông tin khách hàng
          </CardTitle>
          <CardDescription>
            Cập nhật thông tin liên hệ và tuỳ chọn nhận ưu đãi
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {isLoading || !customer ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <CustomerForm
              defaultValues={{
                email: customer.email ?? undefined,
                fullName: customer.fullName ?? undefined,
                phone: customer.phone ?? undefined,
                gender: customer.gender === "FEMALE" ? "FEMALE" : "MALE",
                birthday: customer.birthday ?? undefined,
                avatar: customer.avatar ?? undefined,
                emailSubscribed: customer.emailSubscribed,
              }}
              isPending={isPending}
              submitLabel="Lưu thay đổi"
              onSubmit={onSubmit}
              onCancel={() => navigate("/customers")}
            />
          )}
        </CardContent>
      </Card>

      {customer && (
        <Card>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-base font-medium">Địa chỉ</CardTitle>
            <CardDescription>
              Thêm, sửa, xoá hoặc đặt địa chỉ mặc định cho khách (lưu ngay)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <CustomerAddressManager mode="live" customerId={customerId} />
          </CardContent>
        </Card>
      )}

      {}
      <CustomerStatistics customerId={customerId} />

      {}
      <div className="space-y-4">
        <div className="border-b border-gray-100 flex gap-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-colors ${
              activeTab === "orders"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Lịch sử đơn hàng
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-colors ${
              activeTab === "returns"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Lịch sử đổi trả
          </button>
        </div>

        {activeTab === "orders" && (
          <CustomerOrderHistory customerId={customerId} />
        )}

        {activeTab === "returns" && customer?.customerCode && (
          <CustomerReturnHistory customerCode={customer.customerCode} />
        )}
      </div>
    </div>
  );
}
