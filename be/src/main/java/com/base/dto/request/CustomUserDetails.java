package com.base.dto.request;

import com.base.entity.Customer;
import com.base.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private Long userId;

    private String username;

    private String password;

    private Collection<? extends GrantedAuthority> authorities;

    private boolean enabled;

    private boolean accountNonLocked;

    public static CustomUserDetails fromUser(
            User user,
            List<GrantedAuthority> authorities
    ){

        return new CustomUserDetails(
                user.getUserId(),
                user.getUsername(),
                user.getPassword(),
                authorities,
                user.getStatus() == User.UserStatus.ACTIVE,
                user.getStatus() != User.UserStatus.BANNED
        );
    }

    public static CustomUserDetails fromCustomer(
            Customer customer,
            List<GrantedAuthority> authorities
    ){

        return new CustomUserDetails(
                customer.getCustomerId(),
                customer.getEmail(),
                customer.getPassword(),
                authorities,
                customer.getStatus() == Customer.CustomerStatus.ACTIVE,
                customer.getStatus() != Customer.CustomerStatus.BANNED
        );
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }
}
