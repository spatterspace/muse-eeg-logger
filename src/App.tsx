import "primereact/resources/themes/lara-light-blue/theme.css";
import "./app.css";
import { Button } from "primereact/button";
import { MuseClient, zipSamples } from "muse-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { bandpassFilter, epoch } from "@neurosity/pipes";
import { catchError, multicast } from "rxjs/operators";
import { Observable, Subscription, Subject } from "rxjs";
import { generateXTics } from "./chartUtils";
import { Slider, SliderChangeEvent } from "primereact/slider";
import { eegChartOptions } from "./chartOptions";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Legend
);

type EpochData = {
  data: [
    ch0: number[],
    ch1: number[],
    ch2: number[],
    ch3: number[],
    ch4: number[]
  ];
  info: {
    samplingRate: number;
    startTime: number;
  };
};

type TimestampData = {
  data: [ch0: number, ch1: number, ch2: number, ch3: number, ch4: number];
  index: number;
  timestamp: number;
};

type ChartData = {
  channels: Array<{
    data: number[];
    xLabels: number[];
  }>;
};

type RecordedEpochs = {
  [timestamp: number]: ChartData;
};

const initialSettings = {
  name: "Intro",
  cutOffLow: 0.1,
  cutOffHigh: 100,
  interval: 25, // Sampling points between epochs onsets
  srate: 256, // never exposed to the end user
  duration: 512,
  downloadInterval: 10, // Time in seconds between downloads
};

const enableAux = true;
const nbChannels = enableAux ? 5 : 4;

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

function formatTimestamp(timestamp: number): string {
  // const date = new Date(timestamp);
  // const month = String(date.getMonth() + 1).padStart(2, "0");
  // const day = String(date.getDate()).padStart(2, "0");
  // const hours = String(date.getHours()).padStart(2, "0");
  // const minutes = String(date.getMinutes()).padStart(2, "0");
  // const seconds = String(date.getSeconds()).padStart(2, "0");
  // const milliseconds = String(Math.floor(timestamp % 1000)).padStart(3, "0");
  // return `${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  return new Date(timestamp).toISOString();
}

