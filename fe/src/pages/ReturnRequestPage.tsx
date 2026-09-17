import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRightLeft,
  ArrowLeft,
  Camera,
  FileText,
  Loader2,
  MapPin,
  PackageCheck,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useOrder } from "@/hooks/useOrder";
import { useCreateReturn } from "@/hooks/useReturn";
import { formatCurrency } from "@/utils/format";
import { returnApi, type RefundPreviewResponse } from "@/api/returnApi";
import productApi, {
  type ProductVariantResponse,
  variantEffectivePrice,
} from "@/api/productApi";
import { vnAddressApi } from "@/api/vnAddressApi";
import { useAddresses, useCreateAddress } from "@/hooks/useAddress";
import type { AddressResponse, AddressRequest } from "@/api/addressApi";
import AddressModal from "@/components/address/AddressModal";
import { useMe } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const COMMON_REASONS = [
  "Sản phẩm lỗi/hỏng do nhà sản xuất",
  "Giao sai sản phẩm (màu sắc, kích cỡ, mẫu mã...)",
];

interface SelectedItemState {
  productId: number;
  productName: string;
  variantId: number;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  originalPrice: number;
  reason: string;
  customReason: string;
}

interface ExchangeItemDraft {
  rowId: number;
  sourceVariantId?: number;
  newVariantId?: number;
  newQuantity: number;
}

