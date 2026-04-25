import type { CombatParams } from './presets';
import type { CombatViewModel } from './useCombat';
import { buildCombatShareContent, type CombatShareContent } from './share';

interface CombatShareImageInput {
  params: CombatParams;
  vm: CombatViewModel;
  presetName?: string;
}

interface CombatShareImageSupportInput {
  clipboard?: {
    write?: (items: ClipboardItem[]) => Promise<void>;
  };
  clipboardItem?: unknown;
}

type ClipboardItemConstructor = new (items: Record<string, Blob | PromiseLike<Blob>>) => ClipboardItem;

const CARD_WIDTH = 960;
const CARD_PADDING = 40;
const SECTION_GAP = 20;
const LINE_HEIGHT = 24;
const TITLE_HEIGHT = 28;
const SECTION_PADDING_Y = 22;
const MAX_CHARS_PER_LINE = 48;
const KPI_COLUMNS = 3;
const KPI_CARD_HEIGHT = 86;
const KPI_GAP = 16;
const DISTRIBUTION_BAR_HEIGHT = 20;
const DISTRIBUTION_ROW_GAP = 10;

interface ShareMetric {
  label: string;
  value: string;
  highlight?: boolean;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [''];
  }

  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (word.length > maxChars) {
      if (current.length > 0) {
        lines.push(current);
        current = '';
      }

      for (let start = 0; start < word.length; start += maxChars) {
        lines.push(word.slice(start, start + maxChars));
      }
      continue;
    }

    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

function createSectionMarkup(sections: CombatShareContent['sections'], startY: number): { markup: string; endY: number } {
  const parts: string[] = [];
  let currentY = startY;

  for (const section of sections) {
    const lineEntries = section.lines.flatMap(line =>
      wrapText(section.style === 'list' ? `• ${line}` : line, MAX_CHARS_PER_LINE),
    );

    const sectionHeight = SECTION_PADDING_Y * 2 + TITLE_HEIGHT + lineEntries.length * LINE_HEIGHT;
    parts.push(
      `<rect x="${CARD_PADDING}" y="${currentY}" width="${CARD_WIDTH - CARD_PADDING * 2}" height="${sectionHeight}" rx="18" fill="#1e293b" stroke="#334155" />`,
      `<text x="${CARD_PADDING + 24}" y="${currentY + 34}" fill="#c7d2fe" font-size="18" font-weight="700">${escapeXml(section.title)}</text>`,
    );

    let lineY = currentY + 64;
    for (const line of lineEntries) {
      parts.push(
        `<text x="${CARD_PADDING + 24}" y="${lineY}" fill="#e2e8f0" font-size="18">${escapeXml(line)}</text>`,
      );
      lineY += LINE_HEIGHT;
    }

    currentY += sectionHeight + SECTION_GAP;
  }

  return { markup: parts.join(''), endY: currentY };
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

function buildMetrics(params: CombatParams, vm: CombatViewModel): ShareMetric[] {
  return [
    {
      label: `P(eliminar objetivo de ${params.targetWounds}W)`,
      value: pct(vm.pEliminate),
      highlight: true,
    },
    {
      label: 'Daño más probable',
      value: String(vm.mostLikelyDamage),
    },
    {
      label: 'Daño mediano',
      value: String(vm.medianDamage),
    },
    {
      label: 'Rango central (Q1-Q3)',
      value: `${vm.centralRange.low}-${vm.centralRange.high}`,
    },
    {
      label: 'Daño esperado E[D]',
      value: fmt(vm.expectedDamage),
    },
    {
      label: 'P(>= 1 herida)',
      value: pct(vm.pAtLeastOne),
    },
  ];
}

function buildVisibleDistribution(vm: CombatViewModel): CombatViewModel['distribution'] {
  return vm.distribution
    .filter(entry => entry.probability >= 0.001)
    .slice(0, 20);
}

function createMetricsMarkup(metrics: ShareMetric[], startY: number): { markup: string; endY: number } {
  const cardWidth = (CARD_WIDTH - CARD_PADDING * 2 - KPI_GAP * (KPI_COLUMNS - 1)) / KPI_COLUMNS;
  const parts: string[] = [];

  metrics.forEach((metric, index) => {
    const row = Math.floor(index / KPI_COLUMNS);
    const column = index % KPI_COLUMNS;
    const x = CARD_PADDING + column * (cardWidth + KPI_GAP);
    const y = startY + row * (KPI_CARD_HEIGHT + KPI_GAP);

    parts.push(
      `<rect x="${x}" y="${y}" width="${cardWidth}" height="${KPI_CARD_HEIGHT}" rx="14" fill="#0f172a" stroke="${metric.highlight ? '#818cf8' : '#334155'}" />`,
      `<text x="${x + cardWidth / 2}" y="${y + 24}" fill="#cbd5e1" font-size="14" text-anchor="middle">${escapeXml(metric.label)}</text>`,
      `<text x="${x + cardWidth / 2}" y="${y + 58}" fill="${metric.highlight ? '#818cf8' : '#c7d2fe'}" font-size="24" font-weight="700" text-anchor="middle">${escapeXml(metric.value)}</text>`,
    );
  });

  const rows = Math.ceil(metrics.length / KPI_COLUMNS);
  return {
    markup: parts.join(''),
    endY: startY + rows * KPI_CARD_HEIGHT + (rows - 1) * KPI_GAP,
  };
}

function createDistributionMarkup(vm: CombatViewModel, startY: number): { markup: string; endY: number } {
  const entries = buildVisibleDistribution(vm);
  if (entries.length === 0) {
    return { markup: '', endY: startY };
  }

  const maxProbability = Math.max(...entries.map(entry => entry.probability));
  const labelWidth = 28;
  const valueWidth = 60;
  const barWidth = CARD_WIDTH - CARD_PADDING * 2 - labelWidth - valueWidth - 16;
  const parts = [
    `<text x="${CARD_PADDING}" y="${startY}" fill="#cbd5e1" font-size="16">Distribución completa de daño total entero</text>`,
  ];

  let rowY = startY + 24;
  for (const entry of entries) {
    const width = (entry.probability / maxProbability) * barWidth;
    parts.push(
      `<text x="${CARD_PADDING + labelWidth - 4}" y="${rowY + 15}" fill="#94a3b8" font-size="15" text-anchor="end">${entry.value}</text>`,
      `<rect x="${CARD_PADDING + labelWidth + 8}" y="${rowY}" width="${barWidth}" height="${DISTRIBUTION_BAR_HEIGHT}" rx="5" fill="#334155" />`,
      `<rect x="${CARD_PADDING + labelWidth + 8}" y="${rowY}" width="${width}" height="${DISTRIBUTION_BAR_HEIGHT}" rx="5" fill="#818cf8" />`,
      `<text x="${CARD_PADDING + labelWidth + 8 + barWidth + 10}" y="${rowY + 15}" fill="#94a3b8" font-size="15">${pct(entry.probability)}</text>`,
    );
    rowY += DISTRIBUTION_BAR_HEIGHT + DISTRIBUTION_ROW_GAP;
  }

  return {
    markup: parts.join(''),
    endY: rowY,
  };
}

function getContextSections(content: CombatShareContent): CombatShareContent['sections'] {
  return content.sections.filter(section => section.title === 'PERFIL' || section.title === 'OBJETIVO' || section.title === 'REGLAS');
}

function buildCombatShareSvgDocument(input: CombatShareImageInput): { svg: string; width: number; height: number } {
  const content = buildCombatShareContent(input);
  const contextSections = getContextSections(content);
  const headerLines = [content.title, content.subtitle].filter((line): line is string => Boolean(line));
  const metricsMarkup = createMetricsMarkup(buildMetrics(input.params, input.vm), 144);
  const distributionMarkup = createDistributionMarkup(input.vm, metricsMarkup.endY + 42);
  const sectionMarkup = createSectionMarkup(contextSections, distributionMarkup.endY + 30);
  const height = sectionMarkup.endY + 20;

  const headerText = headerLines
    .map((line, index) => {
      const y = index === 0 ? 62 : 96;
      const size = index === 0 ? 30 : 18;
      const weight = index === 0 ? 800 : 500;
      const color = index === 0 ? '#f8fafc' : '#94a3b8';
      return `<text x="${CARD_PADDING}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`;
    })
    .join('');

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">`,
    '<rect width="100%" height="100%" fill="#0f172a" rx="28" />',
    '<rect x="0" y="0" width="100%" height="120" fill="#111c35" rx="28" />',
    '<rect x="0" y="94" width="100%" height="26" fill="#818cf8" opacity="0.16" />',
    '<g font-family="Segoe UI, Inter, Arial, sans-serif">',
    headerText,
    metricsMarkup.markup,
    distributionMarkup.markup,
    sectionMarkup.markup,
    '</g>',
    '</svg>',
  ].join('');

  return { svg, width: CARD_WIDTH, height };
}

