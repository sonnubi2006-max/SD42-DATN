import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CustomerForm } from "@/components/customer/CustomerForm";
import { CustomerAddressManager } from "@/components/customer/CustomerAddressManager";
import { useCreateCustomer } from "@/hooks/useCustomer";
import { customerApi } from "@/api/customerApi";
import type { CustomerRequest, AddressRequest } from "@/api/customerApi";

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const { mutateAsync: createCustomer, isPending } = useCreateCustomer();
  const [draftAddresses, setDraftAddresses] = useState<AddressRequest[]>([]);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (payload: CustomerRequest) => {
    try {
      setSaving(true);
      const created = await createCustomer(payload);
      if (draftAddresses.length > 0) {
        await Promise.all(
          draftAddresses.map((a) =>
            customerApi.createAddress(created.customerId, a),
          ),
        );
      }
      toast.success("Tạo khách hàng thành công");
      navigate("/customers");
    } catch (err: any) {
      toast.error(err?.apiMessage ?? "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-medium text-foreground">
            Thêm khách hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tạo hồ sơ khách hàng mới
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base font-medium">
            Thông tin khách hàng
          </CardTitle>
          <CardDescription>
            Email là khóa để đồng bộ khi khách đăng ký tài khoản online
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-6">
          <div className="border-b pb-5">
            <CustomerForm
              isPending={isPending || saving}
              submitLabel="Tạo khách hàng"
              onSubmit={onSubmit}
              onCancel={() => navigate("/customers")}
            />
          </div>
          <CustomerAddressManager
            mode="draft"
            value={draftAddresses}
            onChange={setDraftAddresses}
          />
        </CardContent>
      </Card>
    </div>
  );
}
