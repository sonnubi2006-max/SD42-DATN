import z from "zod";

export const categorySchema = z.object({
  categoryName: z
    .string()
    .trim()
    .min(1, "Tên danh mục không được để trống")
    .min(2, "Tên danh mục tối thiểu 2 ký tự")
    .max(100, "Tên danh mục tối đa 100 ký tự"),
  categoryDescription: z
    .string()
    .trim()
    .max(500, "Mô tả danh mục tối đa 500 ký tự"),

  categoryStatus: z.enum(["ACTIVE", "INACTIVE"]),
});

export interface CategoryForm {
  categoryName: string;
  categoryDescription?: string;
  categoryStatus: "ACTIVE" | "INACTIVE";
}
