import { useEffect, useRef, useState, RefObject } from "react";
import { Subscription } from "rxjs";
import { MuseClient, TelemetryData } from "muse-js";

export function useTelemetry(
  client: RefObject<MuseClient>,
  isConnected: boolean
) {
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(
    null
  );
  const telemetrySubscription = useRef<Subscription>();

  useEffect(() => {
    if (telemetrySubscription.current) {
      telemetrySubscription.current.unsubscribe();
    }
    if (!isConnected || !client.current) {
      setTelemetryData(null);
      return;
    }

    telemetrySubscription.current = client.current.telemetryData.subscribe(
      (data: TelemetryData) => {
        setTelemetryData(data);
      }
    );

    return () => {
      if (telemetrySubscription.current) {
        telemetrySubscription.current.unsubscribe();
      }
    };
  }, [client, isConnected]);

  return {
    telemetryData,
    isLoading: isConnected && !telemetryData,
  };
}
