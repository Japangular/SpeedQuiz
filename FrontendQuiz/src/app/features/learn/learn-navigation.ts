/**
 * What the learn board reads from router state when it opens:
 * router.navigate(['/learn', deckId], {state: arrival}).
 *
 * The quiz passes the card it is on; the deck shelf passes only the name.
 */
export interface LearnArrival {
  deckName?: string;
  /** Start at this card (a QuizSession uid). Absent or not in the deck: the first card. */
  startUid?: string;
}

/**
 * How the quiz's current deck is named in the learn route: its id, or for a
 * deck put into the quiz without one (an Anki table selection, the deck
 * stepper) its name, the same fallback QuizEngine uses as session key.
 */
export function quizDeckKey(deckId: string | undefined, deckName: string): string | undefined {
  return deckId || deckName || undefined;
}
