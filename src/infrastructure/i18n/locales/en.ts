const en = {
  common: {
    calculate: 'Calculate',
    reset: 'Reset',
    history: 'History',
    probability: 'Probability',
    result: 'Result',
  },
  dice: {
    title: 'Dice Calculator',
    numberOfDice: 'Number of dice',
    faces: 'Faces per die',
    targetFace: 'Success on (X+)',
    exactSuccesses: 'Exactly {{k}} successes',
    atLeastSuccesses: 'At least {{k}} successes',
    atMostSuccesses: 'At most {{k}} successes',
    expectedValue: 'Expected successes',
    distribution: 'Full distribution',
  },
  cards: {
    title: 'Card Calculator',
    deckSize: 'Deck size',
    copies: 'Copies in deck',
    draws: 'Cards drawn',
    exactProbability: 'Exactly {{k}} copies',
    atLeastOne: 'At least 1 copy',
    combo: 'Combo probability',
    addCard: 'Add card',
    removeCard: 'Remove',
  },
  history: {
    title: 'Roll History',
    noRolls: 'No rolls recorded yet',
    mean: 'Mean',
    variance: 'Variance',
    stdDev: 'Std. Deviation',
    totalRolls: 'Total rolls',
    clearHistory: 'Clear history',
  },
  navigation: {
    dice: 'Dice',
    cards: 'Cards',
    history: 'History',
  },
};

// Derive the type with string values so translations in other languages are assignable
export type Translations = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};

export default en;
