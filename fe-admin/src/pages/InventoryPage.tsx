import {
  AlertCircle,
  PackageCheck,
  PackageX,
  Eye,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useInventoryList,
  useInventoryTransactions,
  useAdjustStock,
} from "@/hooks/useInventory";
import InventoryAdjustmentModal from "@/components/inventory/InventoryAdjustmentModal";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import type { InventoryResponse } from "@/api/inventoryApi";
import { useState } from "react";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "OUT" | "IN">(
    "ALL",
  );
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryResponse | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransactions, setShowTransactions] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 500);
  const { data: inventories, isLoading } = useInventoryList({
    keyword: debouncedSearch,
    page,
    size: 20,
  });

  const { data: transactions } = useInventoryTransactions(showTransactions, 0);
  const { mutate: adjustStock, isPending: isAdjusting } = useAdjustStock();

  const handleAdjustStock = (data: any) => {
    if (!selectedInventory) return;
    adjustStock(
      {
        variantId: selectedInventory.variantId,
        request: data,
      },
      {
        onSuccess: () => {
          toast.success("Điều chỉnh tồn kho thành công");
          setShowAdjustModal(false);
          setSelectedInventory(null);
        },
        onError: (error: any) => {
          toast.error(error?.message ?? "Điều chỉnh thất bại");
        },
      },
    );
  };

  const openAdjustModal = (inventory: InventoryResponse) => {
    setSelectedInventory(inventory);
    setShowAdjustModal(true);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return {
        label: "Hết hàng",
        color: "bg-red-50 text-red-700 border-red-200",
      };
    if (quantity < 10)
      return {
        label: "Tồn kho thấp",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      };
    return {
      label: "Còn hàng",
      color: "bg-green-50 text-green-700 border-green-200",
    };
  };

  const totalSKUs = inventories?.totalElements ?? 0;
  const lowStockCount =
    inventories?.content.filter(
      (item) => item.stockQuantity > 0 && item.stockQuantity < 10,
    ).length ?? 0;
  const outOfStockCount =
    inventories?.content.filter((item) => item.stockQuantity === 0).length ?? 0;

  const getFilteredItems = () => {
    if (!inventories) return [];
    let items = [...inventories.content];
    if (stockFilter === "LOW") {
      items = items.filter(
        (item) => item.stockQuantity > 0 && item.stockQuantity < 10,
      );
    } else if (stockFilter === "OUT") {
      items = items.filter((item) => item.stockQuantity === 0);
    } else if (stockFilter === "IN") {
      items = items.filter((item) => item.stockQuantity >= 10);
    }
    return items;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      { }
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Quản lý tồn kho</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Theo dõi và điều chỉnh tồn kho sản phẩm
          </p>
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="px-5 py-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Tổng mã hàng hóa
              </span>
              <p className="text-2xl font-bold text-gray-900">{totalSKUs}</p>
            </div>
            <div className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-500">
              <PackageCheck size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-100 bg-yellow-50/10 shadow-sm">
          <CardContent className="px-5 py-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-yellow-800 uppercase tracking-wider">
                Sản phẩm sắp hết (dưới 10)
              </span>
              <p className="text-2xl font-bold text-yellow-600">
                {lowStockCount}
              </p>
            </div>
            <div className="w-9 h-9 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500">
              <AlertCircle size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/10 shadow-sm">
          <CardContent className="px-5 py-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-red-800 uppercase tracking-wider">
                Sản phẩm hết hàng
              </span>
              <p className="text-2xl font-bold text-red-600">
                {outOfStockCount}
              </p>
            </div>
            <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <PackageX size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      { }
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm font-semibold text-gray-800">
              Danh sách tồn kho
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Tìm kiếm mã hàng, tên sản phẩm..."
                className="w-full sm:w-56 h-9 text-xs"
              />

              <Select
                value={stockFilter}
                onValueChange={(val) => {
                  setStockFilter(val as any);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả tồn kho</SelectItem>
                  <SelectItem value="IN">Còn hàng (&gt;= 10)</SelectItem>
                  <SelectItem value="LOW">Tồn kho thấp (&lt; 10)</SelectItem>
                  <SelectItem value="OUT">Hết hàng (0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {[
                  "ID",
                  "Mã hàng",
                  "Tên sản phẩm",
                  "Variant",
                  "Tồn kho",
                  "Giá vốn trung bình",
                  "Trạng thái",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    {search
                      ? `Không tìm thấy "${search}"`
                      : "Chưa có tồn kho nào khớp với bộ lọc"}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item.stockQuantity);
                  return (
                    <tr
                      key={item.inventoryId}
                      className="hover:bg-gray-50 transition group"
                    >
                      <td className="px-5 py-3.5 text-xs text-gray-400 ">
                        #{String(item.inventoryId).padStart(3, "0")}
                      </td>
                      <td className="px-5 py-3.5  text-xs text-gray-600">
                        {item.sku}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {item.variant.color} / {item.variant.size}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-base text-gray-900">
                          {item.stockQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {item.avgCostPrice} đ
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setShowTransactions(
                                showTransactions === item.variantId
                                  ? null
                                  : item.variantId,
                              );
                            }}
                            title="Xem lịch sử"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-green-600 hover:bg-green-50"
                            onClick={() => openAdjustModal(item)}
                            title="Điều chỉnh"
                          >
                            <TrendingUp size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          { }
          {showTransactions && transactions && (
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Lịch sử giao dịch
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.content.length === 0 ? (
                  <p className="text-xs text-gray-500">Chưa có giao dịch</p>
                ) : (
                  transactions.content.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {tx.type === "IMPORT" ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            {tx.type === "IMPORT"
                              ? "Nhập"
                              : tx.type === "EXPORT"
                                ? "Xuất"
                                : "Điều chỉnh"}{" "}
                            {tx.quantity} sản phẩm
                          </span>
                        </div>
                        <span className="text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {tx.beforeQuantity} → {tx.afterQuantity}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          { }
          {inventories && !isLoading && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                Trang {page + 1} của {inventories.totalPages} •{" "}
                {inventories.totalElements} mục
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage(Math.min(inventories.totalPages - 1, page + 1))
                  }
                  disabled={inventories.last}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      { }
      <InventoryAdjustmentModal
        isOpen={showAdjustModal}
        variantId={selectedInventory?.variantId}
        sku={selectedInventory?.sku}
        currentQuantity={selectedInventory?.stockQuantity}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedInventory(null);
        }}
        onSubmit={handleAdjustStock}
        isPending={isAdjusting}
      />
    </div>
  );
}
