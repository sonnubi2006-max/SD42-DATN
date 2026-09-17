import { MapPin, Phone, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useCustomerAddresses,
  useSetDefaultAddress,
} from "@/hooks/useCustomer";
import type { AddressResponse } from "@/api/customerApi";

interface Props {
  customerId: number | null;
  customerName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatAddress(a: AddressResponse) {
  return [a.streetAddress, a.ward, a.province]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s && s !== "-" && s !== "null" && s !== "undefined"))
    .join(", ");
}

export function CustomerAddressDialog({
  customerId,
  customerName,
  open,
  onOpenChange,
}: Props) {
  const { data: addresses, isLoading } = useCustomerAddresses(
    customerId ?? 0,
    open && customerId != null,
  );
  const { mutate: setDefault, isPending } = useSetDefaultAddress();

  const handleSetDefault = (addressId: number) => {
    if (customerId == null) return;
    setDefault(
      { id: customerId, addressId },
      {
        onSuccess: () => toast.success("Đã đặt địa chỉ mặc định"),
        onError: (err: any) =>
          toast.error(err?.apiMessage ?? "Thao tác thất bại"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Danh sách địa chỉ</DialogTitle>
          <DialogDescription>
            {customerName ? `Khách hàng: ${customerName}` : "Sổ địa chỉ của khách"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : !addresses || addresses.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Khách hàng chưa có địa chỉ nào
            </div>
          ) : (
            addresses.map((a) => (
              <div
                key={a.addressId}
                className="rounded-xl border border-gray-150 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {a.consigneeName ?? "—"}
                    {a.isDefault && (
                      <Badge variant="success" className="text-[10px]">
                        Mặc định
                      </Badge>
                    )}
                  </span>
                  {!a.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleSetDefault(a.addressId)}
                    >
                      <Star className="h-3.5 w-3.5 mr-1" /> Đặt mặc định
                    </Button>
                  )}
                </div>
                {a.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {a.phone}
                  </p>
                )}
                <p className="text-sm text-gray-700 flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  {formatAddress(a) || "(chưa có chi tiết địa chỉ)"}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
