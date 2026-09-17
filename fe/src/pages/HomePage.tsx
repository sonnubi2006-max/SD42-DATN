import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Leaf,
  Mail,
  Sparkles,
  Gift,
  ShoppingBag,
  TrendingUp,
  Copy,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductGrid from "@/components/product/ProductGrid";
import {
  useBanners,
  useCategories,
  useProducts,
  useTopRatedProducts,
  useBestSellers,
  useBrands,
  useActivePromotions,
} from "@/hooks/useCatalog";
import { resolveImageUrl } from "@/utils/format";
import { formatDate } from "@/utils/dateUtils";

export default function HomePage() {
  const { data: banners } = useBanners();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: promotions } = useActivePromotions();
  const { data: topRated, isLoading: loadingTop } = useTopRatedProducts(8);
  const { data: bestSellers, isLoading: loadingBest } = useBestSellers(8);
  const { data: newest, isLoading: loadingNew } = useProducts({
    size: 8,
    sort: "createdAt,desc",
  });

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã lưu mã giảm giá: ${code}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      toast.success("Cảm ơn bạn đã đăng ký nhận bản tin khuyến mãi!");
    }
  };

  const bannerList = banners?.content ?? [];
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (bannerList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerList.length]);

  return (
    <div className="space-y-16 pb-16">
      <section className="relative overflow-hidden px-4 pt-6 max-w-7xl mx-auto">
        <div className="relative">
          {bannerList.length > 0 ? (
            <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white h-[440px] sm:h-[520px] md:h-[580px] w-full shadow-2xl shadow-slate-200/50">
              {bannerList.map((b, idx) => {
                const isActive = idx === currentBannerIndex;
                return (
                  <div
                    key={b.bannerId}
                    className={`absolute inset-0 transition-all duration-1000 flex flex-col justify-end ${
                      isActive
                        ? "opacity-100 z-10 scale-100"
                        : "opacity-0 z-0 pointer-events-none scale-98"
                    }`}
                  >
                    {/* Background Image */}
                    <img
                      src={resolveImageUrl(b.imageUrl)}
                      alt={b.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-102"
                    />
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/45 to-transparent md:from-black/75 md:via-black/35 md:to-transparent" />

                    {/* Floating Glassmorphism Panel */}
                    <div
                      className={cn(
                        "absolute bottom-10 left-6 md:bottom-16 md:left-16 max-w-sm md:max-w-xl z-25 text-white p-6 md:p-8 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 shadow-lg space-y-4 transition-all duration-700 delay-300",
                        isActive
                          ? "translate-y-0 opacity-100"
                          : "translate-y-4 opacity-0",
                      )}
                    >
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/30 bg-indigo-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        <Sparkles className="size-3.5" />
                        <span>Xu hướng 2026</span>
                      </div>

                      <h2 className="text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight text-white drop-shadow-sm line-clamp-3">
                        {b.title}
                      </h2>

                      <div className="pt-2">
                        <Button
                          asChild
                          size="lg"
                          className="bg-white hover:bg-slate-100 text-indigo-950 font-bold px-6 py-2.5 rounded-xl border-0 shadow-lg cursor-pointer"
                        >
                          <Link to={b.redirectUrl || "/products"}>
                            Khám phá ngay{" "}
                            <ArrowRight className="ml-1.5 size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Prev / Next controls */}
              {bannerList.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentBannerIndex(
                        (prev) =>
                          (prev - 1 + bannerList.length) % bannerList.length,
                      );
                    }}
                    className="absolute left-4 top-1/2 z-30 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/20 hover:bg-black/55 text-white backdrop-blur-xs transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 border border-white/10 cursor-pointer"
                    title="Ảnh quảng cáo trước"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentBannerIndex(
                        (prev) => (prev + 1) % bannerList.length,
                      );
                    }}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/20 hover:bg-black/55 text-white backdrop-blur-xs transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 border border-white/10 cursor-pointer"
                    title="Ảnh quảng cáo sau"
                  >
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}

              {/* Active dots/pills */}
              {bannerList.length > 1 && (
                <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
                  {bannerList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentBannerIndex
                          ? "w-6 bg-white"
                          : "w-2 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Fallback Default Banner */
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 h-[440px] sm:h-[520px] md:h-[580px] w-full flex items-center justify-center shadow-2xl p-6 text-center text-white">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
              <div className="max-w-xl space-y-6 relative z-10">
                <div className="mx-auto size-14 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                  <Sparkles className="size-7 text-indigo-300 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-5xl font-medium tracking-tight leading-tight bg-linear-to-r from-indigo-200 via-white to-pink-200 bg-clip-text text-transparent">
                    Phong Cách Tối Giản Nâng Tầm Bản Thân
                  </h1>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Khám phá bộ sưu tập unisex bền vững từ Stravo, mang đến sự
                    tinh tế, thanh lịch và thoải mái tối đa cho ngày thường của
                    bạn.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white hover:bg-slate-100 text-indigo-950 font-bold rounded-xl border-0 shadow-lg cursor-pointer"
                  >
                    <Link to="/products">
                      Mua sắm ngay <ArrowRight className="ml-1.5 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Truck,
              title: "Freeship Đơn Từ 1.000K",
              desc: "Giao hàng tận nơi nhanh chóng toàn quốc",
              color: "text-blue-600 bg-blue-50/80",
            },
            {
              icon: RotateCcw,
              title: "Đổi Trả Trong 7 Ngày",
              desc: "Dễ dàng, không mất phí nếu do lỗi sản xuất",
              color: "text-emerald-600 bg-emerald-50/80",
            },
            {
              icon: ShieldCheck,
              title: "Thanh Toán Bảo Mật",
              desc: "Bảo mật thông tin ngân hàng & thẻ 100%",
              color: "text-indigo-600 bg-indigo-50/80",
            },
            {
              icon: Leaf,
              title: "Thời Trang Bền Vững",
              desc: "Chất liệu thân thiện với môi trường",
              color: "text-teal-600 bg-teal-50/80",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-100/50"
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors ${item.color}`}
              >
                <item.icon className="size-6 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-800">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {}
      {categories?.content?.length ? (
        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Khám phá theo danh mục
              </h2>
              <p className="text-sm text-muted-foreground">
                Lựa chọn phong cách phù hợp nhất với bạn
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Xem tất cả <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {categories.content.map((c) => (
              <Link
                key={c.categoryId}
                to={`/products?categoryId=${c.categoryId}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-muted/20 hover:bg-muted/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-border hover:border-primary/30"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-background shadow-xs border border-border/50 text-muted-foreground group-hover:text-primary">
                  <ShoppingBag className="size-5" />
                </div>
                <div className="mt-8">
                  <p className="font-semibold text-sm leading-snug text-foreground">
                    {c.categoryName}
                  </p>
                  <span className="mt-1 inline-flex items-center text-xs font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Khám phá ngay →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {}
      {brands?.content?.length ? (
        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Thương hiệu nổi bật
            </h2>
            <p className="text-sm text-muted-foreground">
              Sản phẩm chính hãng từ các nhãn hiệu uy tín hàng đầu
            </p>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {brands.content.map((b) => {
              const logo = resolveImageUrl(b.brandLogo);
              return (
                <Link
                  key={b.brandId}
                  to={`/products?brandId=${b.brandId}`}
                  className="group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-md"
                >
                  <div className="h-12 flex items-center justify-center w-full">
                    {logo ? (
                      <img
                        src={logo}
                        alt={b.brandName}
                        className="max-h-full max-w-full object-contain filter grayscale opacity-70 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground shadow-xs">
                        {b.brandName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground mt-1">
                    {b.brandName}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {}
      {promotions && promotions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
              <Gift className="size-6 text-indigo-500" /> Chương trình khuyến
              mãi
            </h2>
            <p className="text-sm text-muted-foreground">
              Tham gia các chương trình ưu đãi đặc biệt
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {}
            {promotions?.map((p) => (
              <div
                key={p.promotionId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-purple-100/80 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-white p-6 shadow-xs hover:shadow-xl hover:shadow-purple-100/50 hover:-translate-y-1 transition-all duration-300"
              >
                <Gift className="absolute -bottom-8 -right-8 size-32 text-purple-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

                <div className="space-y-2 relative z-10">
                  <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200/50 mb-2">
                    Chương Trình Khuyến Mãi
                  </Badge>
                  <h3 className="font-bold text-lg leading-snug text-slate-800">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 relative z-10">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Ưu đãi lên tới
                    </p>
                    <p className="text-2xl font-medium text-indigo-600 tracking-tight">
                      {p.discountType === "PERCENTAGE"
                        ? `${p.discountValue}%`
                        : `${(p.discountValue / 1000).toLocaleString("vi-VN")}K`}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-300 group-hover:translate-x-0.5 border-0"
                  >
                    <Link to="/products">
                      Mua ngay <ArrowRight className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
              <ShoppingBag className="size-5 text-indigo-500" /> Sản phẩm bán
              chạy
            </h2>
            <p className="text-sm text-muted-foreground">
              Những trang phục được săn đón nhiều nhất
            </p>
          </div>
          <Link
            to="/products?sort=totalSold,desc"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Xem tất cả
          </Link>
        </div>
        <ProductGrid products={bestSellers} isLoading={loadingBest} />
      </section>

      {}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
              <TrendingUp className="size-5 text-indigo-500" /> Đánh giá cao
            </h2>
            <p className="text-sm text-muted-foreground">
              Những sản phẩm được yêu thích nhất bởi khách hàng
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Xem tất cả
          </Link>
        </div>
        <ProductGrid products={topRated} isLoading={loadingTop} />
      </section>

      {}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-500" /> Hàng mới về
            </h2>
            <p className="text-sm text-muted-foreground">
              Cập nhật nhanh nhất các xu hướng thời trang tối giản mới
            </p>
          </div>
          <Link
            to="/products?sort=createdAt,desc"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Xem tất cả
          </Link>
        </div>
        <ProductGrid products={newest?.content} isLoading={loadingNew} />
      </section>
    </div>
  );
}
