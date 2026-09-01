import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryProvider } from '@/providers/query-provider';
import { DeterministicSimulatorDrawer } from '@/components/simulator/deterministic-simulator-drawer';

describe('Deterministic Simulator Component', () => {
  it('renders trigger button with lightning icon', () => {
    render(
      <QueryProvider>
        <DeterministicSimulatorDrawer />
      </QueryProvider>
    );

    expect(screen.getByRole('button', { name: /Scenario Simulator/i })).toBeInTheDocument();
  });
});
