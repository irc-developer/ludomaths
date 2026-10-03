import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ProfilesStack } from '@presentation/navigation/ProfilesStack';
import { CombatStack } from '@presentation/navigation/CombatStack';
import { BuffComparisonStack } from '@presentation/navigation/BuffComparisonStack';
import { HistoryStack } from '@presentation/navigation/HistoryStack';
import type { RootTabParamList } from '@presentation/navigation/navigationTypes';

const Tab = createBottomTabNavigator<RootTabParamList>();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const { t } = useTranslation();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen
            name="ProfilesTab"
            component={ProfilesStack}
            options={{ title: t('navigation.profiles'), headerShown: false }}
          />
          <Tab.Screen
            name="CombatTab"
            component={CombatStack}
            options={{ title: t('navigation.combat'), headerShown: false }}
          />
          <Tab.Screen
            name="BuffComparisonTab"
            component={BuffComparisonStack}
            options={{ title: t('navigation.buffComparison'), headerShown: false }}
          />
          <Tab.Screen
            name="HistoryTab"
            component={HistoryStack}
            options={{ title: t('navigation.combatHistory'), headerShown: false }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
