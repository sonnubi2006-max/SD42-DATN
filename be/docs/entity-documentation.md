# Tài liệu Entity

## 1. Phạm vi và quy ước

Tài liệu này mô tả mô hình dữ liệu hiện có trong `be/src/main/java/com/base/entity`. Hệ thống có 34 entity JPA. Các bảng nối nhiều-nhiều được mô tả cùng entity sở hữu quan hệ và xuất hiện trong ERD tổng thể.

- **PK**: khóa chính; **FK**: khóa ngoại.
- Các giá trị tiền dùng `BigDecimal`; thời gian dùng `LocalDateTime`.
- `OrderDetail` lưu ảnh chụp giá tại thời điểm bán, không nên tính lại lịch sử đơn từ giá hiện tại của sản phẩm.
- `ProductVariant.stockQuantity` là tồn vật lý. `Reservation` là phần giữ hàng theo đơn POS nháp; đơn online hiện trừ tồn ngay khi tạo thành công.

## 2. Tài khoản và khách hàng

| Entity (bảng) | Khóa/dữ liệu chính | Quan hệ | Vai trò nghiệp vụ |
|---|---|---|---|
| `User` (`users`) | `userId` PK; email, password, fullName, phone, role, status | 1-N Order (nhân viên bán); 1-N ReturnRequest (tạo/xử lý); 1-N Post; tham gia Conversation, Message, ConversationAssignment | Tài khoản ADMIN/STAFF. Trạng thái `ACTIVE`, `INACTIVE`, `BANNED` chi phối đăng nhập và quyền thao tác. |
| `Customer` (`customers`) | `customerId` PK; email, password, họ tên, điện thoại, giới tính, ngày sinh, status | 1-N Address, Order, Review, Wishlist; 1-1 Cart; N-N Coupon; tham gia Conversation/Message | Tài khoản người mua. Tài khoản không ACTIVE bị từ chối đăng nhập/chức năng bảo vệ và được hướng dẫn liên hệ cửa hàng. |
| `Address` (`addresses`) | `addressId` PK; người nhận, điện thoại, địa chỉ hành chính, chi tiết, mặc định | N-1 Customer | Sổ địa chỉ giao hàng; hỗ trợ mã tỉnh/huyện/xã để tính phí GHN. |
| `RefreshToken` (`refresh_tokens`) | `id` PK; token, expiryDate | N-1 User hoặc N-1 Customer | Duy trì phiên đăng nhập cho hai loại tài khoản. Một bản ghi chỉ thuộc một chủ thể. |
| `PasswordResetToken` (`password_reset_tokens`) | `id` PK; token, email, accountType, expiryDate, used | Liên kết logic đến User/Customer bằng email + loại tài khoản | Token một lần cho quên mật khẩu. Hệ thống kiểm tra email tồn tại trước khi báo đã gửi yêu cầu. |

## 3. Danh mục, sản phẩm và tồn kho

