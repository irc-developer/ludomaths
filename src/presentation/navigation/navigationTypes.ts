/**
 * @module navigationTypes
 *
 * Central type definitions for React Navigation.
 *
 * Three bottom tabs:
 *  - Profiles  → ProfileStack
 *  - Combat    → CombatStack
 *  - History   → HistoryStack
 *
 * Each tab owns its own StackNavigator so screens can push children
 * without crossing tab boundaries.
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

// ---------------------------------------------------------------------------
// Profiles stack
// ---------------------------------------------------------------------------
export type ProfileStackParamList = {
  ProfileList: undefined;
  ProfileForm: { profileId?: string } | undefined; // undefined = create, id = edit
};

// ---------------------------------------------------------------------------
// Combat stack
// ---------------------------------------------------------------------------
export type CombatStackParamList = {
  CombatSetup: undefined;
  CombatResult: undefined;
};

// ---------------------------------------------------------------------------
// History (combat records) stack
// ---------------------------------------------------------------------------
export type HistoryStackParamList = {
  HistoryList: undefined;
  HistoryDetail: { recordId: string };
};

// ---------------------------------------------------------------------------
// Bottom tabs — each param is the nested navigator's params
// ---------------------------------------------------------------------------
export type RootTabParamList = {
  ProfilesTab: NavigatorScreenParams<ProfileStackParamList>;
  CombatTab: NavigatorScreenParams<CombatStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
};

// ---------------------------------------------------------------------------
// Convenience screen prop types
// ---------------------------------------------------------------------------
export type ProfileListScreenProps = CompositeScreenProps<
  StackScreenProps<ProfileStackParamList, 'ProfileList'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type ProfileFormScreenProps = CompositeScreenProps<
  StackScreenProps<ProfileStackParamList, 'ProfileForm'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type CombatSetupScreenProps = CompositeScreenProps<
  StackScreenProps<CombatStackParamList, 'CombatSetup'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type CombatResultScreenProps = CompositeScreenProps<
  StackScreenProps<CombatStackParamList, 'CombatResult'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type HistoryListScreenProps = CompositeScreenProps<
  StackScreenProps<HistoryStackParamList, 'HistoryList'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type HistoryDetailScreenProps = CompositeScreenProps<
  StackScreenProps<HistoryStackParamList, 'HistoryDetail'>,
  BottomTabScreenProps<RootTabParamList>
>;
