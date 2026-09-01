package com.cbae.engine.service;

import com.cbae.engine.domain.Customer;
import com.cbae.engine.domain.Notification;
import com.cbae.engine.domain.enums.NotificationPriority;
import com.cbae.engine.domain.enums.NotificationType;
import com.cbae.engine.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final Map<UUID, List<SseEmitter>> customerEmitters = new ConcurrentHashMap<>();

    @Transactional
    public Notification sendNotification(Customer customer, String title, String message, NotificationType type, NotificationPriority priority, String deepLink) {
        Notification notification = Notification.builder()
                .customer(customer)
                .title(title)
                .message(message)
                .notificationType(type)
                .priority(priority)
                .deepLink(deepLink)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Notification created for customer {}: [{}] {}", customer.getId(), type, title);

        // Push to active SSE connections for this customer
        broadcastToCustomer(customer.getId(), saved);
        return saved;
    }

    public SseEmitter subscribe(UUID customerId) {
        SseEmitter emitter = new SseEmitter(600000L); // 10 minutes timeout
        customerEmitters.computeIfAbsent(customerId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(customerId, emitter));
        emitter.onTimeout(() -> removeEmitter(customerId, emitter));
        emitter.onError((e) -> removeEmitter(customerId, emitter));

        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected to Notification Stream"));
        } catch (IOException e) {
            removeEmitter(customerId, emitter);
        }

        return emitter;
    }

    private void broadcastToCustomer(UUID customerId, Notification notification) {
        List<SseEmitter> emitters = customerEmitters.get(customerId);
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("NOTIFICATION")
                            .data(notification));
                } catch (IOException e) {
                    removeEmitter(customerId, emitter);
                }
            }
        }
    }

    private void removeEmitter(UUID customerId, SseEmitter emitter) {
        List<SseEmitter> emitters = customerEmitters.get(customerId);
        if (emitters != null) {
            emitters.remove(emitter);
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForCustomer(UUID customerId) {
        return notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID customerId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getCustomer().getId().equals(customerId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }
}
