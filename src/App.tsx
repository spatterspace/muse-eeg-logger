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
import { TopBar } from "./components/TopBar";
import { useEpochGraphData } from "./hooks/useEpochGraphData";
import { useTimestampRecording } from "./hooks/useTimestampRecording";
import { useSpectraGraphData } from "./hooks/useSpectraGraphData";
import { useDeviceInfo } from "./hooks/useDeviceInfo";
import { useTelemetry } from "./hooks/useTelemetry";
import { useAudioAlert } from "./hooks/useAudioAlert";
import { Settings } from "./types";
import { EEGChart } from "./components/EEGChart";
import { SpectraChart } from "./components/SpectraChart";
import { FFTSliders } from "./components/FFTSliders";
import { RingMetrics } from "./components/RingMetrics";
import { Instructions } from "./components/Instructions";
import { DeviceInfoCard } from "./components/DeviceInfoCard";

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
  sliceFFTLow: 1,
  sliceFFTHigh: 100,
  fftBins: 256,
};

const enableAux = false;

function createMuseClient() {
  const client = new MuseClient();
  client.enableAux = enableAux;
  client.enablePpg = true;
  return client;
}

const channelNames = ["TP9", "AF7", "AF8", "TP10"];
if (enableAux) {
  channelNames.push("AUX");
}

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
  const [isEpochChartOpen, setIsEpochChartOpen] = useState(true);
  const [isSpectraChartOpen, setIsSpectraChartOpen] = useState(false);
  const [disconnectSoundEnabled, setDisconnectSoundEnabled] = useState(true);

  const client = useRef(createMuseClient());

  // useDeviceInfo polls the device at an interval to get the device info - this primarily is used to check if the device is still connected
  const {
    deviceInfo,
    error: deviceError,
    isLoading: deviceLoading,
  } = useDeviceInfo(client, isConnected);

  // Audio feedback for device errors
  useAudioAlert(deviceError, "/chime.mp3", disconnectSoundEnabled);

  // telemeteryData includes battery level, voltage, and temperature
  const { telemetryData, isLoading: telemetryLoading } = useTelemetry(
    client,
    isConnected
  );

  // used for graphing - same logic as EEGEdu
  const { currentEpoch } = useEpochGraphData(client, isConnected, settings);
  const { currentSpectra } = useSpectraGraphData(client, isConnected, settings);

  const {
    // timestampData,
    recordingTimestamps,
    setRecordingTimestamps,
    stopRecordingTimestamps,
  } = useTimestampRecording(
    client,
    isConnected,
    settings,
    channelNames,
    participantId
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

  return (
    <div className="p-4">
      <Instructions />

      <DeviceInfoCard
        isConnected={isConnected}
        deviceInfo={deviceInfo}
        deviceError={deviceError}
        deviceLoading={deviceLoading}
        telemetryData={telemetryData}
        telemetryLoading={telemetryLoading}
      />

      <div>
        <TopBar
          // Participant ID
          participantId={participantId}
          setParticipantId={setParticipantId}
          // Connection
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
          // Timestamp recording
          recordingTimestamps={recordingTimestamps}
          onStartRecordingTimestamps={() => {
            setRecordingTimestamps(Date.now());
            setIsEpochChartOpen(false);
            setIsSpectraChartOpen(false);
          }}
          onStopRecordingTimestamps={stopRecordingTimestamps}
          // Download interval
          downloadInterval={settings.downloadInterval}
          onDownloadIntervalChange={(value: number) =>
            setSettings((prev) => ({ ...prev, downloadInterval: value }))
          }
          // Disconnect sound toggle
          disconnectSoundEnabled={disconnectSoundEnabled}
          onToggleDisconnectSound={setDisconnectSoundEnabled}
        />
        <>
          <details
            className="mb-4"
            open={isEpochChartOpen}
            onToggle={(e) => setIsEpochChartOpen(e.currentTarget.open)}
          >
            <summary className="text-lg font-semibold cursor-pointer rounded-t-lg">
              Epoch Chart
            </summary>
            <div className="p-4">
              <div className="grid grid-cols-[25rem_1fr] gap-4 w-full">
                <div>
                  <EpochSliders
                    settings={settings}
                    onSettingChange={(property, value) =>
                      setSettings((prev) => ({ ...prev, [property]: value }))
                    }
                  />
                </div>
                <EEGChart
                  currentEpoch={currentEpoch}
                  channelNames={channelNames}
                  channelColors={channelColors}
                />
              </div>
            </div>
          </details>

          <details
            className="max-w-4xl mb-4"
            open={isSpectraChartOpen}
            onToggle={(e) => setIsSpectraChartOpen(e.currentTarget.open)}
          >
            <summary className="text-lg font-semibold cursor-pointer rounded-t-lg">
              Spectra Chart
            </summary>
            <div className="p-4">
              <div className="grid grid-cols-[25rem_1fr] gap-4 w-full">
                <div>
                  <FFTSliders
                    settings={settings}
                    onSettingChange={(property, value) =>
                      setSettings((prev) => ({ ...prev, [property]: value }))
                    }
                  />
                </div>
                <SpectraChart
                  currentSpectra={currentSpectra}
                  channelNames={channelNames}
                  channelColors={channelColors}
                />
              </div>
            </div>
          </details>
          <RingMetrics />
        </>
      </div>
    </div>
  );
}
