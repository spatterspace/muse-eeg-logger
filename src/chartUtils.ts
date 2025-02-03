// Function to count by n to something
export function customCount(
  start: number,
  end: number,
  step: number = 1
): number[] {
  const len = Math.floor((end - start) / step) + 1;
  return Array(len)
    .fill(0)
    .map((_, idx) => start + idx * step);
}

// Average of values in data
function average(data: number[]): number {
  const sum = data.reduce(function (sum: number, value: number): number {
    return sum + value;
  }, 0);

  const avg = sum / data.length;
  return avg;
}

export const bandLabels: string[] = [
  "Delta",
  "Theta",
  "Alpha",
  "Beta",
  "Gamma",
];

// Generate xTics
export function generateXTics(
  srate: number,
  duration: number,
  reverse: boolean = true
): number[] {
  let tics: number[] = [];
  if (reverse) {
    tics = customCount(
      (1000 / srate) * duration,
      1000 / srate,
      -(1000 / srate)
    );
  } else {
    tics = customCount(1000 / srate, (1000 / srate) * duration, 1000 / srate);
  }
  return tics.map(function (each_element: number): number {
    return Number(each_element.toFixed(0));
  });
}

// Standard deviation of values in values
export function standardDeviation(values: number[]): string {
  const avg = average(values);
  const squareDiffs = values.map(function (value: number): number {
    const diff = value - avg;
    const sqrDiff = diff * diff;
    return sqrDiff;
  });

  const avgSquareDiff = average(squareDiffs);
  const stdDev = Math.sqrt(avgSquareDiff).toFixed(0);
  return stdDev;
}
