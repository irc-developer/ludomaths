/**
 * @format
 */

import './src/infrastructure/i18n'; // initialize i18n before rendering
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
