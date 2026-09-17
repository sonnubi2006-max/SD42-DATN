import { useState } from "react";
import { Mail, Send, Sparkles, AlertCircle, CheckCircle2, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSendPromotionEmail } from "@/hooks/useMarketing";

export default function MarketingEmailPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const { mutate: sendMail, isPending } = useSendPromotionEmail();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề email");
      return;
    }
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung email");
      return;
    }

    sendMail(
      { title, content },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success(res.message || `Đã gửi thành công email tiếp thị!`);

            setTitle("");
            setContent("");
            setActiveTab("edit");
          } else {
            toast.error(res.message || "Gửi email thất bại");
          }
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Đã xảy ra lỗi khi gửi email");
        },
      }
    );
  };

  const handleInsertTemplate = (type: "discount" | "new_product" | "thank_you") => {
    if (type === "discount") {
      setTitle("🔥 SIÊU ƯU ĐÃI: Giảm ngay 20% toàn bộ sản phẩm hôm nay!");
      setContent(
        `Chào bạn,\n\nChúng tôi xin gửi tặng bạn mã giảm giá cực khủng nhân dịp mùa hè này. Giảm ngay 20% cho tất cả các đơn hàng khi áp dụng mã ưu đãi tại website của chúng tôi.\n\nĐừng bỏ lỡ cơ hội mua sắm những sản phẩm hot nhất với mức giá cực kỳ hấp dẫn nhé!\n\nTrân trọng,\nĐội ngũ hỗ trợ khách hàng.`
      );
    } else if (type === "new_product") {
      setTitle("✨ RA MẮT BỘ SƯU TẬP MỚI - Xu hướng thời trang 2026");
      setContent(
        `Chào bạn,\n\nBộ sưu tập mới nhất vừa chính thức cập bến hệ thống! Với những thiết kế đột phá, chất liệu cao cấp và kiểu dáng hiện đại, chắc chắn sẽ mang lại diện mạo mới mẻ cho bạn trong mùa này.\n\nHãy ghé thăm website của chúng tôi ngay hôm nay để trở thành những người đầu tiên sở hữu những sản phẩm độc đáo này nhé.\n\nTrân trọng,\nĐội ngũ hỗ trợ khách hàng.`
      );
    } else {
      setTitle("💖 Lời cảm ơn chân thành & Món quà tri ân đặc biệt");
      setContent(
        `Chào bạn,\n\nCảm ơn bạn đã luôn tin tưởng và đồng hành cùng chúng tôi trong suốt thời gian qua. Sự hài lòng của bạn là động lực lớn nhất để chúng tôi không ngừng cải tiến dịch vụ.\n\nChúng tôi xin gửi tặng bạn một phần quà tri ân nhỏ trong lần mua sắm tiếp theo. Chúc bạn một ngày tràn ngập niềm vui!\n\nTrân trọng,\nĐội ngũ hỗ trợ khách hàng.`
      );
    }
    setActiveTab("edit");
    toast.success("Đã áp dụng mẫu email!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            Chiến dịch Email Tiếp thị
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gửi email thông tin khuyến mãi, ưu đãi hoặc ra mắt sản phẩm mới tới tất cả khách hàng đã đăng ký nhận tin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-150 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-gray-55/50 border-b border-gray-100 flex flex-row items-center justify-between px-6 py-4">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Soạn thảo Email
                </CardTitle>
                <CardDescription className="text-xs">
                  Nhập thông tin tiêu đề và nội dung để gửi email
                </CardDescription>
              </div>

              {}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === "edit"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-550 hover:text-gray-900"
                  }`}
                >
                  <Edit3 className="h-3 w-3" /> Soạn thảo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === "preview"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-550 hover:text-gray-900"
                  }`}
                >
                  <Eye className="h-3 w-3" /> Xem trước
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {activeTab === "edit" ? (
                <form onSubmit={handleSend} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email-title" className="text-xs font-semibold text-gray-700">
                      Tiêu đề Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email-title"
                      placeholder="Nhập tiêu đề thu hút sự chú ý..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="focus:ring-2 focus:ring-blue-500/20"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="email-content" className="text-xs font-semibold text-gray-700">
                        Nội dung Email <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400">
                        Hỗ trợ xuống dòng, tự động định dạng hiển thị
                      </span>
                    </div>
                    <Textarea
                      id="email-content"
                      placeholder="Soạn nội dung thư gửi khách hàng..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                      className="font-sans text-sm focus:ring-2 focus:ring-blue-500/20 min-h-[220px]"
                      disabled={isPending}
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-6 py-2 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      {isPending ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang gửi chiến dịch...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Gửi Mail Tiếp Thị
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50/50">
                  {}
                  <div className="bg-white p-4 border-b border-gray-150 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-16">Từ:</span>
                      <span className="font-semibold text-gray-800">
                        Hệ thống Tiếp thị Store &lt;no-reply@store.com&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-16">Tới:</span>
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                        Tất cả khách hàng đã đăng ký nhận tin (Subscribers)
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-gray-100">
                      <span className="text-gray-400 w-16">Tiêu đề:</span>
                      <span className="font-bold text-gray-900">
                        {title || "(Chưa nhập tiêu đề)"}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="p-6 bg-white min-h-[250px] text-gray-800 text-sm leading-relaxed whitespace-pre-line font-sans">
                    {content ? (
                      <div>
                        {content}
                        <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                          Bạn nhận được email này vì đã đăng ký nhận tin từ cửa hàng của chúng tôi.<br />
                          Để hủy đăng ký, vui lòng bấm vào liên kết <span className="text-blue-500 underline cursor-pointer">tại đây</span>.
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                        <AlertCircle size={24} className="text-gray-300" />
                        <span>Nội dung thư trống. Vui lòng sang mục Soạn thảo để viết nội dung.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {}
        <div className="space-y-6">
          {}
          <Card className="border border-gray-150 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Mẫu Email Nhanh
              </CardTitle>
              <CardDescription className="text-[11px]">
                Chọn một mẫu có sẵn để tạo nội dung email tiếp thị nhanh chóng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => handleInsertTemplate("discount")}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all text-xs group"
              >
                <p className="font-semibold text-gray-800 group-hover:text-blue-700">🔥 Giảm giá & Khuyến mãi</p>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">Giảm ngay 20% cho tất cả đơn hàng...</p>
              </button>

              <button
                type="button"
                onClick={() => handleInsertTemplate("new_product")}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all text-xs group"
              >
                <p className="font-semibold text-gray-800 group-hover:text-blue-700">✨ Ra mắt Bộ sưu tập mới</p>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">Giới thiệu bộ sưu tập thời trang 2026 vừa ra mắt...</p>
              </button>

              <button
                type="button"
                onClick={() => handleInsertTemplate("thank_you")}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all text-xs group"
              >
                <p className="font-semibold text-gray-800 group-hover:text-blue-700">💖 Tri ân khách hàng thân thiết</p>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">Lời cảm ơn cùng mã tri ân khách hàng thân thiết...</p>
              </button>
            </CardContent>
          </Card>

          {}
          <Card className="border border-gray-150 shadow-sm bg-gray-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Hướng dẫn & Lưu ý
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500 space-y-3">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <p>Thư tiếp thị chỉ gửi đến những khách hàng có trạng thái <b>Hoạt động</b> và đã bật tùy chọn <b>Đồng ý nhận tin khuyến mãi</b>.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <p>Nội dung thư được định dạng tự động giúp phân tách dòng văn bản dễ đọc.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <p>Hãy chắc chắn kiểm tra tiêu đề và thông tin trong mục <b>Xem trước</b> trước khi gửi hàng loạt.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
