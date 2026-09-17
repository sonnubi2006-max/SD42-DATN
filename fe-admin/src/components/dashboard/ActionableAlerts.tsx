import { Link } from "react-router-dom";
import { AlertCircle, ShoppingBag, RotateCcw, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useOrderList } from "@/hooks/useOrder";
import { useReturnList } from "@/hooks/useReturn";

interface Props {
  lowStockCount: number;
}

export default function ActionableAlerts({ lowStockCount }: Props) {
  const { data: pendingOrders } = useOrderList({ status: "PENDING", page: 0, size: 1 });
  const { data: pendingReturns } = useReturnList({ status: "PENDING", page: 0, size: 1 });

  const pendingOrdersCount = pendingOrders?.totalElements || 0;
  const pendingReturnsCount = pendingReturns?.totalElements || 0;

  if (pendingOrdersCount === 0 && pendingReturnsCount === 0 && lowStockCount === 0) {
    return null;
  }

  return (
    <Card className="bg-rose-50/50 border-rose-100 shadow-sm">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-full text-rose-600 shadow-inner">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900">Việc cần xử lý ngay</h4>
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs font-semibold text-rose-700">
              {pendingOrdersCount > 0 && (
                <Link to="/orders?status=PENDING" className="flex items-center gap-1.5 hover:text-rose-900 hover:underline transition-colors">
                  <ShoppingBag className="size-3.5" />
                  {pendingOrdersCount} đơn chờ xác nhận
                </Link>
              )}
              {pendingReturnsCount > 0 && (
                <Link to="/returns?status=PENDING" className="flex items-center gap-1.5 hover:text-rose-900 hover:underline transition-colors">
                  <RotateCcw className="size-3.5" />
                  {pendingReturnsCount} yêu cầu đổi trả mới
                </Link>
              )}
              {lowStockCount > 0 && (
                <Link to="/inventory" className="flex items-center gap-1.5 hover:text-rose-900 hover:underline transition-colors">
                  <Package className="size-3.5" />
                  {lowStockCount} sản phẩm sắp hết hàng
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
