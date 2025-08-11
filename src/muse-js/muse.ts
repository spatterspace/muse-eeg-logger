import { BehaviorSubject, fromEvent, merge, Observable, Subject } from "rxjs";
import { filter, first, map, share, take } from "rxjs/operators";

import {
  AccelerometerData,
  EEGReading,
  EventMarker,
  GyroscopeData,
  MuseControlResponse,
  MuseDeviceInfo,
  PPGReading,
  TelemetryData,
} from "./lib/muse-interfaces";
import {
  decodeEEGSamples,
  decodePPGSamples,
  parseAccelerometer,
  parseControl,
  parseGyroscope,
  parseTelemetry,
} from "./lib/muse-parse";
import {
  decodeResponse,
  encodeCommand,
  observableCharacteristic,
} from "./lib/muse-utils";

export { zipSamples } from "./lib/zip-samples";
export type { EEGSample } from "./lib/zip-samples";
export { zipSamplesPpg } from "./lib/zip-samplesPpg";
export type { PPGSample } from "./lib/zip-samplesPpg";
export type {
  EEGReading,
  PPGReading,
  TelemetryData,
  AccelerometerData,
  GyroscopeData,
  XYZ,
  MuseControlResponse,
  MuseDeviceInfo,
} from "./lib/muse-interfaces";

export const MUSE_SERVICE = 0xfe8d;
const CONTROL_CHARACTERISTIC = "273e0001-4c4d-454d-96be-f03bac821358";
const TELEMETRY_CHARACTERISTIC = "273e000b-4c4d-454d-96be-f03bac821358";
const GYROSCOPE_CHARACTERISTIC = "273e0009-4c4d-454d-96be-f03bac821358";
const ACCELEROMETER_CHARACTERISTIC = "273e000a-4c4d-454d-96be-f03bac821358";
const PPG_CHARACTERISTICS = [
  "273e000f-4c4d-454d-96be-f03bac821358", // ambient 0x37-0x39
  "273e0010-4c4d-454d-96be-f03bac821358", // infrared 0x3a-0x3c
  "273e0011-4c4d-454d-96be-f03bac821358", // red 0x3d-0x3f
];
export const PPG_FREQUENCY = 64;
export const PPG_SAMPLES_PER_READING = 6;
const EEG_CHARACTERISTICS = [
  "273e0003-4c4d-454d-96be-f03bac821358",
  "273e0004-4c4d-454d-96be-f03bac821358",
  "273e0005-4c4d-454d-96be-f03bac821358",
  "273e0006-4c4d-454d-96be-f03bac821358",
  "273e0007-4c4d-454d-96be-f03bac821358",
];
export const EEG_FREQUENCY = 256;
export const EEG_SAMPLES_PER_READING = 12;

// These names match the characteristics defined in PPG_CHARACTERISTICS above
export const ppgChannelNames = ["ambient", "infrared", "red"];

// These names match the characteristics defined in EEG_CHARACTERISTICS above
export const channelNames = ["TP9", "AF7", "AF8", "TP10", "AUX"];

export class MuseClient {
  enableAux = false;
  enablePpg = false;
  deviceName: string | null = "";
  connectionStatus = new BehaviorSubject<boolean>(false);
  rawControlData!: Observable<string>;
  controlResponses!: Observable<MuseControlResponse>;
  telemetryData!: Observable<TelemetryData>;
  gyroscopeData!: Observable<GyroscopeData>;
  accelerometerData!: Observable<AccelerometerData>;
  eegReadings!: Observable<EEGReading>;
  ppgReadings!: Observable<PPGReading>;
  eventMarkers!: Subject<EventMarker>;

  private gatt: BluetoothRemoteGATTServer | null = null;
  private controlChar!: BluetoothRemoteGATTCharacteristic;
  private eegCharacteristics!: BluetoothRemoteGATTCharacteristic[];
  private ppgCharacteristics!: BluetoothRemoteGATTCharacteristic[];

  private lastIndex: number | null = null;
  private lastTimestamp: number | null = null;

