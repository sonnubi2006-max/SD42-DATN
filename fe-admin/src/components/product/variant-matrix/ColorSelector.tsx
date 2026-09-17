import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRESET_COLORS, normalizeLabel, type ColorOption } from "./constants";

interface ColorSelectorProps {
  colors: ColorOption[];
  onToggle: (color: ColorOption) => void;
}

export default function ColorSelector({ colors, onToggle }: ColorSelectorProps) {
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#000000");

  const addCustom = () => {
    const v = customName.trim();
    if (!v) {
      toast.error("Vui lòng nhập tên màu.");
      return;
    }
    const key = normalizeLabel(v);

    const selected = colors.find((c) => normalizeLabel(c.name) === key);
    if (selected) {
      toast.error(`Màu "${selected.name}" đã được chọn.`);
      setCustomName("");
      return;
    }

    const preset = PRESET_COLORS.find((c) => normalizeLabel(c.name) === key);
    onToggle(preset ?? { name: v, hex: customHex });
    setCustomName("");
  };

  const allColors = [
    ...PRESET_COLORS,
    ...colors.filter(
      (c) => !PRESET_COLORS.some((p) => normalizeLabel(p.name) === normalizeLabel(c.name)),
    ),
  ];

  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-500">Màu sắc</Label>
      <div className="flex flex-wrap gap-1.5">
        {allColors.map((color) => {
          const active = colors.some(
            (c) => normalizeLabel(c.name) === normalizeLabel(color.name),
          );
          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onToggle(color)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition ${
                active
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/10"
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          className="h-8 w-8 rounded border border-gray-200 p-0.5"
        />
        <Input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Thêm màu khác..."
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
