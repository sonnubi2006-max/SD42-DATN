import { Link } from "react-router-dom";
import { Store, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-border pt-6">
      <Card className="hover:bg-muted/40 transition-colors duration-200">
        <Link
          to="/pos"
          className="flex items-center gap-3 p-4"
        >
          <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
            <Store className="size-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-indigo-900 dark:text-indigo-455">Mở bán hàng tại quầy</h4>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Tạo hoá đơn giao dịch nhanh</p>
          </div>
        </Link>
      </Card>

      <Card className="hover:bg-muted/40 transition-colors duration-200">
        <Link
          to="/products/create"
          className="flex items-center gap-3 p-4"
        >
          <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
            <Plus className="size-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-455">Thêm sản phẩm mới</h4>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Thêm sản phẩm mới vào kho</p>
          </div>
        </Link>
      </Card>

      <Card className="hover:bg-muted/40 transition-colors duration-200">
        <Link
          to="/coupons/create"
          className="flex items-center gap-3 p-4"
        >
          <div className="p-2.5 bg-amber-500 text-white rounded-xl">
            <Plus className="size-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-900 dark:text-amber-455">Tạo mã giảm giá</h4>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Tạo mã ưu đãi cho khách hàng</p>
          </div>
        </Link>
      </Card>
    </div>
  );
}
