import { Slider } from "primereact/slider";
import { Settings } from "../types";

interface FFTSlidersProps {
  settings: Pick<Settings, "sliceFFTLow" | "sliceFFTHigh" | "srate">;
  onSettingChange: (property: keyof Settings, value: number) => void;
}

export function FFTSliders({ settings, onSettingChange }: FFTSlidersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="sliceFFTLow" className="block mb-2">
          FFT Low Cutoff: {settings.sliceFFTLow} Hz
        </label>
        <Slider
          id="sliceFFTLow"
          value={settings.sliceFFTLow}
          onChange={(e) => onSettingChange("sliceFFTLow", e.value as number)}
          min={1}
          max={settings.sliceFFTHigh - 1}
        />
      </div>

      <div>
        <label htmlFor="sliceFFTHigh" className="block mb-2">
          FFT High Cutoff: {settings.sliceFFTHigh} Hz
        </label>
        <Slider
          id="sliceFFTHigh"
          value={settings.sliceFFTHigh}
          onChange={(e) => onSettingChange("sliceFFTHigh", e.value as number)}
          min={settings.sliceFFTLow + 1}
        />
      </div>
    </div>
  );
}
