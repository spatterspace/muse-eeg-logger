import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";

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
  // Audio toggle
  disconnectSoundEnabled: boolean;
  onToggleDisconnectSound: (enabled: boolean) => void;
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
  disconnectSoundEnabled,
  onToggleDisconnectSound,
}: TopBarProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <label htmlFor="participantId" className="text-sm font-medium">
          Participant ID:
        </label>
        <InputText
          id="participantId"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          placeholder="Enter ID"
          className="w-56"
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

      <div className="flex items-center gap-2">
        <Checkbox
          inputId="disconnectSound"
          checked={disconnectSoundEnabled}
          onChange={(e) => onToggleDisconnectSound(!!e.checked)}
        />
        <label htmlFor="disconnectSound" className="text-sm">
          Disconnect sound
        </label>
      </div>
    </div>
  );
}
