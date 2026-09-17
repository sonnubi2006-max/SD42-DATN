import { useState, useMemo } from "react";
import { useMe } from "@/hooks/useAuth";
import { BarChart3 } from "lucide-react";
import {
  useOrderStatistics,
  useTopRatedProductStatistics,
} from "@/hooks/useOrder";
import { useProductVariantList } from "@/hooks/useProductVariant";

import PeriodKpiCard from "@/components/dashboard/PeriodKpiCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RevenueCompareDialog from "@/components/dashboard/RevenueCompareDialog";
import OrderStatusChart from "@/components/dashboard/OrderStatusChart";
import BestSellers from "@/components/dashboard/BestSellers";
import SlowSellers from "@/components/dashboard/SlowSellers";
import LowStockProducts from "@/components/dashboard/LowStockProducts";
import TopCustomers from "@/components/dashboard/TopCustomers";
import TopCoupons from "@/components/dashboard/TopCoupons";
import TopPromotions from "@/components/dashboard/TopPromotions";
import TopStaffSales from "@/components/dashboard/TopStaffSales";
import TopRatedProducts from "@/components/dashboard/TopRatedProducts";
import QuickActions from "@/components/dashboard/QuickActions";
import { getRangeParams } from "@/components/dashboard/dashboardUtils";
import StaffDashboard from "@/components/dashboard/StaffDashboard";

export default function HomePage() {
  const { data: user } = useMe();
  const isStaff = user?.role === "STAFF";

  const todayParams = useMemo(() => getRangeParams("TODAY"), []);
  const weekParams = useMemo(() => getRangeParams("WEEK"), []);
  const monthParams = useMemo(() => getRangeParams("MONTH"), []);
  const yearParams = useMemo(() => getRangeParams("YEAR"), []);

  const { data: todayStats, isLoading: todayLoading } =
    useOrderStatistics(todayParams);
  const { data: weekStats, isLoading: weekLoading } =
    useOrderStatistics(weekParams);
  const { data: monthStats, isLoading: monthLoading } =
    useOrderStatistics(monthParams);
  const { data: yearStats, isLoading: yearLoading } =
    useOrderStatistics(yearParams);

  const [isOpenCompare, setIsOpenCompare] = useState(false);

  const [dashboardParams, setDashboardParams] = useState(() =>
    getRangeParams("MONTH"),
  );
  const { data: orderStats, isLoading: orderStatsLoading } =
    useOrderStatistics(dashboardParams);
  const { data: topRatedProducts, isLoading: topRatedProductsLoading } =
    useTopRatedProductStatistics(dashboardParams);

  const { data: variantsData, isLoading: variantsLoading } =
    useProductVariantList({ page: 0, size: 200 });
  const lowStockItems = useMemo(() => {
    if (!variantsData?.content) return [];
    return variantsData.content
      .filter((item) => item.stockQuantity >= 0 && item.stockQuantity < 10)
      .map((item) => ({
        inventoryId: item.variantId,
        productId: item.productId,
        productName: item.productName || "Sản phẩm",
        sku: item.variantCode,
        stockQuantity: item.stockQuantity,
        variant: { color: item.color, size: item.size },
      }))
      .slice(0, 5);
  }, [variantsData]);

  if (isStaff) {
    return (
      <StaffDashboard
        staffId={user.userId}
        staffName={user.fullName || user.username || "bạn"}
      />
    );
  }

  return (
    <div className="space-y-6 py-6 px-12">
      <div className="flex items-center gap-2 border-b pb-3">
        <BarChart3 className="size-5.5 text-gray-800" />
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">
          Thống kê hoạt động
        </h1>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <PeriodKpiCard
          title="Hôm nay"
          stats={todayStats}
          isLoading={todayLoading}
          iconColorClass="text-blue-600 bg-blue-50"
          borderColorClass="bg-blue-500"
        />
        <PeriodKpiCard
          title="Tuần này"
          stats={weekStats}
          isLoading={weekLoading}
          iconColorClass="text-purple-600 bg-purple-50"
          borderColorClass="bg-purple-500"
        />
        <PeriodKpiCard
          title="Tháng này"
          stats={monthStats}
          isLoading={monthLoading}
          iconColorClass="text-emerald-600 bg-emerald-50"
          borderColorClass="bg-emerald-500"
        />
        <PeriodKpiCard
          title="Năm nay"
          stats={yearStats}
          isLoading={yearLoading}
          iconColorClass="text-amber-500 bg-amber-50"
          borderColorClass="bg-amber-500"
        />
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart
            onOpenCompare={() => setIsOpenCompare(true)}
            onRangeChange={setDashboardParams}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <OrderStatusChart orderStats={orderStats} />
        </div>
      </div>



      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(orderStatsLoading || (orderStats?.topProducts?.length ?? 0) > 0) && (
          <BestSellers
            topProducts={orderStats?.topProducts}
            isLoading={orderStatsLoading}
          />
        )}
        {(orderStatsLoading || (orderStats?.slowProducts?.length ?? 0) > 0) && (
          <SlowSellers
            slowProducts={orderStats?.slowProducts}
            isLoading={orderStatsLoading}
          />
        )}
        {(variantsLoading || lowStockItems.length > 0) && (
          <LowStockProducts items={lowStockItems} isLoading={variantsLoading} />
        )}
        {(orderStatsLoading || (orderStats?.topCustomers?.length ?? 0) > 0) && (
          <TopCustomers
            topCustomers={orderStats?.topCustomers}
            isLoading={orderStatsLoading}
          />
        )}
        {(orderStatsLoading || (orderStats?.topStaff?.length ?? 0) > 0) && (
          <TopStaffSales
            items={orderStats?.topStaff}
            isLoading={orderStatsLoading}
          />
        )}
        {(topRatedProductsLoading || (topRatedProducts?.length ?? 0) > 0) && (
          <TopRatedProducts
            items={topRatedProducts}
            isLoading={topRatedProductsLoading}
          />
        )}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(orderStatsLoading || (orderStats?.topCoupons?.length ?? 0) > 0) && (
          <TopCoupons
            topCoupons={orderStats?.topCoupons}
            isLoading={orderStatsLoading}
          />
        )}
        {(orderStatsLoading ||
          (orderStats?.topPromotions?.length ?? 0) > 0) && (
          <TopPromotions
            topPromotions={orderStats?.topPromotions}
            isLoading={orderStatsLoading}
          />
        )}
      </div>

      {}
      <QuickActions />

      {/* Dialog */}
      <RevenueCompareDialog
        open={isOpenCompare}
        onOpenChange={setIsOpenCompare}
      />
    </div>
  );
}
