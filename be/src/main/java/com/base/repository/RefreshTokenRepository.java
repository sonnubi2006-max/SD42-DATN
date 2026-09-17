package com.base.repository;

import com.base.entity.Customer;
import com.base.entity.RefreshToken;
import com.base.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    @Modifying
    void deleteByUser(User user);

    Optional<RefreshToken> findByUser(User user);

    Optional<RefreshToken> findByCustomer(Customer customer);

    @Modifying
    void deleteByCustomer(Customer customer);
}
