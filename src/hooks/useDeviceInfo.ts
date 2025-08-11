import { useEffect, useRef, useState, RefObject } from "react";
import { MuseClient, MuseDeviceInfo } from "muse-js";

const POLL_INTERVAL = 500;

export function useDeviceInfo(
  client: RefObject<MuseClient>,
  isConnected: boolean
) {
  const [deviceInfo, setDeviceInfo] = useState<MuseDeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset state when connection changes
    setDeviceInfo(null);
    setError(null);

    // Only start polling if connected and client exists
    if (!isConnected || !client.current) {
      return;
    }

    // Initial device info fetch
    const fetchDeviceInfo = async () => {
      try {
        if (client.current) {
          const info = await client.current.deviceInfo();
          setDeviceInfo(info);
          setError(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch device info"
        );
        console.error("Error fetching device info:", err);
      }
    };

    // Fetch immediately
    fetchDeviceInfo();

    // Set up polling every 2 seconds
    intervalRef.current = setInterval(fetchDeviceInfo, POLL_INTERVAL);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [client, isConnected]);

  return {
    deviceInfo,
    error,
    isLoading: isConnected && !deviceInfo && !error,
  };
}
