export function Instructions() {
  return (
    <details className="max-w-4xl mb-4">
      <summary className="text-lg font-semibold cursor-pointer rounded-t-lg">
        Instructions
      </summary>
      <div className="p-4">
        <p className="mb-4">
          This project has been tested on Chrome on Windows and Mac.
        </p>
        <ul className="space-y-2 mb-4">
          <li>
            <b>Change the download folder:</b> go to Chrome settings, then
            Downloads, then hit Change and select the USB stick.
          </li>
          <li>
            <b>Turn off Chrome's download popups:</b> go to Chrome settings,
            search "Show downloads when they are done", and disable that.
          </li>
          <li>
            <b>Unlock the record button:</b> enter the participant ID in the
            box. If you don't have a participant in mind, enter anything. Then
            press Connect and use the browser Bluetooth popup to connect to the
            device.
          </li>
          <li>
            <b>Force Chrome to allow multiple downloads:</b> set the download
            interval to 2s and hit Record Timestamps. If Chrome prompts you to
            allow downloading multiple files, click Allow.
          </li>
        </ul>
        <p className="mb-2">
          The sliders and the graphs are meant to help you test the device, but
          they have no impact on the data recording.
        </p>
        <p>
          At each interval, a CSV file will be automatically downloaded and
          prefixed with the participant ID.
        </p>
        <p>
          If the Muse device disconnects, the disconnect sound will play if
          enabled. The app will try to automatically reconnect to that device
          every second.
        </p>
      </div>
    </details>
  );
}
