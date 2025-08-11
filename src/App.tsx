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
import { useEpochRecording } from "./hooks/useEpochRecording";
import { useTimestampRecording } from "./hooks/useTimestampRecording";
import { useSpectraRecording } from "./hooks/useSpectraRecording";
import { useDeviceInfo } from "./hooks/useDeviceInfo";
import { useTelemetry } from "./hooks/useTelemetry";
import { useAudioAlert } from "./hooks/useAudioAlert";
import { Settings } from "./types";
import { EEGChart } from "./components/EEGChart";
import { SpectraChart } from "./components/SpectraChart";
import { FFTSliders } from "./components/FFTSliders";
import { Card } from "primereact/card";
import { TimestampTable } from "./components/TimestampTable";

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

  const client = useRef(createMuseClient());

  // useDeviceInfo polls the device at an interval to get the device info - this primarily is used to check if the device is still connected
  const {
    deviceInfo,
    error: deviceError,
    isLoading: deviceLoading,
  } = useDeviceInfo(client, isConnected);

  // Audio feedback for device errors
  useAudioAlert(deviceError);

  // telemeteryData includes battery level, voltage, and temperature
  const { telemetryData, isLoading: telemetryLoading } = useTelemetry(
    client,
    isConnected
  );

  // used for graphing - same logic as EEGEdu
  const { currentEpoch } = useEpochRecording(
    client,
    isConnected,
    settings,
    channelNames,
    participantId
  );

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

  const { currentSpectra } = useSpectraRecording(
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
      <details className="max-w-4xl mb-4">
        <summary className="text-lg font-semibold cursor-pointer rounded-t-lg">
          Instructions
        </summary>
        <div className="p-4">
          <p className="mb-4">
            This project has been tested on Chrome on Windows and Mac.
          </p>
          <ul className="space-y-2 mb-4">
            <li>
              <b>Change the download folder:</b> go to Chrome settings, then
              Downloads, then hit Change and select the USB stick.
            </li>
            <li>
              <b>Turn off Chrome's download popups:</b> go to Chrome settings,
              search "Show downloads when they are done", and disable that.
            </li>
            <li>
              <b>Unlock the record buttons:</b> enter the participant ID in the
              box. If you don't have a participant in mind, enter anything. Then
              press Connect and use the browser Bluetooth popup to connect to
              the device.
            </li>
            <li>
              <b>Force Chrome to allow multiple downloads:</b> set the download
              interval to 2s and hit Record Timestamps. If Chrome prompts you to
              allow downloading multiple files, click Allow.
            </li>
          </ul>
          <p className="mb-2">
            The sliders and the graphs are meant to help you test the device,
            but they have no impact on the data recording.
          </p>
          <p className="mb-2">
            When you're ready to start recording, enter a participant ID, press
            Connect, and then enter a download interval of 180 seconds (or as
            decided by the team). Then hit Record Timestamps.
          </p>
          <p>
            At each interval, a CSV file will be automatically downloaded and
            prefixed with the participant ID.
          </p>
        </div>
      </details>

      {isConnected && (
        <Card title="Device Information" className="max-w-4xl mb-4">
          {(deviceLoading || telemetryLoading) && (
            <p>Loading device information...</p>
          )}
          {deviceError && <p className="text-red-500">Error: {deviceError}</p>}
          {(deviceInfo || telemetryData) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Device Details</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Hardware:</span>{" "}
                    {deviceInfo?.hw}
                  </div>
                  <div>
                    <span className="font-medium">Firmware:</span>{" "}
                    {deviceInfo?.fw}
                  </div>
                  <div>
                    <span className="font-medium">Build Number:</span>{" "}
                    {deviceInfo?.bn}
                  </div>
                  <div>
                    <span className="font-medium">Protocol Version:</span>{" "}
                    {deviceInfo?.pv}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Connection & Battery</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Access Point:</span>{" "}
                    {deviceInfo?.ap}
                  </div>
                  <div>
                    <span className="font-medium">Bluetooth:</span>{" "}
                    {deviceInfo?.bl}
                  </div>
                  <div>
                    <span className="font-medium">Serial Port:</span>{" "}
                    {deviceInfo?.sp}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {deviceInfo?.tp}
                  </div>
                  <div>
                    <span className="font-medium">Battery Level:</span>{" "}
                    {telemetryData?.batteryLevel != null
                      ? `${telemetryData.batteryLevel}%`
                      : "-"}
                  </div>
                  <div>
                    <span className="font-medium">Voltage:</span>{" "}
                    {telemetryData?.fuelGaugeVoltage != null
                      ? `${telemetryData.fuelGaugeVoltage} V`
                      : "-"}
                  </div>
                  <div>
                    <span className="font-medium">Temperature:</span>{" "}
                    {telemetryData?.temperature != null
                      ? `${telemetryData.temperature} °C`
                      : "-"}
                  </div>
                  <div>
                    <span className="font-medium">Sequence ID:</span>{" "}
                    {telemetryData?.sequenceId != null
                      ? `${telemetryData.sequenceId}`
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

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
        </>
      </div>
    </div>
  );
}
