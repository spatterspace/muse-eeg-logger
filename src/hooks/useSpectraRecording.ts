import { useEffect, useRef, useState } from "react";
import { RefObject } from "react";
import { MuseClient } from "muse-js";
import { Observable, Subscription } from "rxjs";
import { bandpassFilter, epoch, fft, sliceFFT } from "@neurosity/pipes";
import { catchError } from "rxjs/operators";
import { zipSamples } from "muse-js";
import { Settings, SpectraChartData } from "../types";
import { formatTimestamp } from "../downloadUtils";
import { downloadCSV } from "../downloadUtils";

interface SpectraData {
  psd: number[][];
  freqs: number[];
}

type RecordedSpectra = {
  [timestamp: number]: SpectraChartData;
};
export function useSpectraRecording(
  client: RefObject<MuseClient>,
  isConnected: boolean,
  settings: Settings,
  channelNames: string[],
  participantId: string
) {
  const [currentSpectra, setCurrentSpectra] = useState<SpectraChartData>({
    channels: [],
  });
  const [recordingSpectra, setRecordingSpectra] = useState<number | false>(
    false
  );
  const [recordedSpectra, setRecordedSpectra] = useState<RecordedSpectra>({});

  const spectraPipe = useRef<Observable<SpectraData>>();
  const spectraSubscription = useRef<Subscription>();

  useEffect(() => {
    if (spectraSubscription.current) spectraSubscription.current.unsubscribe();
    if (!isConnected || !client.current) return;

    spectraPipe.current = zipSamples(client.current.eegReadings).pipe(
      // @ts-expect-error: Type mismatch between RxJS versions
      bandpassFilter({
        cutoffFrequencies: [settings.cutOffLow, settings.cutOffHigh],
        nbChannels: client.current.enableAux ? 5 : 4,
      }),
      epoch({
        duration: settings.duration,
        interval: settings.interval,
        samplingRate: settings.srate,
      }),
      fft({ bins: settings.fftBins }),
      sliceFFT([settings.sliceFFTLow, settings.sliceFFTHigh]),
      catchError((err) => {
        console.error("Error in spectra pipe:", err);
        throw err;
      })
    );

    spectraSubscription.current = spectraPipe.current.subscribe((data) => {
      const currentSpectra = {
        channels: data.psd.map((psd) => ({
          data: psd,
          xLabels: data.freqs,
        })),
      };
      setCurrentSpectra(currentSpectra);
      if (recordingSpectra) {
        console.log("pushing", Date.now());
        setRecordedSpectra((prev) => ({
          ...prev,
          [Date.now()]: currentSpectra,
        }));
      }
    });
  }, [isConnected, client, settings, recordingSpectra]);

  const printSpectra = async () => {
    const header = [
      "Timestamp",
      "Time String",
      ...currentSpectra.channels.flatMap((channel, i) =>
        channel.xLabels.map((f) => `${channelNames[i]}_${f}Hz`)
      ),
    ];

    const lines = Object.entries(recordedSpectra).map(
      ([timestamp, spectra]) => {
        const timeString = formatTimestamp(+timestamp);
        const values = spectra.channels.flatMap((channel) => channel.data);
        return [timestamp, timeString, ...values].join(",");
      }
    );

    await downloadCSV(
      `spectra_${participantId}_${formatTimestamp(Date.now())}`,
      header.join(","),
      lines
    );
    setRecordedSpectra({});
  };

  useEffect(() => {
    if (recordingSpectra) {
      if (Date.now() - recordingSpectra > settings.downloadInterval * 1000) {
        printSpectra();
        setRecordingSpectra(Date.now());
      }
    }
  }, [recordedSpectra, settings.downloadInterval, participantId]);

  const stopRecordingSpectra = async () => {
    await printSpectra();
    setRecordingSpectra(false);
  };

  return {
    currentSpectra,
    recordingSpectra,
    setRecordingSpectra,
    stopRecordingSpectra,
  };
}
