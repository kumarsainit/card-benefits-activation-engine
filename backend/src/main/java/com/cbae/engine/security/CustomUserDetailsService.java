package com.cbae.engine.security;

import com.cbae.engine.domain.Customer;
import com.cbae.engine.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final CustomerRepository customerRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Customer not found with email: " + email));
        return UserPrincipal.fromCustomer(customer);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Customer not found with id: " + id));
        return UserPrincipal.fromCustomer(customer);
    }
}
