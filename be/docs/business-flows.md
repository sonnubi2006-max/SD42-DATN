# Quy trình nghiệp vụ

## 1. Đăng nhập, trạng thái tài khoản và quên mật khẩu

1. Khách hàng đăng nhập qua luồng Customer; nhân viên/admin qua luồng User.
2. Hệ thống kiểm tra mật khẩu và trạng thái tài khoản. Chỉ `ACTIVE` được cấp access/refresh token; `INACTIVE` hoặc `BANNED` bị chặn cả khi dùng JWT cũ.
3. Giao diện hiển thị thông báo liên hệ cửa hàng khi tài khoản bị vô hiệu hóa.
4. Khi quên mật khẩu, BE kiểm tra đúng email theo `AccountType` trước. Email không tồn tại trả thông báo lỗi ngay; email hợp lệ mới tạo `PasswordResetToken` và gửi liên kết.
5. Token chỉ dùng một lần, phải còn hạn; sau khi đổi mật khẩu được đánh dấu `used`.

Entity: `User`, `Customer`, `RefreshToken`, `PasswordResetToken`.

## 2. Danh mục, giá bán và tồn kho

1. Admin quản lý `Category`, `Brand`; Admin và nhân viên cùng quản lý `Product`, `ProductVariant`, `ProductImage`.
2. Giá cơ sở và tồn nằm ở biến thể. `Promotion` tạo giá hiệu lực theo thời gian và phạm vi category/product/variant.
3. Mọi màn hình giỏ/checkout chỉ hiển thị giá tham khảo; BE là nguồn giá cuối cùng khi đặt hàng.
4. Thêm vào `CartItem` hoặc `Wishlist` không giữ hàng và không giảm tồn.

## 3. Checkout online khi giá thay đổi

```mermaid
sequenceDiagram
    actor C as Khách hàng
    participant FE as Checkout
    participant BE as Order service
    participant DB as Database
    C->>FE: Nhấn Đặt hàng
    FE->>BE: Gửi biến thể, số lượng, giá đang hiển thị, coupon
    BE->>BE: Tính lại promotion, coupon, phí và tổng tiền
    alt Giá/tổng tiền khác giao diện
        BE-->>FE: HTTP 409 + giá cũ/mới và tổng cũ/mới
        FE->>BE: Tải lại sản phẩm và danh sách coupon khả dụng
        BE-->>FE: Checkout mới, coupon hợp lệ và chi tiết điều kiện
        FE-->>C: Hiển thị thay đổi, chưa tạo Order
        C->>FE: Xác nhận bằng lần nhấn Đặt hàng tiếp theo
    else Dữ liệu còn hợp lệ
        BE->>BE: VNPay claim/trừ tồn; COD chờ cửa hàng xác nhận
        BE->>DB: Tạo Order, OrderDetail, OrderAddress, Payment
        BE-->>FE: VNPay WAITING_PAYMENT hoặc COD PENDING
    end
```

Điểm bắt buộc: lần phát hiện chênh lệch không tạo hóa đơn, không giữ/trừ tồn và không tái sử dụng coupon cũ một cách mù quáng. FE phải tải lại toàn bộ checkout vì một coupon khác có thể vừa trở thành lựa chọn tốt hơn hoặc coupon cũ không còn hợp lệ.

Entity: `Cart`, `CartItem`, `ProductVariant`, `Promotion`, `Coupon`, `Customer`, `Order`, `OrderDetail`, `OrderAddress`, `Payment`.

## 4. Đơn online và giao hàng

1. Sau khi giá/coupon/tồn hợp lệ, snapshot địa chỉ và các dòng hàng. VNPay tạo đơn `WAITING_PAYMENT`; COD tạo đơn `PENDING`.
2. VNPay giữ/trừ tồn khi tạo đơn. COD chỉ trừ tồn khi nhân viên xác nhận `PENDING → CONFIRMED`; `OrderDetail` giữ giá bán lịch sử.
3. Thanh toán online chờ callback; COD chờ chính sách xác nhận của cửa hàng.
4. Chuỗi chính: VNPay `WAITING_PAYMENT → CONFIRMED → SHIPPING → COMPLETED`; COD `PENDING → CONFIRMED → SHIPPING → COMPLETED`.
5. Có nhánh giao thất bại/chuyển hoàn/hư hỏng. Mỗi thay đổi ghi `OrderTransactionLog`.
6. Hủy COD ở `PENDING` không hoàn tồn vì chưa trừ; các đơn đã giữ/trừ kho phải hoàn tồn và xử lý payment/coupon nhất quán.

## 5. POS, đơn nháp và Reservation

