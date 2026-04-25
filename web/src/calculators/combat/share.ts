import type { CombatParams } from './presets';
import type { CombatViewModel } from './useCombat';

interface FormatCombatShareTextInput {
  params: CombatParams;
  vm: CombatViewModel;
  presetName?: string;
}

export interface CombatShareSection {
  title: string;
  style: 'plain' | 'list';
  lines: string[];
}

export interface CombatShareContent {
  title: string;
  subtitle?: string;
  sections: CombatShareSection[];
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

function createSection(title: string, lines: string[]): string {
  return [title, ...lines].join('\n');
}

function toBullets(lines: string[]): string[] {
  return lines.map(line => `- ${line}`);
}

function formatDamageProfile(params: CombatParams): string {
  const base = params.damageD6 ? 'D6' : `D${params.damage}`;
  if ((params.damageBonus ?? 0) > 0) {
    return `${base}+${params.damageBonus}`;
  }
  return base;
}

function formatTarget(params: CombatParams): string {
  const parts = [`R${params.toughness}`, `${params.targetWounds}W`, `SA ${params.baseSave}+`];

  if (params.invulnerableSave !== undefined) {
    parts.push(`Inv ${params.invulnerableSave}++`);
  }

  if (params.fnpThreshold !== undefined) {
    parts.push(`FNP ${params.fnpThreshold}+`);
  }

  return parts.join(' | ');
}

function formatRules(params: CombatParams): string[] {
  const rules: string[] = [];

  if (params.hitRerollAll) rules.push('Repetir fallos al impactar');
  if (params.guaranteedHitSix) rules.push('1 impacto fijo en 6 natural');
  if (params.torrent) rules.push('Torrent');
  if (params.woundRerollAll) rules.push('Repetir fallos al herir');
  if (params.guaranteedWoundSix) rules.push('1 herida fija en 6 natural');
  if (params.lethalHits) rules.push('Lethal Hits');
  if (params.devastatingWounds) rules.push('Devastating Wounds');
  if (params.sustainedHits) rules.push(`Sustained Hits ${params.sustainedHits}`);
  if (params.guaranteedSaveSix) rules.push('1 salvación fija en 6 natural');
  if (params.guaranteedDamageSix && params.damageD6) rules.push('1 daño fijo en 6 natural');
  if ((params.mortalWoundsPerHit ?? 0) > 0) rules.push(`Mortales por impacto ${params.mortalWoundsPerHit}`);

  return rules.length > 0 ? rules : ['sin reglas especiales'];
}

function formatDistribution(vm: CombatViewModel): string[] {
  return vm.distribution
    .filter(entry => entry.probability >= 0.03)
    .slice(0, 8)
    .map(entry => `${entry.value} daño: ${pct(entry.probability)}`);
}

export function buildCombatShareContent({ params, vm, presetName }: FormatCombatShareTextInput): CombatShareContent {
  const sections: CombatShareSection[] = [];

  sections.push({
    title: 'PERFIL',
    style: 'plain',
    lines: [
      `A${params.attacksD6 ? 'D6' : params.attacks} | BH ${params.hitThreshold}+ | F${params.strength} | FP-${params.ap} | ${formatDamageProfile(params)}`,
    ],
  });
  sections.push({
    title: 'OBJETIVO',
    style: 'plain',
    lines: [formatTarget(params)],
  });
  sections.push({
    title: 'REGLAS',
    style: 'list',
    lines: formatRules(params),
  });
  sections.push({
    title: 'RESULTADOS',
    style: 'list',
    lines: [
      `P(eliminar ${params.targetWounds}W): ${pct(vm.pEliminate)}`,
      `Daño esperado: ${fmt(vm.expectedDamage)}`,
      `Daño más probable: ${vm.mostLikelyDamage}`,
      `Daño mediano: ${vm.medianDamage}`,
      `Rango central: ${vm.centralRange.low}-${vm.centralRange.high}`,
      `P(>=1 herida): ${pct(vm.pAtLeastOne)}`,
    ],
  });

  const distributionLines = formatDistribution(vm);
  if (distributionLines.length > 0) {
    sections.push({
      title: 'DISTRIBUCION',
      style: 'list',
      lines: distributionLines,
    });
  }

  return {
    title: 'LUDOMATHS - COMBATE WH40K',
    subtitle: presetName ? `Preset: ${presetName}` : undefined,
    sections,
  };
}

export function formatCombatShareText({ params, vm, presetName }: FormatCombatShareTextInput): string {
  const content = buildCombatShareContent({ params, vm, presetName });
  const sections = [createSection(content.title, content.subtitle ? [content.subtitle] : [])];

  sections.push(
    ...content.sections.map(section =>
      createSection(
        section.title,
        section.style === 'list' ? toBullets(section.lines) : section.lines,
      ),
    ),
  );

  return sections.join('\n\n');
}