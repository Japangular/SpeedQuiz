import { Injectable } from '@angular/core';

export interface LevenshteinResult {
  dif: number;
  shortestString: string;
}

@Injectable({
  providedIn: 'root'
})
export class LevenshteinService {

  constructor() { }

  levenshteinDistance(as: string, bs: string): LevenshteinResult {
    const aa = as.toLowerCase().split(",").map(a => a.trim());
    const bb = bs.toLowerCase().split(",").map(b => b.trim());
    let minDistance = Infinity;
    let maxCommon = "";
    for(let a of aa) {
      for(let b of bb) {
        const distance = calculateLevenshtein(a, b);
        if(distance < minDistance) {
          minDistance = distance;
          maxCommon = a.length > b.length ? a : b;
        }
      }
    }
    return {dif: minDistance, shortestString: maxCommon};
  }

}

export function calculateLevenshtein(a: string, b: string) {
  a = a.toLowerCase();
  b = b.toLowerCase();

  const matrix: number[][] = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost,
      );
    }
  }

  return matrix[a.length][b.length];
}
