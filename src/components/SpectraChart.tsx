import { Line } from "react-chartjs-2";
import { SpectraChartData } from "../types";

interface SpectraChartProps {
  currentSpectra: SpectraChartData;
  channelNames: string[];
  channelColors: string[];
}

export function SpectraChart({
  currentSpectra,
  channelNames,
  channelColors,
}: SpectraChartProps) {
  if (!currentSpectra) return null;

  const data = {
    labels: currentSpectra.channels[0]?.xLabels ?? [],
    datasets: currentSpectra.channels.map((channel, index) => ({
      label: channelNames[index],
      data: channel.data,
      borderColor: channelColors[index],
      backgroundColor: channelColors[index],
      fill: false,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Spectral data from each electrode",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Frequency (Hz)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Power (\u03BCV\u00B2)",
        },
      },
    },
  };

  return (
    <div className="w-full h-96 max-w-4xl">
      <Line data={data} options={options} />
    </div>
  );
}
