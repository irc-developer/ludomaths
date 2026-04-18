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
import { expectedValue } from '@domain/math/distribution';

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

  const expectedDmg = expectedValue(result.damagePerRoundDist);

  return (
    <View style={styles.flex}>
      {/* Header summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('wh40k.expectedDamage')}</Text>
            <Text style={styles.summaryValue}>{expectedDmg.toFixed(2)}</Text>
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
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
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
