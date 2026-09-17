import { ImagePlus, X } from "lucide-react";
import type { ColorOption } from "./constants";
import { toast } from "sonner";
import {
  VARIANT_IMAGE_ACCEPT,
  validateVariantImage,
} from "../variantImageValidation";

interface ColorImageMap {
  [colorName: string]: File | undefined;
}

interface ColorImageUploadProps {
  colors: ColorOption[];
  colorImages: ColorImageMap;
  onImageSelect: (colorName: string, file: File) => void;
  onImageRemove: (colorName: string) => void;
}

export default function ColorImageUpload({
  colors,
  colorImages,
  onImageSelect,
  onImageRemove,
}: ColorImageUploadProps) {
  if (colors.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        Ảnh cho từng màu{" "}
        <span className="text-gray-400">(áp dụng cho các biến thể cùng màu)</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {colors.map((color) => {
          const file = colorImages[color.name];
          const preview = file ? URL.createObjectURL(file) : undefined;

          return (
            <div
              key={color.name}
              className="relative flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-2"
            >
              <div className="flex items-center gap-1.5 self-start">
                <span
                  className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs text-gray-600 truncate">{color.name}</span>
              </div>

              <label className="relative flex h-16 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 overflow-hidden hover:bg-gray-100 transition">
                {preview ? (
                  <img
                    src={preview}
                    alt={color.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus size={18} className="text-gray-300" />
                )}
                <input
                  type="file"
                  accept={VARIANT_IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const error = validateVariantImage(f);
                      if (error) {
                        toast.error(error);
                        e.target.value = "";
                        return;
                      }
                      onImageSelect(color.name, f);
                    }
                  }}
                />
              </label>

              {file && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] text-gray-400 truncate max-w-20">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onImageRemove(color.name)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
