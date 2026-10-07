import type { CombatParams } from './presets';
import type { CombatViewModel } from './useCombat';
import { resolveRerollPolicy } from './rerollPolicy';
import { COMBAT_ENGINE_VERSION } from '@application/dice/combatScenario';
import { t } from '../../i18n/combat';
import { buildSquadScenario, individualProfile } from '@application/dice/squadScenario';

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
  const base = params.damageExpression ?? (params.damageD6 ? 'D6' : String(params.damage));
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

  const hitReroll = resolveRerollPolicy(params.hitRerollAll, params.hitRerollNonSixes, params.torrent);
  const woundReroll = resolveRerollPolicy(params.woundRerollAll, params.woundRerollNonSixes);
  if (hitReroll !== 'none') rules.push(t(hitReroll === 'nonSixes' ? 'combat.hitRerollNonSixes' : 'combat.shareHitFailures'));
  if (params.guaranteedHitSix) rules.push('1 impacto fijo en 6 natural');
  if (params.torrent) rules.push('Torrent');
  if (woundReroll !== 'none') rules.push(t(woundReroll === 'nonSixes' ? 'combat.woundRerollNonSixes' : 'combat.shareWoundFailures'));
  if (params.guaranteedWoundSix) rules.push('1 herida fija en 6 natural');
  if (params.lethalHits) rules.push('Lethal Hits: ' + (params.lethalChoice === 'rollToWound' ? 'tirar para herir' : 'herida automática'));
  if (params.devastatingWounds) rules.push('Devastating Wounds');
  if (params.sustainedHits) rules.push(`Sustained Hits ${params.sustainedHits}`);
  if (params.guaranteedSaveSix) rules.push('1 salvación fija en 6 natural');
  if (params.guaranteedDamageSix && params.damageD6) rules.push('1 daño fijo en 6 natural');
  if ((params.mortalWoundsPerHit ?? 0) > 0) rules.push(`Mortales por impacto ${params.mortalWoundsPerHit}`);

  if (params.cover) rules.push('Cobertura del objetivo: empeora habilidad a distancia');
  if (params.ignoresCover) rules.push('Ignores Cover');
  if (params.twinLinked) rules.push('Twin-linked');
  if (params.heavy) rules.push('Heavy: fase ' + params.phase + ', trabada ' + params.engaged + ', desplegada ' + params.setUpThisTurn + ', movimiento >3 ' + params.movedOverThree);
  if (params.rapidFire) rules.push('Rapid Fire ' + params.rapidFire + ': ' + (params.withinHalfRange ? 'dentro de la mitad del alcance' : 'fuera de la mitad del alcance'));
  if (params.melta) rules.push('Melta ' + params.melta + ': mitad de alcance ' + params.withinHalfRange);
  return rules.length > 0 ? rules : ['sin reglas especiales'];
}

function formatDistribution(vm: CombatViewModel): string[] {
  return vm.distribution
    .filter(entry => entry.probability >= 0.03)
    .slice(0, 8)
    .map(entry => `${entry.value} daño: ${pct(entry.probability)}`);
}

