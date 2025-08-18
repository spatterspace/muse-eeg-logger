import { Card } from "primereact/card";
import { MuseDeviceInfo, TelemetryData } from "muse-js";

interface DeviceInfoCardProps {
  isConnected: boolean;
  deviceInfo: MuseDeviceInfo | null;
  deviceError: string | null;
  deviceLoading: boolean;
  telemetryData: TelemetryData | null;
  telemetryLoading: boolean;
}

export function DeviceInfoCard({
  isConnected,
  deviceInfo,
  deviceError,
  deviceLoading,
  telemetryData,
  telemetryLoading,
}: DeviceInfoCardProps) {
  if (!isConnected) return null;
  return (
    <Card title="Device Information" className="max-w-4xl mb-4">
      {(deviceLoading || telemetryLoading) && (
        <p>Loading device information...</p>
      )}
      {deviceError && (
        <p className="text-red-500">Disconnected. Attempting to reconnect...</p>
      )}
      {(deviceInfo || telemetryData) && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Device Details</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Hardware:</span> {deviceInfo?.hw}
              </div>
              <div>
                <span className="font-medium">Firmware:</span> {deviceInfo?.fw}
              </div>
              <div>
                <span className="font-medium">Build Number:</span>{" "}
                {deviceInfo?.bn}
              </div>
              <div>
                <span className="font-medium">Protocol Version:</span>{" "}
                {deviceInfo?.pv}
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Connection & Battery</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Access Point:</span>{" "}
                {deviceInfo?.ap}
              </div>
              <div>
                <span className="font-medium">Bluetooth:</span> {deviceInfo?.bl}
              </div>
              <div>
                <span className="font-medium">Serial Port:</span>{" "}
                {deviceInfo?.sp}
              </div>
              <div>
                <span className="font-medium">Type:</span> {deviceInfo?.tp}
              </div>
              <div>
                <span className="font-medium">Battery Level:</span>{" "}
                {telemetryData?.batteryLevel != null
                  ? `${telemetryData.batteryLevel}%`
                  : "-"}
              </div>
              <div>
                <span className="font-medium">Voltage:</span>{" "}
                {telemetryData?.fuelGaugeVoltage != null
                  ? `${telemetryData.fuelGaugeVoltage} V`
                  : "-"}
              </div>
              <div>
                <span className="font-medium">Temperature:</span>{" "}
                {telemetryData?.temperature != null
                  ? `${telemetryData.temperature} °C`
                  : "-"}
              </div>
              <div>
                <span className="font-medium">Sequence ID:</span>{" "}
                {telemetryData?.sequenceId != null
                  ? `${telemetryData.sequenceId}`
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
