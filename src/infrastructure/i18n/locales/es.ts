import type { Translations } from './en';

const es: Translations = {
  common: {
    calculate: 'Calcular',
    reset: 'Reiniciar',
    history: 'Historial',
    probability: 'Probabilidad',
    result: 'Resultado',
  },
  dice: {
    title: 'Calculadora de Dados',
    numberOfDice: 'Número de dados',
    faces: 'Caras por dado',
    targetFace: 'Éxito en (X+)',
    exactSuccesses: 'Exactamente {{k}} éxitos',
    atLeastSuccesses: 'Al menos {{k}} éxitos',
    atMostSuccesses: 'Como máximo {{k}} éxitos',
    expectedValue: 'Éxitos esperados',
    distribution: 'Distribución completa',
  },
  cards: {
    title: 'Calculadora de Cartas',
    deckSize: 'Tamaño del mazo',
    copies: 'Copias en el mazo',
    draws: 'Cartas robadas',
    exactProbability: 'Exactamente {{k}} copias',
    atLeastOne: 'Al menos 1 copia',
    combo: 'Probabilidad de combo',
    addCard: 'Añadir carta',
    removeCard: 'Eliminar',
  },
  history: {
    title: 'Historial de Tiradas',
    noRolls: 'Todavía no hay tiradas registradas',
    mean: 'Media',
    variance: 'Varianza',
    stdDev: 'Desviación típica',
    totalRolls: 'Total de tiradas',
    clearHistory: 'Borrar historial',
  },
  navigation: {
    dice: 'Dados',
    cards: 'Cartas',
    history: 'Historial',
  },
};

export default es;
