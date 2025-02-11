import { useEffect, useRef, useState, RefObject } from "react";
import { Observable, Subscription } from "rxjs";
import { bandpassFilter, epoch } from "@neurosity/pipes";
import { catchError } from "rxjs/operators";
import { zipSamples, MuseClient } from "muse-js";
import { generateXTics } from "../chartUtils";
import { downloadCSV } from "../downloadUtils";
import { formatTimestamp } from "../downloadUtils";
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

type RecordedEpochs = {
  [timestamp: number]: EEGChartData;
};
export function useEpochRecording(
  client: RefObject<MuseClient>,
  isConnected: boolean,
  settings: Settings,
  channelNames: string[],
  participantId: string
) {
  const [currentEpoch, setCurrentEpoch] = useState<EEGChartData>({
    channels: [],
  });
  const [recordingEpochs, setRecordingEpochs] = useState<number | false>(false);
  const [recordedEpochs, setRecordedEpochs] = useState<RecordedEpochs>({});

  const epochPipe = useRef<Observable<EpochData>>();
  const epochSubscription = useRef<Subscription>();

  useEffect(() => {
    if (epochSubscription.current) epochSubscription.current.unsubscribe();
    if (!isConnected || !client.current) return;

    epochPipe.current = zipSamples(client.current!.eegReadings).pipe(
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
        return [];
      })
    ) as Observable<EpochData>;

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
  }, [settings, isConnected, recordingEpochs, client]);

  const printEpochs = async () => {
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
  };

  useEffect(() => {
    if (recordingEpochs) {
      if (Date.now() - recordingEpochs > settings.downloadInterval * 1000) {
        printEpochs();
        setRecordingEpochs(Date.now());
      }
    }
  }, [recordedEpochs, settings.downloadInterval, participantId]);

  const stopRecordingEpochs = async () => {
    await printEpochs();
    setRecordingEpochs(false);
  };

  return {
    currentEpoch,
    recordingEpochs,
    setRecordingEpochs,
    stopRecordingEpochs,
  };
}
