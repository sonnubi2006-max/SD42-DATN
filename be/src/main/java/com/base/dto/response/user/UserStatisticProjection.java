package com.base.dto.response.user;

public interface UserStatisticProjection {

    Long getTotalUsers();

    Long getActiveUsers();

    Long getBannedUsers();

    Long getStaffUsers();

    Long getAdminUsers();
}

