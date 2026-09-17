import type { CustomerResponse } from "@/api/customerApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomerList } from "@/hooks/useCustomer";
import { Check, Mail, Phone, Search, UserRound, Users } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickCustomer: (customer: CustomerResponse) => void;
  selectedCustomerId?: number | null;
}

export default function CustomerPopup({
  open,
  onOpenChange,
  onPickCustomer,
  selectedCustomerId,
}: Props) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 400);
  const {
    data: customerPage,
    isLoading,
    isFetching,
  } = useCustomerList({
    keyword: debouncedSearch || undefined,
    size: 20,
  });

  const customers = customerPage?.content ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setSearch("");
  };

  const handlePick = (customer: CustomerResponse) => {
    onPickCustomer(customer);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden border-border bg-background p-0 shadow-2xl sm:max-w-[720px] sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b bg-muted/30 px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Users className="size-5" />
            </span>
            <span>
              <span className="block text-base font-bold text-foreground">
                Chọn khách hàng
              </span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Gán khách thành viên để sử dụng địa chỉ và ưu đãi cá nhân
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b px-5 py-4 sm:px-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên, số điện thoại hoặc email..."
                className="h-11 rounded-xl bg-muted/30 pl-10 pr-10 text-sm focus-visible:ring-indigo-500/20"
              />
              {isFetching && !isLoading && (
                <span className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              )}
            </div>
          </div>

          <div className="min-h-[340px] flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            {isLoading ? (
              <div className="space-y-2.5" aria-label="Đang tải khách hàng">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex animate-pulse items-center gap-3 rounded-xl border p-3"
                  >
                    <div className="size-11 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/5 rounded bg-muted" />
                      <div className="h-3 w-3/5 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-4 text-center">
                <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                  <UserRound className="size-6 text-muted-foreground" />
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {debouncedSearch
                    ? "Không tìm thấy khách hàng"
                    : "Chưa có khách hàng nào"}
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  {debouncedSearch
                    ? "Thử tìm bằng tên, số điện thoại hoặc email khác."
                    : "Danh sách khách hàng hiện đang trống."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map((customer) => {
                  const isSelected = customer.customerId === selectedCustomerId;

                  return (
                    <button
                      key={customer.customerId}
                      type="button"
                      onClick={() => handlePick(customer)}
                      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-100"
                          : "border-border bg-background hover:border-indigo-200 hover:bg-indigo-50/40"
                      }`}
                    >
                      <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {(customer.fullName || customer.email || "K")
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {customer.fullName || "Khách hàng"}
                          </span>
                          {isSelected && (
                            <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                              Đang chọn
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {customer.phone && (
                            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                              <Phone className="size-3 text-indigo-500" />
                              {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className="flex min-w-0 items-center gap-1.5">
                              <Mail className="size-3 shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </span>
                          )}
                        </span>
                      </span>

                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-border text-transparent group-hover:border-indigo-300 group-hover:text-indigo-500"
                        }`}
                      >
                        <Check className="size-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3.5 sm:px-6">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {customers.length}
              </span>{" "}
              khách hàng được hiển thị
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-9 rounded-lg px-4"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
