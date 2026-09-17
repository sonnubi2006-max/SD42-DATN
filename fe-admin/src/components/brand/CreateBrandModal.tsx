import { useRef, useState } from "react";
import type { Brand, BrandStatus } from "@/api/brandApi";
import { Upload, ImageIcon, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useCreateBrand } from "@/hooks/useBrand";
import { toast } from "sonner";

export interface BrandForm {
  brandName: string;
  file: File | null;
  brandStatus: BrandStatus;
}

export type ModalMode = "create" | "edit" | null;

interface ValidateForm {
  brandName: string;
  brandStatus: BrandStatus;
  file: File | null;
}

const brandSchema = z.object({
  brandName: z
    .string()
    .trim()
    .min(1, "Tên thương hiệu không được để trống")
    .min(2, "Tên thương hiệu tối thiểu 2 ký tự")
    .max(50, "Tên thương hiệu tối đa 50 ký tự"),

  file: z
    .instanceof(File, {
      message: "Ảnh không được để trống",
    })
    .refine((file) => file.size <= 2 * 1024 * 1024, "Ảnh tối đa 2MB")
    .refine(
      (file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type),
      "Chỉ nhận PNG, JPG, WEBP",
    ),
});

interface CreateBrandModalProps {
  onCreated?: (brand: Brand) => void;
  className?: string;
}

export default function CreateBrandModal({
  onCreated,
  className,
}: CreateBrandModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { mutate: create, isPending: isCreating } = useCreateBrand();

  const { Field, handleSubmit, reset, setFieldValue } = useForm({
    defaultValues: {
      brandName: "",
      file: null as File | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.file) {
        toast.error("Vui lòng chọn ảnh thương hiệu");
        return;
      }
      create(
        {
          brandName: value.brandName.replace(/\s+/g, " ").trim(),
          brandStatus: "ACTIVE",
          file: value.file,
        },
        {
          onSuccess: (brand) => {
            toast.success("Tạo thương hiệu thành công");
            onCreated?.(brand);
            setIsOpen(false);
            reset();
            setFile(null);
            setPreview(null);

            if (inputRef.current) {
              inputRef.current.value = "";
            }
          },
          onError: (error: any) => {
            toast.error(error?.apiMessage ?? "Tạo thất bại");
          },
        },
      );
    },
    validators: {
      onSubmit: brandSchema,
    },
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setFieldValue("file", f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setFieldValue("file", null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      reset();
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="lg" className={className}>
          <Plus className="mr-2 h-4 w-4" /> Thêm thương hiệu
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-lg w-max p-6">
        {}
        <DialogHeader>
          <DialogTitle>Thêm thương hiệu mới</DialogTitle>
        </DialogHeader>

        {}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
          }}
        >
          <div className="flex flex-col gap-4">
            {}
            <Field name="brandName">
              {(field) => {
                const { errors } = field.state.meta;
                return (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">
                      Tên thương hiệu <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="VD: Gucci, Dior..."
                    />
                    {errors.length > 0 && (
                      <span className="text-destructive text-xs">
                        {(errors[0] as { message?: string })?.message ?? String(errors[0])}
                      </span>
                    )}
                  </div>
                );
              }}
            </Field>

            {}
            <Field name="file">
              {(field) => {
                const { errors } = field.state.meta;
                return (
                  <div className="space-y-1.5">
                    <Label htmlFor="logo">
                      Logo thương hiệu{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {preview ? (
                      <div className="relative h-40 border border-gray-200 rounded-xl overflow-hidden group">
                        <img
                          src={preview}
                          alt="Ảnh xem trước"
                          className="w-auto h-full object-contain p-3"
                        />
                        {}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="text-xs text-white bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg transition"
                          >
                            Đổi ảnh
                          </Button>
                          <Button
                            type="button"
                            onClick={clearPreview}
                            className="text-xs text-white bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg transition"
                          >
                            Xoá
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`w-auto h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition
                    ${
                      dragOver
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {dragOver ? (
                            <Upload size={18} className="text-blue-500" />
                          ) : (
                            <ImageIcon size={18} className="text-gray-400" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">
                            Kéo thả hoặc{" "}
                            <span className="text-blue-600 font-medium">
                              chọn file
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            PNG, JPG, WEBP — tối đa 2MB
                          </p>
                        </div>
                      </div>
                    )}

                    {}
                    <Input
                      ref={inputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          handleFile(f);
                        }
                      }}
                    />

                    {}
                    {file && (
                      <p className="text-xs text-gray-400 truncate">
                        📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                      </p>
                    )}
                    {errors.length > 0 && (
                      <span className="text-destructive text-xs">
                        {(errors[0] as { message?: string })?.message ?? String(errors[0])}
                      </span>
                    )}
                  </div>
                );
              }}
            </Field>
          </div>

          {}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <DialogClose asChild>
              <Button type="button" variant={"destructive"} size={"lg"}>
                Huỷ
              </Button>
            </DialogClose>

            <Button
              type="submit"
              size={"lg"}
              disabled={isCreating}
              onClick={(e) => e.stopPropagation()}
            >
              {isCreating ? "Đang lưu..." : "Tạo thương hiệu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