export function buildCombatShareContent({ params, vm, presetName }: FormatCombatShareTextInput): CombatShareContent {
  if (vm.squad) {
    const scenario = buildSquadScenario(params);
    const primaryCount = (params.modelCount ?? 1) - (params.attackerEquipmentGroups ?? []).reduce((sum, g) => sum + g.count, 0);
    const groups = [{ count: primaryCount, weapons: [individualProfile(params), ...(params.primaryExtraWeapons ?? [])] }, ...(params.attackerEquipmentGroups ?? [])];
    const sections: CombatShareSection[] = [
      { title: 'ALCANCE', style: 'plain', lines: ['11.ª edición · escuadra contra escuadra · ' + vm.squad.engineVersion,
        `${params.modelCount ?? 1} atacantes contra ${vm.squad.modelCount} defensores · una activación`,
        'Daño por miniatura; exceso de cada ataque perdido. Armas y grupos en el orden declarado.',
        'Miniaturas heridas primero; personajes después de los demás grupos. Sin optimización de asignación.',
        'Las repeticiones manuales requieren permiso de una regla.'] },
      { title: 'ARMAS EN ORDEN DE RESOLUCIÓN', style: 'list', lines: groups.flatMap((g, i) => g.weapons.map((p, j) =>
        `Grupo ${i + 1}, arma ${j + 1}: ${g.count} miniaturas · A${p.attacksExpression ?? (p.attacksD6 ? 'D6' : p.attacks)} · habilidad ${p.hitThreshold}+ · F${p.strength} · FP${-p.ap} · D${formatDamageProfile(p)} · ${formatRules(p).join('; ')}`)) },
      { title: 'DEFENSORES EN ORDEN DE ASIGNACIÓN', style: 'list', lines: scenario.defenders.map((g, i) =>
        `Grupo ${i + 1}: ${g.count} miniaturas · R${g.toughness} · ${g.woundsMax}W por miniatura · primera ${g.firstModelWounds ?? g.woundsMax}W restantes · SA${g.baseSave}+${g.invulnerableSave ? ' · Inv' + g.invulnerableSave + '++' : ''}${g.fnpThreshold ? ' · FNP' + g.fnpThreshold + '+' : ''}${g.isCharacter ? ' · personaje' : ''}`) },
      { title: 'RESULTADOS', style: 'list', lines: [`Bajas medias: ${fmt(vm.squad.expectedCasualties)}`,
        `P(eliminar escuadra): ${pct(vm.squad.pEliminate)}`, `Supervivientes medios: ${fmt(vm.squad.expectedSurvivors)}`,
        `Heridas perdidas esperadas: ${fmt(vm.squad.expectedWoundsLost)}`,
        `Objetivo: ${params.casualtyGoal ?? vm.squad.modelCount} bajas · ${pct(vm.squad.casualtiesDist.filter(e => e.value >= (params.casualtyGoal ?? vm.squad!.modelCount)).reduce((sum, e) => sum + e.probability, 0))}`] },
      { title: 'DISTRIBUCIÓN DE BAJAS', style: 'list', lines: vm.squad.casualtiesDist.map(e => `${e.value} bajas: ${pct(e.probability)}`) },
    ];
    if (params.cover) sections[0].lines.push('Cobertura del defensor declarada.');
    if (params.partialCalculation) sections[0].lines.push('CÁLCULO PARCIAL: se omiten las reglas pendientes indicadas.');
    if (params.calculationLimitations?.length) sections.push({ title: 'LIMITACIONES', style: 'list', lines: params.calculationLimitations });
    return { title: 'LUDOMATHS - COMBATE DE ESCUADRAS', subtitle: presetName, sections };
  }
  const sections: CombatShareSection[] = [{ title: 'ALCANCE', style: 'plain', lines: [
    (params.guaranteedHitSix || params.guaranteedWoundSix || params.guaranteedDamageSix || params.guaranteedSaveSix ? 'Supuestos de dados observados anteriores · ' : '11.ª edición · una miniatura · ') + COMBAT_ENGINE_VERSION,
    'Portadores: ' + (params.modelCount ?? 1) + ' · heridas máximas: ' + (params.woundsMax ?? params.targetWounds),
    'Daño potencial sin límite; heridas perdidas limitadas a las restantes.',
    'Las repeticiones manuales requieren permiso de una regla.',
  ] }];

  if (params.catalogSelection) sections[0].lines.push('Catálogo LudoMaths: ' + params.catalogSelection.catalogVersion);
  if (params.partialCalculation) sections[0].lines.push('CÁLCULO PARCIAL: se omiten las reglas pendientes indicadas.');
  if (params.calculationLimitations?.length) sections.push({ title: 'LIMITACIONES', style: 'list', lines: params.calculationLimitations });
  sections.push({
    title: 'PERFIL',
    style: 'plain',
    lines: [
      `A${params.attacksExpression ?? (params.attacksD6 ? 'D6' : params.attacks)} | BH ${params.hitThreshold}+ | F${params.strength} | FP${params.ap === 0 ? 0 : -params.ap} | Daño ${formatDamageProfile(params)}`,
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
      `Heridas perdidas esperadas: ${fmt(vm.expectedWoundsLost ?? 0)}`,
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
