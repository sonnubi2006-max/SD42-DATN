import { Link } from "react-router-dom";

export default function StoreFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              S
            </span>
            Stravo
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Thời trang unisex tối giản, bền vững cho phong cách hằng ngày.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Mua sắm</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/products" className="hover:text-foreground">
                Tất cả sản phẩm
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-foreground">
                Yêu thích
              </Link>
            </li>
            <li>
              <Link to="/tra-cuu-don-hang" className="hover:text-foreground">
                Tra cứu đơn hàng
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/chat" className="hover:text-foreground">
                Trò chuyện hỗ trợ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Liên hệ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Email: support@stravo.vn</li>
            <li>Số điện thoại hỗ trợ: 1900 1234</li>
            <li>TP. Hồ Chí Minh, Việt Nam</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Stravo. Đồ án tốt nghiệp.
      </div>
    </footer>
  );
}
