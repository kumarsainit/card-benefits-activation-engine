package com.cbae.engine.service;

import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.enums.UserRole;
import com.cbae.engine.dto.auth.*;
import com.cbae.engine.exception.ConflictException;
import com.cbae.engine.exception.ResourceNotFoundException;
import com.cbae.engine.repository.CustomerRepository;
import com.cbae.engine.security.JwtService;
import com.cbae.engine.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuditService auditService;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (customerRepository.existsByEmail(email)) {
            throw new ConflictException("An account with email " + email + " already exists");
        }

        Customer customer = Customer.builder()
                .email(email)
                .fullName(request.getFullName().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.ROLE_CUSTOMER)
                .build();

        Customer saved = customerRepository.save(customer);
        UserPrincipal principal = UserPrincipal.fromCustomer(saved);

        String accessToken = jwtService.generateToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        auditService.recordEvent(
                "SECURITY_REGISTER",
                "Customer",
                saved.getId().toString(),
                saved.getId().toString(),
                saved.getRole().name(),
                "REGISTER_SUCCESS",
                "{\"email\": \"" + email + "\"}"
        );

        return buildAuthResponse(accessToken, refreshToken, saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            Customer customer = customerRepository.findById(principal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

            String accessToken = jwtService.generateToken(principal);
            String refreshToken = jwtService.generateRefreshToken(principal);

            auditService.recordEvent(
                    "SECURITY_LOGIN",
                    "Customer",
                    customer.getId().toString(),
                    customer.getId().toString(),
                    customer.getRole().name(),
                    "LOGIN_SUCCESS",
                    "{\"email\": \"" + email + "\"}"
            );

            return buildAuthResponse(accessToken, refreshToken, customer);
        } catch (BadCredentialsException e) {
            auditService.recordEvent(
                    "SECURITY_LOGIN_FAILURE",
                    "Customer",
                    "UNKNOWN",
                    "ANONYMOUS",
                    "ANONYMOUS",
                    "LOGIN_FAILED",
                    "{\"email\": \"" + email + "\", \"reason\": \"BadCredentials\"}"
            );
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!jwtService.validateToken(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        UUID userId = jwtService.extractUserId(refreshToken);
        if (userId == null) {
            throw new BadCredentialsException("Invalid token payload");
        }

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for token"));

        UserPrincipal principal = UserPrincipal.fromCustomer(customer);
        String newAccessToken = jwtService.generateToken(principal);
        String newRefreshToken = jwtService.generateRefreshToken(principal);

        return buildAuthResponse(newAccessToken, newRefreshToken, customer);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile(UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + customerId));
        return mapToProfile(customer);
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, Customer customer) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpirationMs / 1000)
                .user(mapToProfile(customer))
                .build();
    }

    private UserProfileDto mapToProfile(Customer customer) {
        return UserProfileDto.builder()
                .id(customer.getId())
                .email(customer.getEmail())
                .fullName(customer.getFullName())
                .role(customer.getRole())
                .build();
    }
}
