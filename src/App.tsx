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
// import { TimestampTable } from "./components/TimestampTable";
import { TopBar } from "./components/TopBar";
import { useEpochRecording } from "./hooks/useEpochRecording";
import { useTimestampRecording } from "./hooks/useTimestampRecording";
import { Settings } from "./types";
import { EEGChart } from "./components/EEGChart";
import { SpectraChart } from "./components/SpectraChart";
import { useSpectraRecording } from "./hooks/useSpectraRecording";
import { FFTSliders } from "./components/FFTSliders";
import { Card } from "primereact/card";

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
  const [enableCharts, setEnableCharts] = useState(true);

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

  const {
    currentSpectra,
    recordingSpectra,
    setRecordingSpectra,
    stopRecordingSpectra,
  } = useSpectraRecording(
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

  const showCharts =
    enableCharts &&
    !recordingEpochs &&
    !recordingTimestamps &&
    !recordingSpectra;

  return (
    <>
      <Card title="Instructions" className="max-w-4xl">
        This project has been tested on Chrome on Windows and Mac.
        <ul>
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
            press Connect and use the browser Bluetooth popup to connect to the
            device.
          </li>
          <li>
            <b>Force Chrome to allow multiple downloads:</b> set the download
            interval to 2s and hit Record Timestamps. If Chrome prompts you to
            allow downloading multiple files, click Allow.
          </li>
        </ul>
        <p>
          The sliders and the graphs are meant to help you test the device, but
          they have no impact on the data recording.
        </p>
        <p>
          When you're ready to start recording, enter a participant ID, press
          Connect, and then enter a download interval of 180 seconds (or as
          decided by the team). Then hit Record Timestamps.
        </p>
        <p>
          At each interval, a CSV file will be automatically downloaded and
          prefixed with the participant ID.
        </p>
      </Card>
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
          // Spectra recording
          recordingSpectra={recordingSpectra}
          onStartRecordingSpectra={() => setRecordingSpectra(Date.now())}
          onStopRecordingSpectra={stopRecordingSpectra}
          // Enable charts
          enableCharts={enableCharts}
          onEnableChartsChange={setEnableCharts}
          // Download interval
          downloadInterval={settings.downloadInterval}
          onDownloadIntervalChange={(value: number) =>
            setSettings((prev) => ({ ...prev, downloadInterval: value }))
          }
        />
        {showCharts && (
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

            {/* <FFTSliders
              settings={settings}
              onSettingChange={(property, value) =>
                setSettings((prev) => ({ ...prev, [property]: value }))
              }
            />
            <SpectraChart
              currentSpectra={currentSpectra}
              channelNames={channelNames}
              channelColors={channelColors}
            /> */}
          </div>
        )}
        {/* <h2>Timestamps</h2>
      <TimestampTable
        timestampData={timestampData}
        channelNames={channelNames}
          channelColors={channelColors}
        /> */}
      </div>
    </>
  );
}
