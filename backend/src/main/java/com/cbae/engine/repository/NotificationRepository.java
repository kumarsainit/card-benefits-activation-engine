package com.cbae.engine.repository;

import com.cbae.engine.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    List<Notification> findByCustomerIdAndIsReadOrderByCreatedAtDesc(UUID customerId, Boolean isRead);
    long countByCustomerIdAndIsReadFalse(UUID customerId);
}
