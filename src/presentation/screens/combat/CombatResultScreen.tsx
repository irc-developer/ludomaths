import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCombatStore } from '@infrastructure/store/useCombatStore';
import { useCombatResult } from '@presentation/hooks/useCombatResult';
import type { RoundEntry } from '@application/dice/CalculateRoundsToKillUseCase';
import type { CombatResultScreenProps } from '@presentation/navigation/navigationTypes';
import { expectedValue, type Distribution } from '@domain/math/distribution';

function modeFromDist(dist: Distribution): number {
  let best = dist[0];
  for (const entry of dist) {
    if (best == null || entry.probability > best.probability) best = entry;
  }
  return best?.value ?? 0;
}

function medianFromDist(dist: Distribution): number {
  let cumulative = 0;
  for (const entry of dist) {
    cumulative += entry.probability;
    if (cumulative >= 0.5) return entry.value;
  }
  return dist[dist.length - 1]?.value ?? 0;
}

export function CombatResultScreen({ navigation }: CombatResultScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { attacker, defender } = useCombatStore();
  const { result, saving, saveError, savedId, saveRecord } = useCombatResult({ attacker, defender });
  const [label, setLabel] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('navigation.combat') });
  }, [navigation, t]);

  const handleSave = useCallback(async () => {
    if (label.trim() === '') {
      Alert.alert('', t('combatHistory.fieldLabel'));
      return;
    }
    await saveRecord(label.trim());
  }, [label, saveRecord, t]);

  if (result == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('wh40k.selectUnit')}</Text>
      </View>
    );
  }

  const expectedDmg  = expectedValue(result.damagePerRoundDist);
  const mostLikelyDmg = modeFromDist(result.damagePerRoundDist);
  const medianDmg    = medianFromDist(result.damagePerRoundDist);

  return (
    <View style={styles.flex}>
      {/* Header summary */}
      <View style={styles.summaryCard}>
        {/* Row 1: resultados más interpretables */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('wh40k.mostLikelyDamage')}</Text>
            <Text style={styles.summaryValue}>{mostLikelyDmg}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('wh40k.medianDamage')}</Text>
            <Text style={styles.summaryValue}>{medianDmg}</Text>
          </View>
        </View>
        {/* Row 2: métricas de largo plazo */}
        <View style={[styles.summaryRow, styles.summaryRowSecondary]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabelSecondary}>{t('wh40k.expectedDamage')}</Text>
            <Text style={styles.summaryValueSecondary}>{expectedDmg.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabelSecondary}>{t('wh40k.expectedRounds')}</Text>
            <Text style={styles.summaryValueSecondary}>{result.expectedRounds.toFixed(2)}</Text>
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
            <Text style={styles.tableCell}>
              {t('wh40k.round', { n: item.round })}
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[styles.bar, { width: `${item.cumulativeProbability * 100}%` }]}
              />
            </View>
            <Text style={styles.tableProb}>
              {(item.cumulativeProbability * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      />

      {/* Save section */}
      {savedId == null ? (
        <View style={styles.saveSection}>
          <TextInput
            style={styles.labelInput}
            value={label}
            onChangeText={setLabel}
            placeholder={t('combatHistory.fieldLabel')}
            returnKeyType="done"
            accessibilityLabel={t('combatHistory.fieldLabel')}
          />
          {saveError != null && <Text style={styles.errorText}>{saveError}</Text>}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel={t('combatHistory.save')}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('combatHistory.save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.savedBanner}>
          <Text style={styles.savedText}>✓ {t('combatHistory.save')}</Text>
        </View>
      )}
    </View>
  );
}

const ACCENT = '#007aff';
const BAR_COLOR = '#4a90d9';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
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
  summaryRowSecondary: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  summaryLabelSecondary: { fontSize: 10, color: '#aaa', textTransform: 'uppercase', marginBottom: 2 },
  summaryValueSecondary: { fontSize: 16, fontWeight: '500', color: '#666' },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: '#ddd' },
  tableHeader: { fontSize: 12, color: '#888', paddingHorizontal: 16, paddingBottom: 6, textTransform: 'uppercase' },
  table: { flex: 1,paddingHorizontal: 12 },
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
  saveSection: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    gap: 8,
  },
  labelInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  errorText: { color: '#c00', fontSize: 12 },
  saveButton: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#aac4e8' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  savedBanner: {
    padding: 14,
    backgroundColor: '#e9f7ef',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#b2dfdb',
    alignItems: 'center',
  },
  savedText: { color: '#27ae60', fontSize: 15, fontWeight: '600' },
});
