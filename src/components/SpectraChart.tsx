import { Line } from "react-chartjs-2";

interface SpectraChartProps {
  currentSpectra: {
    psd: number[][];
    freqs: number[];
  } | null;
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
    labels: currentSpectra.freqs,
    datasets: channelNames.map((name, index) => ({
      label: name,
      data: currentSpectra.psd[index],
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
        text: "EEG Frequency Spectrum",
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
          text: "Power Spectral Density",
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
