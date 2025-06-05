export function formatTimestamp(timestamp: number): string {
  const date = new Date(Math.floor(timestamp)); // Drop fractional part
  const iso = date.toISOString(); // Gives you up to milliseconds
  const fractional = (timestamp % 1).toFixed(6).slice(2); // Get fractional ms, up to microseconds

  return iso.replace("Z", `.${fractional}Z`);
}

export function downloadCSV(
  name: string,
  header: string,
  lines: string[]
): Promise<void> {
  return new Promise((resolve) => {
    const csvContent = [header, ...lines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    a.onclick = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve();
      }, 100);
    };
    a.click();
  });
}
