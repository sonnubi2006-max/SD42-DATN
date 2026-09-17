# Tài liệu chức năng và API Backend

## 1. Quy ước chung

- Base URL local: `http://localhost:8080/api/v1`.
- API bảo vệ dùng header `Authorization: Bearer <accessToken>`.
- Vai trò: `USER` là khách hàng; `STAFF` là nhân viên; `ADMIN` là quản trị viên.
- `/admin/**`: chỉ ADMIN, ngoại trừ `/admin/products/**` cho cả ADMIN và STAFF quản lý sản phẩm/biến thể. `/manager/**`: ADMIN hoặc STAFF. `/cart/**`, `/wishlist/**`, `/returns/**`, `/ai/**`: USER.
- Các API GET danh mục, sản phẩm, bài viết, banner, review sản phẩm, vận chuyển và promotion đang hoạt động được phép gọi công khai.
- Body JSON dùng `Content-Type: application/json`. API ảnh dùng `multipart/form-data`.

Phần lớn response có dạng:

```json
{
  "success": true,
  "message": "Thành công",
  "data": {}
}
```

Response phân trang nằm trong `data` theo cấu trúc `Page`: `content`, `number`, `size`, `totalElements`, `totalPages`. Tham số Spring Pageable thông dụng là `page`, `size`, `sort=field,asc|desc`.

Mã lỗi cần xử lý ở frontend:

| HTTP | Ý nghĩa |
|---|---|
| `400` | Body/query không hợp lệ hoặc vi phạm quy tắc nghiệp vụ. |
| `401` | Thiếu token, token hết hạn hoặc tài khoản không còn hợp lệ. |
| `403` | Đã đăng nhập nhưng sai vai trò/không sở hữu tài nguyên. |
| `404` | Không tìm thấy dữ liệu. |
| `409` | Xung đột, đặc biệt giá/tổng checkout đã thay đổi; phải tải lại checkout, chưa tạo Order. |

## 2. Xác thực khách hàng

Base path: `/auth`.

| Method và path | Body | Chức năng/cách dùng |
|---|---|---|
| `POST /auth/register` | `RegisterRequest`: `email`, `password`, `fullName`, `phone` | Tạo Customer, mã hóa mật khẩu và tạo giỏ hàng. Trả access token, refresh token và thông tin khách. |
| `POST /auth/login` | `LoginRequest`: `email`, `password` | Đăng nhập khách. Chỉ trạng thái `ACTIVE` được cấp token; INACTIVE/BANNED phải hiển thị hướng dẫn liên hệ cửa hàng. |
| `POST /auth/refresh-token` | `{ "refreshToken": "..." }` | Đổi refresh token còn hạn lấy access token mới. |
| `POST /auth/logout` | Không | Xóa/vô hiệu refresh token của tài khoản hiện tại. Cần Bearer token. |
| `POST /auth/forgot-password` | `{ "email": "..." }` | Kiểm tra Customer theo email; chỉ tạo token và gửi mail khi email tồn tại. |
| `POST /auth/reset-password` | `token`, `newPassword`, `confirmPassword` | Kiểm tra token đúng loại CUSTOMER, còn hạn, chưa dùng; cập nhật mật khẩu. |

