import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PriceInput from "../PriceInput";

interface DefaultValuesProps {
  price: number | undefined;
  stock: number;
  onPriceChange: (v: number | undefined) => void;
  onStockChange: (v: number) => void;
}

export default function DefaultValues({
  price,
  stock,
  onPriceChange,
  onStockChange,
}: DefaultValuesProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">Giá bán mặc định</Label>
        <PriceInput
          value={price ?? ""}
          onChange={(v) => onPriceChange(v === "" ? undefined : v as number)}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">Tồn kho mặc định</Label>
        <Input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => onStockChange(Number(e.target.value) || 0)}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