async function loadSvgImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load combat share SVG image.'));
    image.src = url;
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Unable to export combat share PNG blob.'));
    }, 'image/png');
  });
}

async function buildCombatSharePngBlob(input: CombatShareImageInput): Promise<Blob> {
  const { svg, width, height } = buildCombatShareSvgDocument(input);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadSvgImage(svgUrl);
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to acquire canvas context for combat share image.');
    }

    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function buildCombatShareSvg(input: CombatShareImageInput): string {
  return buildCombatShareSvgDocument(input).svg;
}

export function isCombatShareImageSupported(
  support: CombatShareImageSupportInput = {
    clipboard: globalThis.navigator?.clipboard,
    clipboardItem: (globalThis as typeof globalThis & { ClipboardItem?: unknown }).ClipboardItem,
  },
): boolean {
  return typeof support.clipboard?.write === 'function' && typeof support.clipboardItem === 'function';
}

export async function copyCombatShareImage(input: CombatShareImageInput): Promise<'copied' | 'unsupported' | 'error'> {
  const clipboard = globalThis.navigator?.clipboard;
  const ClipboardItemCtor = (globalThis as typeof globalThis & { ClipboardItem?: ClipboardItemConstructor }).ClipboardItem;

  if (!isCombatShareImageSupported({ clipboard, clipboardItem: ClipboardItemCtor })) {
    return 'unsupported';
  }

  try {
    const pngBlob = await buildCombatSharePngBlob(input);
    await clipboard.write([new ClipboardItemCtor({ 'image/png': pngBlob })]);
    return 'copied';
  } catch {
    return 'error';
  }
}