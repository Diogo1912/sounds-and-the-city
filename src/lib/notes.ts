const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

export function noteName(midi: number): string {
  const name = NAMES[((midi % 12) + 12) % 12] ?? "C";
  return `${name}${Math.floor(midi / 12) - 1}`;
}

export const PIANO_KEYS = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "k"];

export function pianoMidi(octave: number, semitone = 0): number {
  return (octave + 1) * 12 + semitone;
}
