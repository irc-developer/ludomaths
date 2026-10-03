import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { BuffComparisonStackParamList } from '@presentation/navigation/navigationTypes';
import { BuffComparisonScreen } from '@presentation/screens/combat/BuffComparisonScreen';

const Stack = createStackNavigator<BuffComparisonStackParamList>();

export function BuffComparisonStack(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BuffComparison" component={BuffComparisonScreen} />
    </Stack.Navigator>
  );
}