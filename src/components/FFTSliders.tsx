import { Slider } from "primereact/slider";
import { Settings } from "../types";

interface FFTSlidersProps {
  settings: Pick<
    Settings,
    "fftBins" | "sliceFFTLow" | "sliceFFTHigh" | "srate"
  >;
  onSettingChange: (property: keyof Settings, value: number) => void;
}

export function FFTSliders({ settings, onSettingChange }: FFTSlidersProps) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <label htmlFor="fftBins" className="block mb-2">
          FFT Bins: {settings.fftBins}
        </label>
        <Slider
          id="fftBins"
          value={settings.fftBins}
          onChange={(e) => onSettingChange("fftBins", e.value as number)}
          min={32}
          max={1024}
          step={32}
        />
      </div>

      <div>
        <label htmlFor="sliceFFTLow" className="block mb-2">
          FFT Low Cutoff: {settings.sliceFFTLow} Hz
        </label>
        <Slider
          id="sliceFFTLow"
          value={settings.sliceFFTLow}
          onChange={(e) => onSettingChange("sliceFFTLow", e.value as number)}
          min={0}
          max={settings.sliceFFTHigh - 1}
          step={1}
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
          max={settings.srate / 2}
          step={1}
        />
      </div>
    </div>
  );
}
