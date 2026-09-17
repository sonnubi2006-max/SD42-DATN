package com.base.dto.request.user;

import com.base.entity.User;
import lombok.Data;

@Data
public class UpdateStatusUser {
    private User.UserStatus status;
}
