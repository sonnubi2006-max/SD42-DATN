import { Plus, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PosDraftResponse } from "@/api/posApi";
import { useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useCreatePosDraft, useCancelPosDraft } from "@/hooks/usePosDraft";
import { toast } from "sonner";

interface Props {
  drafts: PosDraftResponse[] | undefined;
  activeDraftId: number | null;
  onSelectDraft: (id: number | null) => void;
}

export default function DraftTabs({
  drafts, activeDraftId, onSelectDraft
}: Props) {
  const [cancellingDraftId, setCancellingDraftId] = useState<number | null>(null);

  const { mutate: createDraft, isPending: isCreating } = useCreatePosDraft();
  const { mutate: cancelDraft, isPending: isCancelling } = useCancelPosDraft();

  const handleCreateDraft = () => {
    if (drafts && drafts.length >= 5) {
      toast.error("Mỗi nhân viên chỉ được mở tối đa 5 đơn chờ tại quầy!");
      return;
    }
    createDraft(
      {},
      {
        onSuccess: (d) => {
          onSelectDraft(d.orderId);
          toast.success(`Đã tạo đơn ${d.orderCode}`);
        },
        onError: (e: any) => toast.error(e?.apiMessage ?? "Tạo đơn thất bại"),
      }
    );
  };

  const handleConfirmCancel = () => {
    if (!cancellingDraftId) return;
    cancelDraft(cancellingDraftId, {
      onSuccess: () => {
        toast.success("Đã hủy đơn chờ");
        if (activeDraftId === cancellingDraftId) {
          const remaining = drafts?.filter((d) => d.orderId !== cancellingDraftId);
          onSelectDraft(remaining?.[0]?.orderId ?? null);
        }
        setCancellingDraftId(null);
      },
      onError: (e: any) => {
        toast.error(e?.apiMessage ?? "Hủy thất bại");
        setCancellingDraftId(null);
      },
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {drafts?.map((draft) => {
            const isActive = activeDraftId === draft.orderId;
            return (
              <button
                key={draft.orderId}
                onClick={() => onSelectDraft(draft.orderId)}
                className={`group flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <ShoppingBag size={12} />
                <span>{draft.orderCode}</span>
                {draft.totalItems > 0 && (
                  <Badge
                    className={`h-4 min-w-4 rounded-full px-1 text-[9px] ${
                      isActive ? "bg-white/20 text-white" : "bg-muted"
                    }`}
                  >
                    {draft.totalItems}
                  </Badge>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCancellingDraftId(draft.orderId);
                  }}
                  className={`ml-0.5 rounded-sm p-0.5 transition-colors ${
                    isActive
                      ? "text-white/60 hover:text-white"
                      : "text-muted-foreground/40 hover:text-destructive"
                  }`}
                >
                  <X size={11} />
                </button>
              </button>
            );
          })}
        </div>

        {}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateDraft}
          disabled={isCreating || Boolean(drafts && drafts.length >= 5)}
          title={drafts && drafts.length >= 5 ? "Đã đạt tối đa 5 đơn chờ" : "Tạo đơn chờ mới"}
          className="h-8 shrink-0 gap-1.5 text-xs border-dashed"
        >
          <Plus size={13} />
          {isCreating ? "Đang tạo..." : drafts && drafts.length >= 5 ? "Đã tối đa 5 đơn" : "Đơn mới"}
        </Button>
      </div>

      {cancellingDraftId && (
        <ConfirmModal
          typeConfirm="DELETE"
          message="Bạn có chắc chắn muốn hủy đơn chờ này không?"
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancellingDraftId(null)}
          isPending={isCancelling}
        />
      )}
    </>
  );
}
