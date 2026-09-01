package com.cbae.engine.dto.notification;

import com.cbae.engine.domain.enums.NotificationPriority;
import com.cbae.engine.domain.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private String title;
    private String message;
    private NotificationType notificationType;
    private NotificationPriority priority;
    private String deepLink;
    private Boolean isRead;
    private Instant createdAt;
}
