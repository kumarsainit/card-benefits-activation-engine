package com.cbae.engine.repository;

import com.cbae.engine.domain.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
    List<AuditEvent> findByEntityNameAndEntityIdOrderByTimestampDesc(String entityName, String entityId);
    List<AuditEvent> findByActorIdOrderByTimestampDesc(String actorId);
}
