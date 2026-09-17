import {
  DollarSign,
  ShoppingCart,
  Users,
  UserCheck,
  TrendingUp,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardsProps {
  orderStats?: {
    totalRevenue?: number;
    totalItemsSold?: number;
    totalOrders?: number;
  };
  customerStats?: {
    total?: number;
    registered?: number;
  };
  userStats?: {
    staffUsers?: number;
    activeUsers?: number;
  };
  orderStatsLoading: boolean;
  customerStatsLoading: boolean;
  userStatsLoading: boolean;
}

export default function KpiCards({
  orderStats,
  customerStats,
  userStats,
  orderStatsLoading,
  customerStatsLoading,
  userStatsLoading,
}: KpiCardsProps) {
  const money = (n: number) => {
    return (n ?? 0).toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {}
      <Card className="hover:shadow-sm transition-all duration-200 group">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Doanh thu
            </p>
            <h3 className="text-2xl font-medium text-foreground group-hover:text-primary transition-colors">
              {orderStatsLoading
                ? "Đang tải..."
                : money(orderStats?.totalRevenue ?? 0)}
            </h3>
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <TrendingUp className="size-3" /> Không gồm phí vận chuyển
            </p>
          </div>
          <div className="p-3.5 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-250">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="hover:shadow-sm transition-all duration-200 group">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Doanh số bán hàng
            </p>
            <h3 className="text-2xl font-medium text-foreground group-hover:text-violet-600 transition-colors">
              {orderStatsLoading
                ? "Đang tải..."
                : `${orderStats?.totalItemsSold ?? 0} sản phẩm`}
            </h3>
            <p className="text-xs text-violet-500 font-semibold">
              Thành công & Đang giao
            </p>
          </div>
          <div className="p-3.5 bg-violet-500/10 text-violet-500 rounded-xl group-hover:bg-violet-500 group-hover:text-white transition-all duration-250">
            <Package className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="hover:shadow-sm transition-all duration-200 group">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tổng số đơn hàng
            </p>
            <h3 className="text-2xl font-medium text-foreground group-hover:text-blue-600 transition-colors">
              {orderStatsLoading
                ? "Đang tải..."
                : `${orderStats?.totalOrders ?? 0} đơn`}
            </h3>
            <p className="text-xs text-blue-500 font-semibold">
              Tất cả phương thức
            </p>
          </div>
          <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-250">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="hover:shadow-sm transition-all duration-200 group">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Khách hàng thành viên
            </p>
            <h3 className="text-2xl font-medium text-foreground group-hover:text-amber-500 transition-colors">
              {customerStatsLoading
                ? "Đang tải..."
                : `${customerStats?.total ?? 0} người`}
            </h3>
            <p className="text-xs text-amber-500 font-semibold">
              {customerStats?.registered ?? 0} tài khoản
            </p>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-250">
            <Users className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="hover:shadow-sm transition-all duration-200 group">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nhân viên hoạt động
            </p>
            <h3 className="text-2xl font-medium text-foreground group-hover:text-emerald-500 transition-colors">
              {userStatsLoading
                ? "Đang tải..."
                : `${userStats?.staffUsers ?? 0} nhân sự`}
            </h3>
            <p className="text-xs text-emerald-500 font-semibold">
              {userStats?.activeUsers ?? 0} đang hoạt động
            </p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-250">
            <UserCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
