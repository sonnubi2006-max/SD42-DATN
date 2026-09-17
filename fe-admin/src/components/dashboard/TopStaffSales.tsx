import { ShoppingBag, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StaffSale {
  staffId: number;
  staffName: string;
  orderCount: number;
  revenue: number;
}

export default function TopStaffSales({ items, isLoading }: { items?: StaffSale[]; isLoading: boolean }) {
  return (
    <Card className="h-full border border-gray-100 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-1.5 text-sm font-extrabold text-gray-900">
          <UserRound className="size-4.5 text-blue-600" />
          Nhân viên bán hàng nổi bật
        </CardTitle>
        <CardDescription className="text-xs">Xếp hạng theo doanh thu bán hàng</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading || !items ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded bg-muted" />)}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item, index) => (
              <div key={item.staffId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.staffName || "Nhân viên"}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <ShoppingBag className="size-3" /> {item.orderCount} đơn hàng
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold">{item.revenue.toLocaleString("vi-VN")} đ</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
