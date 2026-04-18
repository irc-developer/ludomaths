import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ProfileStackParamList } from '@presentation/navigation/navigationTypes';
import { ProfileListScreen } from '@presentation/screens/profiles/ProfileListScreen';
import { ProfileFormScreen } from '@presentation/screens/profiles/ProfileFormScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

export function ProfilesStack(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileList" component={ProfileListScreen} />
      <Stack.Screen name="ProfileForm" component={ProfileFormScreen} />
    </Stack.Navigator>
  );
}
