import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number; 
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(0, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div
      className={`flex items-center justify-center gap-1 ${className ?? ""}`}
    >
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      {start > 0 && (
        <>
          <Button variant="ghost" size="icon" onClick={() => onPageChange(0)}>
            1
          </Button>
          {start > 1 && <span className="px-1 text-muted-foreground">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === currentPage ? "default" : "ghost"}
          size="icon"
          onClick={() => onPageChange(p)}
        >
          {p + 1}
        </Button>
      ))}
      {end < totalPages - 1 && (
        <>
          {end < totalPages - 2 && (
            <span className="px-1 text-muted-foreground">…</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(totalPages - 1)}
          >
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
