import { useEffect, useRef, useState, RefObject } from "react";
import { Observable, Subscription } from "rxjs";
import { MuseClient, PPGReading } from "muse-js";
import { downloadCSV } from "../downloadUtils";
import { formatTimestamp } from "../downloadUtils";
import { Settings } from "../types.ts";

export function usePPGRecording(
  client: RefObject<MuseClient>,
  isConnected: boolean,
  settings: Pick<Settings, "cutOffLow" | "cutOffHigh" | "downloadInterval">,
  participantId: string
) {
  const [ppgData, setPPGData] = useState<PPGReading[]>([]);
  const [recordingPPG, setRecordingPPG] = useState<number | false>(false);

  const ppgPipe = useRef<Observable<PPGReading>>();
  const ppgSubscription = useRef<Subscription>();

  useEffect(() => {
    if (ppgSubscription.current) ppgSubscription.current.unsubscribe();
    if (!isConnected || !client.current) return;

    setPPGData([]);

    ppgPipe.current = client.current.ppgReadings;

    client.current.ppgReadings.subscribe((x) => {
      console.log(x);
    });

    ppgSubscription.current = ppgPipe.current.subscribe((x) => {
      setPPGData((prev) => [...prev, x]);
    });
  }, [settings, isConnected, client]);

  const printPPG = async () => {
    const header = [
      "Timestamp",
      "Time String",
      "Channel",
      ...Array.from({ length: 6 }, (_, i) => `Sample ${i}`),
    ];

    const lines = [...ppgData].map((reading) => {
      const timeString = formatTimestamp(reading.timestamp);
      return [
        reading.timestamp,
        timeString,
        reading.ppgChannel,
        ...reading.samples,
      ].join(",");
    });

    await downloadCSV(
      `ppg_${participantId}_${formatTimestamp(Date.now())}`,
      header.join(","),
      lines
    );
  };

  useEffect(() => {
    if (recordingPPG) {
      if (Date.now() - recordingPPG > settings.downloadInterval * 1000) {
        const currentData = [...ppgData];
        printPPG().then(() => {
          setPPGData((prev) => prev.slice(currentData.length));
        });
        setRecordingPPG(Date.now());
      }
    }
  }, [ppgData, settings.downloadInterval, participantId]);

  const stopRecordingPPG = async () => {
    await printPPG();
    setPPGData([]);
    setRecordingPPG(false);
  };

  return {
    ppgData,
    recordingPPG,
    setRecordingPPG,
    stopRecordingPPG,
  };
}
