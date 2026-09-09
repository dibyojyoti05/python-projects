import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';

// Initialize zxcvbn-ts with English dictionary and common adjacency graphs
const zxcvbn = new ZxcvbnFactory({
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
});

export interface PasswordAnalysisResult {
  score: number; // 0 to 4
  guesses: number;
  guessesLog10: number;
  entropyBits: number;
  crackTimesDisplay: {
    onlineThrottling100PerHour: string;
    onlineNoThrottling10PerSecond: string;
    offlineSlowHashing1e4PerSecond: string;
    offlineFastHashing1e10PerSecond: string;
  };
  feedback: {
    warning: string;
    suggestions: string[];
  };
  calcTime: number;
}

export const analyzePassword = (password: string): PasswordAnalysisResult => {
  if (!password) {
    return {
      score: 0,
      guesses: 0,
      guessesLog10: 0,
      entropyBits: 0,
      crackTimesDisplay: {
        onlineThrottling100PerHour: 'instant',
        onlineNoThrottling10PerSecond: 'instant',
        offlineSlowHashing1e4PerSecond: 'instant',
        offlineFastHashing1e10PerSecond: 'instant',
      },
      feedback: {
        warning: '',
        suggestions: [],
      },
      calcTime: 0,
    };
  }

  const result = zxcvbn.check(password);
  const entropyBits = Math.max(0, Math.log2(result.guesses));

  return {
    score: result.score,
    guesses: result.guesses,
    guessesLog10: result.guessesLog10,
    entropyBits: parseFloat(entropyBits.toFixed(2)),
    crackTimesDisplay: {
      onlineThrottling100PerHour: result.crackTimes.onlineThrottlingXPerHour.display,
      onlineNoThrottling10PerSecond: result.crackTimes.onlineNoThrottlingXPerSecond.display,
      offlineSlowHashing1e4PerSecond: result.crackTimes.offlineSlowHashingXPerSecond.display,
      offlineFastHashing1e10PerSecond: result.crackTimes.offlineFastHashingXPerSecond.display,
    },
    feedback: {
      warning: result.feedback.warning || '',
      suggestions: result.feedback.suggestions || [],
    },
    calcTime: result.calcTime,
  };
};

export const getScoreColor = (score: number): string => {
  switch (score) {
    case 0:
      return 'bg-red-500';
    case 1:
      return 'bg-orange-500';
    case 2:
      return 'bg-yellow-500';
    case 3:
      return 'bg-green-400';
    case 4:
      return 'bg-green-600';
    default:
      return 'bg-muted';
  }
};

export const getScoreLabel = (score: number): string => {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Strong';
    case 4:
      return 'Very Strong';
    default:
      return 'Unknown';
  }
};
