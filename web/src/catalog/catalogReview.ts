import type { CatalogScenarioReview } from '@application/dice/catalogScenario';

/** No reviewed metric-irrelevance metadata exists yet, so omitted effects stay explicit. */
export function catalogOmissions(review: CatalogScenarioReview) {
  return Array.from(new Map([...review.pending, ...review.excluded].map(rule => [rule.id, rule])).values());
}
