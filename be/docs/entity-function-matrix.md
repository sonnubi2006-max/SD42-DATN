# Ma trận chức năng – Entity

Ký hiệu: **C** tạo, **R** đọc, **U** cập nhật, **D** xóa; **P** là entity trung tâm của chức năng. Entity không xuất hiện trong một dòng không bị tác động trực tiếp.

| Chức năng | Entity trung tâm | Entity liên quan và tác động |
|---|---|---|
| Đăng ký/đăng nhập khách | `Customer` (C/R/U, P) | `Cart` (C); `RefreshToken` (C/U/D) |
| Đăng nhập admin/nhân viên | `User` (R/U, P) | `RefreshToken` (C/U/D) |
| Khóa/mở tài khoản | `User`, `Customer` (U, P) | `RefreshToken` (R/D để vô hiệu phiên nếu áp dụng) |
| Quên/đặt lại mật khẩu | `PasswordResetToken` (C/R/U, P) | `User` hoặc `Customer` (R/U) |
| Quản lý sổ địa chỉ | `Address` (C/R/U/D, P) | `Customer` (R) |
| Quản lý danh mục | `Category` (C/R/U/D, P) | `Product` (R); `Promotion` (R) |
| Quản lý thương hiệu | `Brand` (C/R/U/D, P) | `Product` (R) |
| Quản lý sản phẩm | `Product` (C/R/U/D, P) | `Category`, `Brand` (R); `ProductVariant`, `ProductImage` (C/R/U/D) |
| Quản lý biến thể/tồn | `ProductVariant` (C/R/U, P) | `Product`, `ProductImage` (R/U); `Reservation`, `OrderDetail` (R) |
| Quản lý promotion | `Promotion` (C/R/U/D, P) | `Category`, `Product`, `ProductVariant` (R/U quan hệ) |
| Quản lý coupon | `Coupon` (C/R/U/D, P) | `Customer` (R/U quan hệ); `Order` (R) |
| Giỏ hàng | `Cart`, `CartItem` (C/R/U/D, P) | `Customer`, `ProductVariant`, `Promotion` (R) |
| Wishlist | `Wishlist` (C/R/D, P) | `Customer`, `ProductVariant`, `Promotion` (R) |
| Tải/tính lại checkout | `CartItem` (R) | `ProductVariant`, `Promotion`, `Coupon`, `Address` (R); không tạo `Order` |
| Đặt hàng online | `Order` (C, P) | `OrderDetail`, `OrderAddress`, `Payment` (C); `ProductVariant`, `Coupon` (R/U); `CartItem` (D) |
| Tạo/sửa đơn POS nháp | `Order` (C/R/U, P) | `OrderDetail` (C/U/D); `Reservation` (C/U); `ProductVariant` (R) |
| Thanh toán POS | `Payment` (C/U, P) | `Order`, `Reservation`, `ProductVariant` (U); `OrderTransactionLog` (C) |
| Thanh toán VNPay | `Payment` (C/R/U, P) | `Order` (R/U); `OrderTransactionLog` (C) |
| Cập nhật vận chuyển | `Order` (R/U, P) | `OrderTransactionLog` (C); `OrderAddress` (R) |
| Hủy/chuyển hoàn đơn | `Order` (U, P) | `ProductVariant`, `Reservation`, `Payment`, `Coupon` (U); `OrderTransactionLog` (C) |
| Tạo yêu cầu đổi/trả | `ReturnRequest` (C, P) | `ReturnItem`, `ExchangeItem` (C); `Order`, `OrderDetail`, `ProductVariant` (R); `User` (R) |
| Duyệt/từ chối đổi trả | `ReturnRequest` (R/U, P) | `User` (R); `OrderTransactionLog` (C nếu có thay đổi đơn) |
| Hoàn tất đổi/trả | `ReturnRequest` (U, P) | `ReturnItem`, `ExchangeItem` (R); `ProductVariant`, `Payment`, `Order`, `Coupon` (U); `OrderTransactionLog` (C) |
| Đánh giá sản phẩm | `Review` (C/R/U, P) | `ReviewImage` (C/R/D); `OrderDetail`, `Product`, `ProductVariant`, `Customer` (R) |
| Gửi/xử lý liên hệ | `Contact` (C/R/U, P) | — |
| Chat hỗ trợ | `Conversation` (C/R/U, P) | `Message` (C/R/U); `Customer`, `User`, `Order` (R) |
| Phân công chat | `ConversationAssignment` (C, P) | `Conversation`, `User` (R/U) |
| Quản lý banner | `Banner` (C/R/U/D, P) | — |
| Quản lý bài viết | `Post` (C/R/U/D, P) | `User`, `PostCategory`, `PostTag` (R/U quan hệ) |
| Báo cáo doanh thu | `Order`, `Payment` (R, P) | `OrderDetail`, `ReturnRequest`, `ReturnItem`, `User` (R) |

## Quy tắc đọc ma trận

- “Tải/tính lại checkout” cố ý không có thao tác C/U trên Order: đây là hàng rào chống tạo hóa đơn khi giá vừa thay đổi.
- Giỏ hàng và wishlist chỉ đọc tồn; reservation chỉ thuộc luồng POS nháp.
- Hoàn tất đổi/trả là thao tác giao dịch nhiều entity; nếu một bước lỗi phải rollback toàn bộ.
- Báo cáo chỉ đọc dữ liệu và phải tách doanh thu bán hàng khỏi tiền đổi hàng.
