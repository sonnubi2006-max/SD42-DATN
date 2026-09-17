import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { usePosDrafts, usePosDraftDetail } from "@/hooks/usePosDraft";
import InvoicePrintModal from "@/components/pos/InvoicePrintModal";
import type { OrderResponse } from "@/api/orderApi";
import DraftTabs from "@/components/pos/DraftTabs";
import CartOrderPanel from "@/components/pos/CartOrderPanel";

export default function POSPage() {
  const { data: drafts } = usePosDrafts();
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);
  const { data: activeDraft } = usePosDraftDetail(activeDraftId);

  const [invoice, setInvoice] = useState<OrderResponse | null>(null);

  useEffect(() => {
    if (drafts?.length && !activeDraftId) {
      setActiveDraftId(drafts[0].orderId);
    }
  }, [drafts, activeDraftId]);

  return (
    <div className="flex min-h-[calc(100svh-5rem)] flex-col gap-2 bg-muted/20 p-2 lg:h-[calc(100dvh-5rem)] lg:min-h-0 lg:gap-3 lg:overflow-hidden lg:p-3">
      {}
      <div className="shrink-0 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
        <DraftTabs
          drafts={drafts}
          activeDraftId={activeDraftId}
          onSelectDraft={setActiveDraftId}
        />
      </div>

      {}
      <div className="flex min-h-0 flex-1 gap-2 lg:gap-3 lg:overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
          {!activeDraftId || !activeDraft ? (
            <EmptyOrderState />
          ) : (
            <CartOrderPanel
              key={activeDraftId}
              activeDraftId={activeDraftId}
              activeDraft={activeDraft}
              onCheckoutSuccess={(d) => {
                setInvoice(d);
                const remaining = drafts?.filter(
                  (x) => x.orderId !== activeDraftId,
                );
                setActiveDraftId(remaining?.[0]?.orderId ?? null);
              }}
            />
          )}
        </div>
      </div>

      {}
      {invoice && (
        <InvoicePrintModal order={invoice} onClose={() => setInvoice(null)} />
      )}
    </div>
  );
}

function EmptyOrderState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground">
      <div className="rounded-full bg-muted p-4">
        <ShoppingCart size={32} className="opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Chưa có đơn hàng</p>
        <p className="mt-1 text-xs">Tạo "Đơn mới" để bắt đầu bán hàng</p>
      </div>
    </div>
  );
}