Ví dụ đăng nhập:

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"user@example.com","password":"123123"}
```

## 3. Xác thực nhân viên và admin

Base path: `/auth/manager`.

| Method và path | Body | Chức năng/cách dùng |
|---|---|---|
| `POST /auth/manager/register` | `RegisterManagerRequest` | ADMIN tạo tài khoản quản lý với email, họ tên, phone, gender, birthday, role, CCCD và địa chỉ. |
| `POST /auth/manager/login` | `{ "username": "...", "password": "..." }` | Đăng nhập STAFF/ADMIN; tài khoản phải ACTIVE. |
| `POST /auth/manager/refresh-token` | `RefreshTokenRequest` | Làm mới JWT của User. |
| `POST /auth/manager/logout` | Không | Đăng xuất tài khoản quản lý hiện tại. |
| `POST /auth/manager/forgot-password` | `ForgotPasswordRequest` | Kiểm tra email User trước khi tạo yêu cầu reset. |
| `POST /auth/manager/reset-password` | `ResetPasswordRequest` | Đặt lại mật khẩu bằng token loại USER. |

## 4. Hồ sơ User và quản lý nhân viên

| Method và path | Input | Chức năng |
|---|---|---|
| `GET /me` | Bearer token | Lấy hồ sơ User đang đăng nhập. |
| `GET /manager/users` | `status`, `role`, `keyword`, Pageable | STAFF/ADMIN tra cứu danh sách tài khoản quản lý. |
| `GET /admin/users/{id}` | Path `id` | Xem chi tiết nhân viên. |
| `POST /admin/users` | Multipart: model `CreateAccountRequest`, `file` tùy chọn | ADMIN tạo nhân viên kèm avatar. |
| `PUT /admin/users/{id}` | Multipart: `AdminUpdateUserRequest`, `file` tùy chọn | Cập nhật hồ sơ nhân viên. |
| `PUT /admin/users/{id}/status` | `UpdateStatusUser` theo controller | Thay đổi/toggle trạng thái tài khoản; trạng thái không ACTIVE không đăng nhập được. |
| `PUT /profile` | Multipart: `UpdateUserRequest`, `file` tùy chọn | User hiện tại tự cập nhật hồ sơ/avatar. |
| `PUT /change-password` | `ChangePasswordRequest` | Kiểm tra mật khẩu cũ, xác nhận mật khẩu mới rồi đổi mật khẩu. |
| `GET /admin/users/statistics` | Không | Tổng số tài khoản theo ACTIVE/INACTIVE/BANNED và STAFF/ADMIN. |

## 5. Khách hàng và địa chỉ

### Khách tự quản lý địa chỉ

| API | Input | Chức năng |
|---|---|---|
| `POST /users/addresses` | `AddressRequest` | Tạo địa chỉ cho Customer hiện tại. |
| `GET /users/addresses` | — | Lấy sổ địa chỉ của khách. |
| `GET /users/addresses/default` | — | Lấy địa chỉ mặc định. |
| `GET /addresses/{addressId}` | ID | Xem địa chỉ có kiểm tra sở hữu. |
| `PUT /addresses/{addressId}` | `AddressRequest` | Sửa địa chỉ của chính khách. |
| `PATCH /users/addresses/{addressId}/default` | ID | Đặt mặc định và bỏ cờ mặc định ở địa chỉ cũ. |
| `DELETE /addresses/{addressId}` | ID | Xóa địa chỉ thuộc khách hiện tại. |

`AddressRequest` chứa người nhận, điện thoại, tỉnh/huyện/xã, địa chỉ chi tiết và cờ mặc định.

### Nhân viên quản lý khách

| API | Input | Chức năng |
|---|---|---|
| `GET /manager/customers` | `page`, `size`, `sort`, `direction` và bộ lọc | Danh sách khách có phân trang. |
| `GET /manager/customers/statistics` | — | Thống kê khách theo nguồn/trạng thái. |
| `POST /manager/customers` | `CustomerRequest` | Tạo khách, thường dùng tại POS. |
| `GET /manager/customers/{id}` | ID | Chi tiết khách. |
| `PUT /manager/customers/{id}` | `CustomerRequest` | Cập nhật khách. |
| `PATCH /manager/customers/{id}/status?status=ACTIVE` | `ACTIVE/INACTIVE/BANNED` | Đổi trạng thái và ảnh hưởng khả năng đăng nhập/thao tác. |
| `GET /manager/customers/search?keyword=` | Email/tên/phone | Tìm nhanh khách để gắn vào đơn POS. |
| `GET /auth/me` | Bearer USER | Hồ sơ Customer hiện tại. |
| `GET /manager/customers/{id}/addresses` | Customer ID | Danh sách địa chỉ của khách. |
| `POST /manager/customers/{id}/addresses` | `AddressRequest` | Nhân viên thêm địa chỉ. |
| `PUT /manager/customers/{id}/addresses/{addressId}` | `AddressRequest` | Nhân viên sửa địa chỉ. |
| `PATCH .../{addressId}/default` | ID | Đặt địa chỉ mặc định. |
| `DELETE .../{addressId}` | ID | Xóa địa chỉ. |
| `GET /admin/addresses/user/{userId}` | Customer ID | ADMIN xem địa chỉ theo khách. |
| `GET /admin/addresses/{addressId}` | Address ID | ADMIN xem chi tiết địa chỉ. |

## 6. Danh mục và thương hiệu

### Category sản phẩm

| API | Chức năng |
|---|---|
| `GET /category` | Danh sách/filter category công khai, có phân trang. |
| `GET /category/{id}` | Chi tiết category. |
| `GET /category/statistics` | Thống kê category. |
| `GET /category/export/excel` | Xuất danh sách Excel. |
| `POST /admin/category` | Tạo bằng `CreateCategoryRequest`. |
| `PUT /admin/category/{id}` | Sửa bằng `UpdateCategoryRequest`. |
| `DELETE /admin/category/{id}` | Xóa mềm/kiểm tra ràng buộc sản phẩm theo service. |

### Brand

| API | Chức năng |
|---|---|
| `GET /brand`, `GET /brand/{id}` | Danh sách và chi tiết thương hiệu. |
| `POST /admin/brand` | Multipart `CreateBrandRequest` và logo. |
| `PUT /admin/brand/{id}` | Multipart `UpdateBrandRequest`, logo tùy chọn. |
| `DELETE /admin/brand/{id}` | Xóa thương hiệu theo quy tắc liên kết sản phẩm. |
| `GET /admin/brand/statistics` | Thống kê thương hiệu. |
| `GET /admin/brand/export/excel` | Xuất Excel. |

## 7. Sản phẩm và biến thể

### Product

Các API quản trị `/admin/products/**` trong hai bảng dưới đây cho phép cả `ADMIN` và `STAFF`.

| API | Input/chức năng |
|---|---|
| `GET /products` | Danh sách công khai; dùng query filter/pagination của controller. Chỉ trả sản phẩm phù hợp storefront. |
| `GET /products/{id}` | Chi tiết sản phẩm công khai. |
| `GET /products/code/{productCode}` | Tìm theo mã sản phẩm; yêu cầu xác thực theo cấu hình hiện tại. |
| `GET /products/top-rated` | Sản phẩm đánh giá cao. |
| `GET /products/best-sellers` | Sản phẩm bán chạy. |
| `GET /products/price-range` | Khoảng giá để dựng bộ lọc. |
| `GET /manager/products` | Danh sách dành cho STAFF/ADMIN, gồm trạng thái quản trị. |
| `GET /admin/products/{id}` | Chi tiết quản trị. |
| `POST /admin/products` | Multipart: `CreateProductRequest`, danh sách ảnh. Tạo Product và dữ liệu ảnh/biến thể theo request. |
| `PUT /admin/products/{id}` | Multipart: `UpdateProductRequest`, ảnh liên quan. |
| `DELETE /admin/products/{id}` | Xóa mềm. |
| `PATCH /admin/products/{id}/restore` | Khôi phục sản phẩm đã xóa. |
| `GET /admin/products/deleted` | Danh sách đã xóa. |
| `PATCH /admin/products/{id}/status?status=` | Đổi `ProductStatus`. |
| `PATCH /admin/products/bulk-delete` | Body danh sách ID. |
| `PATCH /admin/products/bulk-status?status=` | Body danh sách ID. |
| `PATCH /admin/products/{id}/rating` | Đồng bộ/tính lại rating. |
| `GET /admin/products/export` | Xuất dữ liệu sản phẩm. |

### ProductVariant và tồn kho

| API | Input/chức năng |
|---|---|
| `GET /products/{productId}/variants` | Danh sách biến thể của sản phẩm. |
| `GET /products/variants/{variantId}` | Chi tiết biến thể. |
| `GET /products/variants/barcode/{barcode}` | Quét barcode, phù hợp POS. Endpoint cần xác thực. |
| `GET /admin/products/variants` | Filter `productId`, `keyword`, `minPrice`, `maxPrice`, `status`, Pageable. |
| `POST /admin/products/{productId}/variants` | Multipart `ProductVariantRequest` + `file` bắt buộc. |
| `POST /admin/products/{productId}/variants/bulk` | Multipart: `variants` là chuỗi JSON mảng, `files` là danh sách ảnh cùng thứ tự. |
| `PUT /admin/products/variants/{variantId}` | Multipart model + ảnh tùy chọn. |
| `PATCH /admin/products/variants/{variantId}/status?status=` | Đổi trạng thái biến thể. |
| `DELETE /admin/products/variants/{variantId}` | Xóa mềm biến thể. |
| `DELETE /admin/products/variants/bulk-delete` | Body danh sách ID. |
| `PATCH /admin/products/variants/bulk-status?status=` | Body danh sách ID. |
| `PATCH /admin/products/variants/{id}/restore` | Khôi phục biến thể. |

`stockQuantity` là tồn vật lý. Tồn khả dụng cho POS phải trừ thêm tổng Reservation ACTIVE; không thay đổi tồn chỉ vì thêm vào Cart/Wishlist.

## 8. Giỏ hàng và wishlist

### Cart

| API | Chức năng |
|---|---|
| `GET /cart` | Lấy giỏ hiện tại và giá hiệu lực để hiển thị. |
| `POST /cart/items` | Body `{variantId, quantity}`; thêm hoặc cộng số lượng. Chỉ kiểm tra khả dụng, không giữ hàng. |
| `PUT /cart/items` | Body `{variantId, quantity}`; đặt số lượng mới. |
| `PATCH /cart/items/{cartItemId}/increase` | Tăng 1. |
| `PATCH /cart/items/{cartItemId}/decrease` | Giảm 1; khi về 0 service có thể xóa dòng. |
| `DELETE /cart/items/{cartItemId}` | Xóa một dòng. |
| `DELETE /cart/items` | Body mảng ID; xóa nhiều dòng. |
| `DELETE /cart` | Xóa toàn bộ giỏ. |
| `GET /cart/count` | Số dòng/số lượng theo cách tính service. |
| `GET /cart/total` | Tổng tạm tính hiện tại, chưa phải cam kết checkout. |
| `GET /cart/exists/{variantId}` | Kiểm tra biến thể có trong giỏ. |

### Wishlist

| API | Chức năng |
|---|---|
| `GET /wishlist` | Danh sách yêu thích của USER, có `page`, `size`, `sort`, `direction`. |
| `POST /wishlist/{variantId}` | Thêm biến thể. |
| `DELETE /wishlist/{variantId}` | Bỏ biến thể. |
| `PUT /wishlist/{variantId}/toggle` | Đảo trạng thái, trả boolean mới. |
| `GET /wishlist/{variantId}/exists` | Kiểm tra tồn tại. |
| `GET /wishlist/count` | Đếm wishlist. |
| `DELETE /wishlist/clear` | Xóa toàn bộ. |
| `GET /admin/wishlist/user/{userId}` | ADMIN xem wishlist của khách, có phân trang. |

## 9. Promotion và coupon

### Promotion tự động

| API | Chức năng |
|---|---|
| `GET /promotions/active` | Danh sách promotion đang hiệu lực để tính/hiển thị giá. |
| `GET /admin/promotions` | Filter và phân trang promotion. |
| `GET /admin/promotions/{id}` | Chi tiết. |
| `POST /admin/promotions` | Tạo bằng `PromotionRequest`, chỉ định category/product/variant. |
| `PUT /admin/promotions/{id}` | Cập nhật. |
| `PATCH /admin/promotions/{id}/cancel` | Hủy promotion. |
| `PATCH /admin/promotions/{id}/status` | Đồng bộ/thay đổi trạng thái theo controller. |

### Coupon theo mã

| API | Chức năng |
|---|---|
| `GET /coupons` | Các coupon khả dụng cho khách/ngữ cảnh hiện tại. FE cần gọi lại khi checkout thay đổi. |
| `POST /coupons/validate` | Body `{code, orderAmount}`; kiểm tra thời gian, min order, lượt dùng, khách mục tiêu và tính giảm. |
| `GET /manager/coupons` | STAFF/ADMIN filter danh sách coupon. |
| `GET /admin/coupons/{id}` | Chi tiết quản trị. |
| `POST /admin/coupons` | Tạo `CouponRequest`. |
| `PUT /admin/coupons/{id}` | Sửa coupon. |
| `PATCH /admin/coupons/{id}/status` | Đổi trạng thái. |
| `POST /admin/coupons/refresh-status` | Tính lại trạng thái theo thời gian. |

Popup coupon nên hiển thị code, loại/mức giảm, giảm tối đa, giá trị đơn tối thiểu, thời hạn, lượt còn lại và điều kiện khách hàng.

## 10. Đặt hàng online

| API | Input/chức năng |
|---|---|
| `POST /orders` | `CreateOrderRequest`; tạo đơn online sau khi BE tính lại giá, coupon, phí và tồn. |
| `GET /orders/{orderId}` | Khách xem đơn theo ID, có kiểm tra sở hữu. |
| `GET /orders/code/{orderCode}` | Xem theo mã đơn, có kiểm tra sở hữu. |
| `GET /orders/my` | `OrderFilterRequest`; lịch sử đơn của khách. |
| `PATCH /orders/{orderId}/cancel?reason=` | Khách hủy nếu trạng thái cho phép; hoàn tồn và đồng bộ payment. |
| `PATCH /orders/{orderId}/cancel-unpaid` | Hủy đơn chưa thanh toán/hết phiên thanh toán. |

Body tạo đơn chính:

```json
{
  "orderType": "ONLINE",
  "paymentMethod": "VNPAY",
  "couponId": 10,
  "promotionId": null,
  "note": "Giao giờ hành chính",
  "items": [
    {"variantId": 25, "quantity": 2, "price": 350000}
  ],
  "orderAddressRequest": {
    "receiverName": "Nguyễn Văn A",
    "receiverPhone": "0900000000",
    "province": "Hà Nội",
    "district": "Cầu Giấy",
    "ward": "Dịch Vọng",
    "detailAddress": "Số 1"
  },
  "shippingFee": 30000
}
```

`items[].price` là giá FE đang hiển thị để phát hiện thay đổi, không phải giá FE được quyền quyết định. Nếu BE tính ra giá/tổng khác:

1. API trả `409` cùng thông tin giá và tổng mới.
2. Không tạo Order/Payment và không trừ tồn.
3. FE gọi lại sản phẩm/cart và `GET /coupons`.
4. Hiển thị chi tiết tổng mới; người dùng xác nhận bằng lần đặt hàng tiếp theo.

## 11. Quản lý đơn và POS

| API | Chức năng |
|---|---|
| `GET /manager/orders` | Filter toàn bộ đơn bằng `OrderFilterRequest`. |
| `GET /manager/orders/{orderId}` | Chi tiết quản trị. |
| `PUT /manager/orders/{orderId}/status` | Body `UpdateOrderStatusRequest`; kiểm tra transition hợp lệ và ghi log. |
| `PUT /manager/orders/bulk-status` | `BulkUpdateOrderStatusRequest`; cập nhật nhiều đơn. |
| `POST /manager/orders/pos` | Tạo/chốt đơn POS theo request tạo đơn đầy đủ. |
| `POST /manager/orders/pos/draft` | Tạo Order DRAFT rỗng cho quầy. |
| `GET /manager/orders/pos/drafts` | Danh sách đơn nháp còn hoạt động. |
| `POST /manager/orders/pos/{orderId}/items` | `{variantId, quantity}`; thêm dòng và tạo/tăng Reservation ACTIVE. |
| `PATCH /manager/orders/pos/{orderId}/items/{detailId}` | `{quantity}`; cập nhật chi tiết và reservation. |
| `DELETE /manager/orders/pos/{orderId}/items/{detailId}` | Xóa dòng và RELEASE reservation. |
| `PATCH /manager/orders/pos/{orderId}/customer` | `PosAttachCustomerRequest`; gắn khách đã có, tạo nhanh khách hoặc `clear=true`. |
| `POST /manager/orders/pos/{orderId}/checkout` | `PosCheckoutRequest`; tính coupon/phí, thu tiền, trừ tồn một lần, COMPLETE reservation và Order. |
| `DELETE /manager/orders/pos/{orderId}` | Hủy draft, RELEASE toàn bộ reservation. |

## 12. Thanh toán

Base path: `/payments`.

| API | Chức năng |
|---|---|
| `POST /payments/init` | Body `{orderId, clientIp?}`; kiểm tra quyền sở hữu/nhân viên, tạo hoặc đặt Payment PENDING và trả URL thanh toán. IP thực tế được lấy từ request. |
| `GET /payments/vnpay/return` | Callback trình duyệt VNPay; nhận các query `vnp_*`, kiểm chữ ký và cập nhật/trả PaymentResponse. Công khai. |
| `GET /payments/vnpay/ipn` | Callback server-to-server; trả JSON đúng giao thức VNPay. Công khai nhưng bắt buộc xác thực chữ ký. |
| `GET /payments/order/{orderId}` | Chủ đơn hoặc STAFF/ADMIN xem payment. |
| `POST /payments/order/{orderId}/refund?amount=` | STAFF/ADMIN hoàn số tiền dương, payment phải PAID và không vượt phần còn lại. |
| `POST /payments/order/{orderId}/sync` | Chỉ ADMIN; query VNPay để đồng bộ giao dịch. |

Frontend không được tự đánh dấu PAID từ trang return; IPN/BE là nguồn xác nhận. Callback lặp phải idempotent.

## 13. Đổi/đổi hàng

### Khách hàng

| API | Chức năng |
|---|---|
| `POST /returns/upload` | Multipart `file`; tải bằng chứng, trả URL. |
| `POST /returns/refund-preview` | `{orderId, items:[{variantId,quantity}]}`; tính trước số tiền có thể hoàn. |
| `POST /returns` | `CreateReturnRequest`; controller kiểm tra đơn thuộc Customer hiện tại rồi tạo PENDING. |
| `GET /returns/my` | Danh sách yêu cầu của khách, Pageable. |
| `GET /returns/{id}` | Chi tiết có kiểm tra sở hữu. |

### Nhân viên

| API | Chức năng |
|---|---|
| `POST /manager/returns/upload` | Upload ảnh xử lý. |
| `GET /manager/returns` | Filter `status`, `keyword`, `fromDate`, `toDate`, Pageable. Ngày theo ISO-8601. |
| `GET /manager/returns/statistics` | Thống kê trong khoảng tự chọn. |
| `GET /manager/returns/{id}` | Chi tiết. |
| `POST /manager/returns` | Nhân viên tạo yêu cầu `CreateReturnRequest`. |
| `PUT /manager/returns/{id}/approve` | PENDING → APPROVED. |
| `PUT /manager/returns/{id}/reject` | Body `{rejectReason}`; PENDING/APPROVED → REJECTED. |
| `PUT /manager/returns/{id}/complete` | Body tùy chọn gồm `processedImages`, `items[].returnItemId`, `damagedQuantity`; cập nhật tồn, tiền và log trong giao dịch. |

`CreateReturnRequest` gồm `orderId`, thông tin khách, `returnType` (`REFUND`/`EXCHANGE` trong luồng thường), note/images, danh sách hàng trả và hàng đổi. Chỉ APPROVED được complete; trả toàn bộ dạng refund có thể đưa Order và Payment sang REFUNDED.

## 14. Review

| API | Chức năng |
|---|---|
| `POST /reviews` | Multipart `CreateReviewRequest` + ảnh; USER đánh giá một OrderDetail đã mua. |
| `PUT /reviews/{id}` | Multipart `UpdateReviewRequest` + ảnh tùy chọn; sửa đánh giá của mình. |
| `GET /reviews/product/{productId}` | Review công khai theo sản phẩm, phân trang/filter. |
| `GET /reviews/product/{productId}/summary` | Điểm trung bình và phân bố sao. |
| `GET /reviews/my-reviews` | Review của Customer hiện tại. |
| `GET /reviews/my-unreviewed-products` | Các OrderDetail đủ điều kiện chưa đánh giá. |
| `GET /admin/reviews` | ADMIN filter toàn bộ review. |
| `PATCH /admin/reviews/{id}/approve` | Duyệt. |
| `PATCH /admin/reviews/{id}/reject` | Từ chối. |
| `PATCH /admin/reviews/{id}/hide` | Ẩn. |
| `DELETE /reviews/{id}` | Chủ review xóa theo quyền service. |

## 15. Chat hỗ trợ

| API | Quyền/chức năng |
|---|---|
| `POST /chat/conversations` | USER, multipart `CreateConversationRequest` và file tùy chọn; mở hội thoại. |
| `GET /chat/conversations/me` | USER; hội thoại của mình. |
| `GET /chat/conversations/assigned` | USER/STAFF/ADMIN; danh sách được gán theo vai trò hiện tại. |
| `GET /chat/conversations/pending` | STAFF/ADMIN; hàng chờ chưa nhận. |
| `PATCH /chat/conversations/{id}/assign` | STAFF/ADMIN tự nhận/phân công theo service. |
| `GET /admin/chat/conversations` | ADMIN xem toàn bộ. |
| `PATCH /admin/chat/conversations/{id}/reassign/{staffId}` | ADMIN chuyển nhân viên phụ trách. |
| `GET /chat/conversations/{id}` | Xem chi tiết nếu là khách sở hữu hoặc nhân viên có quyền. |
| `PATCH /chat/conversations/{id}/close` | Đóng hội thoại. |
| `GET /chat/conversations/{id}/messages` | Lấy tin nhắn có phân trang. |
| `POST /chat/messages/{conversationId}` | Multipart `SendMessageRequest`, file tùy chọn; gửi text/ảnh/tham chiếu Order. |
| `GET /chat/orders/selectable` | USER; danh sách đơn có thể đính kèm vào chat. |
| `GET /chat/conversations/{id}/assignments` | Lịch sử phân công. |
| `PATCH /chat/conversations/{id}/read` | Đánh dấu đã đọc. |
| `DELETE /chat/messages/{messageId}` | Xóa/thu hồi theo quyền người gửi/service. |

Tin nhắn realtime được đẩy qua Socket.IO; REST vẫn là nguồn tải lịch sử và thao tác bền vững.

## 16. Liên hệ

| API | Chức năng |
|---|---|
| `POST /contacts` | `ContactRequest`; khách gửi tên, email, phone, subject và message. |
| `GET /admin/contacts` | Filter/phân trang yêu cầu. |
| `GET /admin/contacts/{id}` | Chi tiết. |
| `PATCH /admin/contacts/{id}` | Cập nhật trạng thái xử lý. |
| `DELETE /admin/contacts/{id}` | Xóa. |
| `GET /admin/contacts/statistics` | Thống kê PENDING/PROCESSING/RESOLVED. |

## 17. Banner, bài viết và taxonomy bài viết

### Banner

| API | Chức năng |
|---|---|
| `GET /banners` | Filter `isActive`, `keyword`, `checkDate`, phân trang/sort. |
| `GET /banners/{bannerId}` | Chi tiết. |
| `GET /banners/statistics` | Thống kê; hiện endpoint GET này nằm trong pattern public. |
| `POST /admin/banners` | Multipart `BannerCreateRequest` + `file`. |
| `PUT /admin/banners/{id}` | Multipart `BannerUpdateRequest`, file tùy chọn. |
| `PATCH /admin/banners/{id}` | Toggle trạng thái. |
| `DELETE /admin/banners/{id}` | Xóa. |

### Post

| API | Chức năng |
|---|---|
| `GET /posts` | Danh sách bài công khai. |
| `GET /posts/{id}` | Chi tiết bài công khai. |
| `GET /posts/tags?tagId=` | Lọc theo tag. |
| `GET /posts/categories?categoryId=` | Lọc theo chuyên mục. |
| `GET /admin/posts` | Filter `status`, `tagIds`, `categoryIds`, Pageable. |
| `GET /admin/posts/{id}` | Chi tiết kể cả chưa xuất bản. |
| `POST /admin/posts` | Multipart `PostRequest` + thumbnail. |
| `PUT /admin/posts/{id}` | Multipart cập nhật. |
| `PATCH /admin/posts/{id}/status?status=` | Đổi trạng thái bài. |
| `DELETE /admin/posts/{id}` | Xóa. |

`/post-category` và `/post-tag` có GET danh sách/chi tiết công khai; các API `POST`, `PUT`, `DELETE /admin/post-category...` và `/admin/post-tag...` dùng `PostCategoryRequest`/`PostTagRequest` để CRUD taxonomy.

## 18. Shipping/GHN

Base path `/shipping` và đều là GET công khai:

| API | Chức năng |
|---|---|
| `/shipping/ghn/provinces` | Danh sách tỉnh GHN. |
| `/shipping/ghn/districts?provinceId=` | Huyện theo tỉnh. |
| `/shipping/ghn/wards?districtId=` | Xã theo huyện. |
| `/shipping/ghn/fee?...` | Tính phí giao theo tham số địa chỉ/khối lượng controller yêu cầu. |
| `/shipping/ghn/wards-by-province?...` | Danh sách xã gom theo tỉnh. |
| `/shipping/ghn/wards-v2?...` | Nguồn xã phiên bản mới/có cache. |
| `/shipping/address-search?...` | Tìm kiếm địa chỉ để hỗ trợ nhập checkout. |

Phí gửi từ FE vẫn phải được BE kiểm tra/tính lại lúc tạo Order.

## 19. Marketing và AI

| API | Chức năng |
|---|---|
| `POST /admin/marketing/promotion` | `PromotionEmailRequest`; ADMIN gửi chiến dịch email tới nhóm khách đăng ký nhận tin và đang ACTIVE. |
| `POST /ai/chat` | `AiChatRequest`; USER hỏi trợ lý sản phẩm. Service tra cứu biến thể và gọi mô hình AI cấu hình ở backend. |

## 20. Cách tích hợp frontend khuyến nghị

1. Tạo một HTTP client tự thêm Bearer token và xử lý `401` bằng refresh token đúng loại tài khoản.
2. Không retry tự động các POST tạo đơn/thanh toán nếu không có idempotency; riêng `409` checkout phải tải lại dữ liệu và chờ người dùng xác nhận.
3. Sau mọi thay đổi cart/coupon/promotion, lấy lại tổng từ BE.
4. Ở POS, khóa thao tác checkout khi đang gửi request; không trừ tồn thêm ở FE. Reservation do BE quản lý.
5. Với VNPay, sau return page gọi lại `GET /payments/order/{orderId}`; không tin query trên trình duyệt để tự xác nhận PAID.
6. Khi complete đổi trả, tải lại Order, Payment, ReturnRequest và tồn biến thể vì một transaction có thể thay đổi cả bốn nhóm dữ liệu.

## 21. Tài liệu liên quan

- [Frontend khách hàng và frontend quản trị](./frontend-documentation.md)
- [Mô tả entity](./entity-documentation.md)
- [Quy trình nghiệp vụ](./business-flows.md)
- [Ma trận chức năng–entity](./entity-function-matrix.md)
- [ERD tổng thể](./overall-erd.md)
- [Sơ đồ trạng thái](./state-diagrams.md)
