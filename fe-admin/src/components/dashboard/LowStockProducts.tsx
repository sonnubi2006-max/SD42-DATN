import { AlertTriangle, Boxes, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface LowStockItem {
  inventoryId: number;
  productId?: number;
  productName: string;
  sku: string;
  stockQuantity: number;
  variant: {
    color: string;
    size: string;
  };
}

interface LowStockProductsProps {
  items: LowStockItem[] | undefined;
  isLoading: boolean;
}

export default function LowStockProducts({
  items,
  isLoading,
}: LowStockProductsProps) {
  return (
    <Card className="h-full flex flex-col justify-between border border-gray-100 bg-white">
      <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
            <AlertTriangle className="size-4.5 text-amber-500" />
            Sản phẩm sắp hết hàng
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Các sản phẩm có số lượng tồn kho dưới 10
          </CardDescription>
        </div>
        <Link
          to="/products"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
        >
          Tồn kho
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-start pt-0 pb-5">
        {isLoading || !items ? (
          <div className="space-y-3 py-1">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex gap-4 items-center p-3.5 border border-gray-50 rounded-xl bg-gray-50/30 animate-pulse"
              >
                <div className="size-6 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/65 rounded w-2/3" />
                  <div className="h-3 bg-muted/40 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Boxes className="size-8 text-gray-300" />
            Kho hàng đầy đủ, không có sản phẩm sắp hết hàng
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {items.map((item) => (
              <div
                key={item.inventoryId}
                className="flex items-center gap-3.5 p-3.5 border border-gray-100 hover:border-gray-200 hover:shadow-xs rounded-xl bg-white transition-all duration-200 group"
              >
                <div className="shrink-0">
                  <AlertTriangle
                    className={`size-4.5 ${item.stockQuantity === 0 ? "text-red-500 animate-pulse" : "text-amber-500"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {item.productId ? (
                    <Link
                      to={`/products/${item.productId}`}
                      className="block truncate text-sm font-semibold text-gray-900 transition-colors hover:text-primary hover:underline"
                      title={`Mở sản phẩm ${item.productName}`}
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <h4 className="truncate text-sm font-semibold text-gray-900">
                      {item.productName}
                    </h4>
                  )}
                  <p className="text-[11px] text-muted-foreground font-semibold flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="truncate max-w-[120px]">
                      Mã: {item.sku}
                    </span>
                    <span>·</span>
                    <span className="text-gray-500 truncate max-w-[120px]">
                      Phân loại: {item.variant.color} / {item.variant.size}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-medium ${item.stockQuantity === 0 ? "text-red-600" : "text-amber-600"}`}
                  >
                    Còn {item.stockQuantity}
                  </span>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                    Tồn kho
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
