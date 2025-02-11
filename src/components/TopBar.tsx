import { Button } from "primereact/button";
import { Slider, SliderChangeEvent } from "primereact/slider";

interface TopBarProps {
  // Participant ID
  participantId: string;
  setParticipantId: (id: string) => void;
  // Connection
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  // Epoch recording
  recordingEpochs: number | false;
  onStartRecordingEpochs: () => void;
  onStopRecordingEpochs: () => void;
  // Timestamp recording
  recordingTimestamps: number | false;
  onStartRecordingTimestamps: () => void;
  onStopRecordingTimestamps: () => void;
  // Download interval
  downloadInterval: number;
  onDownloadIntervalChange: (e: SliderChangeEvent) => void;
  // Add new props for spectra recording
  recordingSpectra: number | null;
  onStartRecordingSpectra: () => void;
  onStopRecordingSpectra: () => void;
}

export function TopBar({
  participantId,
  setParticipantId,
  isConnected,
  onConnect,
  onDisconnect,
  recordingEpochs,
  onStartRecordingEpochs,
  onStopRecordingEpochs,
  recordingTimestamps,
  onStartRecordingTimestamps,
  onStopRecordingTimestamps,
  downloadInterval,
  onDownloadIntervalChange,
  recordingSpectra,
  onStartRecordingSpectra,
  onStopRecordingSpectra,
}: TopBarProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <label htmlFor="participantId" className="text-sm">
          Participant ID:
        </label>
        <input
          id="participantId"
          type="text"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="Enter ID"
        />
      </div>
      {!isConnected ? (
        <Button label="Connect" size="small" onClick={onConnect} />
      ) : (
        <Button
          label="Disconnect"
          size="small"
          severity="danger"
          onClick={onDisconnect}
        />
      )}
      <Button
        size="small"
        label={recordingEpochs ? "Stop Recording" : "Record Epochs"}
        onClick={
          recordingEpochs ? onStopRecordingEpochs : onStartRecordingEpochs
        }
        disabled={!participantId.trim() || !isConnected}
        severity={recordingEpochs ? "danger" : "success"}
      />
      <Button
        size="small"
        label={recordingTimestamps ? "Stop Recording" : "Record Timestamps"}
        onClick={
          recordingTimestamps
            ? onStopRecordingTimestamps
            : onStartRecordingTimestamps
        }
        disabled={!participantId.trim() || !isConnected}
        severity={recordingTimestamps ? "danger" : "success"}
      />
      <Button
        size="small"
        label={recordingSpectra ? "Stop Recording Spectra" : "Record Spectra"}
        onClick={
          recordingSpectra ? onStopRecordingSpectra : onStartRecordingSpectra
        }
        disabled={!isConnected}
        severity={recordingSpectra ? "danger" : "success"}
      />
      <div>
        <h3 className="text-xs">
          Download Interval: {downloadInterval} seconds
        </h3>
        <Slider
          min={1}
          step={1}
          max={500}
          value={downloadInterval}
          onChange={onDownloadIntervalChange}
          disabled={!!recordingEpochs}
        />
      </div>
    </div>
  );
}
