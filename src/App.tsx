import { Button } from "primereact/button";
import "primereact/resources/themes/lara-light-blue/theme.css";
import { MuseClient, zipSamples } from "muse-js";
import { useEffect, useState } from "react";
import { bandpassFilter, epoch } from "@neurosity/pipes";
import { catchError } from "rxjs/operators";
import { Observable } from "rxjs";
import { generateXTics } from "./chartUtils";

let client: MuseClient;

const settings = {
  name: "Intro",
  cutOffLow: 0.1,
  cutOffHigh: 100,
  interval: 25, // Sampling points between epochs onsets
  srate: 256, // never exposed to the end user
  duration: 512,
};

const enableAux = false;
const nbChannels = enableAux ? 5 : 4;

async function initMuseClient() {
  client = new MuseClient();
  client.enableAux = enableAux;
  await client.connect();
  await client.start();

  const pipe = zipSamples(client.eegReadings).pipe(
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

  return pipe;
  // const multi = pipe.pipe(multicast(() => new Subject()));
}

type ChartData = {
  channels: Array<{
    data: number[];
    xLabels: number[];
  }>;
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<ChartData>({
    channels: [],
  });

  async function connect() {
    const pipe = await initMuseClient();
    pipe.subscribe((data) => {
      setData({
        channels: data.data.map((channel) => ({
          data: channel,
          xLabels: generateXTics(settings.srate, settings.duration),
        })),
      });
    });
    setIsConnected(true);
  }

  useEffect(() => {
    console.log(data);
  }, [data]);

  async function disconnect() {
    await client.disconnect();
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
