import { useEffect, useRef, useState, RefObject } from "react";
import { Observable, Subscription } from "rxjs";
import { bandpassFilter, epoch } from "@neurosity/pipes";
import { catchError } from "rxjs/operators";
import { zipSamples, MuseClient } from "muse-js";
import { generateXTics } from "../chartUtils";
import { EEGChartData, Settings } from "../types";

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

export function useEpochGraphData(
  client: RefObject<MuseClient>,
  isConnected: boolean,
  settings: Settings
) {
  const [currentEpoch, setCurrentEpoch] = useState<EEGChartData>({
    channels: [],
  });

  const epochPipe = useRef<Observable<EpochData>>();
  const epochSubscription = useRef<Subscription>();

  useEffect(() => {
    if (epochSubscription.current) epochSubscription.current.unsubscribe();
    if (!isConnected || !client.current) return;

    epochPipe.current = zipSamples(client.current.eegReadings).pipe(
      // @ts-expect-error: Type mismatch between RxJS versions
      bandpassFilter({
        cutoffFrequencies: [settings.cutOffLow, settings.cutOffHigh],
        nbChannels: client.current.enableAux ? 5 : 4,
      }),
      epoch({
        interval: settings.interval,
        duration: settings.duration,
        samplingRate: settings.srate,
      }),
      catchError((err) => {
        console.error(err);
        return [] as unknown as Observable<EpochData>;
      })
    ) as Observable<EpochData>;

    epochSubscription.current = epochPipe.current.subscribe((data) => {
      const newEpoch: EEGChartData = {
        channels: data.data.map((channelData) => ({
          data: channelData,
          xLabels: generateXTics(settings.srate, settings.duration),
        })),
      };
      setCurrentEpoch(newEpoch);
    });

    return () => {
      if (epochSubscription.current) epochSubscription.current.unsubscribe();
    };
  }, [settings, isConnected, client]);

  return {
    currentEpoch,
  };
}
