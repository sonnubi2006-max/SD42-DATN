import { MapPin, Pencil } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type { CustomerResponse } from "@/api/customerApi";

interface Props {
  data: CustomerResponse[];
  isLoading: boolean;
  selectedIds: Set<number>;
  onToggleOne: (id: number) => void;
  onTogglePage: (ids: number[], checked: boolean) => void;
  onViewAddresses: (c: CustomerResponse) => void;
  onEdit: (c: CustomerResponse) => void;
  onToggleStatus: (c: CustomerResponse) => void;
}

export function CustomerTable({
  data,
  isLoading,
  selectedIds,
  onToggleOne,
  onTogglePage,
  onViewAddresses,
  onEdit,
  onToggleStatus,
}: Props) {
  const pageIds = data.map((c) => c.customerId);
  const allChecked =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allChecked}
              onCheckedChange={(v) => onTogglePage(pageIds, Boolean(v))}
              aria-label="Chọn tất cả"
            />
          </TableHead>
          <TableHead className="w-12">STT</TableHead>
          <TableHead>Mã KH</TableHead>
          <TableHead>Khách hàng</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Số điện thoại</TableHead>
          <TableHead className="max-sm:hidden">Ngày sinh</TableHead>
          <TableHead className="max-sm:hidden">Địa chỉ</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-center">Thao tác</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-16">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Đang tải...
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={10}
              className="text-center py-16 text-muted-foreground text-sm"
            >
              Không có khách hàng nào
            </TableCell>
          </TableRow>
        ) : (
          data.map((c, i) => {
            const isActive = c.status === "ACTIVE";

            return (
              <TableRow
                key={c.customerId}
                data-state={
                  selectedIds.has(c.customerId) ? "selected" : undefined
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(c.customerId)}
                    onCheckedChange={() => onToggleOne(c.customerId)}
                    aria-label={`Chọn khách ${c.customerId}`}
                  />
                </TableCell>

                <TableCell className="text-muted-foreground ">
                  {i + 1}
                </TableCell>

                <TableCell className="font-medium">
                  {c.customerCode || "—"}
                </TableCell>
                <TableCell>{c.fullName ?? "—"}</TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell className="max-sm:hidden">
                  {c.birthday ?? "—"}
                </TableCell>
                <TableCell className="line-clamp-1 truncate max-sm:hidden">
                  {c.address
                    ? [
                      c.address.streetAddress,
                      c.address.ward,
                      c.address.province,
                    ]
                      .map((s) => s?.trim())
                      .filter((s): s is string =>
                        Boolean(
                          s && s !== "-" && s !== "null" && s !== "undefined",
                        ),
                      )
                      .join(", ") || "-"
                    : "-"}
                </TableCell>

                <TableCell>
                  <Badge variant={isActive ? "success" : "destructive"}>
                    {isActive ? "Hoạt động" : "Ngừng"}
                  </Badge>
                </TableCell>

                { }
                <TableCell>
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Danh sách địa chỉ"
                      onClick={() => onViewAddresses(c)}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Cập nhật khách hàng"
                      onClick={() => onEdit(c)}
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => onToggleStatus(c)}
                      title="Đổi trạng thái"
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
