import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface PriceInputProps {
  value: number | string | undefined;
  onChange: (value: number | string | undefined) => void;
  onBlur?: () => void;
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
  error?: boolean;
}

function formatNumber(n: number): string {
  return n.toLocaleString("vi-VN");
}

export default function PriceInput({
  value,
  onChange,
  onBlur,
  placeholder = "0",
  min = 0,
  max,
  className,
  error,
}: PriceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(() =>
    typeof value === "number" ? formatNumber(value) : "",
  );

  useEffect(() => {
    const newDisplay = typeof value === "number" ? formatNumber(value) : "";
    setDisplay(newDisplay);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digits = raw.replace(/[^\d]/g, "");
      if (digits === "") {
        setDisplay("");
        onChange("");
        return;
      }
      const n = Number(digits);
      if (n < min) return;
      if (max != null && n > max) return;
      setDisplay(formatNumber(n));
      onChange(n);
    },
    [onChange, min, max],
  );

  return (
    <Input
      ref={inputRef}
      value={display}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`${className ?? ""} ${error ? "border-red-400 focus-visible:ring-red-400" : ""}`}
    />
  );
}
