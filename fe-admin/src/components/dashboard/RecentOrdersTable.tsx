import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RecentOrdersTableProps {
  orderListData: any;
  orderListLoading: boolean;
}

export default function RecentOrdersTable({
  orderListData,
  orderListLoading,
}: RecentOrdersTableProps) {
  const money = (n: number) => {
    return (n ?? 0).toLocaleString("vi-VN") + "đ";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Hoàn thành</Badge>;
      case "PENDING":
        return <Badge variant="outline">Chờ xử lý</Badge>;
      case "WAITING_STOCK":
        return <Badge variant="outline">Chờ bổ sung hàng</Badge>;
      case "CONFIRMED":
        return <Badge variant="secondary">Đã xác nhận</Badge>;
      case "SHIPPING":
        return <Badge variant="default">Đang giao</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Đã huỷ</Badge>;
      default:
        return <Badge variant="ghost">{status}</Badge>;
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">Hoá đơn giao dịch gần đây</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">5 hoá đơn mới nhất vừa được khởi tạo trên hệ thống</CardDescription>
        </div>
        <Link
          to="/orders"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-muted px-4 py-2 rounded-xl transition-all"
        >
          Quản lý hoá đơn
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="pt-0">
        {orderListLoading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 bg-muted/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !orderListData?.content?.length ? (
          <div className="text-center py-10 border border-dashed rounded-lg text-xs text-muted-foreground">
            Không tìm thấy hoá đơn nào gần đây
          </div>
        ) : (
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-sm">Mã hoá đơn</TableHead>
                <TableHead className="font-semibold text-sm">Khách hàng</TableHead>
                <TableHead className="font-semibold text-sm">Ngày tạo</TableHead>
                <TableHead className="font-semibold text-sm">Tổng tiền</TableHead>
                <TableHead className="font-semibold text-sm">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold text-sm">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderListData.content.map((order: any) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-bold text-primary text-sm">{order.orderCode}</TableCell>
                  <TableCell className="font-medium text-foreground text-sm">{order.customerName || "Khách lẻ"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs md:text-sm">{new Date(order.createdAt).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-foreground font-semibold text-sm">{money(order.totalAmount)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/orders/${order.orderId}`}
                      className="text-xs md:text-sm font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Chi tiết
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
