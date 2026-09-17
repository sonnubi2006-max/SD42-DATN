import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ProductResponse } from "@/api/productApi";
import { Checkbox } from "../ui/checkbox";
import ProductRow from "./ProductRow";

interface ProductTableProps {
  data: ProductResponse[];
  isLoading: boolean;
  search: string;
  selectedIds: number[];
  onSelectChange: (ids: number[]) => void;
}

export default function ProductTable({
  data,
  isLoading,
  search,
  selectedIds,
  onSelectChange,
}: ProductTableProps) {

  const allSelected =
    data.length > 0 && data.every((p) => selectedIds.includes(p.productId));
  const toggleAll = () =>
    onSelectChange(allSelected ? [] : data.map((p) => p.productId));

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
        {search ? `Không tìm thấy "${search}"` : "Chưa có sản phẩm nào"}
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
            "ID",
            "Sản phẩm",
            "Danh mục",
            "Thương hiệu",
            "Biến thể",
            "Giá",
            "Tồn kho",
            "Hàng hỏng",
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
        {data.map((p, i) =>
          <ProductRow
            index={i}
            product={p}
            selectedIds={selectedIds}
            onSelectChange={onSelectChange}
          />
        )}
      </TableBody>
    </Table>
  );
}
