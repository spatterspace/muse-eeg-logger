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
  const [error, setError] = useState<string | null>(null);
  const telemetrySubscription = useRef<Subscription>();

  useEffect(() => {
    if (telemetrySubscription.current) {
      telemetrySubscription.current.unsubscribe();
    }
    if (!isConnected || !client.current) {
      setTelemetryData(null);
      setError(null);
      return;
    }

    try {
      // Subscribe to telemetry data
      telemetrySubscription.current = client.current.telemetryData.subscribe({
        next: (data: TelemetryData) => {
          setTelemetryData(data);
          setError(null);
        },
        error: (err: unknown) => {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to get telemetry data");
          }
          console.error("Error getting telemetry data:", err);
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to subscribe to telemetry");
      }
      console.error("Error subscribing to telemetry:", err);
    }

    return () => {
      if (telemetrySubscription.current) {
        telemetrySubscription.current.unsubscribe();
      }
    };
  }, [client, isConnected]);

  return {
    telemetryData,
    error,
    isLoading: isConnected && !telemetryData && !error,
  };
}
