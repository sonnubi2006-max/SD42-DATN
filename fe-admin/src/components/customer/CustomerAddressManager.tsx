import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressFormDialog } from "./AddressFormDialog";
import ConfirmModal from "@/components/ConfirmModal";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
  useSetDefaultAddress,
} from "@/hooks/useCustomer";
import type { AddressRequest, AddressResponse } from "@/api/customerApi";

interface LiveProps {
  mode: "live";
  customerId: number;
}
interface DraftProps {
  mode: "draft";
  value: AddressRequest[];
  onChange: (list: AddressRequest[]) => void;
}
type Props = LiveProps | DraftProps;

export function CustomerAddressManager(props: Props) {
  if (props.mode === "live") {
    return <LiveManager {...props} />;
  }
  return <DraftManager {...props} />;
}

function SectionShell({
  children,
  onAdd,
}: {
  children: React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Sổ địa chỉ</span>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> Thêm địa chỉ
        </Button>
      </div>
      {children}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: {
    consigneeName?: string | null;
    phone?: string | null;
    isDefault?: boolean | null;
    streetAddress?: string | null;
    ward?: string | null;
    district?: string | null;
    province?: string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault?: () => void;
}) {
  const addressLine = [
    address.streetAddress,
    address.ward,
    address.province,
  ]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s && s !== "-" && s !== "null" && s !== "undefined"))
    .join(", ");

  return (
    <div className="rounded-xl border border-gray-150 p-3.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1.5">
          {address.consigneeName || "—"}
          {address.isDefault && (
            <Badge variant="success" className="text-[10px]">
              Mặc định
            </Badge>
          )}
        </span>
        <div className="flex items-center gap-1">
          {!address.isDefault && onSetDefault && (
            <Button type="button" size="icon" variant="ghost" title="Đặt mặc định" onClick={onSetDefault}>
              <Star className="h-4 w-4 text-amber-500" />
            </Button>
          )}
          <Button type="button" size="icon" variant="ghost" title="Sửa" onClick={onEdit}>
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button>
          <Button type="button" size="icon" variant="ghost" title="Xoá" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {address.phone && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" /> {address.phone}
        </p>
      )}
      <p className="text-sm text-gray-700 flex items-start gap-1">
        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
        {addressLine || "(chưa có chi tiết)"}
      </p>
    </div>
  );
}

function LiveManager({ customerId }: LiveProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editInitial, setEditInitial] = useState<AddressResponse | AddressRequest | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const openAdd = () => {
    setEditIndex(null);
    setEditInitial(null);
    setDialogOpen(true);
  };

  const { data: addresses, isLoading } = useCustomerAddresses(customerId);
  const create = useCreateCustomerAddress();
  const update = useUpdateCustomerAddress();
  const remove = useDeleteCustomerAddress();
  const setDefault = useSetDefaultAddress();

  const editingId = editIndex; 

  const handleSubmit = (payload: AddressRequest) => {
    if (editingId != null) {
      update.mutate(
        { id: customerId, addressId: editingId, payload },
        {
          onSuccess: () => {
            toast.success("Cập nhật địa chỉ thành công");
            setDialogOpen(false);
          },
          onError: (e: any) => toast.error(e?.apiMessage ?? "Thất bại"),
        },
      );
    } else {
      create.mutate(
        { id: customerId, payload },
        {
          onSuccess: () => {
            toast.success("Thêm địa chỉ thành công");
            setDialogOpen(false);
          },
          onError: (e: any) => toast.error(e?.apiMessage ?? "Thất bại"),
        },
      );
    }
  };

  return (
    <SectionShell onAdd={openAdd}>
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Chưa có địa chỉ nào</p>
      ) : (
        <div className="space-y-2.5">
          {addresses.map((a) => (
            <AddressCard
              key={a.addressId}
              address={a}
              onEdit={() => {
                setEditIndex(a.addressId);
                setEditInitial(a);
                setDialogOpen(true);
              }}
              onDelete={() => setDeletingId(a.addressId)}
              onSetDefault={() =>
                setDefault.mutate(
                  { id: customerId, addressId: a.addressId },
                  {
                    onSuccess: () => toast.success("Đã đặt mặc định"),
                    onError: (e: any) => toast.error(e?.apiMessage ?? "Thất bại"),
                  },
                )
              }
            />
          ))}
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editInitial}
        isPending={create.isPending || update.isPending}
        onSubmit={handleSubmit}
      />

      {deletingId !== null && (
        <ConfirmModal
          typeConfirm="DELETE"
          message="Bạn có chắc chắn muốn xoá địa chỉ này?"
          isPending={remove.isPending}
          onCancel={() => setDeletingId(null)}
          onConfirm={() =>
            remove.mutate(
              { id: customerId, addressId: deletingId },
              {
                onSuccess: () => {
                  toast.success("Đã xoá địa chỉ");
                  setDeletingId(null);
                },
                onError: (e: any) => {
                  toast.error(e?.apiMessage ?? "Thất bại");
                  setDeletingId(null);
                },
              },
            )
          }
        />
      )}
    </SectionShell>
  );
}

function DraftManager({ value, onChange }: DraftProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editInitial, setEditInitial] = useState<AddressResponse | AddressRequest | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const openAdd = () => {
    setEditIndex(null);
    setEditInitial(null);
    setDialogOpen(true);
  };

  const handleSubmit = (payload: AddressRequest) => {
    let next = [...value];
    if (payload.isDefault) next = next.map((a) => ({ ...a, isDefault: false }));
    if (editIndex != null) next[editIndex] = payload;
    else next.push(payload);
    if (!next.some((a) => a.isDefault) && next.length > 0) next[0].isDefault = true;
    onChange(next);
    setDialogOpen(false);
  };

  return (
    <SectionShell onAdd={openAdd}>
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          Chưa có địa chỉ. Có thể thêm ngay hoặc bổ sung sau khi tạo khách.
        </p>
      ) : (
        <div className="space-y-2.5">
          {value.map((a, i) => (
            <AddressCard
              key={i}
              address={a}
              onEdit={() => {
                setEditIndex(i);
                setEditInitial(a);
                setDialogOpen(true);
              }}
              onDelete={() => setDeletingIndex(i)}
              onSetDefault={() =>
                onChange(value.map((x, idx) => ({ ...x, isDefault: idx === i })))
              }
            />
          ))}
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editInitial}
        onSubmit={handleSubmit}
      />

      {deletingIndex !== null && (
        <ConfirmModal
          typeConfirm="DELETE"
          message="Bạn có chắc chắn muốn xoá địa chỉ này?"
          isPending={false}
          onCancel={() => setDeletingIndex(null)}
          onConfirm={() => {
            onChange(value.filter((_, idx) => idx !== deletingIndex));
            setDeletingIndex(null);
            toast.success("Đã xoá địa chỉ");
          }}
        />
      )}
    </SectionShell>
  );
}
