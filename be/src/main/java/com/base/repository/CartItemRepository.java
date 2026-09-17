package com.base.repository;

import com.base.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCart_CartIdAndVariant_VariantId(Long cartId, Long variantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.cartId = :cartId AND ci.variant.variantId = :variantId")
    Optional<CartItem> findByCartAndVariantForUpdate(
            @Param("cartId") Long cartId,
            @Param("variantId") Long variantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartItemId = :cartItemId")
    Optional<CartItem> findByIdForUpdate(@Param("cartItemId") Long cartItemId);

    @Modifying
    void deleteByCart_CartId(Long cartId);

    boolean existsByCart_CartIdAndVariant_VariantId(Long cartCartId, Long variantVariantId);
}
