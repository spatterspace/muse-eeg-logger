import { useEffect, useRef } from "react";

export function useAudioAlert(
  error: string | null,
  audioPath: string = "/chime.mp3",
  enabled: boolean = true
) {
  const prevErrorRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(audioPath);
    audioRef.current.volume = 1;
  }, [audioPath]);

  // Play sound when error state changes from null to an error
  useEffect(() => {
    if (enabled && error && !prevErrorRef.current) {
      if (audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
    }
    prevErrorRef.current = error;
  }, [error, enabled]);
}
