import { useEffect, useRef, useState, RefObject } from "react";
import { Observable, Subscription } from "rxjs";
import { bandpassFilter } from "@neurosity/pipes";
import { zipSamples, MuseClient } from "muse-js";
import { downloadCSV } from "../downloadUtils";
import { formatTimestamp } from "../downloadUtils";
import { CombinedPPG, Settings, TimestampData } from "../types.ts";
import {
  map,
  bufferCount,
  mergeMap,
  groupBy,
  withLatestFrom,
} from "rxjs/operators";

export function useTimestampRecording(
  client: RefObject<MuseClient>,
  isConnected: boolean,
  settings: Pick<Settings, "cutOffLow" | "cutOffHigh" | "downloadInterval">,
  channelNames: string[],
  participantId: string
) {
  const [timestampData, setTimestampData] = useState<TimestampData[]>([]);
  const [recordingTimestamps, setRecordingTimestamps] = useState<
    number | false
  >(false);

  const timestampPipe = useRef<Observable<TimestampData>>();
  const timestampSubscription = useRef<Subscription>();

  useEffect(() => {
    if (timestampSubscription.current)
      timestampSubscription.current.unsubscribe();
    if (!isConnected || !client.current) return;

    setTimestampData([]);

    const ppgPipe: Observable<CombinedPPG> = client.current.ppgReadings.pipe(
      groupBy((sample) => sample.index), // group by index
      mergeMap((group$) =>
        group$.pipe(
          bufferCount(3), // wait for 3 items in the same group (index)
          map((samples) => {
            const byChannel = Object.fromEntries(
              samples.map((s) => [s.ppgChannel, s])
            );
            // The samples at the same index have the same timestamps:
            // console.log(
            //   samples[0].timestamp,
            //   samples[1].timestamp,
            //   samples[2].timestamp
            // );
            return {
              index: samples[0].index,
              timestamp: samples[0].timestamp, // This doesn't update enough, so we don't use it; here for debugging reasons
              ch0: byChannel[0].samples,
              ch1: byChannel[1].samples,
              ch2: byChannel[2].samples,
            };
          })
        )
      )
    );

    timestampPipe.current = zipSamples(client.current.eegReadings)
      .pipe(
        // @ts-expect-error: Type mismatch between RxJS versions
        bandpassFilter({
          cutoffFrequencies: [settings.cutOffLow, settings.cutOffHigh],
          nbChannels: client.current.enableAux ? 5 : 4,
        })
      )
      .pipe(
        withLatestFrom(ppgPipe),
        map(([eeg, ppg]) => {
          // console.log(eeg.timestamp, ppg.timestamp);
          return {
            data: eeg.data.slice(0, channelNames.length),
            ppg,
            index: eeg.index,
            timestamp: eeg.timestamp,
            localTimestamp: performance.timeOrigin + performance.now(),
          };
        })
      );

    timestampSubscription.current = timestampPipe.current.subscribe((x) => {
      setTimestampData((prev) => [...prev, x]);
    });
  }, [settings, isConnected, client]);

  useEffect(() => {
    if (recordingTimestamps) {
      setTimestampData([]);
    }
  }, [recordingTimestamps]);

  const printTimestamps = async () => {
    const header = [
      "Local Timestamp",
      "Local Time String",
      "Headset Timestamp",
      "Headset Time String",
      "EEG Index",
      ...channelNames,
      "PPG Index",
      [0, 1, 2].flatMap((ch) => [0, 1, 2, 3, 4, 5].map((i) => `ch${ch}s${i}`)),
    ];

    const lines = [...timestampData].map((reading) => {
      const deviceTimeString = formatTimestamp(reading.timestamp);
      const localTimeString = formatTimestamp(reading.localTimestamp);
      return [
        reading.localTimestamp,
        localTimeString,
        reading.timestamp,
        deviceTimeString,
        reading.index,
        ...reading.data.map((value) => value.toFixed(2)),
        reading.ppg.index,
        ...reading.ppg.ch0.map((value) => value.toFixed(2)),
        ...reading.ppg.ch1.map((value) => value.toFixed(2)),
        ...reading.ppg.ch2.map((value) => value.toFixed(2)),
      ].join(",");
    });

    await downloadCSV(
      `timestamps_${participantId}_${formatTimestamp(Date.now())}`,
      header.join(","),
      lines
    );
  };

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
  }, [
    timestampData,
    settings.downloadInterval,
    participantId,
    recordingTimestamps,
  ]);

  const stopRecordingTimestamps = async () => {
    await printTimestamps();
    setTimestampData([]);
    setRecordingTimestamps(false);
  };

  return {
    timestampData,
    recordingTimestamps,
    setRecordingTimestamps,
    stopRecordingTimestamps,
  };
}
