import React, { useCallback, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StoredUnitProfile } from '@application/profiles/IProfileRepository';
import type {
  CombatBuffRecommendation,
  CombatBuffScenario,
  CompareCombatBuffResult,
} from '@application/dice/CompareCombatBuffUseCase';
import { useCombatStore } from '@infrastructure/store/useCombatStore';
import { useProfiles } from '@presentation/hooks/useProfiles';
import { useCombatBuffComparison } from '@presentation/hooks/useCombatBuffComparison';
import type { BuffComparisonScreenProps } from '@presentation/navigation/navigationTypes';

type Slot = 'attacker' | 'defender';
type ScenarioCardVariant = 'baseline' | 'ballisticSkill' | 'save' | 'armorPenetration' | 'damage';

export function BuffComparisonScreen({ navigation }: BuffComparisonScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { profiles, loading } = useProfiles();
  const { attacker, defender, setAttacker, setDefender } = useCombatStore();
  const comparison = useCombatBuffComparison({ attacker, defender });

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('buffComparison.title') });
  }, [navigation, t]);

  const handleSelect = useCallback(
    (slot: Slot, profile: StoredUnitProfile) => {
      if (slot === 'attacker') {
        setAttacker(profile);
        return;
      }

      setDefender(profile);
    },
    [setAttacker, setDefender],
  );

  const renderSlot = (slot: Slot, selected: StoredUnitProfile | null): React.JSX.Element => {
    const label = slot === 'attacker' ? t('wh40k.attackerLabel') : t('wh40k.defenderLabel');

    return (
      <View style={styles.slotSection}>
        <Text style={styles.slotTitle}>{label}</Text>
        {selected != null ? (
          <TouchableOpacity
            style={[styles.profileCard, styles.profileCardSelected]}
            onPress={() => handleSelect(slot, selected)}
            accessibilityLabel={selected.name}
          >
            <Text style={styles.profileCardName}>{selected.name}</Text>
            <Text style={styles.profileCardStats}>{`T${selected.toughness}  W${selected.wounds}`}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.slotEmpty}>{t('wh40k.selectUnit')}</Text>
        )}
      </View>
    );
  };

  const renderScenarioCard = (
    title: string,
    scenario: CombatBuffScenario,
    baseline: CombatBuffScenario,
    variant: ScenarioCardVariant,
    recommendation: CombatBuffRecommendation,
  ): React.JSX.Element => {
    const highlight =
      (variant === 'ballisticSkill' && recommendation === 'ballisticSkill') ||
      (variant === 'save' && recommendation === 'save') ||
      (variant === 'armorPenetration' && recommendation === 'armorPenetration') ||
      (variant === 'damage' && recommendation === 'damage') ||
      (variant !== 'baseline' && recommendation === 'equal');

    return (
      <View style={[styles.resultCard, highlight && styles.resultCardRecommended]}>
        <Text style={styles.resultCardTitle}>{title}</Text>
        <Text style={styles.resultMetricLabel}>{t('wh40k.expectedDamage')}</Text>
        <Text style={styles.resultMetricValue}>{formatNumber(scenario.expectedDamage)}</Text>
        <Text style={styles.deltaText}>
          {t('buffComparison.deltaDamage')}: {formatSigned(scenario.expectedDamage - baseline.expectedDamage)}
        </Text>
        <Text style={styles.resultMetricLabel}>{t('wh40k.expectedRounds')}</Text>
        <Text style={styles.resultMetricValue}>{formatNumber(scenario.expectedRoundsToKill)}</Text>
        <Text style={styles.deltaText}>
          {t('buffComparison.deltaRounds')}: {formatSigned(scenario.expectedRoundsToKill - baseline.expectedRoundsToKill)}
        </Text>
        <Text style={styles.resultMetricLabel}>{t('buffComparison.firstRoundKill')}</Text>
        <Text style={styles.resultMetricValue}>{formatPercent(scenario.firstRoundKillProbability)}</Text>
      </View>
    );
  };

  const renderSummary = (): React.JSX.Element => {
    if (attacker == null || defender == null) {
      return <Text style={styles.emptySummary}>{t('buffComparison.selectBoth')}</Text>;
    }

    if (attacker.weaponGroups.length === 0) {
      return <Text style={styles.emptySummary}>{t('buffComparison.noWeapons')}</Text>;
    }

    if (comparison == null) {
      return <Text style={styles.emptySummary}>{t('buffComparison.selectBoth')}</Text>;
    }

    return renderComparison(comparison, t);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Text>{t('wh40k.scopeLimit')}</Text>
      <FlatList
        data={profiles}
        keyExtractor={item => item.id}
        contentContainerStyle={profiles.length === 0 ? styles.emptyList : styles.listContent}
        ListHeaderComponent={(
          <View>
            <View style={styles.slotsRow}>
              {renderSlot('attacker', attacker)}
              <Text style={styles.vsText}>{t('combatHistory.vs')}</Text>
              {renderSlot('defender', defender)}
            </View>
            <View style={styles.summarySection}>{renderSummary()}</View>
            <Text style={styles.listHeader}>{t('profiles.title')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('profiles.empty')}</Text>}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <TouchableOpacity
              style={[styles.assignButton, styles.attackerButton]}
              onPress={() => handleSelect('attacker', item)}
              accessibilityLabel={`${t('wh40k.attackerLabel')}: ${item.name}`}
            >
              <Text style={styles.assignButtonText}>⚔</Text>
            </TouchableOpacity>
            <Text style={styles.listItemName}>{item.name}</Text>
            <TouchableOpacity
              style={[styles.assignButton, styles.defenderButton]}
              onPress={() => handleSelect('defender', item)}
              accessibilityLabel={`${t('wh40k.defenderLabel')}: ${item.name}`}
            >
              <Text style={styles.assignButtonText}>🛡</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );

  function renderComparison(
    result: CompareCombatBuffResult,
    translate: typeof t,
  ): React.JSX.Element {
    return (
      <View>
        <Text style={styles.summaryTitle}>{translate('buffComparison.recommendation')}</Text>
        <Text style={styles.recommendationValue}>
          {translate(getRecommendationKey(result.recommendedOption))}
        </Text>
        <Text style={styles.summaryCaption}>{translate('buffComparison.recommendationRule')}</Text>
        <View style={styles.resultsGrid}>
          {renderScenarioCard(
            translate('buffComparison.baseline'),
            result.baseline,
            result.baseline,
            'baseline',
            result.recommendedOption,
          )}
          {renderScenarioCard(
            translate('buffComparison.plusBallisticSkill'),
            result.plusBallisticSkill,
            result.baseline,
            'ballisticSkill',
            result.recommendedOption,
          )}
          {renderScenarioCard(
            translate('buffComparison.plusSave'),
            result.plusSave,
            result.baseline,
            'save',
            result.recommendedOption,
          )}
          {renderScenarioCard(
            translate('buffComparison.plusArmorPenetration'),
            result.plusArmorPenetration,
            result.baseline,
            'armorPenetration',
            result.recommendedOption,
          )}
          {renderScenarioCard(
            translate('buffComparison.plusDamage'),
            result.plusDamage,
            result.baseline,
            'damage',
            result.recommendedOption,
          )}
        </View>
      </View>
    );
  }
}

