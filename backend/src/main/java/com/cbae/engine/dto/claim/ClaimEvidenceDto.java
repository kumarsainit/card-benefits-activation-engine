package com.cbae.engine.dto.claim;

import com.cbae.engine.domain.enums.EvidenceType;
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
public class ClaimEvidenceDto {
    private UUID id;
    private EvidenceType evidenceType;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private Boolean isVerified;
    private Instant createdAt;
}
