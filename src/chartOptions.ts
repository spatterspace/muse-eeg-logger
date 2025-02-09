import { ChartOptions } from "chart.js";

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
