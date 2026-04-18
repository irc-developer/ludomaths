import React, { useEffect, useState, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LoadCombatRecordsUseCase } from '@application/combat/LoadCombatRecordsUseCase';
import { useCombatResult } from '@presentation/hooks/useCombatResult';
import type { StoredCombatRecord } from '@application/combat/ICombatRecordRepository';
import type { RoundEntry } from '@application/dice/CalculateRoundsToKillUseCase';
import type { HistoryDetailScreenProps } from '@presentation/navigation/navigationTypes';
import { combatRecordRepository } from '@infrastructure/storage/repositoryInstances';
import { expectedValue } from '@domain/math/distribution';

export function HistoryDetailScreen({ navigation, route }: HistoryDetailScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { recordId } = route.params;

  const loader = useMemo(() => new LoadCombatRecordsUseCase(combatRecordRepository), []);

  const [record, setRecord] = useState<StoredCombatRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loader
      .loadById(recordId)
      .then(r => setRecord(r))
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [recordId]);

  // Re-run combat calculation from the stored snapshots (read-only)
  const { result } = useCombatResult({
    attacker: record?.attacker ?? null,
    defender: record?.defender ?? null,
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: record?.label ?? t('combatHistory.title') });
  }, [navigation, record, t]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loadError != null || record == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError ?? 'Record not found'}</Text>
      </View>
    );
  }

  const expectedDmg = result != null ? expectedValue(result.damagePerRoundDist) : null;

  return (
    <View style={styles.flex}>
      {/* Meta */}
      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>{record.label}</Text>
        <Text style={styles.metaVs}>
          {`${record.attacker.name} ${t('combatHistory.vs')} ${record.defender.name}`}
        </Text>
        <Text style={styles.metaDate}>{new Date(record.createdAt).toLocaleString()}</Text>
      </View>

      {result == null ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('wh40k.selectUnit')}</Text>
        </View>
      ) : (
        <>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('wh40k.expectedDamage')}</Text>
                <Text style={styles.summaryValue}>{expectedDmg?.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('wh40k.expectedRounds')}</Text>
                <Text style={styles.summaryValue}>{result.expectedRounds.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Kill-by-round table */}
          <Text style={styles.tableHeader}>{t('wh40k.killByRound')}</Text>
          <FlatList
            data={result.killByRound}
            keyExtractor={item => String(item.round)}
            style={styles.table}
            renderItem={({ item }: { item: RoundEntry }) => (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>{t('wh40k.round', { n: item.round })}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width: `${item.cumulativeProbability * 100}%` }]} />
                </View>
                <Text style={styles.tableProb}>
                  {(item.cumulativeProbability * 100).toFixed(1)}%
                </Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const BAR_COLOR = '#4a90d9';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#c00', fontSize: 14 },
  emptyText: { color: '#888', fontSize: 16 },
  metaCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  metaLabel: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  metaVs: { fontSize: 13, color: '#555', marginTop: 4 },
  metaDate: { fontSize: 11, color: '#aaa', marginTop: 2 },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: '#ddd' },
  tableHeader: { fontSize: 12, color: '#888', paddingHorizontal: 16, paddingBottom: 6, textTransform: 'uppercase' },
  table: { flex: 1, paddingHorizontal: 12 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCell: { width: 64, fontSize: 13, color: '#333' },
  barContainer: { flex: 1, height: 8, backgroundColor: '#e8e8e8', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: BAR_COLOR, borderRadius: 4 },
  tableProb: { width: 50, textAlign: 'right', fontSize: 13, color: '#555' },
});
