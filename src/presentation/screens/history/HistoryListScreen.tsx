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
import { useHistory } from '@presentation/hooks/useHistory';
import type { StoredCombatRecord } from '@application/combat/ICombatRecordRepository';
import type { HistoryListScreenProps } from '@presentation/navigation/navigationTypes';

export function HistoryListScreen({ navigation }: HistoryListScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { records, loading, error, deleteRecord } = useHistory();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('combatHistory.title') });
  }, [navigation, t]);

  const handleDelete = useCallback(
    (record: StoredCombatRecord) => {
      Alert.alert(
        t('profiles.deleteConfirmTitle'),
        t('profiles.deleteConfirmMessage'),
        [
          { text: t('profiles.cancel'), style: 'cancel' },
          {
            text: t('combatHistory.delete'),
            style: 'destructive',
            onPress: () => { void deleteRecord(record.id); },
          },
        ],
      );
    },
    [deleteRecord, t],
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
      data={records}
      keyExtractor={item => item.id}
      contentContainerStyle={records.length === 0 ? styles.emptyContainer : styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>{t('combatHistory.empty')}</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardBody}
            onPress={() => navigation.navigate('HistoryDetail', { recordId: item.id })}
            accessibilityLabel={item.label}
          >
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardVs}>
              {`${item.attacker.name} ${t('combatHistory.vs')} ${item.defender.name}`}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            accessibilityLabel={t('combatHistory.delete')}
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
  cardBody: { flex: 1, padding: 14 },
  cardLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  cardVs: { fontSize: 12, color: '#555', marginTop: 3 },
  cardDate: { fontSize: 11, color: '#aaa', marginTop: 2 },
  deleteButton: { padding: 16 },
  deleteButtonText: { fontSize: 18 },
});
