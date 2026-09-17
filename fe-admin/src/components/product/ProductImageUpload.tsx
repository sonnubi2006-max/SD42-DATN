import { useRef, useState } from "react";
import { Upload, X, Star } from "lucide-react";
import type { ProductImageResponse } from "@/api/productVariantApi";
import { toast } from "sonner";

const MAX_PRODUCT_IMAGES = 5;

interface ProductImageUploadProps {
  existingImages?: ProductImageResponse[];
  onDeleteExisting?: (id: number) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export default function ProductImageUpload({
  existingImages = [],
  onDeleteExisting,
  files,
  onFilesChange,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/"),
    );
    const remainingSlots = MAX_PRODUCT_IMAGES - existingImages.length - files.length;
    if (remainingSlots <= 0) {
      toast.error("Mỗi sản phẩm chỉ được có tối đa 5 ảnh");
      return;
    }
    if (valid.length > remainingSlots) {
      toast.error(`Chỉ có thể thêm ${remainingSlots} ảnh nữa`);
    }
    onFilesChange([...files, ...valid.slice(0, remainingSlots)]);
  };

  const removeNew = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const totalCount = existingImages.length + files.length;

  return (
    <div className="space-y-3">
      {}
      {existingImages.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Ảnh hiện tại</p>
          <div className="grid grid-cols-4 gap-2">
            {existingImages.map((img) => (
              <div
                key={img.imageId}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={img.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {img.isThumbnail && (
                  <div className="absolute top-1 left-1 bg-amber-400 text-white rounded px-1 text-[10px] font-medium flex items-center gap-0.5">
                    <Star size={9} fill="white" /> Chính
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteExisting?.(img.imageId)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      {files.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Ảnh mới</p>
          <div className="grid grid-cols-4 gap-2">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="relative group aspect-square rounded-lg overflow-hidden border border-blue-200 bg-blue-50"
              >
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNew(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={10} />
                </button>
                <p className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] truncate px-1 py-0.5">
                  {f.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div
        onClick={() => totalCount < MAX_PRODUCT_IMAGES && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition
          ${
            totalCount >= MAX_PRODUCT_IMAGES
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer"
          }`}
      >
        <Upload
          size={18}
          className={dragOver ? "text-blue-500" : "text-gray-400"}
        />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {totalCount >= MAX_PRODUCT_IMAGES ? "Đã đủ 5 ảnh" : "Kéo thả hoặc "}
            {totalCount < MAX_PRODUCT_IMAGES && (
              <span className="text-blue-600 font-medium">chọn ảnh</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            PNG, JPG, WEBP — nhiều file cùng lúc
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={totalCount >= MAX_PRODUCT_IMAGES}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {totalCount > 0 && (
        <p className="text-xs text-gray-400">{totalCount}/{MAX_PRODUCT_IMAGES} ảnh</p>
      )}
    </div>
  );
}
