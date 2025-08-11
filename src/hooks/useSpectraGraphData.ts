import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { MuseClient } from "muse-js";
import { Observable, Subscription } from "rxjs";
import { bandpassFilter, epoch, fft, sliceFFT } from "@neurosity/pipes";
import { catchError } from "rxjs/operators";
import { zipSamples } from "muse-js";
import { Settings, SpectraChartData } from "../types";

interface SpectraData {
  psd: number[][];
  freqs: number[];
}

export function useSpectraGraphData(
  client: RefObject<MuseClient>,
  isConnected: boolean,
  settings: Settings
) {
  const [currentSpectra, setCurrentSpectra] = useState<SpectraChartData>({
    channels: [],
  });

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
      const nextSpectra: SpectraChartData = {
        channels: data.psd.map((psd) => ({
          data: psd,
          xLabels: data.freqs,
        })),
      };
      setCurrentSpectra(nextSpectra);
    });

    return () => {
      if (spectraSubscription.current)
        spectraSubscription.current.unsubscribe();
    };
  }, [isConnected, client, settings]);

  return {
    currentSpectra,
  };
}