  async connect(gatt?: BluetoothRemoteGATTServer) {
    if (gatt) {
      this.gatt = gatt;
    } else {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [MUSE_SERVICE] }],
      });
      this.gatt = await device.gatt!.connect();
    }
    this.deviceName = this.gatt.device.name || null;

    const service = await this.gatt.getPrimaryService(MUSE_SERVICE);
    fromEvent(this.gatt.device, "gattserverdisconnected")
      .pipe(first())
      .subscribe(() => {
        this.gatt = null;
        this.connectionStatus.next(false);
      });

    // Control
    this.controlChar = await service.getCharacteristic(CONTROL_CHARACTERISTIC);
    this.rawControlData = (
      await observableCharacteristic(this.controlChar)
    ).pipe(
      map((data) => decodeResponse(new Uint8Array(data.buffer))),
      share()
    );
    this.controlResponses = parseControl(this.rawControlData);

    // Battery
    const telemetryCharacteristic = await service.getCharacteristic(
      TELEMETRY_CHARACTERISTIC
    );
    this.telemetryData = (
      await observableCharacteristic(telemetryCharacteristic)
    ).pipe(map(parseTelemetry));

    // Gyroscope
    const gyroscopeCharacteristic = await service.getCharacteristic(
      GYROSCOPE_CHARACTERISTIC
    );
    this.gyroscopeData = (
      await observableCharacteristic(gyroscopeCharacteristic)
    ).pipe(map(parseGyroscope));

    // Accelerometer
    const accelerometerCharacteristic = await service.getCharacteristic(
      ACCELEROMETER_CHARACTERISTIC
    );
    this.accelerometerData = (
      await observableCharacteristic(accelerometerCharacteristic)
    ).pipe(map(parseAccelerometer));

    this.eventMarkers = new Subject();

    // PPG
    if (this.enablePpg) {
      this.ppgCharacteristics = [];
      const ppgObservables = [];
      const ppgChannelCount = PPG_CHARACTERISTICS.length;
      for (
        let ppgChannelIndex = 0;
        ppgChannelIndex < ppgChannelCount;
        ppgChannelIndex++
      ) {
        const characteristicId = PPG_CHARACTERISTICS[ppgChannelIndex];
        const ppgChar = await service.getCharacteristic(characteristicId);
        ppgObservables.push(
          (await observableCharacteristic(ppgChar)).pipe(
            map((data) => {
              const eventIndex = data.getUint16(0);
              return {
                index: eventIndex,
                ppgChannel: ppgChannelIndex,
                samples: decodePPGSamples(
                  new Uint8Array(data.buffer).subarray(2)
                ),
                timestamp: this.getTimestamp(
                  eventIndex,
                  PPG_SAMPLES_PER_READING,
                  PPG_FREQUENCY
                ),
              };
            })
          )
        );
        this.ppgCharacteristics.push(ppgChar);
      }
      this.ppgReadings = merge(...ppgObservables);
    }

    // EEG
    /*
     * We create four (or five, if AUX is enabled) observables, each watching a different
     * channel's characteristic (Bluetooth stream). The characteristic sends 12 samples
     * together every packet, along with an associated event ID. i.e., 12 samples are
     * presumably recorded one after another, but are sent from the headset at the same
     * time (in the same "packet"), and there is no timestamp associated with the packet,
     * let alone for each sample.
     *
     * When we receive each packet, we calculate a timestamp to associate with it using
     * getTimestamp. There, READING_DELTA represents the total time it should take for
     * the device to record 12 samples. We subtract it from the current time, giving us
     * the time that the first of the 12 samples was recorded.
     *
     * After this step, we get eegReadings, which is an observable that emits each
     * electrode's 12 samples together each packet, associated with the event index and
     * the timestamp we chose.
     *
     * e.g., for a given index:
     * {electrode: 3, index: 58, samples: Array(12), timestamp: 1753215566160.875}
     * {electrode: 2, index: 58, samples: Array(12), timestamp: 1753215566160.875}
     * {electrode: 0, index: 58, samples: Array(12), timestamp: 1753215566160.875}
     * {electrode: 1, index: 58, samples: Array(12), timestamp: 1753215566160.875}
     *
     * In zipSamples, we combine electrodes and split out samples; we take the first
     * sample of each of the electrodes and combine them with a timestamp, and so on.
     * e.g. {data: Array(5), index: 171, timestamp: 1753217009737.75}, 12 per index.
     *
     * For sample n this timestamp is calculated:
     * packetTimestamp + (n * 1000) / frequency
     * where frequency is 256hz. This gives us 3.90625ms between each sample timestamp.
     */
    this.eegCharacteristics = [];
    const eegObservables = [] as Observable<EEGReading>[];
    const channelCount = this.enableAux ? EEG_CHARACTERISTICS.length : 4;
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
      const characteristicId = EEG_CHARACTERISTICS[channelIndex];
      const eegChar = await service.getCharacteristic(characteristicId);
      eegObservables.push(
        (await observableCharacteristic(eegChar)).pipe(
          map((data) => {
            const eventIndex = data.getUint16(0);
            const timestamp = this.getTimestamp(
              eventIndex,
              EEG_SAMPLES_PER_READING,
              EEG_FREQUENCY
            );
            // console.log(eventIndex, timestamp, channelIndex);
            // console.log(timestamp, timestamp - (lastTimestamp || timestamp));
            // if (lastTimestamp && lastTimestamp != timestamp && timestamp - lastTimestamp != 46.875) {
            //     console.log('jump', timestamp, lastTimestamp, timestamp - lastTimestamp);
            // }
            return {
              electrode: channelIndex,
              index: eventIndex,
              samples: decodeEEGSamples(
                new Uint8Array(data.buffer).subarray(2)
              ),
              timestamp,
            };
          })
        )
      );
      this.eegCharacteristics.push(eegChar);
    }
    // eegObservables.forEach((observable) => {
    //     observable.subscribe((reading) => {
    //         console.log(reading);
    //     });
    // });
    this.eegReadings = merge(...eegObservables);
    // this.eegReadings.subscribe((reading) => {
    //     console.log(reading);
    // });
    this.connectionStatus.next(true);
  }

  async sendCommand(cmd: string) {
    await this.controlChar.writeValue(encodeCommand(cmd));
  }

  async start() {
    await this.pause();
    let preset = "p21";
    if (this.enablePpg) {
      preset = "p50";
    } else if (this.enableAux) {
      preset = "p20";
    }

    await this.controlChar.writeValue(encodeCommand(preset));
    await this.controlChar.writeValue(encodeCommand("s"));
    await this.resume();
  }

  async pause() {
    await this.sendCommand("h");
  }

  async resume() {
    await this.sendCommand("d");
  }

  async deviceInfo() {
    const resultListener = this.controlResponses
      .pipe(
        filter((r) => !!r.fw),
        take(1)
      )
      .toPromise();
    await this.sendCommand("v1");
    return resultListener as Promise<MuseDeviceInfo>;
  }

  async injectMarker(
    value: string | number,
    timestamp: number = new Date().getTime()
  ) {
    await this.eventMarkers.next({ value, timestamp });
  }

  disconnect() {
    if (this.gatt) {
      this.lastIndex = null;
      this.lastTimestamp = null;
      this.gatt.disconnect();
      this.connectionStatus.next(false);
    }
  }

  private getTimestamp(
    eventIndex: number,
    samplesPerReading: number,
    frequency: number
  ) {
    // For EEG, this is always 46.875
    const READING_DELTA = 1000 * (1.0 / frequency) * samplesPerReading;
    if (this.lastIndex === null || this.lastTimestamp === null) {
      this.lastIndex = eventIndex;
      // We only grab the date from the browser the first time; after that, we
      // manipulate lastTimestamp (adding or removing READING_DELTA) to get the
      // next one.
      this.lastTimestamp = new Date().getTime() - READING_DELTA;
    }

    /*
         * Handle wraparound

         * If eventIndex jumps backwards a very large amount (here we're using 4096 as a
         * threshold) it is probably not because we actually got an out-of-order packet,
         * but because we wrapped around back to zero. This happens after 0x10000 (65536).
         *
         * In that case where we detect a wraparound, add back 0x10000 so that the rest
         * of the logic knows we effectively went forward in index, not backwards.
         */
    while (this.lastIndex - eventIndex > 0x1000) {
      eventIndex += 0x10000;
    }

    // We're still on the same eventIndex; since this function should give the start
    // of the eventIndex, we return the same timestamp
    if (eventIndex === this.lastIndex) {
      return this.lastTimestamp;
    }

    // eventIndex increased, but not necessarily by one.
    if (eventIndex > this.lastIndex) {
      this.lastTimestamp += READING_DELTA * (eventIndex - this.lastIndex);
      this.lastIndex = eventIndex;
      return this.lastTimestamp;
    } else {
      // The indices are out of order - we're getting an index that is less than
      // the previous one. Subtract READING_DELTA from the last timestamp, but don't update it.
      return this.lastTimestamp - READING_DELTA * (this.lastIndex - eventIndex);
    }
  }
}
