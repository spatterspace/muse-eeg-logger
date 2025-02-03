import { Button } from "primereact/button";
import "primereact/resources/themes/lara-light-blue/theme.css";
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

type SampleData = {
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

type ChartData = {
  channels: Array<{
    data: number[];
    xLabels: number[];
  }>;
};

const initialSettings = {
  name: "Intro",
  cutOffLow: 0.1,
  cutOffHigh: 100,
  interval: 25, // Sampling points between epochs onsets
  srate: 256, // never exposed to the end user
  duration: 512,
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

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [data, setData] = useState<ChartData>({
    channels: [],
  });

  const client = useRef(createMuseClient());
  const pipe = useRef<Observable<SampleData>>();
  const subscription = useRef<Subscription>();

  const chartData = useMemo(() => {
    return {
      labels: data.channels[0]?.xLabels || [],
      datasets: data.channels.map((channel, index) => ({
        label: channelNames[index],
        borderColor: channelColors[index],
        data: channel.data.map((x) => x /*+ (300 - index * 100)*/), // Applies offset
        fill: false,
      })),
    };
  }, [data, settings]);

  useEffect(() => {
    if (subscription.current) subscription.current.unsubscribe();
    if (!isConnected) return;
    pipe.current = zipSamples(client.current.eegReadings).pipe(
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
    subscription.current = pipe.current.subscribe((data) => {
      setData({
        channels: data.data.map((channel) => ({
          data: channel,
          xLabels: generateXTics(settings.srate, settings.duration),
        })),
      });
    });
  }, [settings, isConnected]);

  async function connect() {
    await client.current.connect();
    setIsConnected(true);
    await client.current.start();
  }

  useEffect(() => {
    console.log(data);
  }, [data]);

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
      <div>
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
      </div>
      <div className="slider-group">
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
      <Line data={chartData} options={eegChartOptions} />
    </div>
  );
}
