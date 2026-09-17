package com.base.service;

import com.base.enums.AccountType;

public interface PasswordResetService {

    void requestReset(String email, AccountType accountType);

    void resetPassword(String token, String newPassword, String confirmPassword);
}
