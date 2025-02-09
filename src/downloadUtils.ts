export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
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