export default function ReturnRequestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);

  const { data: order, isLoading: loadingOrder } = useOrder(orderId);
  const { data: account } = useMe();
  const { mutate: createReturn, isPending: submitting } = useCreateReturn();

  const [customerNameOverride, setCustomerName] = useState<string | null>(null);
  const [customerPhoneOverride, setCustomerPhone] = useState<string | null>(
    null,
  );
  const customerName =
    customerNameOverride ?? account?.fullName ?? order?.receiverName ?? "";
  const customerPhone =
    customerPhoneOverride ?? account?.phone ?? order?.receiverPhone ?? "";
  const [returnType] = useState<"REFUND" | "EXCHANGE">("EXCHANGE");
  const [exchangeVariants, setExchangeVariants] = useState<
    Record<number, ProductVariantResponse[]>
  >({});
  const [exchangeItems, setExchangeItems] = useState<ExchangeItemDraft[]>([]);
  const [note, setNote] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    Record<number, SelectedItemState>
  >({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [deliveryReceiverName, setDeliveryReceiverName] = useState("");
  const [deliveryReceiverPhone, setDeliveryReceiverPhone] = useState("");
  const [deliveryProvinceName, setDeliveryProvinceName] = useState("");
  const [deliveryDistrictId, setDeliveryDistrictId] = useState<number>();
  const [deliveryDistrictName, setDeliveryDistrictName] = useState("");
  const [deliveryWardCode, setDeliveryWardCode] = useState("");
  const [deliveryWardName, setDeliveryWardName] = useState("");
  const [deliveryDetailAddress, setDeliveryDetailAddress] = useState("");
  const [exchangeShippingFee, setExchangeShippingFee] = useState(0);
  const [isCalculatingShippingFee, setIsCalculatingShippingFee] =
    useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] =
    useState<number>();
  const [savedAddressInitialized, setSavedAddressInitialized] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const { mutate: createAddress, isPending: creatingAddress } =
    useCreateAddress();

  const handleAddAddressSubmit = (payload: AddressRequest) => {
    createAddress(payload, {
      onSuccess: (newAddress) => {
        setIsAddAddressOpen(false);
        if (newAddress) {
          applySavedAddress(newAddress);
        }
      },
    });
  };

  const {
    data: savedAddresses = [],
    isLoading: savedAddressesLoading,
    isError: savedAddressesError,
  } = useAddresses();

  const [refundPreview, setRefundPreview] =
    useState<RefundPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const applySavedAddress = useCallback(
    (address: AddressResponse) => {
      const provinceName = address.provinceName || address.province || "";
      setSelectedSavedAddressId(address.addressId);
      setSavedAddressInitialized(true);
      setDeliveryReceiverName(address.consigneeName || customerName);
      setDeliveryReceiverPhone(address.phone || customerPhone);
      setDeliveryProvinceName(provinceName);
      setDeliveryDistrictId(address.ghnDistrictId);
      setDeliveryDistrictName(address.districtName || address.district || "-");
      setDeliveryWardCode(address.ghnWardCode || "");
      setDeliveryWardName(address.wardName || address.ward || "");
      setDeliveryDetailAddress(address.streetAddress || "");
    },
    [customerName, customerPhone],
  );

  useEffect(() => {
    if (savedAddressInitialized || savedAddresses.length === 0) return;
    applySavedAddress(
      savedAddresses.find((address) => address.isDefault) || savedAddresses[0],
    );
  }, [savedAddressInitialized, savedAddresses, applySavedAddress]);

  useEffect(() => {
    if (!order && !account) return;
    setDeliveryReceiverName(
      (current) => current || account?.fullName || order?.receiverName || "",
    );
    setDeliveryReceiverPhone(
      (current) => current || account?.phone || order?.receiverPhone || "",
    );
  }, [account, order]);

  useEffect(() => {
    if (!deliveryDistrictId || !deliveryWardCode) return;

    let cancelled = false;
    setIsCalculatingShippingFee(true);
    vnAddressApi
      .calculateShippingFee({
        toDistrictId: deliveryDistrictId,
        toWardCode: deliveryWardCode,
      })
      .then((fee) => {
        if (!cancelled) setExchangeShippingFee(fee);
      })
      .catch(() => {
        if (!cancelled) {
          setExchangeShippingFee(35000);
          toast.warning(
            "Không lấy được phí GHN, tạm tính phí mặc định 35.000đ.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsCalculatingShippingFee(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deliveryDistrictId, deliveryWardCode]);

  useEffect(() => {
    const selectedValues = Object.values(selectedItems);
    if (!order || selectedValues.length === 0) {
      const clearPreviewTimer = window.setTimeout(
        () => setRefundPreview(null),
        0,
      );
      return () => window.clearTimeout(clearPreviewTimer);
    }

    const timer = setTimeout(async () => {
      setIsLoadingPreview(true);
      try {
        const preview = await returnApi.refundPreview(
          order.orderId,
          selectedValues.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        );
        setRefundPreview(preview);
      } catch {
        setRefundPreview(null);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedItems, order]);

  useEffect(() => {
    if (returnType !== "EXCHANGE" || !order) return;
    const selectedDetailIds = Object.keys(selectedItems).map(Number);
    const missing = selectedDetailIds.filter((detailId) => {
      const detail = order.orderDetails.find(
        (item) => item.orderDetailId === detailId,
      );
      return detail?.productId && !exchangeVariants[detailId];
    });
    if (!missing.length) return;

    let cancelled = false;
    Promise.all(
      missing.map(async (detailId) => {
        const detail = order.orderDetails.find(
          (item) => item.orderDetailId === detailId,
        )!;
        return [
          detailId,
          await productApi.getVariants(detail.productId!),
        ] as const;
      }),
    )
      .then((results) => {
        if (cancelled) return;
        setExchangeVariants((current) => ({
          ...current,
          ...Object.fromEntries(results),
        }));
      })
      .catch(() => toast.error("Không tải được danh sách sản phẩm đổi"))
      .finally(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [returnType, selectedItems, order, exchangeVariants]);

  const loadingExchangeVariants =
    returnType === "EXCHANGE" &&
    Boolean(order) &&
    Object.keys(selectedItems).some(
      (detailId) => !exchangeVariants[Number(detailId)],
    );

  const selectedSourceItems = Object.entries(selectedItems).map(
    ([detailId, item]) => ({
      detailId: Number(detailId),
      ...item,
    }),
  );

  const remainingForSource = (
    sourceVariantId: number,
    excludedRowId?: number,
  ) => {
    const returnQuantity =
      selectedSourceItems.find((item) => item.variantId === sourceVariantId)
        ?.quantity ?? 0;
    const allocated = exchangeItems.reduce(
      (sum, item) =>
        sum +
        (item.rowId !== excludedRowId &&
          item.sourceVariantId === sourceVariantId
          ? item.newQuantity
          : 0),
      0,
    );
    return Math.max(0, returnQuantity - allocated);
  };

  const totalReturnQuantity = Object.values(selectedItems).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const totalExchangeQuantity = exchangeItems.reduce(
    (sum, item) => sum + item.newQuantity,
    0,
  );
  const remainingExchangeQuantity = Math.max(
    0,
    totalReturnQuantity - totalExchangeQuantity,
  );

  const addExchangeItem = () => {
    if (remainingExchangeQuantity <= 0) {
      toast.error("Tổng số lượng giao đổi đã bằng số lượng khách trả");
      return;
    }
    const defaultSource = selectedSourceItems.find(
      (item) => remainingForSource(item.variantId) > 0,
    );
    if (!defaultSource) {
      toast.error("Hãy chọn sản phẩm lỗi và số lượng cần đổi trước");
      return;
    }
    setExchangeItems((current) => [
      ...current,
      {
        rowId: current.reduce((max, item) => Math.max(max, item.rowId), 0) + 1,
        sourceVariantId: defaultSource.variantId,
        newQuantity: 1,
      },
    ]);
  };

  if (loadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Đang tải thông tin đơn hàng...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto py-32">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin đơn hàng.
        </p>
        <Link to="/orders">
          <Button>Quay lại danh sách đơn hàng</Button>
        </Link>
      </div>
    );
  }

  if (order.orderStatus !== "COMPLETED") {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto py-32">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Không hợp lệ</h2>
        <p className="text-muted-foreground">
          Chỉ đơn hàng đã giao dịch thành công (Đã hoàn thành) mới có thể gửi
          yêu cầu đổi hàng.
        </p>
        <Link to={`/orders/${orderId}`}>
          <Button variant="outline">Chi tiết đơn hàng</Button>
        </Link>
      </div>
    );
  }

  if (order.canReturn === false) {
    const hasRemainingQuantity = order.orderDetails.some(
      (detail) =>
        (detail.remainingReturnQuantity ??
          Math.max(0, detail.quantity - (detail.returnedQuantity ?? 0))) > 0,
    );
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto py-32">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {hasRemainingQuantity
            ? "Đã hết hạn đổi hàng"
            : "Không còn sản phẩm có thể trả"}
        </h2>
        <p className="text-muted-foreground">
          {hasRemainingQuantity
            ? `Đơn hàng chỉ được gửi yêu cầu trả trong vòng 7 ngày${order.returnDeadline
              ? `, hạn cuối ${new Date(order.returnDeadline).toLocaleString("vi-VN")}`
              : ""
            }.`
            : "Toàn bộ số lượng sản phẩm trong đơn đã được yêu cầu đổi hàng."}
        </p>
        <Link to={`/orders/${orderId}`}>
          <Button variant="outline">Chi tiết đơn hàng</Button>
        </Link>
      </div>
    );
  }

  const handleCheckboxChange = (detailId: number, checked: boolean) => {
    const item = order.orderDetails.find((d) => d.orderDetailId === detailId);
    if (!item) return;

    if (checked) {
      const itemPrice =
        item.purchasedUnitPrice ??
        (item.salePrice && item.salePrice < item.price
          ? item.salePrice
          : item.price);
      setSelectedItems((prev) => ({
        ...prev,
        [detailId]: {
          productId: 0,
          productName: item.productName,
          variantId: item.variantId || 0,
          sku: "",
          color: item.color || "",
          size: item.size || "",
          quantity: 1,
          originalPrice: itemPrice,
          reason: COMMON_REASONS[0],
          customReason: "",
        },
      }));
      setExchangeItems((current) =>
        current.some(
          (exchangeItem) => exchangeItem.sourceVariantId === item.variantId,
        )
          ? current
          : [
            ...current,
            {
              rowId:
                current.reduce(
                  (max, exchangeItem) => Math.max(max, exchangeItem.rowId),
                  0,
                ) + 1,
              sourceVariantId: item.variantId,
              newQuantity: 1,
            },
          ],
      );
    } else {
      setSelectedItems((prev) => {
        const copy = { ...prev };
        delete copy[detailId];
        return copy;
      });
      setExchangeItems((current) =>
        current.filter(
          (exchangeItem) => exchangeItem.sourceVariantId !== item.variantId,
        ),
      );
    }
  };

  const handleQtyChange = (detailId: number, qty: number, maxQty: number) => {
    const validQty = Math.max(1, Math.min(qty, maxQty));
    setSelectedItems((prev) => {
      const current = prev[detailId];
      if (!current) return prev;
      return {
        ...prev,
        [detailId]: {
          ...current,
          quantity: validQty,
        },
      };
    });
    const sourceVariantId = selectedItems[detailId]?.variantId;
    if (sourceVariantId) {
      setExchangeItems((current) => {
        let remaining = validQty;
        return current.flatMap((exchangeItem) => {
          if (exchangeItem.sourceVariantId !== sourceVariantId)
            return [exchangeItem];
          if (remaining <= 0) return [];
          const nextQuantity = Math.min(exchangeItem.newQuantity, remaining);
          remaining -= nextQuantity;
          return [{ ...exchangeItem, newQuantity: nextQuantity }];
        });
      });
    }
  };

  const handleReasonSelect = (detailId: number, reason: string) => {
    setSelectedItems((prev) => {
      const current = prev[detailId];
      if (!current) return prev;
      return {
        ...prev,
        [detailId]: {
          ...current,
          reason,
        },
      };
    });
  };

  const handleCustomReasonChange = (detailId: number, text: string) => {
    setSelectedItems((prev) => {
      const current = prev[detailId];
      if (!current) return prev;
      return {
        ...prev,
        [detailId]: {
          ...current,
          customReason: text,
        },
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    const remainingSlots = 5 - imageFiles.length;
    if (remainingSlots <= 0) return;

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    const newFiles = [...imageFiles, ...filesToAdd];
    setImageFiles(newFiles);

    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const removeFile = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    URL.revokeObjectURL(imagePreviews[index]);
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToSubmit = Object.values(selectedItems);
    if (itemsToSubmit.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để đổi hàng");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên và số điện thoại liên lạc");
      return;
    }
    if (!/^0[35789]\d{8}$/.test(customerPhone.trim())) {
      toast.error("Số điện thoại liên lạc không hợp lệ");
      return;
    }

    if (!refundPreview) {
      toast.error(
        "Chưa tính được số tiền hoàn. Vui lòng kiểm tra kết nối và thử lại",
      );
      return;
    }

    if (imageFiles.length === 0) {
      toast.error("Vui lòng cung cấp ít nhất 1 hình ảnh làm bằng chứng");
      return;
    }

    if (returnType === "EXCHANGE") {
      if (exchangeItems.length === 0) {
        toast.error("Vui lòng thêm ít nhất một sản phẩm giao đổi");
        return;
      }
      if (
        exchangeItems.some(
          (item) =>
            !item.sourceVariantId || !item.newVariantId || item.newQuantity < 1,
        )
      ) {
        toast.error(
          "Vui lòng chọn biến thể và nhập số lượng hợp lệ cho từng sản phẩm đổi",
        );
        return;
      }
      const variantIds = exchangeItems.map((item) => item.newVariantId);
      if (new Set(variantIds).size !== variantIds.length) {
        toast.error(
          "Mỗi biến thể đổi chỉ được chọn một lần; hãy gộp số lượng vào cùng một dòng",
        );
        return;
      }
      if (totalExchangeQuantity !== totalReturnQuantity) {
        toast.error(
          `Cần phân bổ đủ ${totalReturnQuantity} sản phẩm giao đổi (hiện tại ${totalExchangeQuantity})`,
        );
        return;
      }
      if (
        !deliveryReceiverName.trim() ||
        !deliveryReceiverPhone.trim() ||
        !deliveryProvinceName ||
        !deliveryWardName ||
        !deliveryDetailAddress.trim()
      ) {
        toast.error(
          "Vui lòng nhập đầy đủ thông tin người nhận và địa chỉ giao hàng đổi",
        );
        return;
      }
      if (!/^0[35789]\d{8}$/.test(deliveryReceiverPhone.trim())) {
        toast.error("Số điện thoại người nhận không hợp lệ");
        return;
      }
    }

    setIsUploadingImages(true);
    let uploadedUrls: string[];
    try {
      uploadedUrls = await returnApi.uploadImages(imageFiles);
    } catch {
      toast.error("Tải ảnh xác nhận lên máy chủ thất bại, vui lòng thử lại");
      return;
    } finally {
      setIsUploadingImages(false);
    }

    const payload = {
      orderId: order.orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      returnType,
      note: note.trim(),
      images: uploadedUrls.join(","),
      items: itemsToSubmit.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        reason: item.reason === "Khác" ? item.customReason : item.reason,
      })),
      ...(returnType === "EXCHANGE" && {
        exchangeItems: exchangeItems.map((item) => ({
          sourceVariantId: item.sourceVariantId!,
          newVariantId: item.newVariantId!,
          newQuantity: item.newQuantity,
        })),
        exchangeFulfillmentMethod: "DELIVERY" as const,
        exchangeShippingFee,
        exchangeDeliveryAddress: {
          receiverName: deliveryReceiverName.trim(),
          receiverPhone: deliveryReceiverPhone.trim(),
          province: deliveryProvinceName,
          district: deliveryDistrictName || "-",
          ward: deliveryWardName,
          detailAddress: deliveryDetailAddress.trim(),
        },
      }),
    };

    createReturn(payload, {
      onSuccess: () => {
        navigate("/returns");
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:py-8">
      <section className="overflow-hidden rounded-[28px] bg-[#171717] text-white shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-12 -top-24 size-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 size-48 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <Link to={`/orders/${orderId}`}>
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-orange-300">
                Đơn hàng {order.orderCode}
              </p>
              <h1 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
                Tạo yêu cầu đổi hàng
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Hoàn tất thông tin bên dưới. Cửa hàng sẽ phản hồi yêu cầu của
                bạn sau khi kiểm tra.
              </p>
              {order.returnDeadline && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-bold text-amber-200">
                  <ShieldCheck className="size-3.5" />
                  Hạn gửi yêu cầu:{" "}
                  {new Date(order.returnDeadline).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {[
          {
            icon: FileText,
            step: "Bước 1",
            title: "Khai báo sản phẩm",
            description: "Chọn số lượng và lý do trả",
          },
          {
            icon: Send,
            step: "Bước 2",
            title: "Gửi yêu cầu",
            description: "Cửa hàng kiểm tra điều kiện",
          },
          {
            icon: PackageCheck,
            step: "Bước 3",
            title: "Nhận hàng & hoàn tiền",
            description: "Kiểm kho và hoàn tất xử lý",
          },
        ].map(({ icon: Icon, step, title, description }) => (
          <div
            key={step}
            className="relative flex items-center gap-3 border-r border-slate-100 p-3 last:border-r-0 sm:p-4"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 sm:size-10">
              <Icon className="size-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {step}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-900 sm:text-xs">
                {title}
              </p>
              <p className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">
                {description}
              </p>
            </div>
          </div>
        ))}
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        { }
        <div className="space-y-5">
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-medium text-slate-950">
                  Chọn sản phẩm muốn trả
                </CardTitle>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-medium text-orange-700">
                  {Object.keys(selectedItems).length} đã chọn
                </span>
              </div>
              <CardDescription>
                Chọn checkbox bên cạnh sản phẩm và nhập số lượng, lý do cụ thể.
                {order.returnDeadline && (
                  <span className="block mt-1 font-medium text-amber-600">
                    Hạn đổi hàng:{" "}
                    {new Date(order.returnDeadline).toLocaleString("vi-VN")}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.orderDetails.map((detail) => {
                const returnedQty = detail.returnedQuantity ?? 0;
                const maxQty =
                  detail.remainingReturnQuantity ??
                  Math.max(0, detail.quantity - returnedQty);
                const isFullyReturned = maxQty <= 0;
                const isSelected = !!selectedItems[detail.orderDetailId];
                const selectedState = selectedItems[detail.orderDetailId];
                const sourceExchangeSelections = exchangeItems.filter(
                  (item) => item.sourceVariantId === detail.variantId,
                );

                return (
                  <div
                    key={detail.orderDetailId}
                    className={`flex flex-col gap-4 rounded-2xl border p-4 transition-all duration-200 ${isSelected
                        ? "border-orange-300 bg-orange-50/50 ring-1 ring-orange-100"
                        : "border-slate-200 bg-white hover:border-slate-300"
                      } ${isFullyReturned ? "opacity-60 bg-gray-50/50" : ""}`}
                  >
                    { }
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`item-${detail.orderDetailId}`}
                        checked={isSelected}
                        disabled={isFullyReturned}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(detail.orderDetailId, !!checked)
                        }
                        className="mt-1"
                      />
                      {detail.imageUrl && (
                        <img
                          src={detail.imageUrl}
                          alt={detail.productName}
                          className="size-20 object-cover rounded-xl border border-slate-200 bg-slate-50"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`item-${detail.orderDetailId}`}
                          className={`text-xs font-bold break-words ${isFullyReturned ? "text-gray-400 cursor-not-allowed" : "text-foreground hover:cursor-pointer"}`}
                        >
                          {detail.productName}
                        </Label>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground mt-1">
                          {detail.color && <span>Màu: {detail.color}</span>}
                          {detail.size && <span>Kích cỡ: {detail.size}</span>}
                          <span>SL mua: {detail.quantity}</span>
                          <span className="text-amber-600 font-medium">
                            · Đã yêu cầu trả: {returnedQty}
                          </span>
                          <span className="text-emerald-600 font-semibold">
                            · Còn có thể trả: {maxQty}
                          </span>
                        </div>
                        {isFullyReturned ? (
                          <span className="text-[10px] text-red-500 font-semibold block mt-1">
                            Đã đổi hàng toàn bộ
                          </span>
                        ) : null}
                        <p className="text-xs font-bold text-primary mt-1">
                          {(detail.purchasedUnitPrice ?? detail.price) <
                            detail.price ? (
                            <span className="flex items-center gap-1.5">
                              <span className="line-through text-gray-400 font-normal">
                                {formatCurrency(detail.price)}
                              </span>
                              <span>
                                {formatCurrency(
                                  detail.purchasedUnitPrice ??
                                  detail.salePrice ??
                                  detail.price,
                                )}
                              </span>
                            </span>
                          ) : (
                            formatCurrency(
                              detail.purchasedUnitPrice ?? detail.price,
                            )
                          )}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          Giá đã chốt tại thời điểm mua
                        </span>
                      </div>
                    </div>

                    { }
                    {isSelected && selectedState && (
                      <div className="space-y-3 rounded-xl border border-orange-100 bg-white p-4">
                        <div className="grid grid-cols-2 gap-4">
                          { }
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">
                              Số lượng trả
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={maxQty}
                              value={selectedState.quantity}
                              onChange={(e) =>
                                handleQtyChange(
                                  detail.orderDetailId,
                                  parseInt(e.target.value) || 1,
                                  maxQty,
                                )
                              }
                              className="h-8 text-xs text-gray-900 bg-white"
                            />
                          </div>

                          { }
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">
                              Lý do đổi hàng
                            </Label>
                            <Select
                              value={selectedState.reason}
                              onValueChange={(val) =>
                                handleReasonSelect(detail.orderDetailId, val)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs text-gray-900 bg-white w-full">
                                <SelectValue placeholder="Chọn lý do..." />
                              </SelectTrigger>
                              <SelectContent>
                                {COMMON_REASONS.map((r) => (
                                  <SelectItem
                                    key={r}
                                    value={r}
                                    className="text-xs"
                                  >
                                    {r}
                                  </SelectItem>
                                ))}
                                <SelectItem value="Khác" className="text-xs">
                                  Lý do khác...
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        { }
                        {(selectedState.reason === "Khác" ||
                          selectedState.reason ===
                          "Sản phẩm lỗi/hỏng do nhà sản xuất" ||
                          selectedState.reason ===
                          "Sản phẩm không giống mô tả/hình ảnh quảng cáo") && (
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold">
                                Chi tiết/Mô tả lỗi
                              </Label>
                              <Input
                                placeholder="Mô tả cụ thể lý do trả sản phẩm này..."
                                value={selectedState.customReason}
                                onChange={(e) =>
                                  handleCustomReasonChange(
                                    detail.orderDetailId,
                                    e.target.value,
                                  )
                                }
                                className="h-8 text-xs text-gray-900 bg-white"
                                required
                              />
                            </div>
                          )}
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                              <ArrowRightLeft className="size-3.5" /> Sản phẩm
                              giao đổi cho {detail.productName}
                            </Label>
                            <button
                              type="button"
                              disabled={
                                sourceExchangeSelections.reduce(
                                  (sum, row) => sum + row.newQuantity,
                                  0,
                                ) >= selectedState.quantity
                              }
                              onClick={() =>
                                setExchangeItems((current) => [
                                  ...current,
                                  {
                                    rowId:
                                      current.reduce(
                                        (max, row) => Math.max(max, row.rowId),
                                        0,
                                      ) + 1,
                                    sourceVariantId: detail.variantId,
                                    newQuantity: 1,
                                  },
                                ])
                              }
                              className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 disabled:opacity-40"
                            >
                              <Plus className="size-3" /> Thêm biến thể
                            </button>
                          </div>
                          <div className="mb-2 rounded-md bg-white/80 px-2.5 py-1.5 text-[10px] text-slate-600">
                            Giá sản phẩm khách gửi lại:{" "}
                            <strong className="text-orange-700">
                              {formatCurrency(selectedState.originalPrice)}/sản
                              phẩm
                            </strong>
                          </div>
                          <div className="space-y-2">
                            {sourceExchangeSelections.map(
                              (selection, index) => {
                                const allocatedElsewhere =
                                  sourceExchangeSelections.reduce(
                                    (sum, row) =>
                                      sum +
                                      (row.rowId === selection.rowId
                                        ? 0
                                        : row.newQuantity),
                                    0,
                                  );
                                const selectedVariant = (
                                  exchangeVariants[detail.orderDetailId] ?? []
                                ).find(
                                  (variant) =>
                                    variant.variantId ===
                                    selection.newVariantId,
                                );
                                const allowedQuantity = Math.max(
                                  1,
                                  Math.min(
                                    selectedState.quantity - allocatedElsewhere,
                                    selectedVariant?.availableStock ??
                                    selectedVariant?.stockQuantity ??
                                    selectedState.quantity,
                                  ),
                                );
                                return (
                                  <div
                                    key={selection.rowId}
                                    className="grid grid-cols-[minmax(0,1fr)_80px_28px] gap-2"
                                  >
                                    {(() => {
                                      const availableVariants = (
                                        exchangeVariants[detail.orderDetailId] ?? []
                                      ).filter(
                                        (variant) =>
                                          variant.status === "ACTIVE" &&
                                          (variant.availableStock ??
                                            variant.stockQuantity) > 0 &&
                                          (((variant.color ?? "")
                                            .trim()
                                            .toLocaleLowerCase("vi-VN") ===
                                            (detail.color ?? "")
                                              .trim()
                                              .toLocaleLowerCase("vi-VN") &&
                                            (variant.size ?? "")
                                              .trim()
                                              .toLocaleLowerCase("vi-VN") ===
                                            (detail.size ?? "")
                                              .trim()
                                              .toLocaleLowerCase("vi-VN")) ||
                                            variantEffectivePrice(variant) ===
                                            selectedState.originalPrice),
                                      );

                                      return (
                                        <Select
                                          value={
                                            selection.newVariantId?.toString() ?? ""
                                          }
                                          onValueChange={(value) =>
                                            setExchangeItems((current) =>
                                              current.map((row) =>
                                                row.rowId === selection.rowId
                                                  ? {
                                                    ...row,
                                                    newVariantId: Number(value),
                                                  }
                                                  : row,
                                              ),
                                            )
                                          }
                                          disabled={availableVariants.length === 0}
                                        >
                                          <SelectTrigger className="h-9 bg-white text-xs w-full">
                                            <SelectValue
                                              placeholder={
                                                loadingExchangeVariants
                                                  ? "Đang tải..."
                                                  : availableVariants.length === 0
                                                    ? "Không có sản phẩm phù hợp"
                                                    : `Biến thể thay thế #${index + 1}`
                                              }
                                            />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableVariants.map((variant) => {
                                              const usedByOtherRow =
                                                sourceExchangeSelections.some(
                                                  (row) =>
                                                    row.rowId !== selection.rowId &&
                                                    row.newVariantId ===
                                                    variant.variantId,
                                                );
                                              return (
                                                <SelectItem
                                                  key={variant.variantId}
                                                  value={variant.variantId.toString()}
                                                  disabled={usedByOtherRow}
                                                  className="text-xs"
                                                >
                                                  {detail.productName} ·{" "}
                                                  {variant.color || "Không màu"} · Size{" "}
                                                  {variant.size || "—"} ·{" "}
                                                  {formatCurrency(
                                                    variantEffectivePrice(variant),
                                                  )}{" "}
                                                  · Còn{" "}
                                                  {variant.availableStock ??
                                                    variant.stockQuantity}
                                                </SelectItem>
                                              );
                                            })}
                                          </SelectContent>
                                        </Select>
                                      );
                                    })()}
                                    <Input
                                      type="number"
                                      min={1}
                                      max={allowedQuantity}
                                      value={selection.newQuantity}
                                      onChange={(event) =>
                                        setExchangeItems((current) =>
                                          current.map((row) =>
                                            row.rowId === selection.rowId
                                              ? {
                                                ...row,
                                                newQuantity: Math.min(
                                                  allowedQuantity,
                                                  Math.max(
                                                    1,
                                                    Number(
                                                      event.target.value,
                                                    ) || 1,
                                                  ),
                                                ),
                                              }
                                              : row,
                                          ),
                                        )
                                      }
                                      className="h-9 bg-white text-xs"
                                    />
                                    <button
                                      type="button"
                                      disabled={
                                        sourceExchangeSelections.length <= 1
                                      }
                                      onClick={() =>
                                        setExchangeItems((current) =>
                                          current.filter(
                                            (row) =>
                                              row.rowId !== selection.rowId,
                                          ),
                                        )
                                      }
                                      className="flex size-7 items-center justify-center self-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                    {selectedVariant &&
                                      (() => {
                                        const replacementPrice =
                                          variantEffectivePrice(
                                            selectedVariant,
                                          );
                                        const difference =
                                          replacementPrice -
                                          selectedState.originalPrice;
                                        return (
                                          <div className="col-span-3 flex justify-between rounded bg-slate-50 px-2 py-1 text-[10px]">
                                            <span>
                                              Giá sản phẩm giao:{" "}
                                              <strong>
                                                {formatCurrency(
                                                  replacementPrice,
                                                )}
                                                /sản phẩm
                                              </strong>
                                            </span>
                                            <span
                                              className={
                                                difference === 0
                                                  ? "text-emerald-600"
                                                  : difference > 0
                                                    ? "text-red-600"
                                                    : "text-blue-600"
                                              }
                                            >
                                              {difference === 0
                                                ? "Ngang giá"
                                                : `Chênh lệch ${difference > 0 ? "+" : ""}${formatCurrency(difference)}`}
                                            </span>
                                          </div>
                                        );
                                      })()}
                                  </div>
                                );
                              },
                            )}
                          </div>
                          <p className="mt-2 text-[10px] text-blue-700">
                            Đã phân bổ{" "}
                            {sourceExchangeSelections.reduce(
                              (sum, row) => sum + row.newQuantity,
                              0,
                            )}
                            /{selectedState.quantity}. Có thể chia sang nhiều
                            màu hoặc kích cỡ.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-slate-950">
                <Truck className="size-4 text-blue-600" /> Thông tin giao sản
                phẩm đổi
              </CardTitle>
              <CardDescription>
                Yêu cầu đổi hàng online sẽ được giao tận nơi đến địa chỉ bạn
                chọn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:grid-cols-2">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Khách hàng
                    </span>
                    <strong className="mt-1 block text-slate-900">
                      {customerName}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Số điện thoại
                    </span>
                    <strong className="mt-1 block text-slate-900">
                      {customerPhone}
                    </strong>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <MapPin className="size-4 text-slate-500" /> Địa chỉ giao
                      hàng
                    </Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddAddressOpen(true)}
                        className="h-8 border-dashed hover:border-slate-900 hover:text-slate-900 transition text-[11px]"
                      >
                        <Plus className="mr-1 size-3" /> Thêm địa chỉ
                      </Button>
                      <Link
                        to="/addresses"
                        target="_blank"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        Quản lý <ArrowRightLeft className="size-3" />
                      </Link>
                    </div>
                  </div>

                  {savedAddressesLoading ? (
                    <div className="rounded-xl border border-dashed bg-white p-6 text-center text-xs text-slate-500">
                      Đang tải địa chỉ của bạn...
                    </div>
                  ) : savedAddressesError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-700">
                      Không thể tải danh sách địa chỉ.
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="space-y-2">
                      {savedAddresses.map((address) => (
                        <label
                          key={address.addressId}
                          className={cn(
                            "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-all",
                            selectedSavedAddressId === address.addressId
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-border bg-white text-muted-foreground hover:bg-accent/30 hover:text-foreground",
                          )}
                        >
                          <input
                            type="radio"
                            name="exchange-delivery-address"
                            className="mt-1 accent-primary"
                            checked={
                              selectedSavedAddressId === address.addressId
                            }
                            onChange={() => applySavedAddress(address)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">
                              {address.consigneeName} • {address.phone}
                              {address.isDefault && (
                                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                                  Mặc định
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                              {[
                                address.streetAddress,
                                address.wardName || address.ward,
                                address.provinceName || address.province,
                              ]
                                .map((value) => value?.trim())
                                .filter((value): value is string =>
                                  Boolean(
                                    value &&
                                    value !== "-" &&
                                    value !== "null" &&
                                    value !== "undefined",
                                  ),
                                )
                                .join(", ")}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/10 py-6 text-center">
                      <p className="mb-3 text-sm text-muted-foreground">
                        Bạn chưa có địa chỉ giao hàng.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsAddAddressOpen(true)}
                      >
                        Thêm địa chỉ mới
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-slate-950">
                Lý do & bằng chứng
              </CardTitle>
              <CardDescription>
                Ảnh rõ tình trạng sản phẩm sẽ giúp yêu cầu được xử lý nhanh hơn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-950">
                  <ArrowRightLeft className="size-3.5 text-blue-600" /> Đổi sản
                  phẩm lỗi
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-blue-700">
                  Cửa hàng kiểm nhận sản phẩm lỗi và giao sản phẩm thay thế;
                  không phát sinh hoàn tiền.
                </span>
              </div>

              {returnType === "EXCHANGE" && (
                <div className="hidden space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-blue-950">
                        Danh sách sản phẩm giao đổi
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-blue-700">
                        Cùng màu và size thì được chênh giá; nếu khác màu hoặc
                        size thì sản phẩm thay thế phải cùng giá.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {loadingExchangeVariants && (
                        <Loader2 className="size-4 animate-spin text-blue-600" />
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addExchangeItem}
                        disabled={remainingExchangeQuantity <= 0}
                        className="h-8 border-blue-200 bg-white text-[10px] text-blue-700 hover:bg-blue-50"
                      >
                        <Plus className="mr-1 size-3" /> Thêm sản phẩm
                      </Button>
                    </div>
                  </div>
                  {exchangeItems.map((exchangeItem, index) => {
                    const sourceItem = selectedSourceItems.find(
                      (item) => item.variantId === exchangeItem.sourceVariantId,
                    );
                    const rowVariantOptions = sourceItem
                      ? (exchangeVariants[sourceItem.detailId] ?? [])
                        .filter(
                          (variant) =>
                            variant.status === "ACTIVE" &&
                            (variant.availableStock ??
                              variant.stockQuantity) > 0 &&
                            (((variant.color ?? "")
                              .trim()
                              .toLocaleLowerCase("vi-VN") ===
                              (sourceItem.color ?? "")
                                .trim()
                                .toLocaleLowerCase("vi-VN") &&
                              (variant.size ?? "")
                                .trim()
                                .toLocaleLowerCase("vi-VN") ===
                              (sourceItem.size ?? "")
                                .trim()
                                .toLocaleLowerCase("vi-VN")) ||
                              variantEffectivePrice(variant) ===
                              sourceItem.originalPrice),
                        )
                        .map((variant) => ({
                          variant,
                          productName: sourceItem.productName,
                        }))
                      : [];
                    const selectedVariant = rowVariantOptions.find(
                      ({ variant }) =>
                        variant.variantId === exchangeItem.newVariantId,
                    )?.variant;
                    const maxQuantity = selectedVariant
                      ? (selectedVariant.availableStock ??
                        selectedVariant.stockQuantity)
                      : undefined;
                    const maxByReturnQuantity = Math.max(
                      1,
                      exchangeItem.sourceVariantId
                        ? remainingForSource(
                          exchangeItem.sourceVariantId,
                          exchangeItem.rowId,
                        )
                        : 1,
                    );
                    const allowedQuantity = maxQuantity
                      ? Math.min(maxQuantity, maxByReturnQuantity)
                      : maxByReturnQuantity;
                    return (
                      <div
                        key={exchangeItem.rowId}
                        className="rounded-xl border border-blue-100 bg-white p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[11px] font-bold text-slate-900">
                            Sản phẩm đổi #{index + 1}
                          </p>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setExchangeItems((current) =>
                                current.filter(
                                  (item) => item.rowId !== exchangeItem.rowId,
                                ),
                              )
                            }
                            className="size-7 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Xóa sản phẩm đổi ${index + 1}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_110px]">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">
                              Sản phẩm lỗi cần đổi
                            </Label>
                            <Select
                              value={
                                exchangeItem.sourceVariantId?.toString() ?? ""
                              }
                              onValueChange={(value) =>
                                setExchangeItems((current) =>
                                  current.map((item) =>
                                    item.rowId === exchangeItem.rowId
                                      ? {
                                        ...item,
                                        sourceVariantId: Number(value),
                                        newVariantId: undefined,
                                        newQuantity: 1,
                                      }
                                      : item,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className="h-9 bg-white text-xs w-full">
                                <SelectValue placeholder="Chọn hàng lỗi" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedSourceItems.map((item) => (
                                  <SelectItem
                                    key={item.variantId}
                                    value={item.variantId.toString()}
                                    disabled={
                                      remainingForSource(
                                        item.variantId,
                                        exchangeItem.rowId,
                                      ) <= 0
                                    }
                                    className="text-xs"
                                  >
                                    {item.productName} ·{" "}
                                    {item.color || "Không màu"} · Size{" "}
                                    {item.size || "—"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">
                              Biến thể thay thế hợp lệ
                            </Label>
                            <Select
                              value={
                                exchangeItem.newVariantId?.toString() ?? ""
                              }
                              onValueChange={(value) =>
                                setExchangeItems((current) =>
                                  current.map((item) =>
                                    item.rowId === exchangeItem.rowId
                                      ? { ...item, newVariantId: Number(value) }
                                      : item,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className="h-9 bg-white text-xs w-full">
                                <SelectValue
                                  placeholder={
                                    sourceItem
                                      ? "Chọn biến thể thay thế"
                                      : "Chọn hàng lỗi trước"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {rowVariantOptions.map(
                                  ({ variant, productName }) => {
                                    const alreadySelected = exchangeItems.some(
                                      (item) =>
                                        item.rowId !== exchangeItem.rowId &&
                                        item.newVariantId === variant.variantId,
                                    );
                                    return (
                                      <SelectItem
                                        key={variant.variantId}
                                        value={variant.variantId.toString()}
                                        disabled={alreadySelected}
                                        className="text-xs"
                                      >
                                        {productName} ·{" "}
                                        {variant.color || "Không màu"} · Size{" "}
                                        {variant.size || "—"} ·{" "}
                                        {formatCurrency(
                                          variantEffectivePrice(variant),
                                        )}{" "}
                                        · Còn{" "}
                                        {variant.availableStock ??
                                          variant.stockQuantity}
                                      </SelectItem>
                                    );
                                  },
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">
                              Số lượng
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={allowedQuantity}
                              value={exchangeItem.newQuantity}
                              onChange={(event) => {
                                const nextQuantity = Math.max(
                                  1,
                                  Number(event.target.value) || 1,
                                );
                                setExchangeItems((current) =>
                                  current.map((item) =>
                                    item.rowId === exchangeItem.rowId
                                      ? {
                                        ...item,
                                        newQuantity: Math.min(
                                          nextQuantity,
                                          allowedQuantity,
                                        ),
                                      }
                                      : item,
                                  ),
                                );
                              }}
                              className="h-9 bg-white text-xs"
                              aria-label={`Số lượng sản phẩm đổi ${index + 1}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold ${totalExchangeQuantity > totalReturnQuantity ? "bg-red-50 text-red-700" : "bg-blue-100/70 text-blue-800"}`}
                  >
                    <span>Đã phân bổ giao đổi</span>
                    <span>
                      {totalExchangeQuantity}/{totalReturnQuantity} sản phẩm
                    </span>
                  </div>
                  {exchangeItems.length === 0 && (
                    <button
                      type="button"
                      onClick={addExchangeItem}
                      disabled={remainingExchangeQuantity <= 0}
                      className="w-full rounded-xl border border-dashed border-blue-200 bg-white py-4 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="mr-1 inline size-3.5" /> Thêm sản phẩm
                      cần giao đổi
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Ghi chú cho cửa hàng
                </Label>
                <Textarea
                  placeholder="Nhập thời gian liên hệ, mô tả lỗi hoặc lưu ý khi giao sản phẩm thay thế..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-24 resize-none rounded-xl bg-white text-xs text-gray-900"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Camera className="size-3.5 text-gray-400" /> Hình ảnh xác
                  nhận (Tối đa 5 ảnh)
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Vui lòng cung cấp hình ảnh sản phẩm thực tế cần đổi/trả để cửa
                  hàng đối chiếu.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1.5">
                  { }
                  {imagePreviews.map((src, index) => (
                    <div
                      key={index}
                      className="group relative size-20 overflow-hidden rounded-xl border border-slate-200 shadow-sm transition hover:border-destructive/50"
                    >
                      <img
                        src={src}
                        alt="Ảnh xem trước"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 transition cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}

                  { }
                  {imageFiles.length < 5 && (
                    <label className="flex size-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-2 text-center transition hover:border-orange-400 hover:bg-orange-50">
                      <UploadCloud className="size-5 text-muted-foreground/75" />
                      <span className="text-[9px] text-muted-foreground font-semibold mt-1">
                        Thêm ảnh
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        { }
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium text-slate-950">
                Thông tin liên lạc
              </CardTitle>
              <CardDescription>
                Nhập thông tin để cửa hàng liên hệ khi nhận/duyệt đổi hàng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Người liên hệ *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nhập tên người liên hệ..."
                  className="h-9 text-xs text-gray-900 bg-white"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Số điện thoại *</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Nhập số điện thoại liên lạc..."
                  className="h-9 text-xs text-gray-900 bg-white"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-md">
            <CardHeader className="border-b border-slate-100 bg-slate-950 text-white">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                {returnType === "EXCHANGE"
                  ? "Tóm tắt đổi hàng"
                  : "Tóm tắt hoàn tiền"}
                {isLoadingPreview && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {Object.keys(selectedItems).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Chưa chọn sản phẩm nào để trả.
                </p>
              ) : returnType === "EXCHANGE" ? (
                <div className="space-y-2">
                  <div className="font-semibold text-sm">Sản phẩm trả lại:</div>
                  {Object.values(selectedItems).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-muted-foreground">
                      <span className="truncate max-w-[200px]">
                        {item.productName} ({item.size}/{item.color})
                      </span>
                      <span>SL: {item.quantity}</span>
                    </div>
                  ))}
                  <div className="font-semibold text-sm mt-3 pt-3 border-t">Sản phẩm muốn đổi:</div>
                  {exchangeItems.length === 0 && (
                    <p className="text-muted-foreground">Chưa chọn sản phẩm đổi</p>
                  )}
                  {exchangeItems.map((item, idx) => {
                    const sourceItem = selectedSourceItems.find(s => s.variantId === item.sourceVariantId);
                    const variants = exchangeVariants[sourceItem?.detailId ?? 0] ?? [];
                    const newVariant = variants.find(v => v.variantId === item.newVariantId);
                    return (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span className="truncate max-w-[200px]">
                          {sourceItem?.productName} {newVariant ? `(${newVariant.size}/${newVariant.color})` : '(Chưa chọn)'}
                        </span>
                        <span>SL: {item.newQuantity}</span>
                      </div>
                    );
                  })}
                </div>
              ) : refundPreview ? (
                <>
                  { }
                  <div className="space-y-2.5">
                    {refundPreview.items.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span className="truncate max-w-[150px] font-medium">
                            {item.productName} ({item.size}/{item.color}) x
                            {item.quantity}
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(item.refundAmount)}
                          </span>
                        </div>
                        {refundPreview.totalDiscount > 0 && (
                          <div className="text-[10px] text-muted-foreground/70 pl-2 flex justify-between">
                            <span>
                              Giá sau KM: {formatCurrency(item.lineSubtotal)}
                            </span>
                            <span className="text-orange-500">
                              Phiếu giảm giá phân bổ: -
                              {formatCurrency(item.allocatedDiscount)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  { }
                  {refundPreview.totalDiscount > 0 && (
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-2.5 space-y-1 text-[10px]">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tổng giá sau KM (hàng trả):</span>
                        <span>
                          {formatCurrency(
                            refundPreview.items.reduce(
                              (s, i) => s + i.lineSubtotal,
                              0,
                            ),
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>Phiếu giảm giá phân bổ theo tỷ lệ:</span>
                        <span>
                          -
                          {formatCurrency(
                            refundPreview.items.reduce(
                              (s, i) => s + i.allocatedDiscount,
                              0,
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between border-t pt-3 text-sm font-bold text-foreground">
                    <span>Tiền hoàn dự kiến:</span>
                    <span className="text-lg font-medium text-orange-600">
                      {formatCurrency(refundPreview.totalRefund)}
                    </span>
                  </div>
                  {refundPreview.totalRefund === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-5 text-amber-800">
                      Mã giảm giá đã thanh toán toàn bộ giá trị sản phẩm. Bạn
                      vẫn có thể gửi yêu cầu đổi hàng, nhưng không phát sinh
                      tiền hoàn và phí vận chuyển không được hoàn lại.
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  {Object.entries(selectedItems).map(([key, item]) => (
                    <div
                      key={key}
                      className="flex justify-between text-muted-foreground"
                    >
                      <span className="truncate max-w-[150px]">
                        {item.productName} ({item.size}/{item.color}) x
                        {item.quantity}
                      </span>
                      <span>
                        {formatCurrency(item.originalPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between font-bold text-sm text-foreground">
                    <span>Tổng tiền hoàn dự kiến:</span>
                    <span className="text-base text-primary">
                      {formatCurrency(
                        Object.values(selectedItems).reduce(
                          (s, i) => s + i.originalPrice * i.quantity,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              )}

              {returnType === "REFUND" && (
                <div className="pt-2 text-[10px] text-muted-foreground flex gap-1.5 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <p>
                    Số tiền hoàn được tính theo giá thực tế thanh toán, đã phân bổ phiếu giảm giá theo tỷ lệ từng sản phẩm; yêu cầu đổi hàng vẫn hợp lệ khi tiền hoàn bằng 0.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  submitting ||
                  isUploadingImages ||
                  isLoadingPreview ||
                  !refundPreview ||
                  Object.keys(selectedItems).length === 0 ||
                  (returnType === "EXCHANGE" &&
                    (exchangeItems.length === 0 ||
                      exchangeItems.some(
                        (item) => !item.newVariantId || item.newQuantity < 1,
                      ) ||
                      totalExchangeQuantity !== totalReturnQuantity))
                }
                className="mt-2 h-11 w-full cursor-pointer rounded-xl bg-orange-600 text-xs font-medium text-white hover:bg-orange-700"
              >
                {(submitting || isUploadingImages) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploadingImages
                  ? "Đang tải ảnh..."
                  : returnType === "EXCHANGE"
                    ? "Gửi yêu cầu đổi hàng"
                    : "Gửi yêu cầu đổi hàng"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
      <AddressModal
        open={isAddAddressOpen}
        isPending={creatingAddress}
        onClose={() => setIsAddAddressOpen(false)}
        onSubmit={handleAddAddressSubmit}
      />
    </div>
  );
}
