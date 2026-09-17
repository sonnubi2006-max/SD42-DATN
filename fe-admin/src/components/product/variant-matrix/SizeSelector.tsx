import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRESET_SIZES, normalizeLabel } from "./constants";

interface SizeSelectorProps {
  sizes: string[];
  onToggle: (size: string) => void;
}

export default function SizeSelector({ sizes, onToggle }: SizeSelectorProps) {
  const [custom, setCustom] = useState("");

  const addCustom = () => {
    const v = custom.trim();
    if (!v) {
      toast.error("Vui lòng nhập tên kích cỡ.");
      return;
    }
    const key = normalizeLabel(v);

    const canonical =
      PRESET_SIZES.find((s) => normalizeLabel(s) === key) ??
      sizes.find((s) => normalizeLabel(s) === key) ??
      v;
    if (sizes.some((s) => normalizeLabel(s) === key)) {
      toast.error(`Kích cỡ "${canonical}" đã được chọn.`);
      return;
    }
    onToggle(canonical);
    setCustom("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-500">Kích cỡ</Label>
      <div className="flex flex-wrap gap-1.5">
        {[
          ...PRESET_SIZES,
          ...sizes.filter(
            (s) => !PRESET_SIZES.some((p) => normalizeLabel(p) === normalizeLabel(s)),
          ),
        ].map((size) => {
          const active = sizes.some(
            (s) => normalizeLabel(s) === normalizeLabel(size),
          );
          return (
            <button
              key={size}
              type="button"
              onClick={() => onToggle(size)}
              className={`px-2.5 py-1 rounded-md border text-xs transition ${
                active
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Thêm kích cỡ khác..."
          className="h-8 w-40 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustom}
          className="h-8 gap-1"
        >
          <Plus size={13} /> Thêm
        </Button>
      </div>
    </div>
  );
}
