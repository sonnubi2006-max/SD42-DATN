import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AddressResponse, AddressRequest } from "@/api/customerApi";
import type { PosCheckoutAddressRequest } from "@/api/posApi";
import { posApi } from "@/api/posApi";
import {
  money,
  formatNumberWithCommas,
  parseNumberFromCommas,
} from "./posUtils";
import { useProvinces, useWardsByProvince } from "@/hooks/useVnAddress";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
} from "@/hooks/useCustomer";
import { AddressFormDialog } from "@/components/customer/AddressFormDialog";
import SavedAddressList from "./SavedAddressList";
import ManualAddressForm from "./ManualAddressForm";

export interface DeliveryInfo {
  isDelivery: boolean;
  deliveryFee: number;
  valid: boolean;
  address: PosCheckoutAddressRequest | null;
}

interface Props {
  customer: { id: number | null; name: string; phone: string };
  onDeliveryChange: (info: DeliveryInfo) => void;
}

export default function DeliverySection({ customer, onDeliveryChange }: Props) {
  const { id: customerId, name: customerName, phone: customerPhone } = customer;

  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [addressMode, setAddressMode] = useState<"saved" | "manual">("saved");
  const [addressFormOpen, setAddressFormOpen] = useState(false);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [provinceCode, setProvinceCode] = useState<number | undefined>(
    undefined,
  );
  const [districtId, setDistrictId] = useState<number | undefined>(undefined);
  const [wardCode, setWardCode] = useState<string | undefined>(undefined);
  const [provinceName, setProvinceName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [wardName, setWardName] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<
    number | undefined
  >(undefined);

  const [ghnFee, setGhnFee] = useState<number>(0);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const feeRequestIdRef = useRef(0);

  const { data: provinces } = useProvinces();
  const { data: wards, isLoading: wardsLoading } = useWardsByProvince(
    provinceCode,
    provinceName,
  );
  const {
    data: customerAddresses,
    isLoading: customerAddressesLoading,
    isError: customerAddressesError,
  } = useCustomerAddresses(customerId ?? 0, !!customerId && isDelivery);
  const { mutate: createCustomerAddress, isPending: isCreatingAddress } =
    useCreateCustomerAddress();

  const isAddressSelected = (addr: AddressResponse) => {
    return addr.addressId === selectedAddressId;
  };

  const handlePickAddress = (addr: AddressResponse) => {
    setSelectedAddressId(addr.addressId);
    setReceiverName(addr.consigneeName || customerName);
    setReceiverPhone(addr.phone || customerPhone);
    setProvinceName(addr.province || "");
    setDistrictName(addr.district || "");
    setWardName(addr.ward || "");
    setDetailAddress(addr.streetAddress || "");

    setProvinceCode(undefined);
    setDistrictId(addr.ghnDistrictId);
    setWardCode(addr.ghnWardCode);
  };

  const handleCreateAddress = (payload: AddressRequest) => {
    if (!customerId) return;
    createCustomerAddress(
      { id: customerId, payload },
      {
        onSuccess: (newAddr) => {
          toast.success("Thêm địa chỉ mới thành công!");
          setAddressFormOpen(false);
          handlePickAddress(newAddr);
        },
        onError: (err: any) =>
          toast.error(err?.apiMessage || "Thêm địa chỉ thất bại"),
      },
    );
  };

  useEffect(() => {
    setAddressMode(customerId ? "saved" : "manual");
  }, [customerId]);

  const prevCustomerId = useRef(customerId);
  useEffect(() => {
    if (prevCustomerId.current && !customerId) {
      setReceiverName("");
      setReceiverPhone("");
      setProvinceName("");
      setDistrictName("");
      setWardName("");
      setDetailAddress("");
      setProvinceCode(undefined);
      setDistrictId(undefined);
      setWardCode(undefined);
      setSelectedAddressId(undefined);
    }
    prevCustomerId.current = customerId;
  }, [customerId]);

  useEffect(() => {
    setIsManualOverride(false);
  }, [districtId, wardCode]);

  useEffect(() => {
    if (!isDelivery || !districtId || !wardCode) return;

    const requestId = ++feeRequestIdRef.current;
    setIsCalculatingFee(true);

    posApi
      .calculateShippingFee({
        toDistrictId: districtId,
        toWardCode: wardCode,
      })
      .then((fee) => {
        if (requestId !== feeRequestIdRef.current) return;
        setGhnFee(fee);
        setShippingFee((currentFee) =>
          isManualOverride ? currentFee : fee.toString(),
        );
      })
      .catch(() => {
        if (requestId !== feeRequestIdRef.current) return;
        setGhnFee(35000);
        setShippingFee((currentFee) =>
          isManualOverride ? currentFee : "35000",
        );
        toast.warning(
          "GHN phản hồi chậm, hệ thống đang dùng phí mặc định 35.000đ.",
        );
      })
      .finally(() => {
        if (requestId === feeRequestIdRef.current) {
          setIsCalculatingFee(false);
        }
      });

    return () => {
      if (requestId === feeRequestIdRef.current) {
        feeRequestIdRef.current += 1;
      }
    };
  }, [isDelivery, districtId, wardCode, isManualOverride]);

  const cleanName = (name: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(
        /^(tinh|thanh pho|thanh pho.|quan|huyen|thi xa|phuong|xa|thi tran)\s+/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();
  };

  useEffect(() => {
    if (isDelivery) {
      if (!shippingFee || shippingFee === "0" || shippingFee === "") {
        setShippingFee("35000");
      }
    } else {
      setShippingFee("");
    }
  }, [isDelivery]);

  useEffect(() => {
    if (isDelivery && provinceName && provinces && !provinceCode) {
      const match = provinces.find(
        (p) =>
          cleanName(p.name) === cleanName(provinceName) ||
          String(p.code) === provinceName,
      );
      if (match) setProvinceCode(match.code);
    }
  }, [isDelivery, provinceName, provinces, provinceCode]);

  useEffect(() => {
    if (isDelivery && wardName && wards && provinceCode && !wardCode) {
      const match = wards.find(
        (w) =>
          w.ghnWardCode === wardName ||
          w.wardCode === wardName ||
          cleanName(w.wardName) === cleanName(wardName),
      );
      if (match) {
        setWardCode(match.ghnWardCode);
        setDistrictId(match.districtId);
        setDistrictName(match.districtName);
      }
    }
  }, [isDelivery, wardName, wards, provinceCode, wardCode]);

  useEffect(() => {
    if (
      isDelivery &&
      customerId &&
      customerAddresses &&
      customerAddresses.length > 0
    ) {
      const hasSelection = customerAddresses.some(isAddressSelected);
      if (!hasSelection) {
        const defaultAddr =
          customerAddresses.find((a) => a.isDefault) || customerAddresses[0];
        if (defaultAddr) handlePickAddress(defaultAddr);
      }
    }
  }, [customerAddresses, isDelivery, customerId]);

  const handleApplyPreset = (
    type: "free" | "half" | "flat20" | "nationwide" | "default",
  ) => {
    if (type === "free") {
      setShippingFee("0");
      setIsManualOverride(true);
      toast.success("Đã miễn phí vận chuyển cho khách!");
    } else if (type === "half") {
      const half = Math.round(ghnFee / 2);
      setShippingFee(half.toString());
      setIsManualOverride(true);
      toast.success(`Đã giảm 50% phí vận chuyển: ${money(half)}`);
    } else if (type === "flat20") {
      setShippingFee("20000");
      setIsManualOverride(true);
      toast.success("Đã áp dụng đồng giá ship 20,000đ");
    } else if (type === "nationwide") {
      setShippingFee("35000");
      setIsManualOverride(true);
      toast.success("Đã áp dụng phí giao hàng toàn quốc 35.000đ");
    } else if (type === "default") {
      setShippingFee(ghnFee.toString());
      setIsManualOverride(false);
      toast.success(`Đã khôi phục phí GHN mặc định: ${money(ghnFee)}`);
    }
  };

  const deliveryFee = isDelivery ? Number(shippingFee) || 0 : 0;
  const valid =
    !isDelivery ||
    Boolean(
      receiverName.trim() &&
      receiverPhone.trim() &&
      provinceName &&
      wardName &&
      detailAddress.trim(),
    );

  const onChangeRef = useRef(onDeliveryChange);
  useEffect(() => {
    onChangeRef.current = onDeliveryChange;
  }, [onDeliveryChange]);
  useEffect(() => {
    onChangeRef.current({
      isDelivery,
      deliveryFee,
      valid,
      address: isDelivery
        ? {
          receiverName: receiverName || customerName,
          receiverPhone: receiverPhone || customerPhone,
          province: provinceName,
          district: districtName,
          ward: wardName,
          detailAddress,
        }
        : null,
    });
  }, [
    isDelivery,
    deliveryFee,
    valid,
    receiverName,
    receiverPhone,
    provinceName,
    districtName,
    wardName,
    detailAddress,
    customerName,
    customerPhone,
  ]);

  return (
    <div className="px-4 py-3 border-b bg-card">
      <div className="mb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          <Truck size={13} className="text-blue-600" />
          Hình thức nhận hàng
        </span>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Chọn nhận trực tiếp tại quầy hoặc giao đến địa chỉ khách
        </p>
      </div>

      <Collapsible open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-full border border-border">
          <button
            type="button"
            onClick={() => {
              setIsDelivery(false);
              setDeliveryOpen(false);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md flex-1 transition-all cursor-pointer ${!isDelivery
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
          >
            <ShoppingBag size={14} />
            <span>Nhận tại quầy</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDelivery(true);
              setDeliveryOpen(true);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md flex-1 transition-all cursor-pointer ${isDelivery
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
          >
            <Truck
              size={14}
              className={isDelivery ? "text-primary" : "text-muted-foreground"}
            />
            <span>Giao hàng tận nơi</span>
          </button>

          {isDelivery && (
            <CollapsibleTrigger className="p-1.5 rounded-md hover:bg-background/80 transition-colors cursor-pointer">
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 text-muted-foreground ${deliveryOpen ? "rotate-180" : ""
                  }`}
              />
            </CollapsibleTrigger>
          )}
        </div>

        {!isDelivery && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-2.5 py-2 text-[10px] font-medium text-emerald-700">
            <CheckCircle2 size={13} />
            Không cần địa chỉ và không phát sinh phí vận chuyển.
          </div>
        )}

        {isDelivery && (
          <CollapsibleContent>
            <div className="mt-3 space-y-3 rounded-xl border bg-muted/20 p-3 shadow-2xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <MapPin size={13} className="text-primary" />
                  Địa chỉ giao nhận hàng
                </div>
              </div>

              {customerId ? (
                <div className="space-y-3">
                  { }
                  <div className="flex gap-1 p-0.5 bg-muted rounded-md text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setAddressMode("saved")}
                      className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${addressMode === "saved"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Địa chỉ đã lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddressMode("manual");
                        setSelectedAddressId(undefined);
                      }}
                      className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${addressMode === "manual"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Nhập địa chỉ mới
                    </button>
                  </div>

                  {addressMode === "saved" ? (
                    <SavedAddressList
                      customerAddresses={customerAddresses}
                      isLoading={customerAddressesLoading}
                      isError={customerAddressesError}
                      customerName={customerName}
                      customerPhone={customerPhone}
                      isAddressSelected={isAddressSelected}
                      onPickAddress={handlePickAddress}
                      onAddAddressClick={() => setAddressFormOpen(true)}
                    />
                  ) : (
                    <ManualAddressForm
                      receiverName={receiverName}
                      setReceiverName={setReceiverName}
                      receiverPhone={receiverPhone}
                      setReceiverPhone={setReceiverPhone}
                      provinceId={provinceCode}
                      setProvinceId={setProvinceCode}
                      setProvinceName={setProvinceName}
                      wardCode={wardCode}
                      setWardCode={setWardCode}
                      setWardName={setWardName}
                      setDistrictId={setDistrictId}
                      setDistrictName={setDistrictName}
                      detailAddress={detailAddress}
                      setDetailAddress={setDetailAddress}
                      provinces={provinces}
                      wards={wards}
                      wardsLoading={wardsLoading}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-1.5 rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400 border border-amber-500/20 leading-relaxed">
                    <Info
                      size={14}
                      className="shrink-0 mt-0.5 text-amber-600"
                    />
                    <span>
                      Gán thông tin khách hàng để chọn nhanh từ danh sách địa
                      chỉ đã lưu.
                    </span>
                  </div>
                  <ManualAddressForm
                    receiverName={receiverName}
                    setReceiverName={setReceiverName}
                    receiverPhone={receiverPhone}
                    setReceiverPhone={setReceiverPhone}
                    provinceId={provinceCode}
                    setProvinceId={setProvinceCode}
                    setProvinceName={setProvinceName}
                    wardCode={wardCode}
                    setWardCode={setWardCode}
                    setWardName={setWardName}
                    setDistrictId={setDistrictId}
                    setDistrictName={setDistrictName}
                    detailAddress={detailAddress}
                    setDetailAddress={setDetailAddress}
                    provinces={provinces}
                    wards={wards}
                    wardsLoading={wardsLoading}
                  />
                </div>
              )}

              {!valid && (
                <div className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[10px] font-medium leading-relaxed text-red-700">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  Vui lòng nhập đủ người nhận, số điện thoại, tỉnh/thành,
                  phường/xã và địa chỉ chi tiết.
                </div>
              )}

              { }
              <div className="pt-3 border-t space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={13} className="text-primary" /> Phí vận chuyển
                    (đ)
                  </Label>
                  {isCalculatingFee ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      <RefreshCw size={10} className="animate-spin" />
                      Đang tính phí...
                    </span>
                  ) : isManualOverride ? (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Đã sửa thủ công
                    </span>
                  ) : districtId && wardCode ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Phí GHN
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="35.000"
                      value={formatNumberWithCommas(shippingFee)}
                      onChange={(e) => {
                        const raw = parseNumberFromCommas(e.target.value);
                        setShippingFee(raw);
                        setIsManualOverride(true);
                      }}
                      className="h-8.5 text-xs bg-background pr-8  font-semibold"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-muted-foreground">
                      đ
                    </span>
                  </div>

                  {isManualOverride && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleApplyPreset("default")}
                      className="h-8.5 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Khôi phục tính phí tự động GHN"
                    >
                      <RefreshCw size={13} />
                    </Button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("nationwide")}
                  className={`w-full rounded-md border py-1.5 text-[10px] font-bold transition cursor-pointer ${isManualOverride && shippingFee === "35000"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    }`}
                >
                  Giao hàng toàn quốc · 35.000đ
                </button>

                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("free")}
                    className={`py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer ${shippingFee === "0"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                  >
                    Free Ship
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("half")}
                    className={`py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer ${isManualOverride &&
                        Number(shippingFee) === Math.round(ghnFee / 2)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                  >
                    Giảm 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("flat20")}
                    className={`py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer ${shippingFee === "20000"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                  >
                    Đồng giá 20k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("default")}
                    className={`py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer ${!isManualOverride
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                  >
                    Tự động
                  </button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>

      {customerId && (
        <AddressFormDialog
          open={addressFormOpen}
          onOpenChange={setAddressFormOpen}
          initial={null}
          isPending={isCreatingAddress}
          onSubmit={handleCreateAddress}
        />
      )}
    </div>
  );
}
