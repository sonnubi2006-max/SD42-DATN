import { AlertTriangle, Edit, Layers, MessageSquare } from "lucide-react";
import {
    TableCell,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ProductStatusBadge from "./ProductStatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Switch } from "../ui/switch";
import { useState } from "react";
import type { ProductResponse } from "@/api/productApi";
import { useNavigate } from "react-router-dom";
import { useChangeProductStatus } from "@/hooks/useProduct";
import { toast } from "sonner";

interface ProductProps {
    index: number;
    product: ProductResponse;
    selectedIds: number[];
    onSelectChange: (ids: number[]) => void;
}

function formatPrice(v: number) {
    return v.toLocaleString("vi-VN") + "đ";
}

function getPriceRange(variants: ProductResponse["variants"]) {
    if (!variants?.length) return null;
    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatPrice(min);
    return `${formatPrice(min)} – ${formatPrice(max)}`;
}

const ProductRow = ({ selectedIds, product, onSelectChange, index }: ProductProps) => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const { mutate: changeStatus } = useChangeProductStatus();

    const thumbnail =
        product.images?.find((img) => img.isThumbnail) ?? product.images?.[0];
    const checked = selectedIds.includes(product.productId);

    let totalStock = 0;
    product.variants.forEach((v) => {
        totalStock += v.stockQuantity;
    });

    const priceLabel = getPriceRange(product.variants);

    const newStatus =
        product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const toggleOne = (id: number) =>
        onSelectChange(
            selectedIds.includes(id)
                ? selectedIds.filter((s) => s !== id)
                : [...selectedIds, id],
        );

    const handleChangeStatus = () => {
        changeStatus(
            { id: product.productId, status: newStatus },
            {
                onSuccess: () =>
                    toast.success("Cập nhật trạng thái thành công"),
                onError: (error: unknown) =>
                    toast.error(
                        (error as { apiMessage?: string } | null)?.apiMessage ?? "Thất bại",
                    ),
            },
        )
    }

    const handleEditProduct = () => {
        navigate(`/products/${product.productId}/edit`)
    }

    return (
        <TableRow key={product.productId} className="group hover:bg-gray-50">
            <TableCell>
                <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOne(product.productId)}
                />
            </TableCell>

            <TableCell>{index + 1}</TableCell>
            <TableCell className="text-sm ">{product.productCode}</TableCell>
            <TableCell>
                <div className="flex items-center gap-3">
                    {thumbnail ? (
                        <img
                            src={thumbnail.imageUrl}
                            alt={product.productName}
                            className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm truncate max-w-45">{product.productName}</p>
                    </div>
                </div>
            </TableCell>

            <TableCell className="text-sm text-gray-600">
                {product.category.categoryName ?? "—"}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
                {product.brand.brandName ?? "—"}
            </TableCell>

            <TableCell className="text-sm text-gray-500">
                {product.variants?.length ?? 0}
            </TableCell>
            <TableCell className="text-sm font-medium text-gray-700">
                {priceLabel ?? "—"}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
                {totalStock}
            </TableCell>
            <TableCell className={(product.damagedQuantity ?? 0) > 0 ? "font-bold text-red-600" : "text-gray-400"}>
                {product.damagedQuantity ?? 0}
            </TableCell>
            <TableCell>
                <ProductStatusBadge status={product.status} />
            </TableCell>

            <TableCell>
                <div className="flex items-center justify-start gap-2">
                    {(product.damagedQuantity ?? 0) > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-amber-600 hover:bg-amber-50"
                            onClick={() => navigate(`/products/variants?productId=${product.productId}`)}
                            title="Xem biến thể và hóa đơn có hàng hỏng"
                        >
                            <AlertTriangle size={14} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                        onClick={() => navigate(`/reviews?keyword=${encodeURIComponent(product.productCode)}`)}
                        title="Xem đánh giá sản phẩm"
                    >
                        <MessageSquare size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => navigate(`/products/${product.productId}`)}
                        title="Xem các biến thể"
                    >
                        <Layers size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={handleEditProduct}
                        title="Chỉnh sửa"
                    >
                        <Edit size={14} />
                    </Button>

                    <AlertDialog open={open} onOpenChange={setOpen}>
                        <AlertDialogTrigger>
                            <Switch checked={product.status === "ACTIVE"} />
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-lg">Xác nhận</AlertDialogTitle>

                                <AlertDialogDescription>
                                    {`Bạn có chắc muốn thay đổi trạng thái '${product.productName}' thành ${product.status !== "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"
                                        }`}
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel size={"lg"}>Huỷ</AlertDialogCancel>

                                <AlertDialogAction
                                    size={"lg"}
                                    onClick={handleChangeStatus}
                                >
                                    Xác nhận
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </TableCell>
        </TableRow>
    );
}

export default ProductRow
