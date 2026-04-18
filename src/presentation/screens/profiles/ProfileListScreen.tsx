import React, { useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useProfiles } from '@presentation/hooks/useProfiles';
import type { StoredUnitProfile } from '@application/profiles/IProfileRepository';
import type { ProfileListScreenProps } from '@presentation/navigation/navigationTypes';

export function ProfileListScreen({ navigation }: ProfileListScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { profiles, loading, error, deleteProfile } = useProfiles();

  // Header button: navigate to empty ProfileForm (create)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('profiles.title'),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfileForm', undefined)}
          style={styles.headerButton}
          accessibilityLabel={t('profiles.new')}
        >
          <Text style={styles.headerButtonText}>＋</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, t]);

  const handleDelete = useCallback(
    (profile: StoredUnitProfile) => {
      Alert.alert(
        t('profiles.deleteConfirmTitle'),
        t('profiles.deleteConfirmMessage'),
        [
          { text: t('profiles.cancel'), style: 'cancel' },
          {
            text: t('profiles.delete'),
            style: 'destructive',
            onPress: () => { void deleteProfile(profile.id); },
          },
        ],
      );
    },
    [deleteProfile, t],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error != null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={profiles}
      keyExtractor={item => item.id}
      contentContainerStyle={profiles.length === 0 ? styles.emptyContainer : styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>{t('profiles.empty')}</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardBody}
            onPress={() => navigation.navigate('ProfileForm', { profileId: item.id })}
            accessibilityLabel={item.name}
          >
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardStats}>
              {`T${item.toughness}  W${item.wounds}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            accessibilityLabel={t('profiles.delete')}
          >
            <Text style={styles.deleteButtonText}>🗑</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#c00', fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
  listContent: { padding: 16, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardBody: { flex: 1, padding: 16 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  cardStats: { fontSize: 13, color: '#555', marginTop: 2 },
  deleteButton: { padding: 16 },
  deleteButtonText: { fontSize: 18 },
  headerButton: { marginRight: 16 },
  headerButtonText: { fontSize: 22, color: '#007aff' },
});
