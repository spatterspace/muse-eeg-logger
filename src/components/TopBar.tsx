import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

interface TopBarProps {
  // Participant ID
  participantId: string;
  setParticipantId: (id: string) => void;
  // Connection
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  // Timestamp recording
  recordingTimestamps: number | false;
  onStartRecordingTimestamps: () => void;
  onStopRecordingTimestamps: () => void;
  // Download interval
  downloadInterval: number;
  onDownloadIntervalChange: (value: number) => void;
}

export function TopBar({
  participantId,
  setParticipantId,
  isConnected,
  onConnect,
  onDisconnect,
  recordingTimestamps,
  onStartRecordingTimestamps,
  onStopRecordingTimestamps,
  downloadInterval,
  onDownloadIntervalChange,
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
        <Button
          label="Connect"
          size="small"
          onClick={onConnect}
          disabled={!participantId.trim()}
        />
      ) : (
        <Button
          label="Disconnect"
          size="small"
          severity="danger"
          onClick={onDisconnect}
        />
      )}
      {/* <Button
        size="small"
        label={recordingEpochs ? "Stop Recording" : "Record Epochs"}
        onClick={
          recordingEpochs ? onStopRecordingEpochs : onStartRecordingEpochs
        }
        disabled={!participantId.trim() || !isConnected}
        severity={recordingEpochs ? "danger" : "success"}
      /> */}
      <Button
        size="small"
        label={recordingTimestamps ? "Stop Recording" : "Record"}
        onClick={
          recordingTimestamps
            ? onStopRecordingTimestamps
            : onStartRecordingTimestamps
        }
        disabled={!participantId.trim() || !isConnected}
        severity={recordingTimestamps ? "danger" : "success"}
      />

      <div className="flex items-center gap-2">
        <label htmlFor="downloadInterval" className="text-sm">
          Download Interval (seconds):
        </label>
        <InputNumber
          id="downloadInterval"
          value={downloadInterval}
          onValueChange={(e) => onDownloadIntervalChange(e.value ?? 1)}
          min={1}
          disabled={!!recordingTimestamps}
          className="w-20"
          size={5}
          useGrouping={false}
        />
      </div>
    </div>
  );
}
