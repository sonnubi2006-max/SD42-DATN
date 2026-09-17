import { Users, ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface CustomerItem {
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
}

interface TopCustomersProps {
  topCustomers: CustomerItem[] | undefined;
  isLoading: boolean;
}

export default function TopCustomers({ topCustomers, isLoading }: TopCustomersProps) {
  const money = (n: number) => {
    return (n ?? 0).toLocaleString("vi-VN") + " đ";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex items-center justify-center size-6 rounded-full bg-amber-100 text-amber-700 font-extrabold text-xs border border-amber-200 shadow-3xs">
          👑
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center justify-center size-6 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center justify-center size-6 rounded-full bg-orange-100 text-orange-700 font-extrabold text-xs border border-orange-200">
          3
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center size-6 rounded-full bg-gray-50 text-gray-500 font-bold text-xs border border-gray-150">
        {rank}
      </span>
    );
  };

  return (
    <Card className="h-full flex flex-col justify-between border border-gray-100 bg-white">
      <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
            <Users className="size-4.5 text-indigo-500" />
            Khách hàng tiềm năng
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            5 khách hàng mua nhiều nhất
          </CardDescription>
        </div>
        <Link
          to="/customers"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
        >
          Khách hàng
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-start pt-0 pb-5">
        {isLoading || !topCustomers ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-4 items-center">
                <div className="size-6 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/65 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-muted/40 rounded w-1/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : topCustomers.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg text-xs text-muted-foreground">
            Chưa có dữ liệu khách hàng
          </div>
        ) : (
          <div className="divide-y divide-border w-full">
            {topCustomers.map((c, index) => (
              <div
                key={c.phone || c.name}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-muted/30 px-2 rounded-xl transition-all duration-200"
              >
                <div className="shrink-0">{getRankBadge(index + 1)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {c.name}
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                    SĐT: {c.phone}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-foreground">
                    {money(c.totalSpent)}
                  </span>
                  <p className="text-xs text-indigo-500 font-bold mt-0.5 flex items-center justify-end gap-0.5">
                    <ShoppingBag className="size-3" />
                    {c.orderCount} đơn
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
