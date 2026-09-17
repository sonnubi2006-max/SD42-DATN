# Danh sách Entity để thiết kế ERD trên DrawSQL

Tổng số: **33 entity JPA**

| STT | Entity Java           | Tên bảng                 |
| --: | --------------------- | ------------------------ |
|   1 | `Address`             | `addresses`              |
|   2 | `Banner`              | `banners`                |
|   3 | `Brand`               | `brands`                 |
|   4 | `Cart`                | `carts`                  |
|   5 | `CartItem`            | `cart_items`             |
|   6 | `Category`            | `categories`             |
|   7 | `Contact`             | `contacts`               |
|   8 | `Conversation`        | `conversations`          |
|   9 | `Coupon`              | `coupons`                |
|  10 | `Customer`            | `customers`              |
|  11 | `ExchangeItem`        | `exchange_items`         |
|  12 | `Message`             | `messages`               |
|  13 | `Order`               | `orders`                 |
|  14 | `OrderAddress`        | `order_address`          |
|  15 | `OrderDetail`         | `order_details`          |
|  16 | `OrderTransactionLog` | `order_transaction_logs` |
|  17 | `PasswordResetToken`  | `password_reset_tokens`  |
|  18 | `Payment`             | `payments`               |
|  19 | `Post`                | `posts`                  |
|  20 | `PostCategory`        | `post_categories`        |
|  21 | `PostTag`             | `post_tags`              |
|  22 | `Product`             | `products`               |
|  23 | `ProductImage`        | `product_images`         |
|  24 | `ProductVariant`      | `product_variants`       |
|  25 | `Promotion`           | `promotions`             |
|  26 | `RefreshToken`        | `refresh_tokens`         |
|  27 | `Reservation`         | `reservations`           |
|  28 | `ReturnItem`          | `return_items`           |
|  29 | `ReturnRequest`       | `return_requests`        |
|  30 | `Review`              | `reviews`                |
|  31 | `ReviewImage`         | `review_images`          |
|  32 | `User`                | `users`                  |
|  33 | `Wishlist`            | `wishlists`              |

## Nhóm entity trên DrawSQL

### 1. Người dùng và xác thực

- `Customer`
- `User`
- `Address`
- `RefreshToken`
- `PasswordResetToken`

### 2. Danh mục và sản phẩm

- `Category`
- `Brand`
- `Product`
- `ProductVariant`
- `ProductImage`

### 3. Giỏ hàng và yêu thích

- `Cart`
- `CartItem`
- `Wishlist`

### 4. Đơn hàng và thanh toán

- `Order`
- `OrderDetail`
- `OrderAddress`
- `Payment`
- `Reservation`
- `OrderTransactionLog`

### 5. Khuyến mại

- `Coupon`
- `Promotion`

### 6. Đánh giá

- `Review`
- `ReviewImage`

### 7. Trả và đổi hàng

- `ReturnRequest`
- `ReturnItem`
- `ExchangeItem`

### 8. Trao đổi tin nhắn

- `Conversation`
- `Message`

### 9. Nội dung

- `Post`
- `PostCategory`
- `PostTag`
- `Banner`
- `Contact`

## Entity đã loại bỏ

Các entity sau không còn nằm trong thiết kế:

- `Notification`
- `ReviewReply`
- `Supplier`

## Lưu ý khi tạo bảng trên DrawSQL

Ngoài 33 entity trên, ứng dụng có thể sử dụng các **bảng liên kết** cho quan hệ nhiều-nhiều. Đây là bảng cơ sở dữ liệu, không nhất thiết có class entity Java riêng:

- `coupon_customers`
- `promotion_categories`
- `promotion_products`
- `promotion_variants`
- `post_category_mapping`
- `post_tag_mapping`

Khi thiết kế ERD vật lý trên DrawSQL, nên thêm các bảng liên kết này sau khi tạo xong 33 bảng entity chính.
