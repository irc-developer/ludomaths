import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CombatScenarioBoundary } from './CombatScenarioContext';
import { ScenarioResultNotice } from './ScenarioResultNotice';
import { s } from '../../i18n/scenario';

afterEach(cleanup);

describe('pending combat results', () => {
  it('asks to reselect profiles when the catalog selection cannot be resolved', () => {
    render(<CombatScenarioBoundary><ScenarioResultNotice ready error={s('pending')} /></CombatScenarioBoundary>);
    expect(screen.getByRole('status').textContent).toBe(s('profilesUnavailable'));
  });
});