function getRecommendationKey(recommendation: CombatBuffRecommendation): string {
  switch (recommendation) {
    case 'ballisticSkill':
      return 'buffComparison.recommendBallisticSkill';
    case 'save':
      return 'buffComparison.recommendSave';
    case 'armorPenetration':
      return 'buffComparison.recommendArmorPenetration';
    case 'damage':
      return 'buffComparison.recommendDamage';
    default:
      return 'buffComparison.recommendEqual';
  }
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatSigned(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}`;
}

const ACCENT = '#007aff';
const ATTACK_COLOR = '#c0392b';
const DEFEND_COLOR = '#27ae60';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  slotSection: { flex: 1 },
  slotTitle: { fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  slotEmpty: { fontSize: 13, color: '#bbb', fontStyle: 'italic' },
  profileCard: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  profileCardSelected: { borderColor: ACCENT, backgroundColor: '#eaf3ff' },
  profileCardName: { fontSize: 13, fontWeight: '600' },
  profileCardStats: { fontSize: 11, color: '#555', marginTop: 2 },
  vsText: { fontSize: 16, fontWeight: '700', color: '#999', marginTop: 16 },
  summarySection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  emptySummary: { fontSize: 15, color: '#666', lineHeight: 22 },
  summaryTitle: { fontSize: 13, color: '#777', textTransform: 'uppercase', marginBottom: 6 },
  recommendationValue: { fontSize: 28, fontWeight: '700', color: '#111827' },
  summaryCaption: { marginTop: 4, color: '#6b7280', fontSize: 13, lineHeight: 19 },
  resultsGrid: { gap: 12, marginTop: 16 },
  resultCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultCardRecommended: {
    borderColor: ACCENT,
    backgroundColor: '#eef6ff',
  },
  resultCardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  resultMetricLabel: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  resultMetricValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  deltaText: { fontSize: 13, color: '#2563eb', marginTop: 2 },
  listHeader: { fontSize: 12, color: '#888', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 24 },
  emptyText: { color: '#888', fontSize: 15 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  assignButton: { padding: 14 },
  attackerButton: { backgroundColor: ATTACK_COLOR },
  defenderButton: { backgroundColor: DEFEND_COLOR },
  assignButtonText: { fontSize: 16 },
  listItemName: { flex: 1, paddingHorizontal: 12, fontSize: 15, color: '#1a1a1a' },
});