export type TimestampData = {
  data: [ch0: number, ch1: number, ch2: number, ch3: number, ch4: number];
  index: number;
  timestamp: number;
};

export type EEGChartData = {
  channels: Array<{
    data: number[];
    xLabels: number[];
  }>;
};

export type SpectraChartData = {
  channels: Array<{
    data: number[];
    xLabels: number[];
  }>;
};

export type RecordedEpochs = {
  [timestamp: number]: EEGChartData;
};

export interface Settings {
  cutOffLow: number;
  cutOffHigh: number;
  interval: number;
  srate: number;
  duration: number;
  downloadInterval: number;
  sliceFFTLow: number;
  sliceFFTHigh: number;
  fftBins: number;
}
