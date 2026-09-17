import { Slider } from "@/components/ui/slider";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
}

const formatPrice = (value: number) => `${Math.round(value).toLocaleString("vi-VN")}đ`;

export function PriceRangeSlider({
  min,
  max,
  value,
  onValueChange,
}: PriceRangeSliderProps) {
  const normalizedMax = Math.max(max, min + 1);
  const step = normalizedMax - min <= 1_000 ? 1 : 1_000;

  return (
    <div className="min-w-64 flex-1 space-y-2 rounded-md border bg-background px-3 py-2">
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>{formatPrice(value[0])}</span>
        <span>Khoảng giá</span>
        <span>{formatPrice(value[1])}</span>
      </div>
      <Slider
        min={min}
        max={normalizedMax}
        step={step}
        value={value}
        onValueChange={(next) => onValueChange(next as [number, number])}
        aria-label="Khoảng giá sản phẩm"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/70">
        <span>Min: {formatPrice(min)}</span>
        <span>Max: {formatPrice(max)}</span>
      </div>
    </div>
  );
}
