package com.cbae.engine.service;

import com.cbae.engine.domain.AuditEvent;
import com.cbae.engine.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    @Transactional
    public void recordEvent(String eventType, String entityName, String entityId, String actorId, String actorRole, String action, String detailsJson) {
        try {
            AuditEvent event = AuditEvent.builder()
                    .eventType(eventType)
                    .entityName(entityName)
                    .entityId(entityId)
                    .actorId(actorId != null ? actorId : "SYSTEM")
                    .actorRole(actorRole != null ? actorRole : "ANONYMOUS")
                    .action(action)
                    .detailsJson(detailsJson)
                    .timestamp(Instant.now())
                    .build();
            auditEventRepository.save(event);
            log.info("AUDIT: [{} - {}] Entity: {} ({}) Actor: {} Action: {}", eventType, action, entityName, entityId, actorId, action);
        } catch (Exception e) {
            log.error("Failed to record audit event: {}", e.getMessage(), e);
        }
    }
}
