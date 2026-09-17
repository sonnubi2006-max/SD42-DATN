import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value?: number;
  size?: number;
  className?: string;
}

export default function RatingStars({
  value = 0,
  size = 14,
  className,
}: RatingStarsProps) {
  const rounded = Math.round(value);
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i < rounded
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
