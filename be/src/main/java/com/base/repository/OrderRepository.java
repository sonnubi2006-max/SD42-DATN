package com.base.repository;

import com.base.entity.Order;
import com.base.entity.Customer;
import com.base.enums.OrderStatus;
import com.base.enums.OrderType;
import com.base.enums.PaymentMethod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Modifying(flushAutomatically = true)
    @Query("""
            UPDATE Order o
               SET o.customer = :customer
             WHERE o.customer IS NULL
               AND o.guestEmail IS NOT NULL
               AND LOWER(TRIM(o.guestEmail)) = :normalizedEmail
            """)
    int linkGuestOrdersToCustomerByEmail(
            @Param("customer") Customer customer,
            @Param("normalizedEmail") String normalizedEmail
    );

    interface StaffSalesStatistic {
        Long getStaffId();
        String getStaffName();
        Long getOrderCount();
        BigDecimal getRevenue();
    }

    @Query("""
            SELECT o.staff.userId AS staffId,
                   o.staff.fullName AS staffName,
                   COUNT(o) AS orderCount,
                   SUM(o.finalAmount - COALESCE(o.shippingFee, 0)) AS revenue
            FROM Order o
            WHERE o.staff IS NOT NULL
              AND o.orderStatus IN (
                com.base.enums.OrderStatus.COMPLETED,
                com.base.enums.OrderStatus.REFUNDED,
                com.base.enums.OrderStatus.CANCELED_BY_DAMAGED
              )
              AND (:fromDate IS NULL OR o.completedAt >= :fromDate)
              AND (:toDate IS NULL OR o.completedAt <= :toDate)
            GROUP BY o.staff.userId, o.staff.fullName
            ORDER BY SUM(o.finalAmount - COALESCE(o.shippingFee, 0)) DESC
            """)
    List<StaffSalesStatistic> findStaffSalesStatistics(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    @Query("""
            SELECT o FROM Order o
            LEFT JOIN FETCH o.orderDetails od
            LEFT JOIN FETCH od.variant
            LEFT JOIN FETCH o.customer
            LEFT JOIN FETCH o.coupon
            LEFT JOIN FETCH o.staff
            WHERE o.orderId = :orderId
            """)
    Optional<Order> findByIdWithDetails(@Param("orderId") Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.orderDetails od
            LEFT JOIN FETCH od.variant
            LEFT JOIN FETCH o.customer
            LEFT JOIN FETCH o.coupon
            WHERE o.orderId = :orderId
            """)
    Optional<Order> findByIdWithDetailsForUpdate(@Param("orderId") Long orderId);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.orderDetails od
            LEFT JOIN FETCH od.variant
            LEFT JOIN FETCH o.customer
            LEFT JOIN FETCH o.coupon
            WHERE o.orderCode = :orderCode
            """)
    Optional<Order> findByOrderCodeWithDetails(@Param("orderCode") String orderCode);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.orderDetails od
            LEFT JOIN FETCH od.variant
            LEFT JOIN FETCH o.customer
            LEFT JOIN FETCH o.coupon
            LEFT JOIN FETCH o.orderAddress oa
            WHERE UPPER(o.orderCode) = UPPER(:orderCode)
              AND o.customer IS NULL
              AND (
                o.guestPhone = :guestPhone
                OR (o.guestPhone IS NULL AND oa.receiverPhone = :guestPhone)
              )
            """)
    Optional<Order> findGuestOrderForLookup(
            @Param("orderCode") String orderCode,
            @Param("guestPhone") String guestPhone
    );

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN o.customer c
        WHERE c.customerId = :userId
          AND (
            :status IS NULL
            OR (
              :status = com.base.enums.OrderStatus.CANCELLED
              AND o.orderStatus IN (
                com.base.enums.OrderStatus.CANCELLED,
                com.base.enums.OrderStatus.REFUNDED,
                com.base.enums.OrderStatus.CANCELED_BY_DAMAGED,
                com.base.enums.OrderStatus.FAILED_DELIVERY,
                com.base.enums.OrderStatus.RETURNING,
                com.base.enums.OrderStatus.RETURNED_TO_SHOP
              )
            )
            OR (
              :status = com.base.enums.OrderStatus.PENDING
              AND o.orderStatus IN (
                com.base.enums.OrderStatus.PENDING,
                com.base.enums.OrderStatus.WAITING_STOCK
              )
            )
            OR (
              :status NOT IN (
                com.base.enums.OrderStatus.CANCELLED,
                com.base.enums.OrderStatus.PENDING
              )
              AND o.orderStatus = :status
            )
          )
          AND (:keyword IS NULL OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<Order> findByUserId(
            @Param("userId")  Long userId,
            @Param("status")  OrderStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
            SELECT o FROM Order o
            LEFT JOIN o.customer c
            LEFT JOIN o.staff s
            LEFT JOIN o.orderAddress a
            WHERE (:keyword IS NULL OR
                      LOWER(o.orderCode)      LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(c.fullName)       LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(c.phone)          LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(o.guestName)      LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(o.guestPhone)     LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(a.receiverName)   LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(a.receiverPhone)  LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND (:status        IS NULL OR o.orderStatus   = :status)
              AND (:orderType     IS NULL OR o.orderType     = :orderType)
              AND (:paymentMethod IS NULL OR o.paymentMethod = :paymentMethod)
              AND (:userId        IS NULL OR c.customerId        = :userId)
              AND (:staffId       IS NULL OR s.userId        = :staffId)
              AND (:fromDate IS NULL OR o.createdAt >= :fromDate)
              AND (:toDate IS NULL OR o.createdAt <= :toDate)
            """)
    Page<Order> filterOrders(
            @Param("keyword")       String keyword,
            @Param("status")        OrderStatus status,
            @Param("orderType")     OrderType orderType,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("userId")        Long userId,
            @Param("staffId")       Long staffId,
            @Param("fromDate")      LocalDateTime fromDate,
            @Param("toDate")        LocalDateTime toDate,
            Pageable pageable
    );

    @Query("""
            SELECT o FROM Order o
            LEFT JOIN o.customer c
            LEFT JOIN o.staff s
            LEFT JOIN o.orderAddress a
            WHERE (:keyword IS NULL OR
                      LOWER(o.orderCode)      LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(c.fullName)       LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(c.phone)          LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(o.guestName)      LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(o.guestPhone)     LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(a.receiverName)   LIKE LOWER(CONCAT('%',:keyword,'%'))
                   OR LOWER(a.receiverPhone)  LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND (:status        IS NULL OR o.orderStatus   = :status)
              AND (:orderType     IS NULL OR o.orderType     = :orderType)
              AND (:paymentMethod IS NULL OR o.paymentMethod = :paymentMethod)
              AND (:userId        IS NULL OR c.customerId    = :userId)
              AND (:staffId       IS NULL OR s.userId        = :staffId)
              AND o.completedAt IS NOT NULL
              AND (:fromDate IS NULL OR o.completedAt >= :fromDate)
              AND (:toDate IS NULL OR o.completedAt <= :toDate)
            """)
    Page<Order> filterOrdersByCompletedDate(
            @Param("keyword")       String keyword,
            @Param("status")        OrderStatus status,
            @Param("orderType")     OrderType orderType,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("userId")        Long userId,
            @Param("staffId")       Long staffId,
            @Param("fromDate")      LocalDateTime fromDate,
            @Param("toDate")        LocalDateTime toDate,
            Pageable pageable
    );

    boolean existsByOrderCode(String orderCode);

    List<Order> findAllByOrderStatus(OrderStatus status);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.orderDetails od
            LEFT JOIN FETCH od.variant
            LEFT JOIN FETCH o.customer
            LEFT JOIN FETCH o.staff
            WHERE o.staff.userId = :staffId
              AND o.orderStatus = :status
            ORDER BY o.createdAt DESC
            """)
    List<Order> findDraftsByStaff(@Param("staffId") Long staffId,
                                            @Param("status") OrderStatus status);

    @Query("""
            SELECT COUNT(o) FROM Order o
            WHERE o.staff.userId = :staffId
              AND o.orderStatus = :status
            """)
    long countDraftsByStaff(@Param("staffId") Long staffId,
                            @Param("status") OrderStatus status);

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount - COALESCE(o.shippingFee, 0)), 0)
            FROM Order o
            WHERE o.orderStatus IN (
                com.base.enums.OrderStatus.COMPLETED,
                com.base.enums.OrderStatus.CANCELED_BY_DAMAGED
              )
              AND o.completedAt BETWEEN :from AND :to
            """)
    BigDecimal sumRevenueByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to
    );

    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE o.orderStatus = :status
            """)
    long countByStatus(@Param("status") OrderStatus status);

    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE o.customer.customerId = :userId AND o.coupon.couponId = :couponId
              AND o.orderStatus NOT IN (
                  com.base.enums.OrderStatus.DRAFT,
                  com.base.enums.OrderStatus.CANCELLED,
                  com.base.enums.OrderStatus.REFUNDED,
                  com.base.enums.OrderStatus.CANCELED_BY_DAMAGED
              )
            """)
    long countByUserIdAndCouponId(@Param("userId") Long userId, @Param("couponId") Long couponId);

    @Query("""
            SELECT DISTINCT o FROM Order o
            LEFT JOIN FETCH o.orderDetails od
            LEFT JOIN FETCH od.variant
            WHERE o.orderStatus IN :statuses
              AND o.createdAt >= :startOfDay
              AND o.createdAt < :endOfDay
            ORDER BY o.createdAt DESC
            """)
    List<Order> findUnfinishedOrdersByDate(
            @Param("statuses") List<OrderStatus> statuses,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("""
            SELECT o FROM Order o
            WHERE o.orderStatus = com.base.enums.OrderStatus.WAITING_PAYMENT
              AND o.orderType = com.base.enums.OrderType.ONLINE
              AND COALESCE(o.orderDate, o.createdAt) <= :cutoff
            """)
    List<Order> findExpiredWaitingPaymentOrders(@Param("cutoff") LocalDateTime cutoff);
}

