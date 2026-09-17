import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryRow } from "./CategoryRow";
import type { Category } from "@/api/categoryApi";

export interface CategoryTableProps {
  categories: Category[];
  isLoading: boolean;
  selectedIds: Set<number>;
  toggleSelectOne: (id: number) => void;
  toggleSelectAll: (ids: number[], checked: boolean) => void;
}

export default function CategoryTable({
  categories,
  isLoading,
  selectedIds,
  toggleSelectOne,
  toggleSelectAll,
}: CategoryTableProps) {
  const allPageIds = categories.map((cat) => cat.categoryId) ?? [];
  const isAllSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));

  return (
    <Table>
      {}
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) =>
                toggleSelectAll(allPageIds, !!checked)
              }
            />
          </TableHead>
          <TableHead className="w-20 text-center">STT</TableHead>
          <TableHead>Mã </TableHead>
          <TableHead>Tên danh mục</TableHead>
          <TableHead>Mô tả</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Hành động</TableHead>
        </TableRow>
      </TableHeader>

      {}
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-16">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Đang tải…
              </div>
            </TableCell>
          </TableRow>
        ) : categories.length ? (
          categories.map((cat, i) => (
            <CategoryRow
              index={i + 1}
              key={cat.categoryId}
              category={cat}
              checked={selectedIds.has(cat.categoryId)}
              onCheckedChange={() => toggleSelectOne(cat.categoryId)}
            />
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center py-16 text-muted-foreground text-sm"
            >
              Không có danh mục nào.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
