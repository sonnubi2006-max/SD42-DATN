import { useEffect, useId, useMemo, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface OrderEvidenceImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function OrderEvidenceImageUpload({
  files,
  onChange,
  required = false,
  disabled = false,
}: OrderEvidenceImageUploadProps) {
  const inputId = useId();
  const [error, setError] = useState("");
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  const addFiles = (selectedFiles: File[]) => {
    setError("");
    const validFiles = selectedFiles.filter((file) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.");
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Mỗi ảnh không được vượt quá 5 MB.");
        return false;
      }
      return true;
    });

    const merged = [...files, ...validFiles];
    if (merged.length > MAX_IMAGES) {
      setError("Chỉ được chọn tối đa 5 ảnh xác nhận.");
      onChange(merged.slice(0, MAX_IMAGES));
      return;
    }
    onChange(merged);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-semibold text-gray-700">
          Ảnh xác nhận {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[10px] text-gray-400">{files.length}/{MAX_IMAGES} ảnh</span>
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || files.length >= MAX_IMAGES}
        className="sr-only"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <label
        htmlFor={inputId}
        className={`flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-3 py-3 text-center transition ${
          disabled || files.length >= MAX_IMAGES
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            : "border-blue-200 bg-blue-50/40 text-blue-700 hover:bg-blue-50"
        }`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!disabled) addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <ImagePlus size={20} />
        <span className="mt-1 text-xs font-semibold">Chọn hoặc kéo ảnh vào đây</span>
        <span className="text-[10px] text-gray-400">JPEG, PNG, WebP · tối đa 5 MB/ảnh</span>
      </label>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map(({ file, url }, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="group relative aspect-square">
              <img
                src={url}
                alt={`Ảnh xác nhận ${index + 1}`}
                className="h-full w-full rounded-md border border-gray-200 object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                disabled={disabled}
                aria-label={`Xóa ảnh ${file.name}`}
                onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                className="absolute -right-1.5 -top-1.5 size-5 rounded-full opacity-90"
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