1. Nhân viên tạo `Order(DRAFT)` tại quầy.
2. Khi thêm/sửa dòng hàng, hệ thống tạo hoặc điều chỉnh `Reservation(ACTIVE)` theo `ProductVariant`.
3. Reservation làm giảm **số lượng khả dụng**, nhưng chưa phải doanh thu và chưa nên coi là đã bán.
4. Khi chốt đơn: `DRAFT → WAITING_PAYMENT`; khi thanh toán thành công, trừ tồn vật lý một lần, chuyển reservation sang `COMPLETED`, rồi Order sang `COMPLETED`.
5. Xóa dòng hoặc hủy đơn nháp chuyển reservation liên quan sang `RELEASED`.
6. `expiredAt` và trạng thái `EXPIRED` đã có trong mô hình; cần scheduler/command dọn riêng nếu muốn tự động hết hạn. Scheduler đang có chủ yếu dọn đơn nháp, nên phải đảm bảo nó cũng giải phóng reservation qua service.

Với một cửa hàng nhỏ, cách lai này hợp lý: online trừ tồn ngay để tránh oversell; POS nháp dùng reservation vì nhân viên có thể giữ giỏ trong lúc phục vụ. Không nên coi việc cho sản phẩm vào giỏ online là giữ hàng.

## 6. Thanh toán và VNPay

1. Tạo `Payment(PENDING)` gắn 1-1 với Order, số tiền bằng `finalAmount`.
2. Với VNPay, BE tạo URL và lưu thông tin giao dịch; callback hợp lệ chuyển sang `PAID`, lưu `paidAt`, đồng thời tiếp tục trạng thái đơn phù hợp.
3. Callback thất bại chuyển `FAILED`; payment quá hạn có thể chuyển `CANCELLED` và hủy/giải phóng đơn theo service.
4. Chỉ payment `PAID` mới được hoàn tiền. Hoàn đủ chuyển `REFUNDED`; số tiền đã hoàn được cộng vào `refundedAmount`.
5. Callback phải có tính idempotent: nhận lại cùng kết quả không thu tiền hay cập nhật tồn lần hai.

## 7. Đổi/đổi hàng phía nhân viên

1. Nhân viên chọn đơn đủ điều kiện và các `OrderDetail` cần trả/đổi.
2. Tạo `ReturnRequest(PENDING)` gồm `ReturnItem`; nếu đổi hàng thì thêm `ExchangeItem` chỉ rõ biến thể mới và chênh lệch.
3. Nhân viên có quyền duyệt: `PENDING → APPROVED`, hoặc từ chối `PENDING/APPROVED → REJECTED` với lý do.
4. Chỉ yêu cầu `APPROVED` được hoàn tất. Khi hoàn tất, hệ thống cập nhật tồn hàng trả/hàng đổi, payment/refund, coupon liên quan và ghi log đơn trong cùng giao dịch.
5. `APPROVED → COMPLETED`. Trả toàn bộ dạng REFUND có thể đưa Order sang `REFUNDED`; trả một phần vẫn giữ lịch sử trên ReturnRequest.
6. Báo cáo tách **doanh thu bán hàng** và **tiền đổi hàng**, không hiển thị một chỉ số “doanh thu” gây khó hiểu.

Entity: `ReturnRequest`, `ReturnItem`, `ExchangeItem`, `Order`, `OrderDetail`, `ProductVariant`, `Payment`, `Coupon`, `User`, `OrderTransactionLog`.

## 8. Đánh giá và chăm sóc khách hàng

- Sau khi mua, khách đánh giá theo `OrderDetail`; `Review` gắn thêm Product/Variant để tổng hợp nhanh, ảnh nằm ở `ReviewImage`.
- `Contact` tiếp nhận biểu mẫu liên hệ.
- Chat tạo `Conversation`; `Message` xác định người gửi Customer hoặc User và có thể dẫn chiếu Order. `ConversationAssignment` lưu lịch sử phân công nhân viên.

## 9. Nội dung và marketing

- Banner được bật/tắt và sắp thứ tự hiển thị.
- Post do User biên soạn, phân loại bằng `PostCategory` và `PostTag`.
- Coupon là giảm giá theo mã; Promotion là giảm giá tự động. Hai loại phải được tính và giải thích tách biệt trong popup checkout.

## 10. Thống kê admin và nhân viên

Nguồn dữ liệu chính là `Order`, `Payment`, `ReturnRequest` theo khoảng thời gian tự chọn:

- Doanh thu bán hàng: tổng giao dịch bán đủ điều kiện theo ngày hoàn thành/thanh toán.
- Tiền đổi hàng: tổng refund đã hoàn tất theo thời điểm xử lý trả.
- Số đơn, sản phẩm bán và tỷ lệ đổi trả lấy từ Order/OrderDetail/ReturnItem.
- Biểu đồ đường phải dùng cùng timezone và cùng quy tắc biên ngày với các thẻ tổng quan.
- Nhân viên chỉ xem phạm vi được phân quyền; admin có thể xem toàn cửa hàng.
