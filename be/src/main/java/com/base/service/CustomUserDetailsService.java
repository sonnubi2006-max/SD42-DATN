package com.base.service;

import com.base.dto.request.CustomUserDetails;
import com.base.entity.Customer;
import com.base.entity.User;
import com.base.repository.CustomerRepository;
import com.base.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userRepository.findByUsername(username)
                .orElse(null);

        if (user != null) {

            List<GrantedAuthority> authorities =
                    List.of(
                            new SimpleGrantedAuthority(
                                    "ROLE_" + user.getRole().name()
                            )
                    );

            return CustomUserDetails.fromUser(
                    user,
                    authorities
            );
        }

        Customer customer = customerRepository
                .findByEmailIgnoreCase(username)
                .orElse(null);

        if (customer != null) {

            List<GrantedAuthority> authorities =
                    List.of(
                            new SimpleGrantedAuthority(
                                    "ROLE_USER"
                            )
                    );

            return CustomUserDetails.fromCustomer(
                    customer,
                    authorities
            );
        }

        throw new UsernameNotFoundException(
                "User not found: " + username
        );
    }
}
