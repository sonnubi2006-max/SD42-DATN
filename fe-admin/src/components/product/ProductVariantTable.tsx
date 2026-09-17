import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Checkbox } from "@/components/ui/checkbox";
import type { ProductVariantResponse } from "@/api/productVariantApi";
import ProductVariantRow from "./ProductVariantRow";

interface ProductVariantTableProps {
  data: ProductVariantResponse[];
  isLoading: boolean;
  search: string;
  selectedIds: number[];
  onSelectChange: (ids: number[]) => void;
}

export default function ProductVariantTable({
  data,
  isLoading,
  search,
  selectedIds,
  onSelectChange,
}: ProductVariantTableProps) {
  const allSelected =
    data.length > 0 && data.every((p) => selectedIds.includes(p.variantId));
  const toggleAll = () =>
    onSelectChange(allSelected ? [] : data.map((p) => p.variantId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Đang tải...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">
        {search ? "Không tìm thấy" : "Chưa có biến thể sản phẩm nào"}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50 hover:bg-gray-50">
          <TableHead className="w-10">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          </TableHead>
          {[
            "STT",
            "Mã",
            "Size",
            "Màu",
            "Giá",
            "Tồn kho",
            "Hàng hỏng",
            "Hình ảnh",
            "Trạng thái",
            "Hành động",
          ].map((h) => (
            <TableHead
              key={h}
              className="text-xs font-medium text-gray-400 uppercase tracking-wide"
            >
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((p, i) => (
          <ProductVariantRow
            variant={p}
            key={p.variantId}
            onSelectChange={onSelectChange}
            selectedIds={selectedIds}
            index={i}
          />
        ))}
      </TableBody>
    </Table>
  );
}
