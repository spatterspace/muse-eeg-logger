import { Line } from "react-chartjs-2";
import { ChartOptions } from "chart.js";
import { EEGChartData } from "../types";

const eegChartOptions: ChartOptions<"line"> = {
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
  maintainAspectRatio: false,
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

type EEGChartProps = {
  currentEpoch: EEGChartData;
  channelNames: string[];
  channelColors: string[];
};

export function EEGChart({
  currentEpoch,
  channelNames,
  channelColors,
}: EEGChartProps) {
  const chartData = {
    labels: currentEpoch.channels[0]?.xLabels ?? [],
    datasets: currentEpoch.channels.map((channel, index) => ({
      label: channelNames[index],
      borderColor: channelColors[index],
      backgroundColor: channelColors[index],
      data: channel.data.map((x) => x /*+ (300 - index * 100)*/), // Applies offset
      fill: false,
    })),
  };

  return (
    <div className="w-full h-96 max-w-4xl">
      <Line data={chartData} options={eegChartOptions} />
    </div>
  );
}
