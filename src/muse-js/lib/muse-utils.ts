import { fromEventPattern } from "rxjs";
import { map, takeUntil } from "rxjs/operators";

export function decodeResponse(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes.subarray(1, 1 + bytes[0]));
}

export function encodeCommand(cmd: string) {
  const encoded = new TextEncoder().encode(`X${cmd}\n`);
  encoded[0] = encoded.length - 1;
  return encoded;
}

export async function observableCharacteristic(
  characteristic: BluetoothRemoteGATTCharacteristic
) {
  await characteristic.startNotifications();
  const device = characteristic.service!.device;
  const disconnected = fromEventPattern<Event>(
    (handler) =>
      device.addEventListener(
        "gattserverdisconnected",
        handler as EventListener
      ),
    (handler) =>
      device.removeEventListener(
        "gattserverdisconnected",
        handler as EventListener
      )
  );
  return fromEventPattern<Event>(
    (handler) =>
      characteristic.addEventListener(
        "characteristicvaluechanged",
        handler as EventListener
      ),
    (handler) =>
      characteristic.removeEventListener(
        "characteristicvaluechanged",
        handler as EventListener
      )
  ).pipe(
    takeUntil(disconnected),
    map(
      (event: Event) =>
        (event.target as BluetoothRemoteGATTCharacteristic).value as DataView
    )
  );
}
