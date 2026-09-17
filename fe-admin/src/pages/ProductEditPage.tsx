import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useProductById, useUpdateProduct } from "@/hooks/useProduct";
import ProductForm from "@/components/product/ProductForm";
import type { ProductFormData } from "@/components/product/ProductForm";

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    isError,
  } = useProductById(productId || null);
  const { mutate: update, isPending } = useUpdateProduct();

  const handleSubmit = (form: ProductFormData) => {
    update(
      {
        id: productId,
        data: {
          productName: form.productName,
          description: form.description,
          categoryId: form.categoryId,
          brandId: form.brandId,
          status: form.status,
          imagesDelete: form.imagesDelete,
        },
        files: form.files,
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật sản phẩm thành công");
          navigate("/products");
        },
        onError: (error: any) => {
          toast.error(error?.apiMessage ?? "Cập nhật thất bại");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Đang tải sản phẩm...
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-sm text-gray-400">
        <p>Không tìm thấy sản phẩm.</p>
        <button
          onClick={() => navigate("/products")}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ProductForm
        initial={product}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </div>
  );
}