| Entity (bảng) | Khóa/dữ liệu chính | Quan hệ | Vai trò nghiệp vụ |
|---|---|---|---|
| `Category` (`categories`) | `categoryId` PK; name, slug, description, status | 1-N Product; N-N Promotion | Phân loại sản phẩm và phạm vi áp dụng khuyến mại. |
| `Brand` (`brands`) | `brandId` PK; name, slug, logo, status | 1-N Product | Thương hiệu sản phẩm. |
| `Product` (`products`) | `productId` PK; name, slug, description, material, status | N-1 Category, Brand; 1-N ProductVariant, ProductImage, Review; N-N Promotion | Sản phẩm cha chứa thông tin dùng chung. |
| `ProductVariant` (`product_variants`) | `variantId` PK; SKU, barcode, size, color, price, stockQuantity, status | N-1 Product; 1-1 ProductImage; được tham chiếu bởi CartItem, OrderDetail, Reservation, ReturnItem, ExchangeItem, Review, Wishlist; N-N Promotion | Đơn vị bán và quản lý tồn thực tế. Giá checkout phải được BE tính lại từ giá biến thể và promotion hợp lệ. |
| `ProductImage` (`product_images`) | `imageId` PK; URL, alt text, displayOrder, primary | N-1 Product; 1-1 ProductVariant tùy chọn | Ảnh chung của sản phẩm hoặc ảnh đại diện riêng cho biến thể. |
| `Promotion` (`promotions`) | `promotionId` PK; tên, loại/mức giảm, thời gian, active | N-N Category, Product, ProductVariant | Khuyến mại tự động. Phạm vi càng cụ thể được dùng để tính giá hiệu lực theo logic dịch vụ. |
| `Coupon` (`coupons`) | `couponId` PK; code, loại/mức giảm, minOrder, maxDiscount, giới hạn lượt, thời gian, trạng thái, personal | N-N Customer; 1-N Order | Mã giảm giá nhập/chọn ở checkout. Có điều kiện giá trị đơn, thời gian, lượt dùng và khách hàng mục tiêu. |
| `Reservation` (`reservations`) | `reservationId` PK; quantity, status, expiredAt | N-1 Order; N-1 ProductVariant | Giữ hàng cho dòng hàng của đơn POS nháp. Không phải bản ghi bán hàng và không tự thay thế `stockQuantity`. |

## 4. Giỏ hàng, đơn hàng, thanh toán và đổi trả

| Entity (bảng) | Khóa/dữ liệu chính | Quan hệ | Vai trò nghiệp vụ |
|---|---|---|---|
| `Cart` (`carts`) | `cartId` PK; timestamps | 1-1 Customer; 1-N CartItem | Giỏ mua hàng hiện tại của khách. Thêm vào giỏ không đồng nghĩa giữ hàng. |
| `CartItem` (`cart_items`) | `cartItemId` PK; quantity | N-1 Cart; N-1 ProductVariant | Dòng hàng dự kiến mua; giá và tồn phải xác minh lại khi checkout. |
| `Order` (`orders`) | `orderId` PK; orderCode, type, amounts, paymentMethod, status, timestamps | N-1 Customer, Coupon, User; 1-N OrderDetail, Reservation, ReturnRequest, OrderTransactionLog; 1-1 OrderAddress, Payment | Chứng từ bán hàng trung tâm cho online và POS. Chỉ tạo sau khi toàn bộ giá, coupon và tồn đã hợp lệ. |
| `OrderDetail` (`order_details`) | `orderDetailId` PK; quantity, unitPrice, discount, total | N-1 Order; N-1 ProductVariant; 1-1 Review | Ảnh chụp từng dòng hàng tại thời điểm đặt/bán, là căn cứ thanh toán và đổi trả. |
| `OrderAddress` (`order_addresses`) | `orderAddressId` PK; người nhận, điện thoại, địa chỉ đầy đủ | 1-1 Order | Snapshot địa chỉ giao hàng; độc lập với việc khách sửa `Address` sau này. |
| `OrderTransactionLog` (`order_transaction_logs`) | `id` PK; previousStatus, currentStatus, action, note, createdBy, createdAt | N-1 Order | Nhật ký truy vết mọi chuyển trạng thái quan trọng của đơn. |
| `Payment` (`payments`) | `paymentId` PK; amount, method, status, transactionCode, dữ liệu ngân hàng, paidAt, refundedAmount | 1-1 Order | Theo dõi nghĩa vụ thanh toán, callback VNPay và tổng tiền đã hoàn. |
| `ReturnRequest` (`return_requests`) | `returnId` PK + version; type, status, refundAmount, lý do/ảnh, người tạo/xử lý | N-1 Order; N-1 User (`createdBy`, `processedBy`); 1-N ReturnItem, ExchangeItem | Hồ sơ đổi/trả. Dùng optimistic locking để tránh hai nhân viên xử lý đồng thời. |
| `ReturnItem` (`return_items`) | `returnItemId` PK; quantity, refundAmount, reason, condition | N-1 ReturnRequest; N-1 ProductVariant | Mặt hàng khách trả và giá trị hoàn tương ứng. |
| `ExchangeItem` (`exchange_items`) | `exchangeItemId` PK; quantity, priceDifference | N-1 ReturnRequest; N-1 ProductVariant mới | Biến thể giao thay trong yêu cầu đổi hàng và phần chênh lệch cần thu/hoàn. |

