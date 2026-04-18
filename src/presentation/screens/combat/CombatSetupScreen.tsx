import React, { useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useProfiles } from '@presentation/hooks/useProfiles';
import { useCombatStore } from '@infrastructure/store/useCombatStore';
import type { StoredUnitProfile } from '@application/profiles/IProfileRepository';
import type { CombatSetupScreenProps } from '@presentation/navigation/navigationTypes';

type Slot = 'attacker' | 'defender';

export function CombatSetupScreen({ navigation }: CombatSetupScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { profiles, loading } = useProfiles();
  const { attacker, defender, setAttacker, setDefender } = useCombatStore();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('navigation.combat') });
  }, [navigation, t]);

  const canCalculate = attacker != null && defender != null && attacker.weaponGroups.length > 0;

  const handleSelect = useCallback(
    (slot: Slot, profile: StoredUnitProfile) => {
      if (slot === 'attacker') setAttacker(profile);
      else setDefender(profile);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Selected slots */}
      <View style={styles.slotsRow}>
        {renderSlot('attacker', attacker)}
        <Text style={styles.vsText}>{t('combatHistory.vs')}</Text>
        {renderSlot('defender', defender)}
      </View>

      {/* Profile list */}
      <Text style={styles.listHeader}>{t('profiles.title')}</Text>
      <FlatList
        data={profiles}
        keyExtractor={item => item.id}
        contentContainerStyle={profiles.length === 0 ? styles.emptyList : styles.listContent}
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

      {/* Calculate button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.calcButton, !canCalculate && styles.calcButtonDisabled]}
          onPress={() => { if (canCalculate) navigation.navigate('CombatResult'); }}
          disabled={!canCalculate}
          accessibilityLabel={t('wh40k.calculate')}
        >
          <Text style={styles.calcButtonText}>{t('wh40k.calculate')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
  listHeader: { fontSize: 12, color: '#888', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  listContent: { paddingHorizontal: 12, paddingBottom: 8 },
  emptyList: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  calcButton: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  calcButtonDisabled: { backgroundColor: '#aac4e8' },
  calcButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
