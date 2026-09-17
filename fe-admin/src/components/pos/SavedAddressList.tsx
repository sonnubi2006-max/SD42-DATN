import { MapPin, MapPinned, Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AddressResponse } from "@/api/customerApi";

interface SavedAddressListProps {
  customerAddresses: AddressResponse[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  customerName: string;
  customerPhone: string;
  isAddressSelected: (addr: AddressResponse) => boolean;
  onPickAddress: (addr: AddressResponse) => void;
  onAddAddressClick: () => void;
}

export default function SavedAddressList({
  customerAddresses,
  isLoading = false,
  isError = false,
  customerName,
  customerPhone,
  isAddressSelected,
  onPickAddress,
  onAddAddressClick,
}: SavedAddressListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <MapPinned size={13} className="text-primary" />
          Địa chỉ giao hàng của khách
        </Label>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-4 text-center text-xs font-medium text-muted-foreground">
          Đang tải địa chỉ của khách hàng...
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 py-4 text-center text-xs font-medium text-red-700">
          Không thể tải địa chỉ khách hàng. Vui lòng thử lại.
        </div>
      ) : customerAddresses && customerAddresses.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {customerAddresses.map((addr) => {
            const selected = isAddressSelected(addr);
            return (
              <button
                type="button"
                key={addr.addressId}
                onClick={() => onPickAddress(addr)}
                className={`group flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left text-xs transition-all relative cursor-pointer ${selected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                  }`}
              >
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                  }`}>
                  {selected && <Check size={10} className="stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-foreground truncate">
                      {addr.consigneeName || customerName}
                    </span>
                    {(addr.phone || customerPhone) && (
                      <span className="text-muted-foreground  text-[11px]">
                        · {addr.phone || customerPhone}
                      </span>
                    )}
                    {addr.isDefault && (
                      <Badge variant="secondary" className="text-[9px] font-semibold px-1 py-0 h-4 bg-primary/10 text-primary border-none">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-[11px] mt-0.5 font-medium leading-relaxed">
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
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 bg-muted/20 rounded-lg border border-dashed border-border">
          <MapPin size={20} className="mx-auto text-muted-foreground/40 mb-1" />
          <p className="text-xs text-muted-foreground font-medium">
            Khách hàng chưa có địa chỉ giao nhận nào
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs border-dashed gap-1.5 font-semibold cursor-pointer"
        onClick={onAddAddressClick}
      >
        <Plus size={13} />
        Thêm địa chỉ mới cho khách
      </Button>
    </div>
  );
}
