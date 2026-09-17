import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddressModal from "@/components/address/AddressModal";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from "@/hooks/useAddress";
import type { AddressRequest, AddressResponse } from "@/api/addressApi";
import AccountLayout from "@/components/account/AccountLayout";

export default function AddressPage() {
  const { data: addresses, isLoading } = useAddresses();
  const { mutate: create, isPending: creating } = useCreateAddress();
  const { mutate: update, isPending: updating } = useUpdateAddress();
  const { mutate: setDefault } = useSetDefaultAddress();
  const { mutate: remove } = useDeleteAddress();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AddressResponse | null>(null);

  const handleSubmit = (payload: AddressRequest) => {
    if (editing) {
      update(
        { addressId: editing.addressId, payload },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      create(payload, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sổ địa chỉ</h1>
            <p className="text-sm text-muted-foreground">Quản lý các địa chỉ nhận hàng của bạn</p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            <Plus className="mr-1.5 size-4" /> Thêm địa chỉ mới
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        ) : !addresses?.length ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
            <MapPin className="size-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Bạn chưa có địa chỉ giao hàng nào.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <Card key={addr.addressId} className="border-border/75">
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{addr.consigneeName}</span>
                      <span className="text-xs text-muted-foreground">
                        {addr.phone}
                      </span>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Mặc định</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {[
                        addr.streetAddress,
                        addr.wardName || addr.ward,
                        addr.provinceName || addr.province,
                      ]
                        .map((s) => s?.trim())
                        .filter((s): s is string => Boolean(s && s !== "-" && s !== "null" && s !== "undefined"))
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Đặt mặc định"
                        onClick={() => setDefault(addr.addressId)}
                        className="cursor-pointer h-8 w-8"
                      >
                        <Star className="size-3.5 text-muted-foreground hover:text-amber-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(addr);
                        setOpen(true);
                      }}
                      className="cursor-pointer h-8 w-8"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(addr.addressId)}
                      className="cursor-pointer h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddressModal
          open={open}
          initial={editing}
          isPending={creating || updating}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </div>
    </AccountLayout>
  );
}