function downloadCSV(
  name: string,
  header: string,
  lines: string[]
): Promise<void> {
  return new Promise((resolve) => {
    const csvContent = [header, ...lines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    a.onclick = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve();
      }, 100);
    };
    a.click();
  });
}

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [currentPage, setCurrentPage] = useState(0);
  const [participantId, setParticipantId] = useState("");
  const [recordingEpochs, setRecordingEpochs] = useState<number | false>(false);
  const [recordingTimestamps, setRecordingTimestamps] = useState<
    number | false
  >(false);

  const [currentEpoch, setCurrentEpoch] = useState<ChartData>({
    channels: [],
  });

  const [recordedEpochs, setRecordedEpochs] = useState<RecordedEpochs>({});

  const [timestampData, setTimestampData] = useState<TimestampData[]>([]);

  const client = useRef(createMuseClient());
  const epochPipe = useRef<Observable<EpochData>>();
  const timestampPipe = useRef<Observable<TimestampData>>();
  const epochSubscription = useRef<Subscription>();
  const timestampSubscription = useRef<Subscription>();
  const chartData = useMemo(() => {
    return {
      labels: currentEpoch.channels[0]?.xLabels || [],
      datasets: currentEpoch.channels.map((channel, index) => ({
        label: channelNames[index],
        borderColor: channelColors[index],
        data: channel.data.map((x) => x /*+ (300 - index * 100)*/), // Applies offset
        fill: false,
      })),
    };
  }, [currentEpoch, settings]);

  useEffect(() => {
    if (epochSubscription.current) epochSubscription.current.unsubscribe();
    if (timestampSubscription.current)
      timestampSubscription.current.unsubscribe();
    if (!isConnected) return;

    setTimestampData([]);

    timestampPipe.current = zipSamples(client.current.eegReadings).pipe(
      // @ts-expect-error: Type mismatch between RxJS versions. Neurosity uses 7, muse-js uses 6. Our project currently uses 6
      bandpassFilter({
        cutoffFrequencies: [settings.cutOffLow, settings.cutOffHigh],
        nbChannels,
      })
    );
    timestampSubscription.current = timestampPipe.current.subscribe((x) => {
      setTimestampData((prev) => [...prev, x]);
    });

    epochPipe.current = zipSamples(client.current.eegReadings).pipe(
      // @ts-expect-error: Type mismatch between RxJS versions. Neurosity uses 7, muse-js uses 6. Our project currently uses 6
      bandpassFilter({
        cutoffFrequencies: [settings.cutOffLow, settings.cutOffHigh],
        nbChannels,
      }),
      epoch({
        interval: settings.interval,
        duration: settings.duration,
        samplingRate: settings.srate,
      }),
      catchError((err) => {
        console.error(err);
        return [];
      })
    ) as Observable<{
      data: [
        ch0: number[],
        ch1: number[],
        ch2: number[],
        ch3: number[],
        ch4: number[]
      ];
      info: {
        samplingRate: number;
        startTime: number;
      };
    }>;

    console.log("subscribing");
    // const multi = pipe.current.pipe(multicast(() => new Subject()));
    epochSubscription.current = epochPipe.current.subscribe((data) => {
      const newEpoch = {
        channels: data.data.map((channel) => ({
          data: channel,
          xLabels: generateXTics(settings.srate, settings.duration),
        })),
      };
      setCurrentEpoch(newEpoch);
      if (recordingEpochs) {
        setRecordedEpochs((prev) => ({ ...prev, [Date.now()]: newEpoch }));
      }
    });
  }, [settings, isConnected, recordingEpochs]);

  async function connect() {
    await client.current.connect();
    setIsConnected(true);
    await client.current.start();
  }

  async function printEpochs() {
    const header = [
      "Timestamp",
      "Time String",
      ...currentEpoch.channels.flatMap((channel, i) =>
        channel.xLabels.map((f) => `${channelNames[i]}_${f}ms`)
      ),
    ];

    const lines = Object.entries(recordedEpochs).map(([timestamp, epoch]) => {
      const timeString = formatTimestamp(+timestamp);
      const values = epoch.channels.flatMap((channel) => channel.data);
      return [timestamp, timeString, ...values].join(",");
    });

    await downloadCSV(
      `epochs_${participantId}_${formatTimestamp(Date.now())}`,
      header.join(","),
      lines
    );
    setRecordedEpochs({});
  }

  useEffect(() => {
    if (recordingEpochs) {
      if (Date.now() - recordingEpochs > settings.downloadInterval * 1000) {
        printEpochs();
        setRecordingEpochs(Date.now());
      }
    }
  }, [recordedEpochs]);

  function stopRecordingEpochs() {
    printEpochs();
    setRecordingEpochs(false);
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

  const pageSize = 20;
  const totalPages = Math.ceil(timestampData.length / pageSize);
  const paginatedData = [...timestampData]
    .reverse()
    .slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  function nextPage() {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  }

  function prevPage() {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }

  async function printTimestamps() {
    const header = ["Timestamp", "Time String", ...channelNames];

    const lines = [...timestampData].map((reading) => {
      const timeString = formatTimestamp(reading.timestamp);
      return [
        reading.timestamp,
        timeString,
        ...reading.data.map((value) => value.toFixed(2)),
      ].join(",");
    });

    await downloadCSV(
      `timestamps_${participantId}_${formatTimestamp(Date.now())}`,
      header.join(","),
      lines
    );
  }

  useEffect(() => {
    if (recordingTimestamps) {
      if (Date.now() - recordingTimestamps > settings.downloadInterval * 1000) {
        const currentData = [...timestampData];
        printTimestamps().then(() => {
          setTimestampData((prev) => prev.slice(currentData.length));
        });
        setRecordingTimestamps(Date.now());
      }
    }
  }, [timestampData]);

  function stopRecordingTimestamps() {
    printTimestamps().then(() => {
      setTimestampData([]);
      setRecordingTimestamps(false);
    });
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="participantId" className="text-sm">
            Participant ID:
          </label>
          <input
            id="participantId"
            type="text"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="Enter ID"
          />
        </div>
        {!isConnected ? (
          <Button label="Connect" size="small" onClick={connect} />
        ) : (
          <Button
            label="Disconnect"
            size="small"
            severity="danger"
            onClick={disconnect}
          />
        )}
        {!recordingEpochs ? (
          <Button
            label="Record Epochs"
            size="small"
            severity="danger"
            onClick={() => setRecordingEpochs(Date.now())}
            disabled={!participantId.trim() || !isConnected}
          />
        ) : (
          <Button
            label="Stop Recording"
            size="small"
            severity="danger"
            onClick={() => stopRecordingEpochs()}
          />
        )}
        {!recordingTimestamps ? (
          <Button
            label="Record Timestamps"
            size="small"
            severity="danger"
            onClick={() => setRecordingTimestamps(Date.now())}
            disabled={!participantId.trim() || !isConnected}
          />
        ) : (
          <Button
            label="Stop Recording"
            size="small"
            severity="danger"
            onClick={() => stopRecordingTimestamps()}
          />
        )}
        <div>
          <h3 className="text-xs">
            Download Interval: {settings.downloadInterval} seconds
          </h3>
          <Slider
            min={1}
            step={1}
            max={500}
            value={settings.downloadInterval}
            onChange={(e) => handleSliderChange(e, "downloadInterval")}
            disabled={!!recordingEpochs}
          />
        </div>
      </div>
      <div className="flex">
        <div className="slider-group w-100 text-xs">
          <div>
            <h3>Epoch duration (Sampling Points): {settings.duration}</h3>
            <Slider
              min={1}
              step={1}
              max={4096}
              value={settings.duration}
              onChange={(e) => handleSliderChange(e, "duration")}
            />
          </div>
          <div>
            <h3>Sampling points between epochs onsets: {settings.interval}</h3>
            <Slider
              min={1}
              step={1}
              max={settings.duration}
              value={settings.interval}
              onChange={(e) => handleSliderChange(e, "interval")}
            />
          </div>
          <div>
            <h3>Cutoff Frequency Low: {settings.cutOffLow} Hz</h3>
            <Slider
              min={0.01}
              step={0.5}
              max={settings.cutOffHigh - 0.5}
              value={settings.cutOffLow}
              onChange={(e) => handleSliderChange(e, "cutOffLow")}
            />
          </div>
          <div>
            <h3>Cutoff Frequency High: {settings.cutOffHigh} Hz</h3>
            <Slider
              min={settings.cutOffLow + 0.5}
              step={0.5}
              max={settings.srate / 2}
              value={settings.cutOffHigh}
              onChange={(e) => handleSliderChange(e, "cutOffHigh")}
            />
          </div>
        </div>
        <div className="w-full max-w-4xl">
          <Line data={chartData} options={eegChartOptions} />
        </div>
      </div>
      <h2>Timestamps</h2>
      {/* {timestampData.length > 0 && (
        <h3 className="text-sm">
          Since {formatTimestamp(timestampData[0].timestamp)}
        </h3>
      )} */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 text-sm">
          <div className="font-bold p-2 bg-gray-100">Timestamp</div>
          <div className="font-bold p-2 bg-gray-100">Time String</div>
          {channelNames.map((name, index) => (
            <div
              key={name}
              className="font-bold p-2 bg-gray-100"
              style={{ color: channelColors[index] }}
            >
              {name}
            </div>
          ))}

          {paginatedData.map((reading) => (
            <>
              <div key={`ts-${reading.timestamp}`} className="p-2 border">
                {reading.timestamp}
              </div>
              <div className="p-2 border">
                {formatTimestamp(reading.timestamp)}
              </div>
              {reading.data.map((value, idx) => (
                <div
                  key={`val-${reading.timestamp}-${idx}`}
                  className="p-2 border"
                >
                  {value.toFixed(2)}
                </div>
              ))}
            </>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button
            label="Newer"
            size="small"
            disabled={currentPage === 0}
            onClick={prevPage}
          />
          <span>
            Page {currentPage + 1} of {Math.max(1, totalPages)}
          </span>
          <Button
            label="Older"
            size="small"
            disabled={currentPage >= totalPages - 1}
            onClick={nextPage}
          />
        </div>
      </div>
    </div>
  );
}
