package com.cbae.engine.controller;

import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.enums.UserRole;
import com.cbae.engine.dto.auth.LoginRequest;
import com.cbae.engine.dto.auth.RefreshTokenRequest;
import com.cbae.engine.dto.auth.RegisterRequest;
import com.cbae.engine.repository.CustomerRepository;
import com.cbae.engine.security.JwtService;
import com.cbae.engine.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.transaction.annotation.Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("POST /api/v1/auth/register should create new user and return tokens")
    void shouldRegisterNewUser() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("jane.doe@example.com")
                .fullName("Jane Doe")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("jane.doe@example.com")))
                .andExpect(jsonPath("$.data.user.role", is("ROLE_CUSTOMER")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register should fail with 409 when email already exists")
    void shouldFailRegistrationOnDuplicateEmail() throws Exception {
        customerRepository.save(Customer.builder()
                .email("duplicate@example.com")
                .fullName("Existing User")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        RegisterRequest request = RegisterRequest.builder()
                .email("duplicate@example.com")
                .fullName("Duplicate User")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.errorCode", is("CONFLICT")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should authenticate and return tokens for valid credentials")
    void shouldLoginWithValidCredentials() throws Exception {
        customerRepository.save(Customer.builder()
                .email("login.user@example.com")
                .fullName("Login User")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        LoginRequest request = LoginRequest.builder()
                .email("login.user@example.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("login.user@example.com")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should return 401 Unauthorized for incorrect password")
    void shouldRejectLoginWithWrongPassword() throws Exception {
        customerRepository.save(Customer.builder()
                .email("wrong.pwd@example.com")
                .fullName("Wrong Pwd User")
                .passwordHash(passwordEncoder.encode("CorrectPassword123!"))
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        LoginRequest request = LoginRequest.builder()
                .email("wrong.pwd@example.com")
                .password("WrongPassword999!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.errorCode", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh should issue new tokens given valid refresh token")
    void shouldRefreshTokenSuccessfully() throws Exception {
        Customer customer = customerRepository.save(Customer.builder()
                .email("token.refresh@example.com")
                .fullName("Token User")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        String refreshToken = jwtService.generateRefreshToken(UserPrincipal.fromCustomer(customer));

        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken(refreshToken)
                .build();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me should return user profile with valid Bearer token")
    void shouldReturnCurrentUserProfileWithBearerToken() throws Exception {
        Customer customer = customerRepository.save(Customer.builder()
                .email("me.user@example.com")
                .fullName("Me User")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        String token = jwtService.generateToken(UserPrincipal.fromCustomer(customer));

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("me.user@example.com")))
                .andExpect(jsonPath("$.data.fullName", is("Me User")));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me should return 401 when unauthenticated")
    void shouldRejectMeEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should authenticate demo customer successfully")
    void shouldLoginDemoCustomer() throws Exception {
        customerRepository.save(Customer.builder()
                .email("customer@example.com")
                .fullName("Alex Carter")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(UserRole.ROLE_CUSTOMER)
                .build());

        LoginRequest request = LoginRequest.builder()
                .email("customer@example.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("customer@example.com")))
                .andExpect(jsonPath("$.data.user.role", is("ROLE_CUSTOMER")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should authenticate demo admin successfully")
    void shouldLoginDemoAdmin() throws Exception {
        customerRepository.save(Customer.builder()
                .email("admin@cbae.internal")
                .fullName("System Admin")
                .passwordHash(passwordEncoder.encode("AdminSecure2026!"))
                .role(UserRole.ROLE_ADMIN)
                .build());

        LoginRequest request = LoginRequest.builder()
                .email("admin@cbae.internal")
                .password("AdminSecure2026!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("admin@cbae.internal")))
                .andExpect(jsonPath("$.data.user.role", is("ROLE_ADMIN")));
    }
}
