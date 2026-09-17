import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateProduct } from "@/hooks/useProduct";
import { useBulkAddProductVariants } from "@/hooks/useProductVariant";
import ProductForm from "@/components/product/ProductForm";
import type { ProductFormData } from "@/components/product/ProductForm";
import type { ProductResponse } from "@/api/productApi";

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const createVariants = useBulkAddProductVariants();

  const [createdProduct, setCreatedProduct] = useState<ProductResponse | null>(
    null,
  );

  const handleSubmit = async (form: ProductFormData) => {
    if (!form.files.length) {
      toast.error("Vui lòng thêm ít nhất 1 ảnh sản phẩm");
      return;
    }
    try {
      const product = await createProduct.mutateAsync({
        productName: form.productName,
        description: form.description,
        categoryId: form.categoryId,
        brandId: form.brandId,
        status: "ACTIVE",
        files: form.files,
      });
      setCreatedProduct(product);

      if (form.variants.length > 0) {
        try {
          await createVariants.mutateAsync({
            productId: product.productId,
            items: form.variants.map((variant) => ({
              data: {
                size: variant.size.trim(),
                color: variant.color.trim(),
                price: variant.price,
                stockQuantity: variant.stockQuantity ?? 0,
                status: variant.status ?? "INACTIVE",
              },
              file: variant.file as File,
            })),
          });
        } catch (error) {
          toast.error(
            (error as { apiMessage?: string } | null)?.apiMessage ??
              "Sản phẩm đã được tạo nhưng lưu biến thể thất bại.",
          );
          navigate(`/products/${product.productId}/edit`);
          return;
        }
      }

      toast.success(
        form.variants.length > 0
          ? `Đã tạo sản phẩm và ${form.variants.length} biến thể.`
          : "Tạo sản phẩm thành công.",
      );
      navigate("/products");
    } catch (error) {
      toast.error(
        (error as { apiMessage?: string } | null)?.apiMessage ??
          "Tạo sản phẩm thất bại",
      );
    }
  };

  return (
    <div className="p-6">
      <ProductForm
        onSubmit={handleSubmit}
        isPending={createProduct.isPending || createVariants.isPending}
        createdProduct={createdProduct ?? undefined}
        onFinish={() => navigate("/products")}
      />
    </div>
  );
}
