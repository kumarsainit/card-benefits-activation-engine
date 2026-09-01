package com.cbae.engine.security;

import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.enums.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Getter
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String fullName;
    private final String password;
    private final UserRole role;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(UUID id, String email, String fullName, String password, UserRole role) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.password = password;
        this.role = role;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority(role.name()));
    }

    public static UserPrincipal fromCustomer(Customer customer) {
        return new UserPrincipal(
                customer.getId(),
                customer.getEmail(),
                customer.getFullName(),
                customer.getPasswordHash(),
                customer.getRole()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
