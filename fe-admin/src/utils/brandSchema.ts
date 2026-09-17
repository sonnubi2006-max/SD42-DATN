import { z } from "zod";

export const brandSchema = z.object({
  brandName: z
    .string()
    .min(1, "Tên thương hiệu không được để trống")
    .min(2, "Tên thương hiệu tối thiểu 2 ký tự")
    .max(50, "Tên thương hiệu tối đa 50 ký tự"),

  brandStatus: z.enum(["ACTIVE", "INACTIVE"]),

  file: z
    .instanceof(File)
    .nullable()
    .refine((file) => !file || file.size <= 2 * 1024 * 1024, "Ảnh tối đa 2MB")
    .refine(
      (file) =>
        !file || ["image/png", "image/jpeg", "image/webp"].includes(file.type),
      "Chỉ nhận PNG, JPG, WEBP",
    ),
});

export type BrandForm = z.infer<typeof brandSchema>;
