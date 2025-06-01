import { Slider } from "primereact/slider";
import { Settings } from "../types";

type EpochSlidersProps = {
  settings: Pick<
    Settings,
    "duration" | "interval" | "cutOffLow" | "cutOffHigh" | "srate"
  >;
  onSettingChange: (
    property: keyof Pick<
      Settings,
      "duration" | "interval" | "cutOffLow" | "cutOffHigh"
    >,
    value: number
  ) => void;
};

export function EpochSliders({ settings, onSettingChange }: EpochSlidersProps) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2>Chart Settings</h2>
      <div>
        <label htmlFor="duration" className="block mb-2">
          Epoch Duration (Sampling Points): {settings.duration}
        </label>
        <Slider
          id="duration"
          min={1}
          step={1}
          max={4096}
          value={settings.duration}
          onChange={(e) => onSettingChange("duration", e.value as number)}
        />
      </div>

      <div>
        <label htmlFor="interval" className="block mb-2">
          Sampling Points Between Epochs: {settings.interval}
        </label>
        <Slider
          id="interval"
          min={1}
          step={1}
          max={settings.duration}
          value={settings.interval}
          onChange={(e) => onSettingChange("interval", e.value as number)}
        />
      </div>

      <div>
        <label htmlFor="cutOffLow" className="block mb-2">
          Cutoff Frequency Low: {settings.cutOffLow} Hz
        </label>
        <Slider
          id="cutOffLow"
          min={0.01}
          step={0.5}
          max={settings.cutOffHigh - 0.5}
          value={settings.cutOffLow}
          onChange={(e) => onSettingChange("cutOffLow", e.value as number)}
        />
      </div>

      <div>
        <label htmlFor="cutOffHigh" className="block mb-2">
          Cutoff Frequency High: {settings.cutOffHigh} Hz
        </label>
        <Slider
          id="cutOffHigh"
          min={settings.cutOffLow + 0.5}
          step={0.5}
          max={settings.srate / 2}
          value={settings.cutOffHigh}
          onChange={(e) => onSettingChange("cutOffHigh", e.value as number)}
        />
      </div>
    </div>
  );
}
