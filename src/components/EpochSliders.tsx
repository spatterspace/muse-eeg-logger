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
    <div className="slider-group w-100 text-xs">
      <div>
        <h3>Epoch duration (Sampling Points): {settings.duration}</h3>
        <Slider
          min={1}
          step={1}
          max={4096}
          value={settings.duration}
          onChange={(e) => onSettingChange("duration", e.value as number)}
        />
      </div>
      <div>
        <h3>Sampling points between epochs onsets: {settings.interval}</h3>
        <Slider
          min={1}
          step={1}
          max={settings.duration}
          value={settings.interval}
          onChange={(e) => onSettingChange("interval", e.value as number)}
        />
      </div>
      <div>
        <h3>Cutoff Frequency Low: {settings.cutOffLow} Hz</h3>
        <Slider
          min={0.01}
          step={0.5}
          max={settings.cutOffHigh - 0.5}
          value={settings.cutOffLow}
          onChange={(e) => onSettingChange("cutOffLow", e.value as number)}
        />
      </div>
      <div>
        <h3>Cutoff Frequency High: {settings.cutOffHigh} Hz</h3>
        <Slider
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
