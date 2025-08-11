import { useCallback, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Message } from "primereact/message";
import {
  downloadRingData,
  UltrahumanMetricsApiResponse,
} from "../downloadRingData";

function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function RingMetrics() {
  const [email, setEmail] = useState("psr66ykryz@privaterelay.appleid.com");
  const [date, setDate] = useState<Date | null>(new Date());
  const [authorization, setAuthorization] = useState(
    "eyJhbGciOiJIUzI1NiJ9.eyJzZWNyZXQiOiJiNGNkNTllYTg2ZDg2MWZiZGU3NyIsImV4cCI6MjUwNzI4NDMyMX0.Uc19RwM868BfY65Wz4ZH-WtOJgx2h8ksfb85DaUkQ5o"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<UltrahumanMetricsApiResponse | null>(
    null
  );

  const onLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      if (!email || !date || !authorization) {
        throw new Error("Email, date, and authorization are required");
      }
      const res = await downloadRingData({
        email,
        date: formatDateYYYYMMDD(date),
        authorization,
      });
      setResponse(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [email, date, authorization]);

  const { labels, valuesHR, valuesHRV, hasData } = useMemo(() => {
    const empty = {
      labels: [] as string[],
      valuesHR: [] as (number | null)[],
      valuesHRV: [] as (number | null)[],
      hasData: false,
    };
    if (!response) return empty;

    const hrItem = response.data.metric_data.find((m) => m.type === "hr");
    const hrvItem = response.data.metric_data.find((m) => m.type === "hrv");

    const hrValues =
      hrItem && "values" in hrItem.object && hrItem.object.values
        ? hrItem.object.values.filter((v) => v.value != null)
        : [];
    const hrvValues =
      hrvItem && "values" in hrvItem.object && hrvItem.object.values
        ? hrvItem.object.values.filter((v) => v.value != null)
        : [];

    if (hrValues.length === 0 && hrvValues.length === 0) return empty;

    const hrMap = new Map<number, number>();
    for (const v of hrValues) hrMap.set(v.timestamp, v.value as number);
    const hrvMap = new Map<number, number>();
    for (const v of hrvValues) hrvMap.set(v.timestamp, v.value as number);

    const allTimestamps = Array.from(
      new Set<number>([...hrMap.keys(), ...hrvMap.keys()])
    ).sort((a, b) => a - b);

    const labels = allTimestamps.map((t) =>
      new Date(t * 1000).toLocaleTimeString()
    );
    const valuesHR = allTimestamps.map((t) => hrMap.get(t) ?? null);
    const valuesHRV = allTimestamps.map((t) => hrvMap.get(t) ?? null);

    return { labels, valuesHR, valuesHRV, hasData: true };
  }, [response]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Heart Rate (BPM)",
          data: valuesHR as (number | null)[],
          borderColor: "rgba(217,95,2)",
          backgroundColor: "rgba(217,95,2)",
          fill: false,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 3,
          tension: 0,
        },
        {
          label: "HRV",
          data: valuesHRV as (number | null)[],
          borderColor: "rgba(117,112,179)",
          backgroundColor: "rgba(117,112,179)",
          fill: false,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 3,
          tension: 0,
        },
      ],
    }),
    [labels, valuesHR, valuesHRV]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: false },
        legend: {
          display: true,
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Time" },
        },
        y: {
          title: { display: true, text: "Value" },
        },
      },
    }),
    []
  );

  return (
    <details className="max-w-4xl mb-4">
      <summary className="text-lg font-semibold cursor-pointer rounded-t-lg">
        Ring Metrics (Ultrahuman)
      </summary>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="uh-email">
              Email
            </label>
            <InputText
              id="uh-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="uh-date">
              Date
            </label>
            <Calendar
              id="uh-date"
              value={date}
              onChange={(e) => setDate((e.value as Date) ?? null)}
              dateFormat="yy-mm-dd"
            />
          </div>
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-medium mb-1" htmlFor="uh-auth">
              Authorization
            </label>
            <InputText
              id="uh-auth"
              value={authorization}
              onChange={(e) => setAuthorization(e.target.value)}
              placeholder="Bearer <token>"
            />
          </div>
          <div className="flex md:col-span-4">
            <Button
              className="mt-1"
              label="Load"
              onClick={onLoad}
              loading={loading}
            />
          </div>
        </div>

        {error && <Message severity="error" text={error} />}

        <div className="w-full h-96 max-w-4xl">
          {hasData ? (
            <Line data={data} options={options} />
          ) : (
            <div className="text-sm text-gray-600">
              No HR data yet. Enter credentials above and click Load.
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
