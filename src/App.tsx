import "primereact/resources/themes/lara-light-blue/theme.css";
import "./app.css";
import { MuseClient } from "muse-js";
import { useRef, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Legend,
} from "chart.js";
import { EpochSliders } from "./components/EpochSliders";
import { TimestampTable } from "./components/TimestampTable";
import { TopBar } from "./components/TopBar";
import { useEpochRecording } from "./hooks/useEpochRecording";
import { useTimestampRecording } from "./hooks/useTimestampRecording";
import { Settings } from "./types";
import { SliderChangeEvent } from "primereact/slider";
import { EEGChart } from "./components/EEGChart";
import { SpectraChart } from "./components/SpectraChart";
import { useSpectraRecording } from "./hooks/useSpectraRecording";
import { FFTSliders } from "./components/FFTSliders";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Legend
);

const initialSettings: Settings = {
  cutOffLow: 0.1,
  cutOffHigh: 100,
  interval: 25, // Sampling points between epochs onsets
  srate: 256, // never exposed to the end user
  duration: 512,
  downloadInterval: 10, // Time in seconds between downloads
  fftBins: 512,
  sliceFFTLow: 1,
  sliceFFTHigh: 100,
};

const enableAux = true;

function createMuseClient() {
  const client = new MuseClient();
  client.enableAux = enableAux;
  return client;
}

const channelNames = ["TP9", "AF7", "AF8", "TP10", "AUX"];
const channelColors = [
  "rgba(217,95,2)", // Orange
  "rgba(27,158,119)", // Green
  "rgba(117,112,179)", // Purple
  "rgba(231,41,138)", // Pink
  "rgba(20,20,20)", // Black
];

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [participantId, setParticipantId] = useState("");

  const client = useRef(createMuseClient());

  const {
    currentEpoch,
    recordingEpochs,
    setRecordingEpochs,
    stopRecordingEpochs,
  } = useEpochRecording(
    client,
    isConnected,
    settings,
    participantId,
    channelNames
  );

  const {
    timestampData,
    recordingTimestamps,
    setRecordingTimestamps,
    stopRecordingTimestamps,
  } = useTimestampRecording(
    client,
    isConnected,
    settings,
    participantId,
    channelNames
  );

  const {
    currentSpectra,
    recordingSpectra,
    setRecordingSpectra,
    stopRecordingSpectra,
  } = useSpectraRecording(
    client,
    isConnected,
    settings,
    participantId,
    channelNames
  );

  async function connect() {
    await client.current.connect();
    setIsConnected(true);
    await client.current.start();
  }

  async function disconnect() {
    await client.current.disconnect();
    setIsConnected(false);
  }

  function handleSliderChange(
    e: SliderChangeEvent,
    property: keyof typeof settings
  ) {
    setSettings((prevSettings) => ({ ...prevSettings, [property]: e.value }));
  }

  return (
    <div>
      <TopBar
        // Participant ID
        participantId={participantId}
        setParticipantId={setParticipantId}
        // Connection
        isConnected={isConnected}
        onConnect={connect}
        onDisconnect={disconnect}
        // Epoch recording
        recordingEpochs={recordingEpochs}
        onStartRecordingEpochs={() => setRecordingEpochs(Date.now())}
        onStopRecordingEpochs={stopRecordingEpochs}
        // Timestamp recording
        recordingTimestamps={recordingTimestamps}
        onStartRecordingTimestamps={() => setRecordingTimestamps(Date.now())}
        onStopRecordingTimestamps={stopRecordingTimestamps}
        // Download interval
        downloadInterval={settings.downloadInterval}
        onDownloadIntervalChange={(e) =>
          handleSliderChange(e, "downloadInterval")
        }
        // Spectra recording
        recordingSpectra={recordingSpectra}
        onStartRecordingSpectra={() => setRecordingSpectra(Date.now())}
        onStopRecordingSpectra={stopRecordingSpectra}
      />
      <div className="grid grid-cols-[25rem_1fr] gap-4 w-full">
        <EpochSliders
          settings={settings}
          onSettingChange={(property, value) =>
            setSettings((prev) => ({ ...prev, [property]: value }))
          }
        />
        <EEGChart
          currentEpoch={currentEpoch}
          channelNames={channelNames}
          channelColors={channelColors}
        />

        <FFTSliders
          settings={settings}
          onSettingChange={(property, value) =>
            setSettings((prev) => ({ ...prev, [property]: value }))
          }
        />
        <SpectraChart
          currentSpectra={currentSpectra}
          channelNames={channelNames}
          channelColors={channelColors}
        />
      </div>
      <h2>Timestamps</h2>
      <TimestampTable
        timestampData={timestampData}
        channelNames={channelNames}
        channelColors={channelColors}
      />
    </div>
  );
}
