

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.users (
        user_id         BIGINT IDENTITY(1,1) NOT NULL,
        user_code       VARCHAR(20) NOT NULL,
        username        NVARCHAR(255) NOT NULL,
        password        NVARCHAR(255) NOT NULL,
        email           NVARCHAR(255) NOT NULL,
        phone           NVARCHAR(255) NULL,
        full_name       NVARCHAR(255) NULL,
        avatar          NVARCHAR(255) NULL,
        gender          NVARCHAR(255) NOT NULL
                            CONSTRAINT DF_users_gender DEFAULT N'MALE'
                            CONSTRAINT CK_users_gender CHECK (gender IN (N'MALE', N'FEMALE')),
        cccd            NVARCHAR(255) NULL,
        birthday        DATE NULL,
        province        NVARCHAR(100) NULL,
        district        NVARCHAR(100) NULL,
        ward            NVARCHAR(100) NULL,
        street_address  NVARCHAR(255) NULL,
        status          NVARCHAR(255) NOT NULL
                            CONSTRAINT DF_users_status DEFAULT N'ACTIVE',
        role            NVARCHAR(255) NOT NULL
                            CONSTRAINT DF_users_role DEFAULT N'STAFF',
        created_at      DATETIME2(6) NULL
                            CONSTRAINT DF_users_created_at DEFAULT SYSDATETIME(),
        updated_at      DATETIME2(6) NULL
                            CONSTRAINT DF_users_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_users PRIMARY KEY (user_id),
        CONSTRAINT UK_users_user_code UNIQUE (user_code),
        CONSTRAINT UK_users_username UNIQUE (username),
        CONSTRAINT UK_users_email UNIQUE (email),
        CONSTRAINT UK_users_phone UNIQUE (phone),
        CONSTRAINT UK_users_cccd UNIQUE (cccd)
    );

    CREATE TABLE dbo.customers (
        customer_id       BIGINT IDENTITY(1,1) NOT NULL,
        customer_code     VARCHAR(20) NOT NULL,
        email             NVARCHAR(255) NOT NULL,
        password          NVARCHAR(255) NULL,
        full_name         NVARCHAR(255) NULL,
        phone             NVARCHAR(255) NULL,
        gender            NVARCHAR(255) NOT NULL
                              CONSTRAINT DF_customers_gender DEFAULT N'MALE'
                              CONSTRAINT CK_customers_gender CHECK (gender IN (N'MALE', N'FEMALE')),
        birthday          DATE NULL,
        avatar            NVARCHAR(255) NULL,
        role              NVARCHAR(255) NOT NULL
                              CONSTRAINT DF_customers_role DEFAULT N'USER',
        source            NVARCHAR(255) NOT NULL
                              CONSTRAINT DF_customers_source DEFAULT N'GUEST',
        email_subscribed  BIT NOT NULL
                              CONSTRAINT DF_customers_email_subscribed DEFAULT 1,
        status            NVARCHAR(255) NOT NULL
                              CONSTRAINT DF_customers_status DEFAULT N'ACTIVE',
        created_at        DATETIME2(6) NULL
                              CONSTRAINT DF_customers_created_at DEFAULT SYSDATETIME(),
        updated_at        DATETIME2(6) NULL
                              CONSTRAINT DF_customers_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_customers PRIMARY KEY (customer_id),
        CONSTRAINT UK_customers_customer_code UNIQUE (customer_code),
        CONSTRAINT UK_customers_email UNIQUE (email)
    );

    CREATE TABLE dbo.addresses (
        address_id       BIGINT IDENTITY(1,1) NOT NULL,
        customer_id      BIGINT NOT NULL,
        receiver_name    NVARCHAR(100) NULL,
        receiver_phone   NVARCHAR(255) NULL,
        province         NVARCHAR(100) NULL,
        district         NVARCHAR(100) NULL,
        ward             NVARCHAR(100) NULL,
        ghn_province_id  INT NULL,
        ghn_district_id  INT NULL,
        ghn_ward_code    NVARCHAR(20) NULL,
        province_name    NVARCHAR(100) NULL,
        district_name    NVARCHAR(100) NULL,
        ward_name        NVARCHAR(100) NULL,
        street_address   NVARCHAR(255) NULL,
        note             NVARCHAR(MAX) NULL,
        is_default       BIT NOT NULL
                             CONSTRAINT DF_addresses_is_default DEFAULT 0,
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_addresses_created_at DEFAULT SYSDATETIME(),
        updated_at       DATETIME2(6) NULL
                             CONSTRAINT DF_addresses_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_addresses PRIMARY KEY (address_id),
        CONSTRAINT FK_addresses_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id)
    );

    CREATE TABLE dbo.password_reset_tokens (
        id            BIGINT IDENTITY(1,1) NOT NULL,
        token         NVARCHAR(255) NOT NULL,
        email         NVARCHAR(255) NOT NULL,
        account_type  NVARCHAR(255) NOT NULL,
        expiry_date   DATETIME2(6) NOT NULL,
        used          BIT NOT NULL
                          CONSTRAINT DF_password_reset_tokens_used DEFAULT 0,

        CONSTRAINT PK_password_reset_tokens PRIMARY KEY (id),
        CONSTRAINT UK_password_reset_tokens_token UNIQUE (token)
    );

    CREATE TABLE dbo.refresh_tokens (
        id           BIGINT IDENTITY(1,1) NOT NULL,
        user_id      BIGINT NULL,
        customer_id  BIGINT NULL,
        token        NVARCHAR(255) NOT NULL,
        expiry_date  DATETIME2(6) NOT NULL,

        CONSTRAINT PK_refresh_tokens PRIMARY KEY (id),
        CONSTRAINT UK_refresh_tokens_token UNIQUE (token),
        CONSTRAINT FK_refresh_tokens_users
            FOREIGN KEY (user_id) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_refresh_tokens_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id),
        CONSTRAINT CK_refresh_tokens_owner
            CHECK (user_id IS NOT NULL OR customer_id IS NOT NULL)
    );

    CREATE TABLE dbo.categories (
        category_id           BIGINT IDENTITY(1,1) NOT NULL,
        category_name         NVARCHAR(255) NOT NULL,
        category_code         NVARCHAR(50) NULL,
        category_description  NVARCHAR(255) NULL,
        category_status       NVARCHAR(255) NOT NULL
                                  CONSTRAINT DF_categories_status DEFAULT N'ACTIVE',
        created_at            DATETIME2(6) NULL
                                  CONSTRAINT DF_categories_created_at DEFAULT SYSDATETIME(),
        updated_at            DATETIME2(6) NULL
                                  CONSTRAINT DF_categories_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_categories PRIMARY KEY (category_id)
    );

    CREATE TABLE dbo.brands (
        brand_id      BIGINT IDENTITY(1,1) NOT NULL,
        brand_name    NVARCHAR(255) NOT NULL,
        brand_code    NVARCHAR(50) NULL,
        brand_logo    NVARCHAR(255) NULL,
        brand_status  NVARCHAR(255) NOT NULL
                          CONSTRAINT DF_brands_status DEFAULT N'INACTIVE',
        created_at    DATETIME2(6) NULL
                          CONSTRAINT DF_brands_created_at DEFAULT SYSDATETIME(),
        updated_at    DATETIME2(6) NULL
                          CONSTRAINT DF_brands_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_brands PRIMARY KEY (brand_id)
    );

    CREATE TABLE dbo.products (
        product_id      BIGINT IDENTITY(1,1) NOT NULL,
        product_name    NVARCHAR(255) NOT NULL,
        product_slug    NVARCHAR(255) NOT NULL,
        product_code    NVARCHAR(255) NOT NULL,
        description     NVARCHAR(MAX) NULL,
        average_rating  DECIMAL(3,2) NOT NULL
                            CONSTRAINT DF_products_average_rating DEFAULT 0,
        category_id     BIGINT NULL,
        brand_id        BIGINT NULL,
        status          NVARCHAR(255) NOT NULL
                            CONSTRAINT DF_products_status DEFAULT N'INACTIVE',
        created_at      DATETIME2(6) NULL
                            CONSTRAINT DF_products_created_at DEFAULT SYSDATETIME(),
        updated_at      DATETIME2(6) NULL
                            CONSTRAINT DF_products_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_products PRIMARY KEY (product_id),
        CONSTRAINT UK_products_slug UNIQUE (product_slug),
        CONSTRAINT UK_products_code UNIQUE (product_code),
        CONSTRAINT FK_products_categories
            FOREIGN KEY (category_id) REFERENCES dbo.categories(category_id),
        CONSTRAINT FK_products_brands
            FOREIGN KEY (brand_id) REFERENCES dbo.brands(brand_id)
    );

    CREATE TABLE dbo.product_variants (
        variant_id      BIGINT IDENTITY(1,1) NOT NULL,
        version         BIGINT NOT NULL
                            CONSTRAINT DF_product_variants_version DEFAULT 0,
        variant_code    NVARCHAR(255) NOT NULL,
        product_id      BIGINT NOT NULL,
        barcode         NVARCHAR(255) NULL,
        size            NVARCHAR(25) NULL,
        color           NVARCHAR(25) NULL,
        price           DECIMAL(15,2) NULL,
        created_at      DATETIME2(6) NULL
                            CONSTRAINT DF_product_variants_created_at DEFAULT SYSDATETIME(),
        updated_at      DATETIME2(6) NULL
                            CONSTRAINT DF_product_variants_updated_at DEFAULT SYSDATETIME(),
        status          NVARCHAR(255) NOT NULL
                            CONSTRAINT DF_product_variants_status DEFAULT N'INACTIVE',
        stock_quantity  INT NOT NULL
                            CONSTRAINT DF_product_variants_stock DEFAULT 0,

        CONSTRAINT PK_product_variants PRIMARY KEY (variant_id),
        CONSTRAINT UK_product_variants_code UNIQUE (variant_code),
        CONSTRAINT UK_product_variants_barcode UNIQUE (barcode),
        CONSTRAINT UK_product_variant UNIQUE (product_id, size, color),
        CONSTRAINT FK_product_variants_products
            FOREIGN KEY (product_id) REFERENCES dbo.products(product_id)
    );

    CREATE TABLE dbo.product_images (
        image_id    BIGINT IDENTITY(1,1) NOT NULL,
        product_id  BIGINT NULL,
        variant_id  BIGINT NULL,
        image_url   NVARCHAR(255) NOT NULL,
        thumbnail   BIT NOT NULL
                        CONSTRAINT DF_product_images_thumbnail DEFAULT 0,
        created_at  DATETIME2(6) NULL
                        CONSTRAINT DF_product_images_created_at DEFAULT SYSDATETIME(),
        updated_at  DATETIME2(6) NULL
                        CONSTRAINT DF_product_images_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_product_images PRIMARY KEY (image_id),
        CONSTRAINT UK_product_images_variant UNIQUE (variant_id),
        CONSTRAINT FK_product_images_products
            FOREIGN KEY (product_id) REFERENCES dbo.products(product_id),
        CONSTRAINT FK_product_images_variants
            FOREIGN KEY (variant_id) REFERENCES dbo.product_variants(variant_id)
    );

    CREATE TABLE dbo.carts (
        cart_id      BIGINT IDENTITY(1,1) NOT NULL,
        customer_id  BIGINT NOT NULL,
        created_at   DATETIME2(6) NULL
                         CONSTRAINT DF_carts_created_at DEFAULT SYSDATETIME(),
        updated_at   DATETIME2(6) NULL
                         CONSTRAINT DF_carts_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_carts PRIMARY KEY (cart_id),
        CONSTRAINT UK_carts_customer UNIQUE (customer_id),
        CONSTRAINT FK_carts_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id)
    );

    CREATE TABLE dbo.cart_items (
        cart_item_id  BIGINT IDENTITY(1,1) NOT NULL,
        cart_id       BIGINT NOT NULL,
        variant_id    BIGINT NOT NULL,
        quantity      INT NOT NULL,
        price         DECIMAL(38,2) NULL,
        created_at    DATETIME2(6) NULL
                          CONSTRAINT DF_cart_items_created_at DEFAULT SYSDATETIME(),
        updated_at    DATETIME2(6) NULL
                          CONSTRAINT DF_cart_items_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_cart_items PRIMARY KEY (cart_item_id),
        CONSTRAINT UK_cart_items_cart_variant UNIQUE (cart_id, variant_id),
        CONSTRAINT FK_cart_items_carts
            FOREIGN KEY (cart_id) REFERENCES dbo.carts(cart_id),
        CONSTRAINT FK_cart_items_variants
            FOREIGN KEY (variant_id) REFERENCES dbo.product_variants(variant_id),
        CONSTRAINT CK_cart_items_quantity CHECK (quantity > 0)
    );

    CREATE TABLE dbo.wishlists (
        wishlist_id  BIGINT IDENTITY(1,1) NOT NULL,
        customer_id  BIGINT NOT NULL,
        variant_id   BIGINT NOT NULL,
        created_at   DATETIME2(6) NULL
                         CONSTRAINT DF_wishlists_created_at DEFAULT SYSDATETIME(),
        updated_at   DATETIME2(6) NULL
                         CONSTRAINT DF_wishlists_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_wishlists PRIMARY KEY (wishlist_id),
        CONSTRAINT UK_wishlists_customer_variant UNIQUE (customer_id, variant_id),
        CONSTRAINT FK_wishlists_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id),
        CONSTRAINT FK_wishlists_variants
            FOREIGN KEY (variant_id) REFERENCES dbo.product_variants(variant_id)
    );

    CREATE TABLE dbo.coupons (
        coupon_id           BIGINT IDENTITY(1,1) NOT NULL,
        code                NVARCHAR(50) NOT NULL,
        description         NVARCHAR(255) NOT NULL,
        discount_type       NVARCHAR(255) NOT NULL,
        discount_value      DECIMAL(15,2) NOT NULL,
        max_discount_amount DECIMAL(15,2) NULL,
        min_order_value     DECIMAL(15,2) NULL,
        total_quantity      INT NULL,
        used_quantity       INT NOT NULL
                                CONSTRAINT DF_coupons_used_quantity DEFAULT 0,
        max_uses_per_user   INT NULL,
        start_date          DATETIME2(6) NULL,
        end_date            DATETIME2(6) NULL,
        status              NVARCHAR(255) NOT NULL
                                CONSTRAINT DF_coupons_status DEFAULT N'ACTIVE',
        coupon_type         NVARCHAR(255) NOT NULL
                                CONSTRAINT DF_coupons_type DEFAULT N'PUBLIC',
        created_at          DATETIME2(6) NULL
                                CONSTRAINT DF_coupons_created_at DEFAULT SYSDATETIME(),
        updated_at          DATETIME2(6) NULL
                                CONSTRAINT DF_coupons_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_coupons PRIMARY KEY (coupon_id),
        CONSTRAINT UK_coupons_code UNIQUE (code),
        CONSTRAINT CK_coupons_quantities CHECK (
            used_quantity >= 0
            AND (total_quantity IS NULL OR total_quantity >= 0)
        )
    );

    CREATE TABLE dbo.coupon_customers (
        coupon_id    BIGINT NOT NULL,
        customer_id  BIGINT NOT NULL,

        CONSTRAINT PK_coupon_customers PRIMARY KEY (coupon_id, customer_id),
        CONSTRAINT FK_coupon_customers_coupons
            FOREIGN KEY (coupon_id) REFERENCES dbo.coupons(coupon_id),
        CONSTRAINT FK_coupon_customers_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id)
    );

    CREATE TABLE dbo.promotions (
        promotion_id        BIGINT IDENTITY(1,1) NOT NULL,
        promotion_code      VARCHAR(20) NOT NULL,
        name                NVARCHAR(255) NOT NULL,
        description         NVARCHAR(MAX) NULL,
        discount_type       NVARCHAR(255) NOT NULL,
        discount_value      DECIMAL(15,2) NOT NULL,
        max_discount_amount DECIMAL(15,2) NULL,
        apply_type          NVARCHAR(255) NOT NULL,
        start_date          DATETIME2(6) NOT NULL,
        end_date            DATETIME2(6) NOT NULL,
        status              NVARCHAR(255) NOT NULL
                                CONSTRAINT DF_promotions_status DEFAULT N'UPCOMING',
        created_at          DATETIME2(6) NULL
                                CONSTRAINT DF_promotions_created_at DEFAULT SYSDATETIME(),
        updated_at          DATETIME2(6) NULL
                                CONSTRAINT DF_promotions_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_promotions PRIMARY KEY (promotion_id),
        CONSTRAINT UK_promotions_promotion_code UNIQUE (promotion_code),
        CONSTRAINT CK_promotions_dates CHECK (end_date >= start_date)
    );

    CREATE TABLE dbo.promotion_categories (
        promotion_id  BIGINT NOT NULL,
        category_id   BIGINT NOT NULL,

        CONSTRAINT PK_promotion_categories PRIMARY KEY (promotion_id, category_id),
        CONSTRAINT FK_promotion_categories_promotions
            FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(promotion_id),
        CONSTRAINT FK_promotion_categories_categories
            FOREIGN KEY (category_id) REFERENCES dbo.categories(category_id)
    );

    CREATE TABLE dbo.promotion_products (
        promotion_id  BIGINT NOT NULL,
        product_id    BIGINT NOT NULL,

        CONSTRAINT PK_promotion_products PRIMARY KEY (promotion_id, product_id),
        CONSTRAINT FK_promotion_products_promotions
            FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(promotion_id),
        CONSTRAINT FK_promotion_products_products
            FOREIGN KEY (product_id) REFERENCES dbo.products(product_id)
    );

    CREATE TABLE dbo.promotion_variants (
        promotion_id  BIGINT NOT NULL,
        variant_id    BIGINT NOT NULL,

        CONSTRAINT PK_promotion_variants PRIMARY KEY (promotion_id, variant_id),
        CONSTRAINT FK_promotion_variants_promotions
            FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(promotion_id),
        CONSTRAINT FK_promotion_variants_variants
            FOREIGN KEY (variant_id) REFERENCES dbo.product_variants(variant_id)
    );

    CREATE TABLE dbo.orders (
        order_id         BIGINT IDENTITY(1,1) NOT NULL,
        customer_id      BIGINT NULL,
        guest_name       NVARCHAR(100) NULL,
        guest_email      NVARCHAR(254) NULL,
        guest_phone      NVARCHAR(20) NULL,
        coupon_id        BIGINT NULL,
        coupon_code      NVARCHAR(255) NULL,
        staff_id         BIGINT NULL,
        order_code       NVARCHAR(255) NOT NULL,
        order_type       NVARCHAR(255) NULL,
        order_date       DATETIME2(6) NOT NULL
                             CONSTRAINT DF_orders_order_date DEFAULT SYSDATETIME(),
        total_amount     DECIMAL(15,2) NULL,
        discount_amount  DECIMAL(15,2) NOT NULL
                             CONSTRAINT DF_orders_discount_amount DEFAULT 0,
        shipping_fee     DECIMAL(15,2) NOT NULL
                             CONSTRAINT DF_orders_shipping_fee DEFAULT 0,
        final_amount     DECIMAL(15,2) NULL,
        payment_method   NVARCHAR(255) NULL,
        order_status     NVARCHAR(255) NOT NULL
                             CONSTRAINT DF_orders_status DEFAULT N'CONFIRMED',
        note             NVARCHAR(MAX) NULL,
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_orders_created_at DEFAULT SYSDATETIME(),
        updated_at       DATETIME2(6) NULL
                             CONSTRAINT DF_orders_updated_at DEFAULT SYSDATETIME(),
        completed_at     DATETIME2(6) NULL,

        CONSTRAINT PK_orders PRIMARY KEY (order_id),
        CONSTRAINT UK_orders_code UNIQUE (order_code),
        CONSTRAINT CK_orders_order_status CHECK (
            order_status IN (
                N'DRAFT', N'WAITING_PAYMENT', N'PENDING', N'WAITING_STOCK', N'CONFIRMED',
                N'SHIPPING', N'RETURNING', N'RETURNED_TO_SHOP',
                N'CANCELED_BY_DAMAGED', N'FAILED_DELIVERY', N'COMPLETED',
                N'CANCELLED', N'REFUNDED'
            )
        ),
        CONSTRAINT FK_orders_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id),
        CONSTRAINT FK_orders_coupons
            FOREIGN KEY (coupon_id) REFERENCES dbo.coupons(coupon_id),
        CONSTRAINT FK_orders_users
            FOREIGN KEY (staff_id) REFERENCES dbo.users(user_id)
    );

    CREATE TABLE dbo.order_address (
        order_address_id  BIGINT IDENTITY(1,1) NOT NULL,
        receiver_name     NVARCHAR(100) NULL,
        receiver_phone    NVARCHAR(255) NULL,
        province          NVARCHAR(100) NULL,
        district          NVARCHAR(100) NULL,
        ward              NVARCHAR(100) NULL,
        detail_address    NVARCHAR(255) NULL,
        note              NVARCHAR(MAX) NULL,
        order_id          BIGINT NOT NULL,

        CONSTRAINT PK_order_address PRIMARY KEY (order_address_id),
        CONSTRAINT UK_order_address_order UNIQUE (order_id),
        CONSTRAINT FK_order_address_orders
            FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id)
    );

    CREATE TABLE dbo.order_details (
        order_detail_id  BIGINT IDENTITY(1,1) NOT NULL,
        order_id         BIGINT NOT NULL,
        variant_id       BIGINT NULL,
        product_name     NVARCHAR(255) NOT NULL,
        image_url        NVARCHAR(255) NULL,
        size             NVARCHAR(25) NOT NULL,
        color            NVARCHAR(25) NOT NULL,
        quantity         INT NOT NULL,
        damaged_quantity INT NOT NULL
                             CONSTRAINT DF_order_details_damaged_quantity DEFAULT 0,
        price            DECIMAL(15,2) NOT NULL,
        sale_price       DECIMAL(15,2) NULL,
        subtotal         DECIMAL(15,2) NOT NULL,
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_order_details_created_at DEFAULT SYSDATETIME(),
        updated_at       DATETIME2(6) NULL
                             CONSTRAINT DF_order_details_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_order_details PRIMARY KEY (order_detail_id),
        CONSTRAINT FK_order_details_orders
            FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id),
        CONSTRAINT FK_order_details_variants
            FOREIGN KEY (variant_id) REFERENCES dbo.product_variants(variant_id),
        CONSTRAINT CK_order_details_quantity CHECK (quantity > 0),
        CONSTRAINT CK_order_details_damaged_quantity
            CHECK (damaged_quantity >= 0 AND damaged_quantity <= quantity)
    );

    CREATE TABLE dbo.order_transaction_logs (
        log_id           BIGINT IDENTITY(1,1) NOT NULL,
        order_id         BIGINT NOT NULL,
        previous_status  NVARCHAR(255) NULL,
        current_status   NVARCHAR(255) NOT NULL,
        action           NVARCHAR(255) NULL,
        note             NVARCHAR(MAX) NULL,
        created_by       NVARCHAR(255) NULL,
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_order_logs_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_order_transaction_logs PRIMARY KEY (log_id),
        CONSTRAINT CK_order_transaction_logs_previous_status CHECK (
            previous_status IS NULL OR previous_status IN (
                N'DRAFT', N'WAITING_PAYMENT', N'PENDING', N'WAITING_STOCK', N'CONFIRMED',
                N'SHIPPING', N'RETURNING', N'RETURNED_TO_SHOP',
                N'CANCELED_BY_DAMAGED', N'FAILED_DELIVERY', N'COMPLETED',
                N'CANCELLED', N'REFUNDED'
            )
        ),
        CONSTRAINT CK_order_transaction_logs_current_status CHECK (
            current_status IN (
                N'DRAFT', N'WAITING_PAYMENT', N'PENDING', N'WAITING_STOCK', N'CONFIRMED',
                N'SHIPPING', N'RETURNING', N'RETURNED_TO_SHOP',
                N'CANCELED_BY_DAMAGED', N'FAILED_DELIVERY', N'COMPLETED',
                N'CANCELLED', N'REFUNDED'
            )
        ),
        CONSTRAINT FK_order_transaction_logs_orders
            FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id)
    );

    CREATE TABLE dbo.order_transaction_log_images (
        image_id         BIGINT IDENTITY(1,1) NOT NULL,
        log_id           BIGINT NOT NULL,
        image_url        NVARCHAR(1000) NOT NULL,
        cloud_public_id  NVARCHAR(500) NULL,
        original_name    NVARCHAR(255) NULL,
        content_type     NVARCHAR(100) NULL,
        file_size        BIGINT NULL,
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_order_log_images_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_order_transaction_log_images PRIMARY KEY (image_id),
        CONSTRAINT FK_order_log_images_logs
            FOREIGN KEY (log_id) REFERENCES dbo.order_transaction_logs(log_id)
            ON DELETE CASCADE,
        CONSTRAINT CK_order_log_images_file_size
            CHECK (file_size IS NULL OR file_size >= 0)
    );

    CREATE INDEX IX_order_transaction_log_images_log_id
        ON dbo.order_transaction_log_images(log_id);

    CREATE TABLE dbo.payments (
        payment_id        BIGINT IDENTITY(1,1) NOT NULL,
        order_id          BIGINT NOT NULL,
        amount            DECIMAL(15,2) NOT NULL,
        payment_method    NVARCHAR(255) NULL,
        payment_status    NVARCHAR(255) NOT NULL
                              CONSTRAINT DF_payments_status DEFAULT N'PENDING',
        transaction_code  NVARCHAR(255) NULL,
        bank_code         NVARCHAR(20) NULL,
        card_type         NVARCHAR(20) NULL,
        vnp_response_code NVARCHAR(10) NULL,
        paid_at           DATETIME2(6) NULL,
        refunded_amount   DECIMAL(15,2) NOT NULL
                              CONSTRAINT DF_payments_refunded_amount DEFAULT (0),
        created_at        DATETIME2(6) NULL
                              CONSTRAINT DF_payments_created_at DEFAULT SYSDATETIME(),
        updated_at        DATETIME2(6) NULL
                              CONSTRAINT DF_payments_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_payments PRIMARY KEY (payment_id),
        CONSTRAINT UK_payments_order UNIQUE (order_id),
        CONSTRAINT FK_payments_orders
            FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id)
    );

    CREATE TABLE dbo.reservations (
        reservation_id  BIGINT IDENTITY(1,1) NOT NULL,
        order_id        BIGINT NOT NULL,
        variant_id      BIGINT NULL,
        quantity        INT NOT NULL,
        status          NVARCHAR(255) NOT NULL
                            CONSTRAINT DF_reservations_status DEFAULT N'ACTIVE',
        expired_at      DATETIME2(6) NULL,
        created_at      DATETIME2(6) NULL
                            CONSTRAINT DF_reservations_created_at DEFAULT SYSDATETIME(),
        updated_at      DATETIME2(6) NULL
                            CONSTRAINT DF_reservations_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_reservations PRIMARY KEY (reservation_id),
        CONSTRAINT FK_reservations_orders
            FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id),
        CONSTRAINT FK_reservations_variants
            FOREIGN KEY (variant_id) REFERENCES dbo.product_variants(variant_id),
        CONSTRAINT CK_reservations_quantity CHECK (quantity > 0)
    );

    CREATE TABLE dbo.reviews (
        review_id       BIGINT IDENTITY(1,1) NOT NULL,
        customer_id     BIGINT NOT NULL,
        product_id      BIGINT NOT NULL,
        variant_id      BIGINT NULL,
        order_detail_id BIGINT NULL,
        rating          INT NOT NULL,
        comment         NVARCHAR(MAX) NULL,
        size_feedback   NVARCHAR(MAX) NULL,
        status          NVARCHAR(255) NOT NULL
                              CONSTRAINT DF_reviews_status DEFAULT N'APPROVED',
        created_at      DATETIME2(6) NULL
                            CONSTRAINT DF_reviews_created_at DEFAULT SYSDATETIME(),
        updated_at      DATETIME2(6) NULL
                            CONSTRAINT DF_reviews_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_reviews PRIMARY KEY (review_id),
        CONSTRAINT UK_reviews_order_detail UNIQUE (order_detail_id),
        CONSTRAINT FK_reviews_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id),
        CONSTRAINT FK_reviews_products
            FOREIGN KEY (product_id) REFERENCES dbo.products(product_id),
        CONSTRAINT FK_reviews_variants
            FOREIGN KEY (variant_id) REFERENCES dbo.product_variants(variant_id),
        CONSTRAINT FK_reviews_order_details
            FOREIGN KEY (order_detail_id) REFERENCES dbo.order_details(order_detail_id),
        CONSTRAINT CK_reviews_rating CHECK (rating BETWEEN 1 AND 5)
    );

    CREATE TABLE dbo.review_images (
        review_image_id  BIGINT IDENTITY(1,1) NOT NULL,
        review_id        BIGINT NOT NULL,
        image_url        NVARCHAR(255) NOT NULL,
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_review_images_created_at DEFAULT SYSDATETIME(),
        updated_at       DATETIME2(6) NULL
                             CONSTRAINT DF_review_images_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_review_images PRIMARY KEY (review_image_id),
        CONSTRAINT FK_review_images_reviews
            FOREIGN KEY (review_id) REFERENCES dbo.reviews(review_id)
    );

    CREATE TABLE dbo.return_requests (
        return_id         BIGINT IDENTITY(1,1) NOT NULL,
        version           BIGINT NOT NULL
                              CONSTRAINT DF_return_requests_version DEFAULT 0,
        order_id          BIGINT NOT NULL,
        order_code        NVARCHAR(255) NOT NULL,
        customer_name     NVARCHAR(55) NOT NULL,
        customer_phone    NVARCHAR(255) NULL,
        refund_amount     DECIMAL(15,2) NOT NULL,
        status            NVARCHAR(255) NOT NULL
                              CONSTRAINT DF_return_requests_status DEFAULT N'PENDING',
        return_type       NVARCHAR(255) NOT NULL
                              CONSTRAINT DF_return_requests_type DEFAULT N'REFUND',
        note              NVARCHAR(MAX) NULL,
        reject_reason     NVARCHAR(MAX) NULL,
        images            NVARCHAR(MAX) NULL,
        processed_images  NVARCHAR(MAX) NULL,
        created_by        BIGINT NULL,
        processed_by      BIGINT NULL,
        created_at        DATETIME2(6) NULL
                              CONSTRAINT DF_return_requests_created_at DEFAULT SYSDATETIME(),
        updated_at        DATETIME2(6) NULL
                              CONSTRAINT DF_return_requests_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_return_requests PRIMARY KEY (return_id),
        CONSTRAINT FK_return_requests_orders
            FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id),
        CONSTRAINT FK_return_requests_created_by
            FOREIGN KEY (created_by) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_return_requests_processed_by
            FOREIGN KEY (processed_by) REFERENCES dbo.users(user_id)
    );

    CREATE TABLE dbo.return_items (
        return_item_id   BIGINT IDENTITY(1,1) NOT NULL,
        return_id        BIGINT NOT NULL,
        variant_id       BIGINT NOT NULL,
        product_id       BIGINT NULL,
        product_name     NVARCHAR(255) NOT NULL,
        sku              NVARCHAR(255) NULL,
        color            NVARCHAR(25) NULL,
        size             NVARCHAR(25) NULL,
        quantity         INT NOT NULL,
        damaged_quantity INT NULL
                             CONSTRAINT DF_return_items_damaged_quantity DEFAULT 0,
        original_price   DECIMAL(15,2) NOT NULL,
        refund_price     DECIMAL(15,2) NOT NULL,
        reason           NVARCHAR(MAX) NULL,

        CONSTRAINT PK_return_items PRIMARY KEY (return_item_id),
        CONSTRAINT FK_return_items_requests
            FOREIGN KEY (return_id) REFERENCES dbo.return_requests(return_id),
        CONSTRAINT FK_return_items_variants
            FOREIGN KEY (variant_id) REFERENCES dbo.product_variants(variant_id),
        CONSTRAINT CK_return_items_quantities CHECK (
            quantity > 0
            AND ISNULL(damaged_quantity, 0) >= 0
            AND ISNULL(damaged_quantity, 0) <= quantity
        )
    );

    CREATE TABLE dbo.exchange_items (
        exchange_item_id  BIGINT IDENTITY(1,1) NOT NULL,
        return_id         BIGINT NOT NULL,
        new_variant_id    BIGINT NOT NULL,
        new_product_name  NVARCHAR(255) NOT NULL,
        new_color         NVARCHAR(25) NULL,
        new_size          NVARCHAR(25) NULL,
        new_quantity      INT NOT NULL,
        price_difference  DECIMAL(15,2) NOT NULL
                              CONSTRAINT DF_exchange_items_price_difference DEFAULT 0,

        CONSTRAINT PK_exchange_items PRIMARY KEY (exchange_item_id),
        CONSTRAINT FK_exchange_items_requests
            FOREIGN KEY (return_id) REFERENCES dbo.return_requests(return_id),
        CONSTRAINT FK_exchange_items_variants
            FOREIGN KEY (new_variant_id) REFERENCES dbo.product_variants(variant_id),
        CONSTRAINT CK_exchange_items_quantity CHECK (new_quantity > 0)
    );

    CREATE TABLE dbo.conversations (
        conversation_id    BIGINT IDENTITY(1,1) NOT NULL,
        customer_id        BIGINT NOT NULL,
        staff_id           BIGINT NULL,
        status             NVARCHAR(255) NOT NULL
                               CONSTRAINT DF_conversations_status DEFAULT N'PENDING',
        title              NVARCHAR(255) NOT NULL,
        last_message       VARCHAR(MAX) NULL,
        last_message_at    DATETIME2(6) NULL,
        unread_count_staff INT NOT NULL
                               CONSTRAINT DF_conversations_unread_staff DEFAULT 0,
        unread_count_user  INT NOT NULL
                               CONSTRAINT DF_conversations_unread_user DEFAULT 0,
        created_at         DATETIME2(6) NULL
                               CONSTRAINT DF_conversations_created_at DEFAULT SYSDATETIME(),
        updated_at         DATETIME2(6) NULL
                               CONSTRAINT DF_conversations_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_conversations PRIMARY KEY (conversation_id),
        CONSTRAINT FK_conversations_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id),
        CONSTRAINT FK_conversations_users
            FOREIGN KEY (staff_id) REFERENCES dbo.users(user_id)
    );

    CREATE TABLE dbo.messages (
        message_id       BIGINT IDENTITY(1,1) NOT NULL,
        conversation_id  BIGINT NOT NULL,
        customer_id      BIGINT NULL,
        user_id          BIGINT NULL,
        message_type     NVARCHAR(255) NOT NULL
                             CONSTRAINT DF_messages_type DEFAULT N'TEXT',
        message_content  VARCHAR(MAX) NULL,
        image_url        NVARCHAR(255) NULL,
        deleted          BIT NOT NULL
                             CONSTRAINT DF_messages_deleted DEFAULT 0,
        is_read          BIT NOT NULL
                             CONSTRAINT DF_messages_is_read DEFAULT 0,
        read_at          DATETIME2(6) NULL,
        sent_at          DATETIME2(6) NULL
                             CONSTRAINT DF_messages_sent_at DEFAULT SYSDATETIME(),
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_messages_created_at DEFAULT SYSDATETIME(),
        updated_at       DATETIME2(6) NULL
                             CONSTRAINT DF_messages_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_messages PRIMARY KEY (message_id),
        CONSTRAINT FK_messages_conversations
            FOREIGN KEY (conversation_id) REFERENCES dbo.conversations(conversation_id),
        CONSTRAINT FK_messages_customers
            FOREIGN KEY (customer_id) REFERENCES dbo.customers(customer_id),
        CONSTRAINT FK_messages_users
            FOREIGN KEY (user_id) REFERENCES dbo.users(user_id),
        CONSTRAINT CK_messages_message_type
            CHECK (message_type IN (N'TEXT', N'IMAGE', N'ORDER')),
        CONSTRAINT CK_messages_sender
            CHECK (
                (customer_id IS NOT NULL AND user_id IS NULL)
                OR (customer_id IS NULL AND user_id IS NOT NULL)
            )
    );

    CREATE TABLE dbo.post_categories (
        post_category_id BIGINT IDENTITY(1,1) NOT NULL,
        category_name    NVARCHAR(255) NOT NULL,
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_post_categories_created_at DEFAULT SYSDATETIME(),
        updated_at       DATETIME2(6) NULL
                             CONSTRAINT DF_post_categories_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_post_categories PRIMARY KEY (post_category_id),
        CONSTRAINT UK_post_categories_name UNIQUE (category_name)
    );

    CREATE TABLE dbo.post_tags (
        tag_id      BIGINT IDENTITY(1,1) NOT NULL,
        tag_name    NVARCHAR(255) NOT NULL,
        created_at  DATETIME2(6) NULL
                        CONSTRAINT DF_post_tags_created_at DEFAULT SYSDATETIME(),
        updated_at  DATETIME2(6) NULL
                        CONSTRAINT DF_post_tags_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_post_tags PRIMARY KEY (tag_id),
        CONSTRAINT UK_post_tags_name UNIQUE (tag_name)
    );

    CREATE TABLE dbo.posts (
        post_id     BIGINT IDENTITY(1,1) NOT NULL,
        author_id   BIGINT NOT NULL,
        title       NVARCHAR(255) NOT NULL,
        slug        NVARCHAR(255) NOT NULL,
        thumbnail   NVARCHAR(255) NULL,
        summary     NVARCHAR(MAX) NULL,
        content     NVARCHAR(MAX) NULL,
        status      NVARCHAR(255) NOT NULL
                        CONSTRAINT DF_posts_status DEFAULT N'DRAFT',
        view_count  INT NOT NULL
                        CONSTRAINT DF_posts_view_count DEFAULT 0,
        created_at  DATETIME2(6) NULL
                        CONSTRAINT DF_posts_created_at DEFAULT SYSDATETIME(),
        updated_at  DATETIME2(6) NULL
                        CONSTRAINT DF_posts_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_posts PRIMARY KEY (post_id),
        CONSTRAINT UK_posts_slug UNIQUE (slug),
        CONSTRAINT FK_posts_users
            FOREIGN KEY (author_id) REFERENCES dbo.users(user_id)
    );

    CREATE TABLE dbo.post_category_mapping (
        post_id           BIGINT NOT NULL,
        post_category_id  BIGINT NOT NULL,

        CONSTRAINT PK_post_category_mapping
            PRIMARY KEY (post_id, post_category_id),
        CONSTRAINT FK_post_category_mapping_posts
            FOREIGN KEY (post_id) REFERENCES dbo.posts(post_id),
        CONSTRAINT FK_post_category_mapping_categories
            FOREIGN KEY (post_category_id)
            REFERENCES dbo.post_categories(post_category_id)
    );

    CREATE TABLE dbo.post_tag_mapping (
        post_id  BIGINT NOT NULL,
        tag_id   BIGINT NOT NULL,

        CONSTRAINT PK_post_tag_mapping PRIMARY KEY (post_id, tag_id),
        CONSTRAINT FK_post_tag_mapping_posts
            FOREIGN KEY (post_id) REFERENCES dbo.posts(post_id),
        CONSTRAINT FK_post_tag_mapping_tags
            FOREIGN KEY (tag_id) REFERENCES dbo.post_tags(tag_id)
    );

    CREATE TABLE dbo.banners (
        banner_id     BIGINT IDENTITY(1,1) NOT NULL,
        title         NVARCHAR(255) NOT NULL,
        image_url     NVARCHAR(255) NOT NULL,
        redirect_url  NVARCHAR(255) NULL,
        is_active     BIT NOT NULL
                          CONSTRAINT DF_banners_is_active DEFAULT 1,
        start_date    DATETIME2(6) NULL,
        end_date      DATETIME2(6) NULL,
        created_at    DATETIME2(6) NULL
                          CONSTRAINT DF_banners_created_at DEFAULT SYSDATETIME(),
        updated_at    DATETIME2(6) NULL
                          CONSTRAINT DF_banners_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_banners PRIMARY KEY (banner_id),
        CONSTRAINT CK_banners_dates CHECK (
            end_date IS NULL OR start_date IS NULL OR end_date >= start_date
        )
    );

    CREATE TABLE dbo.contacts (
        contact_id  BIGINT IDENTITY(1,1) NOT NULL,
        full_name   NVARCHAR(255) NOT NULL,
        email       NVARCHAR(255) NOT NULL,
        subject     NVARCHAR(255) NULL,
        message     VARCHAR(MAX) NULL,
        status      NVARCHAR(255) NOT NULL
                        CONSTRAINT DF_contacts_status DEFAULT N'PENDING',
        created_at  DATETIME2(6) NULL
                        CONSTRAINT DF_contacts_created_at DEFAULT SYSDATETIME(),
        updated_at  DATETIME2(6) NULL
                        CONSTRAINT DF_contacts_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_contacts PRIMARY KEY (contact_id)
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
