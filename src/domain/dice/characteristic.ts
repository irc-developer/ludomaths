import type { Distribution } from '../math/distribution';
import { multiConvolve } from '../math/convolution';

/** Complete distribution, including the intrinsic constant, never a mean. */
export function characteristicDistribution(expression: string): Distribution {
  const value = expression.trim().toUpperCase();
  if (/^\d{1,3}$/.test(value)) {
    const n = Number(value);
    if (n > 100) throw new RangeError('Characteristic limit exceeded');
    return [{ value: n, probability: 1 }];
  }
  const match = /^(\d{1,2})?D([36])(?:\+(\d{1,3}))?$/.exec(value);
  if (!match) throw new RangeError('Unsupported characteristic expression');
  const count = Number(match[1] ?? 1);
  const sides = Number(match[2]);
  const constant = Number(match[3] ?? 0);
  if (count < 1 || count > 10 || constant > 100) throw new RangeError('Characteristic limit exceeded');
  const die = Array.from({ length: sides }, (_, i) => ({ value: i + 1, probability: 1 / sides }));
  return multiConvolve(die, count).map(entry => ({ ...entry, value: entry.value + constant }));
}

/** Public AP is signed: accepting positive text would hide an ambiguous input. */
export function parseSignedAp(value: string): number {
  if (!/^(0|-[1-9]\d?)$/.test(value.trim())) throw new RangeError('AP must be zero or negative');
  return Math.abs(Number(value.trim()));
}
