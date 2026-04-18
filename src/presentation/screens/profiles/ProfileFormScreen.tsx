import React, { useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useProfileForm } from '@presentation/hooks/useProfileForm';
import type { ProfileFormScreenProps } from '@presentation/navigation/navigationTypes';
import type { WeaponFormRow } from '@presentation/hooks/useProfileForm';

// ── Sub-components ────────────────────────────────────────────────────────────

interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
  optional?: boolean;
}

function LabeledInput({ label, value, onChangeText, numeric, optional }: LabeledInputProps): React.JSX.Element {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{label}{optional ? ' (opt.)' : ''}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={numeric === true ? 'number-pad' : 'default'}
        returnKeyType="next"
        accessibilityLabel={label}
      />
    </View>
  );
}

interface WeaponRowProps {
  idx: number;
  weapon: WeaponFormRow;
  onUpdate: (idx: number, key: keyof WeaponFormRow, value: string) => void;
  onRemove: (idx: number) => void;
  removeLabel: string;
}

function WeaponRowCard({ idx, weapon, onUpdate, onRemove, removeLabel }: WeaponRowProps): React.JSX.Element {
  const { t } = useTranslation();
  const update = useCallback(
    (key: keyof WeaponFormRow) => (value: string) => onUpdate(idx, key, value),
    [idx, onUpdate],
  );
  return (
    <View style={styles.weaponCard}>
      <View style={styles.weaponCardHeader}>
        <Text style={styles.weaponCardTitle}>{`${t('profiles.fieldModelCount')} ${idx + 1}`}</Text>
        <TouchableOpacity onPress={() => onRemove(idx)} accessibilityLabel={removeLabel}>
          <Text style={styles.removeText}>{removeLabel}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.weaponGrid}>
        <LabeledInput label={t('profiles.fieldAttacks')} value={weapon.attacks} onChangeText={update('attacks')} numeric />
        <LabeledInput label={t('profiles.fieldHitThreshold')} value={weapon.hitThreshold} onChangeText={update('hitThreshold')} numeric />
        <LabeledInput label={t('profiles.fieldStrength')} value={weapon.strength} onChangeText={update('strength')} numeric />
        <LabeledInput label={t('profiles.fieldAP')} value={weapon.ap} onChangeText={update('ap')} numeric />
        <LabeledInput label={t('profiles.fieldDamage')} value={weapon.damage} onChangeText={update('damage')} numeric />
        <LabeledInput label={t('profiles.fieldModelCount')} value={weapon.modelCount} onChangeText={update('modelCount')} numeric />
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function ProfileFormScreen({ navigation, route }: ProfileFormScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const profileId = route.params?.profileId;

  const {
    step,
    fields,
    loading,
    error,
    updateField,
    updateWeapon,
    addWeapon,
    removeWeapon,
    nextStep,
    prevStep,
    save,
  } = useProfileForm(profileId);

  const isEdit = profileId != null;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? t('profiles.edit') : t('profiles.new'),
    });
  }, [navigation, t, isEdit]);

  const handleSave = useCallback(async () => {
    const success = await save();
    if (success) navigation.goBack();
  }, [save, navigation]);

  const STEP_LABELS: string[] = [
    t('profiles.stepDefensive'),
    t('profiles.stepWeapons'),
    t('profiles.stepReview'),
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEP_LABELS.map((label, i) => (
          <View key={label} style={[styles.stepDot, i === step && styles.stepDotActive]}>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* ── Step 0: Defensive stats ─────────────────────────────────────── */}
        {step === 0 && (
          <View>
            <LabeledInput
              label={t('profiles.fieldName')}
              value={fields.name}
              onChangeText={v => updateField('name', v)}
            />
            <LabeledInput
              label={t('profiles.fieldWounds')}
              value={fields.wounds}
              onChangeText={v => updateField('wounds', v)}
              numeric
            />
            <LabeledInput
              label={t('profiles.fieldToughness')}
              value={fields.toughness}
              onChangeText={v => updateField('toughness', v)}
              numeric
            />
            <LabeledInput
              label={t('profiles.fieldBaseSave')}
              value={fields.baseSave}
              onChangeText={v => updateField('baseSave', v)}
              numeric
            />
            <LabeledInput
              label={t('profiles.fieldInvulnSave')}
              value={fields.invulnSave}
              onChangeText={v => updateField('invulnSave', v)}
              numeric
              optional
            />
            <LabeledInput
              label={t('profiles.fieldFNP')}
              value={fields.fnpThreshold}
              onChangeText={v => updateField('fnpThreshold', v)}
              numeric
              optional
            />
          </View>
        )}

        {/* ── Step 1: Weapons ─────────────────────────────────────────────── */}
        {step === 1 && (
          <View>
            {fields.weapons.map((w, i) => (
              <WeaponRowCard
                key={i}
                idx={i}
                weapon={w}
                onUpdate={updateWeapon}
                onRemove={removeWeapon}
                removeLabel={t('profiles.removeWeapon')}
              />
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addWeapon} accessibilityLabel={t('profiles.addWeapon')}>
              <Text style={styles.addButtonText}>+ {t('profiles.addWeapon')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Review ───────────────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.review}>
            <Text style={styles.reviewTitle}>{fields.name}</Text>
            <Text style={styles.reviewLine}>{`T${fields.toughness}  W${fields.wounds}  ${fields.baseSave}+`}</Text>
            {fields.invulnSave !== '' && (
              <Text style={styles.reviewLine}>{`${fields.invulnSave}++ invuln`}</Text>
            )}
            {fields.fnpThreshold !== '' && (
              <Text style={styles.reviewLine}>{`${fields.fnpThreshold}+ FNP`}</Text>
            )}
            {fields.weapons.length > 0 && (
              <>
                <Text style={styles.reviewSubtitle}>{t('profiles.stepWeapons')}</Text>
                {fields.weapons.map((w, i) => (
                  <Text key={i} style={styles.reviewLine}>
                    {`${w.modelCount}× A${w.attacks} S${w.strength} AP-${w.ap} D${w.damage} (${w.hitThreshold}+)`}
                  </Text>
                ))}
              </>
            )}
          </View>
        )}

        {/* Error message */}
        {error != null && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      {/* Navigation / submit buttons */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
            <Text style={styles.secondaryButtonText}>← {t('profiles.stepDefensive')}</Text>
          </TouchableOpacity>
        )}
        {step < 2 ? (
          <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
            <Text style={styles.primaryButtonText}>{t('profiles.stepWeapons')} →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>{t('profiles.save')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ACCENT = '#007aff';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  stepDot: { alignItems: 'center', paddingHorizontal: 8 },
  stepDotActive: { borderBottomWidth: 2, borderBottomColor: ACCENT },
  stepLabel: { fontSize: 12, color: '#888' },
  stepLabelActive: { color: ACCENT, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 4 },
  fieldRow: { marginBottom: 12 },
  label: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  weaponCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  weaponCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weaponCardTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  removeText: { fontSize: 13, color: '#c00' },
  weaponGrid: { gap: 0 },
  addButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: { color: ACCENT, fontSize: 15, fontWeight: '500' },
  review: { gap: 6 },
  reviewTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  reviewSubtitle: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#333' },
  reviewLine: { fontSize: 14, color: '#555' },
  errorText: { color: '#c00', fontSize: 13, marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: ACCENT,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: ACCENT, fontSize: 15 },
});
