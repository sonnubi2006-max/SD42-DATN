package com.base.repository;

import com.base.entity.OrderTransactionLogImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderTransactionLogImageRepository
        extends JpaRepository<OrderTransactionLogImage, Long> {
}
