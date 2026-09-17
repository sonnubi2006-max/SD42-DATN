package com.base.repository;

import com.base.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByOrder_OrderIdAndStatus(Long orderId, Reservation.ReservationStatus status);

    Optional<Reservation> findByOrder_OrderIdAndVariant_VariantIdAndStatus(
            Long orderId, Long variantId, Reservation.ReservationStatus status);

    @Query("""
            SELECT COALESCE(SUM(r.quantity), 0)
            FROM Reservation r
            WHERE r.variant.variantId = :variantId
              AND r.status = com.base.entity.Reservation.ReservationStatus.ACTIVE
              AND r.order.orderType = com.base.enums.OrderType.ONLINE
            """)
    int sumActiveOnlineQuantityByVariantId(@Param("variantId") Long variantId);

    @Query("""
            SELECT COALESCE(SUM(r.quantity), 0)
            FROM Reservation r
            WHERE r.variant.variantId = :variantId
              AND r.status = com.base.entity.Reservation.ReservationStatus.ACTIVE
              AND r.order.orderType IN (
                  com.base.enums.OrderType.POS,
                  com.base.enums.OrderType.POS_SHIP
              )
            """)
    int sumActivePosQuantityByVariantId(@Param("variantId") Long variantId);
}
