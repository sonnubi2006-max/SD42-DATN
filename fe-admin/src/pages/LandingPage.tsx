import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  PackagePlus,
  RotateCcw,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { useMe } from "@/hooks/useAuth";
import { useOrderStatistics } from "@/hooks/useOrder";
import { useReturnList } from "@/hooks/useReturn";
import { useProductVariantList } from "@/hooks/useProductVariant";
import { getRangeParams } from "@/components/dashboard/dashboardUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecentOrders from "@/components/dashboard/RecentOrders";
import RecentReturns from "@/components/dashboard/RecentReturns";

export default function LandingPage() {
  const { data: user } = useMe();
  const todayParams = useMemo(() => getRangeParams("TODAY"), []);
  const { data: stats, isLoading: statsLoading } =
    useOrderStatistics(todayParams);
  const { data: pendingReturns, isLoading: returnsLoading } = useReturnList({
    status: "PENDING",
    page: 0,
    size: 1,
  });
  const { data: variants, isLoading: variantsLoading } = useProductVariantList({
    page: 0,
    size: 200,
  });
  const lowStockCount =
    variants?.content.filter((item) => item.stockQuantity < 10).length ?? 0;

  const overview = [
    {
      label: "Đơn chờ xử lý",
      value: stats?.pendingCount ?? 0,
      icon: ClipboardList,
      color: "bg-amber-50 text-amber-700",
      loading: statsLoading,
      to: "/orders?status=PENDING",
    },
    {
      label: "Đơn đang giao",
      value: stats?.shippingCount ?? 0,
      icon: Truck,
      color: "bg-blue-50 text-blue-700",
      loading: statsLoading,
      to: "/orders?status=SHIPPING",
    },
    {
      label: "Yêu cầu đổi trả",
      value: pendingReturns?.totalElements ?? 0,
      icon: RotateCcw,
      color: "bg-violet-50 text-violet-700",
      loading: returnsLoading,
      to: "/returns?status=PENDING",
    },
    {
      label: "Sắp hết hàng",
      value: lowStockCount,
      icon: Boxes,
      color: "bg-rose-50 text-rose-700",
      loading: variantsLoading,
      to: "/products/variants",
    },
  ];

  const quickActions = [
    {
      label: "Bán hàng tại quầy",
      description: "Tạo hóa đơn và thanh toán",
      to: "/pos",
      icon: Store,
    },
    {
      label: "Quản lý hóa đơn",
      description: "Theo dõi và xử lý đơn hàng",
      to: "/orders",
      icon: ShoppingCart,
    },
    {
      label: "Xử lý đổi trả",
      description: "Duyệt yêu cầu đổi sản phẩm",
      to: "/returns",
      icon: RotateCcw,
    },
    {
      label: "Thêm sản phẩm",
      description: "Tạo sản phẩm và biến thể mới",
      to: "/products/create",
      icon: PackagePlus,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 py-4">
      <section className="overflow-hidden rounded-3xl bg-slate-950 px-7 py-8 text-white shadow-lg sm:px-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
              Trung tâm vận hành Stravo
            </p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
              Xin chào, {user?.fullName || user?.username || "bạn"}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Theo dõi công việc cần ưu tiên hôm nay và truy cập nhanh các
              nghiệp vụ bán hàng.
            </p>
          </div>
          <Button
            asChild
            className="h-11 bg-white text-slate-950 hover:bg-slate-100"
          >
            <Link to="/statistics">
              Xem thống kê chi tiết <BarChart3 className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium text-slate-900">
              Cần xử lý hôm nay
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Dữ liệu vận hành đang cần chú ý.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overview.map(({ label, value, icon: Icon, color, loading, to }) => (
            <Link key={label} to={to}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-2xl p-3 ${color}`}>
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-3xl font-medium text-slate-900">
                      {loading ? "—" : value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-medium text-slate-900 mb-4">Truy cập nhanh</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ label, description, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="group rounded-2xl border bg-white p-5 transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700">
                  <Icon className="size-5" />
                </div>
                <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
              <h3 className="mt-5 text-base font-medium text-slate-900">
                {label}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="h-full">
          <RecentOrders />
        </section>
        
        <section className="h-full">
          <RecentReturns />
        </section>
      </div>
    </div>
  );
}
