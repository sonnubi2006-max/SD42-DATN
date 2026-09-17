package com.base.repository;

import com.base.entity.ExchangeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExchangeItemRepository extends JpaRepository<ExchangeItem, Long> {
    List<ExchangeItem> findByReturnRequest_ReturnId(Long returnId);
}
