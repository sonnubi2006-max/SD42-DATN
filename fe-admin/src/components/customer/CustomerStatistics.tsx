import { useOrderList } from "@/hooks/useOrder";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, ShoppingBag, DollarSign, Loader2 } from "lucide-react";

interface Props {
  customerId: number;
}

export default function CustomerStatistics({ customerId }: Props) {
  const { data: orderPage, isLoading } = useOrderList({
    customerId,
    page: 0,
    size: 1000, // Fetch a large number to calculate statistics
  });

  const orders = orderPage?.content ?? [];
  
  const totalOrders = orderPage?.totalElements ?? 0;
  
  const completedCount = orders.filter(o => o.status === "COMPLETED" || o.status === "REFUNDED").length;
  
  const completionRate = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0;
  
  const totalSpent = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, order) => sum + (order.finalAmount || 0), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Tỉ lệ hoàn thành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {completedCount} / {totalOrders} đơn hàng
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ShoppingBag className="size-4 text-blue-500" />
            Tổng đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrders}</div>
          <p className="text-xs text-muted-foreground mt-1">Đơn đặt hàng</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="size-4 text-amber-500" />
            Tổng tiền đã mua
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {totalSpent.toLocaleString("vi-VN")} đ
          </div>
          <p className="text-xs text-muted-foreground mt-1">Đơn hoàn thành</p>
        </CardContent>
      </Card>
    </div>
  );
}
