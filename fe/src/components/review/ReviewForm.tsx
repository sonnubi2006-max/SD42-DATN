import { useState, useEffect } from "react";
import { Star, X, Camera, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CreateReviewRequest } from "@/api/reviewApi";

interface ReviewFormProps {
  orderDetailId: number;
  productName: string;
  isPending?: boolean;
  initialRating?: number;
  onSubmit: (payload: CreateReviewRequest, files: File[]) => void;
  onCancel?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Rất tệ 😡",
  2: "Không hài lòng 😞",
  3: "Bình thường 😐",
  4: "Hài lòng 🙂",
  5: "Tuyệt vời! 😍",
};

export default function ReviewForm({
  orderDetailId,
  productName,
  isPending,
  initialRating = 0,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [sizeFeedback, setSizeFeedback] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (initialRating > 0) {
      setRating(initialRating);
    }
  }, [initialRating]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    const remainingSlots = 5 - files.length;
    if (remainingSlots <= 0) return;

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    const newFiles = [...files, ...filesToAdd];
    setFiles(newFiles);

    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    URL.revokeObjectURL(previews[index]);
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ orderDetailId, rating, comment, sizeFeedback }, files);
  };

  const activeRatingValue = hover || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center justify-between border-b pb-3 border-border/40">
        <div>
          <h3 className="font-bold text-base text-foreground leading-snug">Viết Đánh Giá Sản Phẩm</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{productName}</p>
        </div>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-muted-foreground h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {}
      <div className="space-y-2 text-center py-4 bg-muted/20 rounded-xl border border-dashed border-border/60">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Mức độ hài lòng của bạn *
        </Label>
        <div className="flex justify-center items-center gap-1.5 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="p-1 hover:scale-110 active:scale-95 transition"
            >
              <Star
                className={cn(
                  "size-8 transition-all duration-150 cursor-pointer",
                  s <= activeRatingValue
                    ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                    : "text-muted-foreground/35"
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-xs font-bold text-amber-500 min-h-[1.25rem] transition-all">
          {RATING_LABELS[activeRatingValue] || "Vui lòng chọn số sao"}
        </p>
      </div>

      {}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Đánh giá kích cỡ
        </Label>
        <div className="flex flex-wrap gap-2">
          {["Chật hơn", "Vừa vặn", "Rộng hơn"].map((f) => {
            const isActive = sizeFeedback === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setSizeFeedback(isActive ? "" : f)}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Bình luận chi tiết *
        </Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Hãy chia sẻ nhận xét chi tiết của bạn về chất lượng sản phẩm, form dáng và dịch vụ chăm sóc nhé..."
          rows={4}
          required
          className="resize-none focus-visible:ring-primary/20 text-xs py-3 px-4 border-border/80"
        />
      </div>

      {}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Camera className="size-3.5 text-muted-foreground" /> Hình ảnh đính kèm (Tối đa 5 ảnh)
        </Label>

        <div className="flex flex-wrap gap-3 items-center">
          {}
          {previews.map((src, index) => (
            <div
              key={index}
              className="relative size-16 rounded-xl border border-border overflow-hidden shadow-2xs group hover:border-destructive/50 transition"
            >
              <img src={src} alt="Ảnh xem trước" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-destructive text-white rounded-full p-0.5 transition"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}

          {}
          {files.length < 5 && (
            <label className="flex flex-col items-center justify-center size-16 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/10 cursor-pointer transition text-center p-2">
              <UploadCloud className="size-5 text-muted-foreground/75" />
              <span className="text-[9px] text-muted-foreground font-semibold mt-1">Thêm ảnh</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {}
      <div className="flex gap-3 justify-end pt-3 border-t border-border/30">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="cursor-pointer text-xs font-semibold h-9 px-4 rounded-xl border-border"
          >
            Hủy bỏ
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending || rating === 0}
          className="cursor-pointer text-xs font-bold bg-primary hover:bg-primary/95 h-9 px-5 rounded-xl text-primary-foreground shadow-xs flex items-center gap-1.5"
        >
          {isPending ? "Đang gửi..." : "Gửi đánh giá"}
        </Button>
      </div>
    </form>
  );
}
