import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface TrendItem {
  size?: string;
  color?: string;
  count: number;
}

interface FashionTrendsProps {
  bestSellingSizes: TrendItem[] | undefined;
  bestSellingColors: TrendItem[] | undefined;
  isLoading: boolean;
}

export default function FashionTrends({
  bestSellingSizes,
  bestSellingColors,
  isLoading,
}: FashionTrendsProps) {
  if (isLoading || !bestSellingSizes || !bestSellingColors) {
    return (
      <Card className="h-[250px] animate-pulse flex flex-col justify-between p-6">
        <div className="h-4 w-1/3 bg-muted rounded" />
        <div className="grid grid-cols-2 gap-4 flex-1 mt-4">
          <div className="space-y-2 bg-muted/40 rounded-xl p-3" />
          <div className="space-y-2 bg-muted/40 rounded-xl p-3" />
        </div>
      </Card>
    );
  }

  const maxSizeCount = Math.max(...bestSellingSizes.map((s) => s.count), 1);
  const maxColorCount = Math.max(...bestSellingColors.map((c) => c.count), 1);

  const colorMap: { [key: string]: string } = {
    "Đen": "bg-slate-950 ring-1 ring-slate-800",
    "Trắng": "bg-white ring-1 ring-gray-300",
    "Be/Kem": "bg-[#e5d4be] ring-1 ring-[#d2bca2]",
    "Navy": "bg-blue-900 ring-1 ring-blue-850",
    "Xám": "bg-gray-450 ring-1 ring-gray-400",
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-foreground">Xu hướng mua sắm quần áo</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Thống kê kích cỡ và màu sắc bán ra nhiều nhất</CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 pt-0">
        {}
        <div className="space-y-3.5 border-r border-border pr-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tỷ lệ kích cỡ</h4>
          {bestSellingSizes.map((s) => {
            const percent = (s.count / maxSizeCount) * 100;
            return (
              <div key={s.size} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-foreground">{s.size}</span>
                  <span className="text-muted-foreground font-medium">{s.count} lượt bán</span>
                </div>
                <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {}
        <div className="space-y-3.5">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tỷ lệ Màu sắc (Color)</h4>
          {bestSellingColors.map((c) => {
            const percent = (c.count / maxColorCount) * 100;
            const swatchClass = colorMap[c.color || ""] || "bg-gray-200";
            return (
              <div key={c.color} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    <span className={`size-3 rounded-full shrink-0 ${swatchClass}`} />
                    {c.color}
                  </span>
                  <span className="text-muted-foreground font-medium">{c.count} lượt bán</span>
                </div>
                <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
