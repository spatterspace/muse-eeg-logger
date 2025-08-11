/**
 * Ultrahuman Metrics API client.
 *
 * Fetches partner metrics for a given email and date.
 */

export interface UltrahumanTimeSeriesValue {
  value: number | null;
  timestamp: number;
}

export interface UltrahumanMetricObject {
  day_start_timestamp?: number;
  title?: string;
  subtitle?: string;
  unit?: string;
  values?: UltrahumanTimeSeriesValue[];
  last_reading?: number | null;
  avg?: number | null;
  total?: number | null;
  value?: number | null;
}

export interface UltrahumanMetricDataItem {
  // Metric type restricted to known values from the example response
  type: UltrahumanMetricType;
  // Shape varies by metric type; keep this flexible but typed.
  object: UltrahumanMetricObject | Record<string, never>;
}

export interface UltrahumanMetricsData {
  metric_data: UltrahumanMetricDataItem[];
  latest_time_zone: string;
}

export interface UltrahumanMetricsApiResponse {
  data: UltrahumanMetricsData;
  error: unknown | null;
  status: number; // e.g., 200
}

export type UltrahumanMetricType =
  | "hr"
  | "temp"
  | "hrv"
  | "steps"
  | "night_rhr"
  | "avg_sleep_hrv"
  | "Sleep"
  | "glucose"
  | "metabolic_score"
  | "glucose_variability"
  | "average_glucose"
  | "hba1c"
  | "time_in_target"
  | "recovery_index"
  | "movement_index"
  | "active_minutes"
  | "vo2_max"
  | "sleep_rhr";

export type DownloadRingDataParams = {
  email: string;
  /** Date string formatted as YYYY-MM-DD (e.g. 2025-08-11). */
  date: string;
  authorization: string;
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
};

/**
 * Fetch Ultrahuman partner metrics for the given user and date.
 */
export async function downloadRingData(
  params: DownloadRingDataParams
): Promise<UltrahumanMetricsApiResponse> {
  const { email, date, authorization, signal } = params;

  const url = new URL("https://partner.ultrahuman.com/api/v1/metrics");
  url.searchParams.set("email", email);
  url.searchParams.set("date", date);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: authorization,
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    // Try to surface server-provided error details when available
    let message = `Ultrahuman metrics request failed: ${response.status} ${response.statusText}`;
    try {
      const maybeJson = await response.json();
      message = `${message}$
${JSON.stringify(maybeJson)}`;
    } catch {
      try {
        const text = await response.text();
        if (text)
          message = `${message}$
${text}`;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  const json = (await response.json()) as UltrahumanMetricsApiResponse;

  // Optional sanity check mirroring the example response schema
  if (
    typeof json !== "object" ||
    json === null ||
    typeof json.status !== "number"
  ) {
    throw new Error("Unexpected Ultrahuman metrics response shape");
  }

  return json;
}
