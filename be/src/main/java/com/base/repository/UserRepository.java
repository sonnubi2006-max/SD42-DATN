package com.base.repository;

import com.base.dto.response.user.UserStatisticProjection;
import com.base.entity.User;
import com.base.enums.RoleUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUserCode(String userCode);

    @Query("""
    SELECT u FROM User u
    WHERE (
        :keyword IS NULL 
        OR LOWER(u.userCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
    AND (:status IS NULL OR u.status = :status)
    AND (:role IS NULL OR u.role = :role)
""")
    Page<User> search(
            @Param("keyword") String keyword,
            @Param("status") User.UserStatus status,
            @Param("role") RoleUser role,
            Pageable pageable
    );

    Page<User> findByRoleAndStatus(
            RoleUser role,
            User.UserStatus status,
            Pageable pageable
    );

    @Query("""
    SELECT
        COUNT(u) as totalUsers,
        COALESCE(
            SUM(
                CASE
                    WHEN u.status = 'ACTIVE'
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as activeUsers,
        COALESCE(
            SUM(
                CASE
                    WHEN u.status = 'INACTIVE'
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as inactiveUsers,
        COALESCE(
            SUM(
                CASE
                    WHEN u.status = 'BANNED'
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as bannedUsers,
        COALESCE(
            SUM(
                CASE
                    WHEN u.role = 'STAFF'
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as staffUsers,
        COALESCE(
            SUM(
                CASE
                    WHEN u.role = 'ADMIN'
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as adminUsers
    FROM User u
""")
    UserStatisticProjection getUserStatistics();

    boolean existsByCccdAndUserIdIsNot(String email, Long userId);
    boolean existsByPhoneAndUserIdIsNot(String phone, Long userId);
    boolean existsByCccd(String email);
    boolean existsByPhone(String phone);

    List<User> findAllByRole(RoleUser role);
}
