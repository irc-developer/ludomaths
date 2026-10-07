import { calculateSquad, type SquadRequest } from './squadCalculations';
const scope = self as unknown as { onmessage: (event: MessageEvent<SquadRequest>) => void; postMessage: (message: unknown) => void };
scope.onmessage = event => {
  try { scope.postMessage({ result: calculateSquad(event.data) }); }
  catch (error) { scope.postMessage({ error: error instanceof Error ? error.message : 'SQUAD_INVALID_INPUT' }); }
};
