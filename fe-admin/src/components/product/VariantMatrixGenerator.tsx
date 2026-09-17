import { useState } from "react";
import { Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { GeneratedCombo } from "./variant-matrix/types";
import type { ColorOption } from "./variant-matrix/constants";
import { buildCombos } from "./variant-matrix/constants";
import SizeSelector from "./variant-matrix/SizeSelector";
import ColorSelector from "./variant-matrix/ColorSelector";
import ColorImageUpload from "./variant-matrix/ColorImageUpload";
import DefaultValues from "./variant-matrix/DefaultValues";

export type { GeneratedCombo } from "./variant-matrix/types";

interface ColorImageMap {
  [colorName: string]: File | undefined;
}

interface VariantMatrixGeneratorProps {
  existingKeys: Set<string>;
  onGenerate: (combos: GeneratedCombo[]) => void;
}

export default function VariantMatrixGenerator({
  existingKeys,
  onGenerate,
}: VariantMatrixGeneratorProps) {
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [colorImages, setColorImages] = useState<ColorImageMap>({});

  const [defaultPrice, setDefaultPrice] = useState<number | undefined>(
    undefined,
  );
  const [defaultStock, setDefaultStock] = useState<number>(0);

  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const toggleColor = (color: ColorOption) => {
    setColors((prev) => {
      const exists = prev.some((c) => c.name === color.name);
      const next = exists
        ? prev.filter((c) => c.name !== color.name)
        : [...prev, color];

      if (exists) {
        setColorImages((imgs) => {
          const copy = { ...imgs };
          delete copy[color.name];
          return copy;
        });
      }
      return next;
    });
  };

  const handleImageSelect = (colorName: string, file: File) => {
    setColorImages((prev) => ({ ...prev, [colorName]: file }));
  };

  const handleImageRemove = (colorName: string) => {
    setColorImages((prev) => {
      const copy = { ...prev };
      delete copy[colorName];
      return copy;
    });
  };

  const handleGenerate = () => {
    if (colors.length === 0 || sizes.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 màu và 1 kích cỡ.");
      return;
    }

    const { combos, skipped } = buildCombos(
      colors,
      sizes,
      { price: defaultPrice, stock: defaultStock },
      existingKeys,
    );

    if (combos.length === 0) {
      toast.info("Tất cả tổ hợp đã tồn tại trong danh sách.");
      return;
    }

    combos.forEach((c) => {
      const img = colorImages[c.color];
      if (img) {
        (c as GeneratedCombo & { file?: File }).file = img;
      }
    });

    onGenerate(combos);
    toast.success(
      `Đã tạo ${combos.length} biến thể${skipped ? ` (bỏ qua ${skipped} tổ hợp trùng)` : ""}.`,
    );
  };

  const totalCombos = colors.length * sizes.length;
  const hasSelection = sizes.length > 0 || colors.length > 0;

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-4 space-y-4">
      <p className="text-sm font-medium text-gray-700">
        Tạo biến thể hàng loạt
      </p>

      <SizeSelector sizes={sizes} onToggle={toggleSize} />
      <ColorSelector colors={colors} onToggle={toggleColor} />

      <ColorImageUpload
        colors={colors}
        colorImages={colorImages}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
      />

      <DefaultValues
        price={defaultPrice}
        stock={defaultStock}
        onPriceChange={setDefaultPrice}
        onStockChange={setDefaultStock}
      />

      {}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {hasSelection ? (
            <span>
              {colors.length} màu × {sizes.length} size ={" "}
              <span className="font-medium text-gray-700">{totalCombos}</span>{" "}
              tổ hợp
            </span>
          ) : (
            <span>Chọn màu và kích cỡ để tạo tổ hợp.</span>
          )}
          {hasSelection && (
            <button
              type="button"
              onClick={() => {
                setSizes([]);
                setColors([]);
                setColorImages({});
              }}
              className="inline-flex items-center gap-0.5 text-gray-400 hover:text-red-500"
            >
              <X size={12} /> Xoá chọn
            </button>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleGenerate}
          className="gap-1.5"
        >
          <Wand2 size={14} /> Tạo tổ hợp biến thể
        </Button>
      </div>
    </div>
  );
}