## 5. Tương tác, nội dung và hỗ trợ

| Entity (bảng) | Khóa/dữ liệu chính | Quan hệ | Vai trò nghiệp vụ |
|---|---|---|---|
| `Review` (`reviews`) | `reviewId` PK; rating, comment, status, timestamps | N-1 Customer, Product, ProductVariant; 1-1 OrderDetail; 1-N ReviewImage | Đánh giá gắn với mặt hàng đã mua, tránh đánh giá lặp trên cùng chi tiết đơn. |
| `ReviewImage` (`review_images`) | `imageId` PK; URL, displayOrder | N-1 Review | Bằng chứng/hình ảnh đi kèm đánh giá. |
| `Wishlist` (`wishlists`) | `wishlistId` PK; createdAt | N-1 Customer; N-1 ProductVariant | Danh sách biến thể khách quan tâm; không giữ tồn. |
| `Contact` (`contacts`) | `contactId` PK; name, email, phone, subject, message, status | Độc lập | Yêu cầu liên hệ/hỗ trợ từ website. |
| `Conversation` (`conversations`) | `conversationId` PK; status, lastMessageAt | N-1 Customer; N-1 User phụ trách; 1-N Message, ConversationAssignment | Phiên chat hỗ trợ giữa khách và cửa hàng. |
| `Message` (`messages`) | `messageId` PK; content/type, read flag, timestamps | N-1 Conversation; người gửi là Customer hoặc User; N-1 Order tùy chọn | Tin nhắn văn bản/ảnh và có thể đính kèm tham chiếu đơn hàng. |
| `ConversationAssignment` (`conversation_assignments`) | `id` PK; action, assignedAt | N-1 Conversation; N-1 User được giao; N-1 User thực hiện | Lịch sử nhận/chuyển/nhả cuộc hội thoại giữa nhân viên. |
| `Banner` (`banners`) | `bannerId` PK; title, imageUrl, targetUrl, displayOrder, active, thời gian | Độc lập | Nội dung quảng bá trên giao diện. |
| `Post` (`posts`) | `postId` PK; title, slug, summary, content, thumbnail, status, publishedAt | N-1 User tác giả; N-N PostCategory, PostTag | Bài viết/tin tức của cửa hàng. |
| `PostCategory` (`post_categories`) | `categoryId` PK; name, slug | N-N Post | Chuyên mục bài viết, tách biệt với Category sản phẩm. |
| `PostTag` (`post_tags`) | `tagId` PK; name, slug | N-N Post | Nhãn linh hoạt cho bài viết. |

## 6. Bảng nối không có entity riêng

| Bảng nối | Liên kết |
|---|---|
| `coupon_customers` | Coupon N-N Customer |
| `promotion_categories` | Promotion N-N Category |
| `promotion_products` | Promotion N-N Product |
| `promotion_variants` | Promotion N-N ProductVariant |
| `post_category_mapping` | Post N-N PostCategory |
| `post_tag_mapping` | Post N-N PostTag |

## 7. Quy tắc sở hữu tồn kho

`CartItem` và `Wishlist` chỉ thể hiện ý định, không giữ hàng. `Reservation.ACTIVE` thể hiện hàng đang được giữ cho đơn POS nháp. Với đơn online, hệ thống hiện xác nhận tồn đồng thời qua Redis rồi trừ trực tiếp `ProductVariant.stockQuantity` khi tạo đơn; nếu hủy thì hoàn tồn. Vì vậy không được cộng thêm reservation của đơn online vào phép trừ tồn nếu chưa thay đổi kiến trúc.
