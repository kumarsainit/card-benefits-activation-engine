import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceUploader } from '@/components/claims/evidence-uploader';

describe('EvidenceUploader Component', () => {
  it('renders upload dropzone, document type selector, and suggested evidence badges', () => {
    const handleChange = vi.fn();
    render(
      <EvidenceUploader
        evidenceList={[]}
        onChange={handleChange}
        suggestedEvidence={['Purchase Receipt', 'Damage Photo']}
      />
    );

    expect(screen.getByText(/Attach Evidence Document/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Purchase Receipt/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Damage Photo/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
  });
});
