package com.base.repository;

import com.base.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByCustomer_CustomerId(Long customerId);
    Optional<Address> findByCustomer_CustomerIdAndIsDefault(Long customerId, boolean isDefault);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.customer.customerId = :customerId")
    void clearDefaultByCustomerId(Long customerId);

    List<Address> findByCustomerCustomerIdOrderByIsDefaultDescAddressIdAsc(Long customerId);

    Optional<Address> findByCustomerCustomerIdAndIsDefaultTrue(Long customerId);

    Optional<Address> findFirstByCustomerCustomerIdOrderByAddressIdAsc(Long customerId);

    long countByCustomerCustomerId(Long customerId);
}
