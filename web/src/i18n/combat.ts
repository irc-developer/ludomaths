const es = {
  'combat.hitRerollFailures': 'Repetir todos los fallos para impactar',
  'combat.hitRerollNonSixes': 'Repetir todo lo que no sean seises para impactar',
  'combat.woundRerollFailures': 'Repetir todos los fallos para herir',
  'combat.woundRerollNonSixes': 'Repetir todo lo que no sean seises para herir',
  'combat.rerollHelp': 'Conserva los 6 naturales y repite una vez los resultados 1–5, incluidos los éxitos.',
  'combat.shareHitFailures': 'Repetir fallos al impactar',
  'combat.shareWoundFailures': 'Repetir fallos al herir',
};

type TranslationKey = keyof typeof es;
export type CombatLocale = 'es' | 'en';

const en: Record<TranslationKey, string> = {
  'combat.hitRerollFailures': 'Reroll all failed hit rolls',
  'combat.hitRerollNonSixes': 'Reroll all non-sixes to hit',
  'combat.woundRerollFailures': 'Reroll all failed wound rolls',
  'combat.woundRerollNonSixes': 'Reroll all non-sixes to wound',
  'combat.rerollHelp': 'Keep natural sixes and reroll results 1–5 once, including successful rolls.',
  'combat.shareHitFailures': 'Reroll failed hit rolls',
  'combat.shareWoundFailures': 'Reroll failed wound rolls',
};

/** Default to Spanish, matching the existing web interface. */
export function t(key: TranslationKey, locale: CombatLocale = 'es'): string {
  return (locale === 'en' ? en : es)[key];
}
