import { useRef, useState } from "react";
import type { Brand, BrandStatus } from "@/api/brandApi";
import { Upload, ImageIcon, Edit, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useUpdateBrand } from "@/hooks/useBrand";
import { toast } from "sonner";

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
  brandStatus: z.enum(["ACTIVE", "INACTIVE"]),
  file: z
    .instanceof(File)
    .nullable()
    .refine((file) => !file || file.size <= 2 * 1024 * 1024, "Ảnh tối đa 2MB")
    .refine(
      (file) => !file || ["image/png", "image/jpeg", "image/webp"].includes(file.type),
      "Chỉ nhận PNG, JPG, WEBP",
    ),
});

export default function UpdateBrandModal({ brand }: { brand: Brand }) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ValidateForm | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: update, isPending: isUpdating } = useUpdateBrand();

  const { Field, handleSubmit } = useForm({
    defaultValues: {
      brandName: brand.brandName,
      brandStatus: brand.brandStatus,
      file: null as File | null,
    },
    onSubmit: async ({ value }) => {
      setPendingValues(value);
      setConfirmOpen(true);
    },
    validators: { onSubmit: brandSchema },
  });

  const handleConfirm = () => {
    if (!pendingValues) return;
    update(
      {
        id: brand.brandId,
        payload: {
          brandName: pendingValues.brandName.replace(/\s+/g, " ").trim(),
          file: pendingValues.file ?? undefined,
          brandStatus: pendingValues.brandStatus,
        },
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật thương hiệu thành công");
          setIsOpen(false);
          setConfirmOpen(false);
          setPendingValues(null);
          setFile(null);
          setPreview(null);
          if (inputRef.current) inputRef.current.value = "";
        },
        onError: (error: any) => {
          toast.error(error?.apiMessage ?? "Cập nhật thất bại");
          setConfirmOpen(false);
        },
      },
    );
  };

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
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
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="icon-lg" variant="ghost" title="Chỉnh sửa">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="min-w-lg w-max p-6">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thương hiệu</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }}>
            <div className="flex flex-col gap-4">
              {}
              <Field name="brandName">
                {(field) => {
                  const { errors } = field.state.meta;
                  return (
                    <div className="space-y-1.5">
                      <Label htmlFor="brandName">
                        Tên thương hiệu <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="brandName"
                        defaultValue={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="VD: Gucci, Dior..."
                      />
                      {errors.length > 0 && (
                        <span className="text-destructive text-xs">{(errors[0] as { message?: string })?.message ?? String(errors[0])}</span>
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
                      <Label>Logo thương hiệu</Label>
                      {preview ? (
                        <div className="relative w-full h-40 border border-border rounded-xl overflow-hidden group">
                          <img src={preview} alt="Ảnh xem trước" className="w-full h-full object-contain p-3" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button type="button" onClick={() => inputRef.current?.click()}
                              className="text-xs text-white bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg">
                              Đổi ảnh
                            </Button>
                            <Button type="button" onClick={clearPreview}
                              className="text-xs text-white bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg">
                              Xoá
                            </Button>
                          </div>
                        </div>
                      ) : brand?.brandLogo ? (
                        <div className="relative w-full h-40 border border-border rounded-xl overflow-hidden group">
                          <img src={brand.brandLogo} alt="logo" className="w-full h-full object-contain p-3" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button type="button" onClick={() => inputRef.current?.click()}
                              className="text-xs text-white bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg">
                              Đổi ảnh
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => inputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleDrop}
                          className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {dragOver ? <Upload size={18} className="text-primary" /> : <ImageIcon size={18} className="text-muted-foreground" />}
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-foreground">
                              Kéo thả hoặc <span className="text-primary font-medium">chọn file</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP — tối đa 2MB</p>
                          </div>
                        </div>
                      )}
                      <Input
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { handleFile(f); field.handleChange(f); }
                        }}
                      />
                      {file && (
                        <p className="text-xs text-muted-foreground truncate">
                          📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                        </p>
                      )}
                      {errors.length > 0 && (
                        <span className="text-destructive text-xs">{(errors[0] as { message?: string })?.message ?? String(errors[0])}</span>
                      )}
                    </div>
                  );
                }}
              </Field>

              {}
              <Field name="brandStatus">
                {(field) => {
                  const { errors } = field.state.meta;
                  return (
                    <div className="space-y-1.5">
                      <Label>Trạng thái</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v as BrandStatus)}
                      >
                        <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                          <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.length > 0 && (
                        <span className="text-destructive text-xs">{(errors[0] as { message?: string })?.message ?? String(errors[0])}</span>
                      )}
                    </div>
                  );
                }}
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-border">
              <DialogClose asChild>
                <Button type="button" variant="outline">Huỷ</Button>
              </DialogClose>
              <Button type="submit">Cập nhật</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-500" />
              Xác nhận cập nhật
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn cập nhật thương hiệu{" "}
              <strong>"{brand.brandName}"</strong> với thông tin mới không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating ? "Đang lưu..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
