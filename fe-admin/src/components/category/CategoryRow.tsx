import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import type { Category } from "@/api/categoryApi";
import UpdateStatusCategory from "./UpdateStatusCategory";
import UpdateCategoryModal from "./UpdateCategoryModal";

export interface CategoryRowProps {
  index: number;
  category: Category;
  checked: boolean;
  onCheckedChange: () => void;
}

export function CategoryRow({
  index,
  category,
  checked,
  onCheckedChange,
}: CategoryRowProps) {
  return (
    <TableRow className="group">
      {}
      <TableCell>
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      </TableCell>

      {}
      <TableCell className="text-center text-muted-foreground">
        {index}
      </TableCell>

      {}
      <TableCell className="font-medium">{category.categoryCode}</TableCell>

      {}
      <TableCell className="font-medium">{category.categoryName}</TableCell>

      {}
      <TableCell className="truncate">
        {category.categoryDescription ?? "—"}
      </TableCell>

      {}
      <TableCell>
        <Badge
          variant={
            category.categoryStatus === "ACTIVE" ? "success" : "destructive"
          }
        >
          {category.categoryStatus === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}
        </Badge>
      </TableCell>

      {}
      <TableCell>
        <div className="flex items-center gap-1 ">
          <UpdateCategoryModal category={category} />
          <UpdateStatusCategory category={category} />
        </div>
      </TableCell>
    </TableRow>
  );
}
