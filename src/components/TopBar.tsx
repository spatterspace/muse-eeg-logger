import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";

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
  // PPG recording
  recordingPPG: number | false;
  onStartRecordingPPG: () => void;
  onStopRecordingPPG: () => void;
  // Spectra recording
  recordingSpectra: number | false;
  onStartRecordingSpectra: () => void;
  onStopRecordingSpectra: () => void;
  // Enable charts
  enableCharts: boolean;
  onEnableChartsChange: (value: boolean) => void;
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
  recordingEpochs,
  // onStartRecordingEpochs,
  // onStopRecordingEpochs,
  recordingTimestamps,
  onStartRecordingTimestamps,
  onStopRecordingTimestamps,
  recordingPPG,
  onStartRecordingPPG,
  onStopRecordingPPG,
  enableCharts,
  onEnableChartsChange,
  downloadInterval,
  onDownloadIntervalChange,
}: // recordingSpectra,
// onStartRecordingSpectra,
// onStopRecordingSpectra,
TopBarProps) {
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
        label={recordingPPG ? "Stop Recording" : "Record PPG"}
        onClick={recordingPPG ? onStopRecordingPPG : onStartRecordingPPG}
        disabled={!participantId.trim() || !isConnected}
        severity={recordingPPG ? "danger" : "success"}
      />
      {/* <Button
        size="small"
        label={recordingSpectra ? "Stop Recording Spectra" : "Record Spectra"}
        onClick={
          recordingSpectra ? onStopRecordingSpectra : onStartRecordingSpectra
        }
        disabled={!participantId.trim() || !isConnected}
        severity={recordingSpectra ? "danger" : "success"}
      /> */}
      <div className="flex items-center gap-2">
        <label htmlFor="enableCharts" className="text-sm">
          Chart
        </label>
        <InputSwitch
          id="enableCharts"
          checked={enableCharts}
          onChange={(e) => onEnableChartsChange(e.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="downloadInterval" className="text-sm">
          Download Interval (seconds):
        </label>
        <InputNumber
          id="downloadInterval"
          value={downloadInterval}
          onValueChange={(e) => onDownloadIntervalChange(e.value ?? 1)}
          min={1}
          max={500}
          disabled={!!recordingEpochs}
          className="w-20"
          size={5}
          useGrouping={false}
        />
      </div>
    </div>
  );
}
