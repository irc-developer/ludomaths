/**
 * @format
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import i18n from '../src/infrastructure/i18n';
import App from '../App';

test('renders correctly', async () => {
  await i18n.changeLanguage('en');

  const { toJSON } = render(<App />);

  expect(toJSON()).not.toBeNull();
});
