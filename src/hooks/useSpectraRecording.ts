import { useEffect, useRef, useState } from "react";
import { RefObject } from "react";
import { MuseClient } from "muse-js";
import { Observable, Subscription } from "rxjs";
import { bandpassFilter, epoch, fft, sliceFFT } from "@neurosity/pipes";
import { catchError } from "rxjs/operators";
import { zipSamples } from "muse-js";

interface SpectraData {
  psd: number[][];
  freqs: number[];
}

export function useSpectraRecording(
  client: RefObject<MuseClient>,
  isConnected: boolean,
  settings: {
    cutOffLow: number;
    cutOffHigh: number;
    interval: number;
    duration: number;
    srate: number;
  },
  participantId: string,
  channelNames: string[]
) {
  const [currentSpectra, setCurrentSpectra] = useState<SpectraData | null>(
    null
  );
  const [recordingSpectra, setRecordingSpectra] = useState<number | null>(null);
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
      fft({ bins: settings.duration }),
      sliceFFT([settings.cutOffLow, settings.cutOffHigh]),
      catchError((err) => {
        console.error("Error in spectra pipe:", err);
        throw err;
      })
    );

    spectraSubscription.current = spectraPipe.current.subscribe((data) => {
      setCurrentSpectra(data);
    });

    // const sub = (pipe$ as any).subscribe((data: SpectraData) => {
    //   setCurrentSpectra(data);
    // });

    // setSubscription(sub);
    // (pipe$ as any).connect();

    // return () => {
    //   if (sub) sub.unsubscribe();
    // };
  }, [isConnected, client, settings, channelNames]);

  const stopRecordingSpectra = () => {
    setRecordingSpectra(null);
  };

  return {
    currentSpectra,
    recordingSpectra,
    setRecordingSpectra,
    stopRecordingSpectra,
  };
}
