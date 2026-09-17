import { Input } from "@/components/ui/input";

interface QuantityInputProps {
  value: number;
  max: number;
  onCommit: (value: number) => void;
}

interface QuantityInputProps {
  value: number;
  max: number;
  onCommit: (value: number) => void;
}

export default function QuantityInput({
  value,
  max,
  onCommit,
}: QuantityInputProps) {
  return (
    <Input
      inputMode="numeric"
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "");

        if (raw === "") return;

        const parsed = Number(raw);

        const next = Math.min(Math.max(Math.trunc(parsed), 1), max);

        onCommit(next);
      }}
      className="h-7 w-12 text-center text-xs font-medium"
    />
  );
}
