import { ChartOptions } from "chart.js";
export const chartStyles = {
  wrapperStyle: {
    display: "flex",
    flexWrap: "wrap",
    padding: "20px",
  },
};

export const emptyChannelData = {
  ch0: {
    datasets: [{}],
  },
  ch1: {
    datasets: [{}],
  },
  ch2: {
    datasets: [{}],
  },
  ch3: {
    datasets: [{}],
  },
};

export const emptyAuxChannelData = {
  ch0: {
    datasets: [{}],
  },
  ch1: {
    datasets: [{}],
  },
  ch2: {
    datasets: [{}],
  },
  ch3: {
    datasets: [{}],
  },
  ch4: {
    datasets: [{}],
  },
};

export const emptySingleChannelData = {
  ch1: {
    datasets: [{}],
  },
};

export const eegChartOptions: ChartOptions<"line"> = {
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: "Time (msec)",
      },
    },
    y: {
      display: true,
      title: {
        display: true,
        text: "Voltage (\u03BCV)",
      },
    },
  },
  elements: {
    point: {
      radius: 0,
    },
  },
  responsive: true,
  animation: {
    duration: 0,
  },
  plugins: {
    legend: {
      display: true,
      position: "top",
    },
    title: {
      display: true,
      text: "Raw data from EEG electrodes",
    },
  },
} as const;
