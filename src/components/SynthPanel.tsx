import { Knob } from "@/components/Knob";
import { noteName } from "@/lib/notes";
import type { CityId } from "@/types";

type Props = {
  city: CityId;
  name: string;
  scale: number[];
  armed: number;
  cutoff: number;
  decay: number;
  cutoffDefault: number;
  decayDefault: number;
  onArm: (midi: number) => void;
  onCutoff: (value: number) => void;
  onDecay: (value: number) => void;
};

const KIND = {
  "new-york": "bullet",
  amsterdam: "bell",
  tokyo: "ticket",
  london: "roundel",
} as const;

export function SynthPanel({
  city,
  name,
  scale,
  armed,
  cutoff,
  decay,
  cutoffDefault,
  decayDefault,
  onArm,
  onCutoff,
  onDecay,
}: Props) {
  const kind = KIND[city];
  return (
    <section className="synth" aria-label={name}>
      <p className="synth-name">{name}</p>
      <Knob
        label="Cutoff"
        kind={kind}
        size={46}
        min={0}
        max={100}
        value={Math.round(cutoff * 100)}
        resetValue={Math.round(cutoffDefault * 100)}
        onChange={(value) => onCutoff(value / 100)}
      />
      <Knob
        label="Decay"
        kind={kind}
        size={46}
        min={0}
        max={100}
        value={Math.round(decay * 100)}
        resetValue={Math.round(decayDefault * 100)}
        onChange={(value) => onDecay(value / 100)}
      />
      <div className="keys" role="group" aria-label={`${name} keyboard`}>
        {scale.map((midi) => (
          <button
            key={midi}
            type="button"
            className={midi === armed ? "key is-on" : "key"}
            aria-pressed={midi === armed}
            onPointerDown={(event) => {
              event.preventDefault();
              onArm(midi);
            }}
          >
            {noteName(midi)}
          </button>
        ))}
      </div>
    </section>
  );
}
