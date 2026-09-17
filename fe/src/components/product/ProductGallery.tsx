import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/utils/format";

export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const current = resolveImageUrl(images[active]);

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
        {current ? (
          <img src={current} alt={alt} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-10" />
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-lg border-2",
                i === active ? "border-primary" : "border-transparent",
              )}
            >
              <img
                src={resolveImageUrl(img)}
                alt={`${alt} ${i + 1}`}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
