import { Slider } from "@/components/ui/slider";
import { noteName } from "@/lib/notes";

type Props = {
  name: string;
  scale: number[];
  armed: number;
  cutoff: number;
  decay: number;
  onArm: (midi: number) => void;
  onCutoff: (value: number) => void;
  onDecay: (value: number) => void;
};

export function SynthPanel({ name, scale, armed, cutoff, decay, onArm, onCutoff, onDecay }: Props) {
  return (
    <aside className="synth">
      <p className="synth-name">{name}</p>
      <label className="knob">
        <span>Cutoff</span>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[Math.round(cutoff * 100)]}
          aria-label="Cutoff"
          onValueChange={(value) => onCutoff((value[0] ?? 50) / 100)}
        />
      </label>
      <label className="knob">
        <span>Decay</span>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[Math.round(decay * 100)]}
          aria-label="Decay"
          onValueChange={(value) => onDecay((value[0] ?? 30) / 100)}
        />
      </label>
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
    </aside>
  );
}
