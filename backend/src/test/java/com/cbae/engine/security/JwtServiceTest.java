package com.cbae.engine.security;

import com.cbae.engine.domain.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private final String testSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L);
        ReflectionTestUtils.setField(jwtService, "jwtRefreshExpirationMs", 86400000L);
    }

    @Test
    @DisplayName("Should generate valid token and correctly extract claims")
    void shouldGenerateAndValidateToken() {
        UUID userId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(
                userId,
                "user@example.com",
                "Test User",
                "password",
                UserRole.ROLE_CUSTOMER
        );

        String token = jwtService.generateToken(principal);

        assertThat(token).isNotBlank();
        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo("user@example.com");
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
        assertThat(jwtService.extractRole(token)).isEqualTo("ROLE_CUSTOMER");
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void shouldGenerateValidRefreshToken() {
        UUID userId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(
                userId,
                "refresh@example.com",
                "Refresh User",
                "password",
                UserRole.ROLE_CUSTOMER
        );

        String refreshToken = jwtService.generateRefreshToken(principal);

        assertThat(refreshToken).isNotBlank();
        assertThat(jwtService.validateToken(refreshToken)).isTrue();
        assertThat(jwtService.extractUsername(refreshToken)).isEqualTo("refresh@example.com");
        assertThat(jwtService.extractUserId(refreshToken)).isEqualTo(userId);
    }

    @Test
    @DisplayName("Should return false when validating an invalid token")
    void shouldReturnFalseForInvalidToken() {
        assertThat(jwtService.validateToken("invalid.token.string")).isFalse();
    }
}
