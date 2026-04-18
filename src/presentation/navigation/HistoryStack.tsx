import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { HistoryStackParamList } from '@presentation/navigation/navigationTypes';
import { HistoryListScreen } from '@presentation/screens/history/HistoryListScreen';
import { HistoryDetailScreen } from '@presentation/screens/history/HistoryDetailScreen';

const Stack = createStackNavigator<HistoryStackParamList>();

export function HistoryStack(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HistoryList" component={HistoryListScreen} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
    </Stack.Navigator>
  );
}
