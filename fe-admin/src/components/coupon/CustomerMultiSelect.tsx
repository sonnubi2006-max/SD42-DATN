import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomerList } from "@/hooks/useCustomer";
import type { TargetedCustomer } from "@/api/couponApi";
import { Label } from "../ui/label";

interface Props {
  value: TargetedCustomer[];
  onChange: (value: TargetedCustomer[]) => void;
}

function labelOf(c: TargetedCustomer) {
  return c.fullName || c.email || `#${c.customerId}`;
}

export function CustomerMultiSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 400);

  const { data, isLoading } = useCustomerList({
    keyword: debounced || undefined,
    status: "ACTIVE",
    page: 0,
    size: 20,
  });

  const selectedIds = new Set(value.map((c) => c.customerId));

  const toggle = (c: TargetedCustomer) => {
    if (selectedIds.has(c.customerId)) {
      onChange(value.filter((x) => x.customerId !== c.customerId));
    } else {
      onChange([...value, c]);
    }
  };

  const remove = (id: number) =>
    onChange(value.filter((c) => c.customerId !== id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="text-muted-foreground">
              {value.length > 0
                ? `Đã chọn ${value.length} khách hàng`
                : "Chọn khách hàng được áp dụng…"}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm theo tên, email, SĐT…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Đang tải…
                </div>
              ) : (data?.content?.length ?? 0) === 0 ? (
                <CommandEmpty>Không tìm thấy khách hàng</CommandEmpty>
              ) : (
                data?.content.map((c) => {
                  const checked = selectedIds.has(c.customerId);
                  const item: TargetedCustomer = {
                    customerId: c.customerId,
                    fullName: c.fullName,
                    email: c.email,
                  };
                  return (
                    <CommandItem
                      key={c.customerId}
                      value={String(c.customerId)}
                      onSelect={() => toggle(item)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          checked ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-foreground">{labelOf(item)}</span>
                        {c.email && (
                          <span className="text-[0.65rem] text-muted-foreground">
                            {c.email}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
