/** LudoMaths revision; never an external data or application version. */
export const COMBAT_ENGINE_VERSION = 'lm-combat-11.1';
export function canRecalculateRecord(record: { engineVersion?: string } | null): boolean {
  return record?.engineVersion === COMBAT_ENGINE_VERSION;
}
