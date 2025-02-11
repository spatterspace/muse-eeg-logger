import { useEffect, useRef, useState, RefObject } from "react";
import { Observable, Subscription } from "rxjs";
import { bandpassFilter } from "@neurosity/pipes";
import { zipSamples, MuseClient } from "muse-js";
import { downloadCSV } from "../downloadUtils";
import { formatTimestamp } from "../downloadUtils";
import { Settings, TimestampData } from "../types.ts";

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

    timestampPipe.current = zipSamples(client.current.eegReadings).pipe(
      // @ts-expect-error: Type mismatch between RxJS versions
      bandpassFilter({
        cutoffFrequencies: [settings.cutOffLow, settings.cutOffHigh],
        nbChannels: client.current.enableAux ? 5 : 4,
      })
    );

    timestampSubscription.current = timestampPipe.current.subscribe((x) => {
      setTimestampData((prev) => [...prev, x]);
    });
  }, [settings, isConnected, client]);

  const printTimestamps = async () => {
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
  }, [timestampData, settings.downloadInterval, participantId]);

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
