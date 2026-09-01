package com.cbae.engine.controller;

import com.cbae.engine.domain.Notification;
import com.cbae.engine.dto.ApiResponse;
import com.cbae.engine.dto.notification.NotificationDto;
import com.cbae.engine.security.JwtService;
import com.cbae.engine.security.UserPrincipal;
import com.cbae.engine.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Endpoints for customer notifications and real-time alert streaming")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtService jwtService;

    @GetMapping
    @Operation(summary = "Get all notifications for the authenticated customer")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<NotificationDto> dtos = notificationService.getNotificationsForCustomer(principal.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        notificationService.markAsRead(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to real-time Server-Sent Events (SSE) notification stream")
    public SseEmitter subscribeToStream(@RequestParam(name = "token", required = false) String token) {
        UUID customerId;
        if (org.springframework.util.StringUtils.hasText(token) && !"null".equalsIgnoreCase(token) && !"undefined".equalsIgnoreCase(token) && jwtService.validateToken(token)) {
            customerId = jwtService.extractUserId(token);
        } else {
            customerId = UUID.fromString("11111111-1111-1111-1111-111111111111"); // Demo fallback customer
        }
        return notificationService.subscribe(customerId);
    }

    private NotificationDto mapToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .notificationType(n.getNotificationType())
                .priority(n.getPriority())
                .deepLink(n.getDeepLink())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
