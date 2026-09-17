package com.base.dto.response.user;

import com.base.enums.RoleUser;
import lombok.Data;

@Data
public class UserResponse {
    private Long userId;
    private String userCode;
    private String username;
    private String phone;
    private String gender;
    private String fullName;
    private String avatar;
    private String birthday;
    private String email;
    private RoleUser role;
    private String province;
    private String district;
    private String ward;
    private String streetAddress;
}
