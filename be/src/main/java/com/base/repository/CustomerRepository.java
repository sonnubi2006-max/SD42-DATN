package com.base.repository;

import com.base.entity.Customer;
import com.base.enums.CustomerSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    boolean existsByCustomerCode(String customerCode);

    List<Customer> findByEmailSubscribedTrueAndStatus(Customer.CustomerStatus status);

    @Query("""
            SELECT c FROM Customer c
            WHERE (:keyword IS NULL
                   OR LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(c.email)    LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR c.phone           LIKE CONCAT('%', :keyword, '%'))
              AND (:source IS NULL OR c.source = :source)
              AND (:status IS NULL OR c.status = :status)
            """)
    Page<Customer> filterCustomers(@Param("keyword") String keyword,
                                   @Param("source") CustomerSource source,
                                   @Param("status") Customer.CustomerStatus status,
                                   Pageable pageable);

    long countBySource(CustomerSource source);
}
