import { useState } from "react";
import { Plus, Eye, CheckCircle2, Clock, XCircle } from "lucide-react";
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
  useGoodsReceiptList,
  useGoodsReceiptDetail,
  useCreateGoodsReceipt,
  useApproveGoodsReceipt,
  useDeleteGoodsReceipt,
} from "@/hooks/useInventory";
import { useSupplierList } from "@/hooks/useSupplier";
import GoodsReceiptModal from "@/components/inventory/GoodsReceiptModal";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";
import type { GoodsReceiptRequest, ReceiptStatus } from "@/api/inventoryApi";

export default function GoodsReceiptPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | "">("");
  const [showModal, setShowModal] = useState(false);
  const [detailReceiptId, setDetailReceiptId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const { data: receipts, isLoading } = useGoodsReceiptList({
    receiptCode: search,
    page,
    size: 10,
  });

  const { data: detailReceipt } = useGoodsReceiptDetail(detailReceiptId);
  const { data: suppliers } = useSupplierList({ page: 0, size: 100 });

  const { mutate: createReceipt, isPending: isCreating } =
    useCreateGoodsReceipt();
  const { mutate: approveReceipt, isPending: isApproving } =
    useApproveGoodsReceipt();
  const { mutate: deleteReceipt, isPending: isDeleting } =
    useDeleteGoodsReceipt();

  const handleCreateReceipt = (data: GoodsReceiptRequest) => {
    const request = {
      ...data,
      items: data.items.map((req) => {
        return {
          variantId: req.variantId,
          quantity: req.quantity,
          importPrice: req.importPrice,
        };
      }),
    };
    createReceipt(request, {
      onSuccess: () => {
        toast.success("Tạo phiếu nhập hàng thành công");
        setShowModal(false);
      },
      onError: (error) => {
        const apiError = (error as { apiMessage?: string } | null) ?? null;
        toast.error(apiError?.apiMessage ?? "Tạo thất bại");
      },
    });
  };

  const handleApproveReceipt = () => {
    if (!approvingId) return;
    approveReceipt(approvingId, {
      onSuccess: () => {
        toast.success("Duyệt phiếu nhập hàng thành công");
        setApprovingId(null);
      },
      onError: (error) => {
        const apiError = (error as { apiMessage?: string } | null) ?? null;
        toast.error(apiError?.apiMessage ?? "Duyệt thất bại");
      },
    });
  };

  const handleDeleteReceipt = () => {
    if (!deletingId) return;
    deleteReceipt(deletingId, {
      onSuccess: () => {
        toast.success("Xoá phiếu nhập hàng thành công");
        setDeletingId(null);
      },
      onError: (error) => {
        const apiError = (error as { apiMessage?: string } | null) ?? null;
        toast.error(apiError?.apiMessage ?? "Xoá thất bại");
      },
    });
  };

  const getStatusIcon = (status: ReceiptStatus) => {
    console.log(status);
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "DRAFT":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusLabel = (status: ReceiptStatus) => {
    const statusMap: Record<ReceiptStatus, string> = {
      DRAFT: "Chờ duyệt",
      COMPLETED: "Đã duyệt",
      CANCELLED: "Đã hủy",
    };
    return statusMap[status];
  };

  const getStatusColor = (status: ReceiptStatus) => {
    const colorMap: Record<ReceiptStatus, string> = {
      DRAFT: "bg-yellow-50 text-yellow-700",
      COMPLETED: "bg-green-50 text-green-700",
      CANCELLED: "bg-red-50 text-red-700",
    };
    return colorMap[status];
  };

  const supplierOptions =
    suppliers?.content.map((s) => ({
      id: s.supplierId,
      name: s.supplierName,
    })) ?? [];

  console.log(receipts?.content);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            Quản lý phiếu nhập hàng
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tạo và theo dõi phiếu nhập hàng từ nhà cung cấp
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus size={18} /> Tạo phiếu nhập
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Danh sách phiếu nhập hàng
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Tìm kiếm mã phiếu..."
                className="w-48 h-9"
              />

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as ReceiptStatus | "");
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                  <SelectItem value="COMPLETED">Đã duyệt</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
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
                  "Mã phiếu",
                  "Nhà cung cấp",
                  "Tạo bởi",
                  "Ngày tạo",
                  "Tổng tiền",
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
                    colSpan={7}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : receipts?.content.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    {search
                      ? `Không tìm thấy "${search}"`
                      : "Chưa có phiếu nhập nào"}
                  </td>
                </tr>
              ) : (
                receipts?.content.map((receipt) => (
                  <tr
                    key={receipt.receiptId}
                    className="hover:bg-gray-50 transition group"
                  >
                    <td className="px-5 py-3.5  text-xs text-gray-600">
                      {receipt.receiptCode}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {receipt.supplier.supplierName}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {receipt.author.fullName}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {new Date(receipt.receiptDate).toLocaleDateString(
                        "vi-VN",
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {receipt.totalAmount.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                          receipt.status,
                        )}`}
                      >
                        {getStatusIcon(receipt.status)}
                        {getStatusLabel(receipt.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => setDetailReceiptId(receipt.receiptId)}
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </Button>
                        {receipt.status === "DRAFT" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-green-600 hover:bg-green-50"
                              onClick={() => setApprovingId(receipt.receiptId)}
                              title="Duyệt"
                            >
                              <CheckCircle2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => setDeletingId(receipt.receiptId)}
                              title="Hủy"
                            >
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          { }
          {detailReceiptId && detailReceipt && (
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Chi tiết phiếu nhập
                </h3>
                <button
                  onClick={() => setDetailReceiptId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">
                        Sản phẩm
                      </th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">
                        Variant
                      </th>
                      <th className="px-3 py-2 text-right text-gray-600 font-medium">
                        Số lượng
                      </th>
                      <th className="px-3 py-2 text-right text-gray-600 font-medium">
                        Giá nhập
                      </th>
                      <th className="px-3 py-2 text-right text-gray-600 font-medium">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detailReceipt.details.map((detail) => (
                      <tr key={detail.detailId}>
                        <td className="px-3 py-2 text-gray-900">
                          {detail.productName}
                        </td>
                        <td className="px-3 py-2 text-left text-gray-600">
                          {detail.productId}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {detail.quantity}
                        </td>

                        <td className="px-3 py-2 text-right text-gray-600">
                          {detail.importPrice.toLocaleString("vi-VN")}₫
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          {detail.subtotal.toLocaleString("vi-VN")}₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detailReceipt.note && (
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Ghi chú:</span>{" "}
                      {detailReceipt.note}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          { }
          {receipts && !isLoading && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                Trang {page + 1} của {receipts.totalPages} •{" "}
                {receipts.totalElements} mục
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
                    setPage(Math.min(receipts.totalPages - 1, page + 1))
                  }
                  disabled={receipts.last}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      { }
      <GoodsReceiptModal
        isOpen={showModal}
        suppliers={supplierOptions}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateReceipt}
        isPending={isCreating}
      />

      { }
      {approvingId && (
        <ConfirmModal
          typeConfirm="UPDATE"
          message={`Bạn có chắc muốn duyệt phiếu nhập hàng này? Sau khi duyệt, tồn kho sẽ được cập nhật.`}
          onConfirm={handleApproveReceipt}
          onCancel={() => setApprovingId(null)}
          isPending={isApproving}
        />
      )}

      { }
      {deletingId && (
        <ConfirmModal
          typeConfirm="DELETE"
          message={`Bạn có chắc muốn hủy phiếu nhập hàng này?`}
          onConfirm={handleDeleteReceipt}
          onCancel={() => setDeletingId(null)}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}
