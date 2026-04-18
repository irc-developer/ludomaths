import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { CombatStackParamList } from '@presentation/navigation/navigationTypes';
import { CombatSetupScreen } from '@presentation/screens/combat/CombatSetupScreen';
import { CombatResultScreen } from '@presentation/screens/combat/CombatResultScreen';

const Stack = createStackNavigator<CombatStackParamList>();

export function CombatStack(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CombatSetup" component={CombatSetupScreen} />
      <Stack.Screen name="CombatResult" component={CombatResultScreen} />
    </Stack.Navigator>
  );
}
