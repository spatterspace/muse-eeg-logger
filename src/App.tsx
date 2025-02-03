import { Button } from "primereact/button";
import "primereact/resources/themes/lara-light-blue/theme.css";
import { MuseClient, zipSamples } from "muse-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { bandpassFilter, epoch } from "@neurosity/pipes";
import { catchError, multicast } from "rxjs/operators";
import { Observable, Subscription, Subject } from "rxjs";
import { generateXTics } from "./chartUtils";

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

const enableAux = false;
const nbChannels = enableAux ? 5 : 4;

function createMuseClient() {
  const client = new MuseClient();
  client.enableAux = enableAux;
  return client;
}

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [data, setData] = useState<ChartData>({
    channels: [],
  });

  const client = useRef(createMuseClient());
  const pipe = useRef<Observable<SampleData>>();
  const subscription = useRef<Subscription>();

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

  return (
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
  );
}
