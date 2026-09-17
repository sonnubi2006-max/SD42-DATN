import { Button } from "@/components/ui/button";

export interface Props {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  onPageChange: (page: number) => void;
}

export const CouponPagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  totalElements,
  first,
  last,
  onPageChange,
}) => {
  const pages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, i) => i + 1,
  );

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
      <span className="text-xs text-muted-foreground">
        Trang {currentPage + 1} / {totalPages} — {totalElements} mã giảm giá
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={first}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Trước
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === currentPage + 1 ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p - 1)}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={last}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau →
        </Button>
      </div>
    </div>
  );
};
