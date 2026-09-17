import { useState } from "react";
import {
  ChevronDown,
  Mail,
  Phone,
  RefreshCw,
  Search,
  User,
  UserCheck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CustomerResponse } from "@/api/customerApi";
import { useAttachPosCustomer } from "@/hooks/usePosDraft";
import { useCustomer } from "@/hooks/useCustomer";
import CustomerPopup from "./CustomerPopup";
import CustomerCreateDialog from "./CustomerCreateDialog";

export interface CustomerSummary {
  id: number | null;
  name: string;
  phone: string;
}

interface Props {
  activeDraftId: number;
  customer: CustomerSummary;
  onCustomerChange: (c: CustomerSummary) => void;
}

export default function CustomerSelectionSection({
  activeDraftId,
  customer,
  onCustomerChange,
}: Props) {
  const { id: customerId, name: customerName, phone: customerPhone } = customer;

  const [customerOpen, setCustomerOpen] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);

  const { mutate: attachCustomer } = useAttachPosCustomer();
  const { data: detail } = useCustomer(customerId ?? 0);

  const handlePickCustomer = (picked: CustomerResponse) => {
    attachCustomer(
      {
        orderId: activeDraftId,
        request: { customerId: picked.customerId },
      },
      {
        onSuccess: () => {
          toast.success(
            `Đã gán khách hàng: ${picked.fullName || "Thành công"}`,
          );
          onCustomerChange({
            id: picked.customerId,
            name: picked.fullName || picked.email || "",
            phone: picked.phone || "",
          });
        },

        onError: (e: any) => toast.error(e?.apiMessage ?? "Gán khách thất bại"),
      },
    );
    setCustomerOpen(false);
  };

  const handleClearCustomer = () => {
    attachCustomer(
      {
        orderId: activeDraftId,
        request: { clear: true },
      },
      {
        onSuccess: () => {
          toast.success("Đã chuyển về khách lẻ");
          onCustomerChange({ id: null, name: "", phone: "" });
        },

        onError: (e: any) => toast.error(e?.apiMessage ?? "Gỡ khách thất bại"),
      },
    );
  };

  return (
    <div className="px-4 py-3.5 border-b bg-card">
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} className="text-indigo-600" />
            Khách hàng
          </span>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Chọn khách để dùng địa chỉ đã lưu và ưu đãi cá nhân
          </p>
        </div>
        {!customerId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6.5 text-[11px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold cursor-pointer rounded-md transition-colors"
            onClick={() => setCustomerOpen(true)}
          >
            <UserPlus size={12} className="mr-1" />
            Chọn khách
          </Button>
        )}
      </div>

      {customerId ? (
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden hover:shadow-sm transition-all duration-200 relative border-l-4 border-l-indigo-600">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              { }
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white ring-offset-2 ring-offset-slate-100 shadow-xs">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-xs font-bold">
                    {(customerName || "K").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800 tracking-tight truncate max-w-[150px]">
                      {customerName}
                    </span>

                  </div>

                  <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                    {(customerPhone || detail?.phone) && (
                      <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                        <Phone size={11} className="text-indigo-500 shrink-0" />
                        <span className="tabular-nums">
                          {customerPhone || detail?.phone}
                        </span>
                      </span>
                    )}
                    {detail?.email && (
                      <span className="truncate max-w-[200px] flex items-center gap-1.5 text-slate-400 font-medium">
                        <Mail size={11} className="text-slate-400 shrink-0" />
                        <span>{detail.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              { }
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold cursor-pointer transition-colors shadow-xs"
                  onClick={() => setCustomerOpen(true)}
                  title="Thay đổi khách hàng"
                >
                  <RefreshCw size={10} className="mr-1" />
                  Đổi
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                  onClick={handleClearCustomer}
                  title="Chuyển về khách lẻ"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          <Card className="border border-dashed border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 hover:border-indigo-400/50 transition-all rounded-2xl">
            <CardContent className="flex items-center justify-between p-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 shadow-xs">
                  <UserRound size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700">
                    Khách vãng lai
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Chưa lưu thông tin cá nhân
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold gap-1 px-3 cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-50/50 rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  onClick={() => setCustomerOpen(true)}
                >
                  <Search size={13} />
                  Tìm
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 text-xs font-bold gap-1 px-3 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  onClick={() => setCreateCustomerOpen(true)}
                >
                  <UserPlus size={13} />
                  Tạo mới
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <CustomerPopup
        open={customerOpen}
        onOpenChange={setCustomerOpen}
        onPickCustomer={handlePickCustomer}
        selectedCustomerId={customerId}
      />
      <CustomerCreateDialog
        open={createCustomerOpen}
        onOpenChange={setCreateCustomerOpen}
        onCreated={handlePickCustomer}
      />
    </div>
  );
}
