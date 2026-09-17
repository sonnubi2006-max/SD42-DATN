# Báo cáo Nâng cấp Giao diện POS: Tìm kiếm Popup, Quét QR, Bảng Hóa Đơn & Đơn Giá Giảm Giá

Chúng tôi đã tối ưu hóa bảng hiển thị giỏ hàng POS, loại bỏ cột khuyến mãi riêng biệt để tiết kiệm diện tích chiều ngang và tổ chức lại cách hiển thị giá theo dạng "Giảm giá trực quan" kết hợp tăng kích thước phông chữ toàn diện. Đồng thời, nâng cấp khung hiển thị thông tin khách hàng gán vào đơn chờ, mở rộng chiều rộng của sidebar thanh toán và sửa đổi layout Popup Tìm sản phẩm rộng hơn và hiển thị bộ lọc liên tục.

---

## 1. Loại bỏ cột Khuyến mãi & Gộp kiểu hiển thị Giảm giá (Discount style pricing)

*   **Loại bỏ cột**: Cột "Khuyến mãi" riêng biệt đã được xóa bỏ hoàn toàn.
*   **Hiển thị giá giảm giá trực quan trong cột "Đơn giá"**:
    *   Nếu sản phẩm có áp dụng khuyến mãi: **Giá niêm yết cũ** sẽ được gạch ngang (`line-through text-muted-foreground`) nhỏ ở trên, và **Giá khuyến mãi mới** sẽ được hiển thị đậm bằng màu đỏ hoa hồng (`text-rose-600 font-bold`) nổi bật ở dưới.
    *   Nếu không có khuyến mãi: Chỉ hiển thị đơn giá bán bình thường (`text-sm font-semibold text-foreground`).
*   **Cơ chế này tương tự cách hiển thị trên các sàn thương mại điện tử lớn**, giúp thu ngân dễ dàng so sánh giá trước/sau giảm chỉ trong một ánh nhìn.

---

## 2. Nâng cấp hiển thị Khách hàng chi tiết & Mở rộng Sidebar Thanh toán

*   **Mở rộng chiều ngang cột thanh toán bên phải (`lg:w-[420px] xl:w-[460px]`)**: Thay thế các class không chuẩn của Tailwind (`w-85`, `w-95`) bằng kích thước pixel rõ ràng. Giúp cột thanh toán mở rộng thành **420px đến 460px**, tăng đáng kể diện tích hiển thị để các ô điền địa chỉ giao hàng, thông tin khách hàng, thẻ giảm giá và tổng tiền hóa đơn to rõ, dễ nhìn, không bị co cụm.
*   **Gộp truy vấn thông tin chi tiết**: Sử dụng hook `useCustomer` để tự động lấy toàn bộ thông tin lý lịch khách hàng từ ID.
*   **Card thiết kế sang trọng**: Sử dụng nền chuyển sắc (`bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-pink-50/10`) và viền bo mềm mại.
*   **Đầy đủ trường thông tin**:
    *   Ảnh đại diện bằng chữ cái đầu (Avatar Initial) với hiệu ứng bóng đổ.
    *   Số điện thoại (với icon Điện thoại).
    *   Email thành viên (với icon Thư).
    *   Phân loại thành viên thông minh: Phân biệt rõ "Thành viên hệ thống" và "Khách lẻ ghi nhận" qua Badge.
    *   **Giới tính & Ngày sinh**: Hiển thị trong một khung trắng kính mờ (`bg-white/70 backdrop-blur-xs`) tinh tế, giúp thu ngân nắm bắt nhanh thông tin cá nhân khách hàng để tư vấn size hoặc gửi lời chúc/khuyến mãi sinh nhật.

---

## 3. Sửa lỗi chiều rộng Popup & Cải tiến sản phẩm to rõ hơn

*   **Mở rộng tối đa chiều rộng Popup (`w-[95vw] sm:max-w-[1000px]`)**: Sửa lỗi do bộ nén mặc định của thư viện UI giới hạn chiều ngang chỉ còn `384px`. Nay cửa sổ tìm sản phẩm đã mở rộng lên đến `1000px` trên máy tính, tương đương 95% màn hình giúp hiển thị thông tin sản phẩm và bộ lọc cực kỳ thoáng đãng.
*   **Sản phẩm hiển thị to và đẹp hơn**:
    *   Điều chỉnh số cột từ `grid-cols-5` xuống `grid-cols-4` trên Desktop, giúp tăng 25% kích thước mỗi ô sản phẩm.
    *   Tăng khoảng đệm card (`p-3.5`) và nâng cỡ chữ tên sản phẩm (`text-sm font-bold`), giá khuyến mãi hiển thị to rõ rệt (`text-sm font-extrabold text-rose-600`).
*   **Hiển thị bộ lọc cố định (Persistent Filters)**:
    *   Xóa bộ lọc ẩn/hiện, cấu hình cố định liên tục bên dưới thanh tìm kiếm.

---

## Kết quả Kiểm tra (Verification Results)

*   **TypeScript Check**: Lệnh `npx tsc --noEmit` hoàn thành thành công không phát sinh lỗi kiểu dữ liệu.
*   **Trải nghiệm thực tế**: Bảng giỏ hàng rộng rãi, thông tin khách hàng chi tiết sắc nét, phần giá hiển thị trực quan và dễ dàng thao tác chuẩn xác.
