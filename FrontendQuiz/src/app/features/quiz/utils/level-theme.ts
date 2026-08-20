/**
 * Deterministic hue per level, shared by every surface that tints itself by
 * level. 47 is coprime with 360, so neighbouring levels land far apart and the
 * cycle only repeats after 360 levels.
 */
export function levelHue(level: number | null | undefined): number {
  return ((level ?? 0) * 47) % 360;
}
