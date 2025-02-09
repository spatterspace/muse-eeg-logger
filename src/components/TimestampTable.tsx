import { useState } from "react";
import { Button } from "primereact/button";
import { formatTimestamp } from "../downloadUtils";
import { TimestampData } from "../types";

type TimestampTableProps = {
  timestampData: TimestampData[];
  channelNames: string[];
  channelColors: string[];
};

export function TimestampTable({
  timestampData,
  channelNames,
  channelColors,
}: TimestampTableProps) {
  const pageSize = 20;
  const totalPages = Math.ceil(timestampData.length / pageSize);
  const [currentPage, setCurrentPage] = useState(0);

  const paginatedData = [...timestampData]
    .reverse()
    .slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  function nextPage() {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  }

  function prevPage() {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-1 text-sm">
        <div className="font-bold p-2 bg-gray-100">Timestamp</div>
        <div className="font-bold p-2 bg-gray-100">Time String</div>
        {channelNames.map((name, index) => (
          <div
            key={name}
            className="font-bold p-2 bg-gray-100"
            style={{ color: channelColors[index] }}
          >
            {name}
          </div>
        ))}

        {paginatedData.map((reading) => (
          <>
            <div key={`ts-${reading.timestamp}`} className="p-2 border">
              {reading.timestamp}
            </div>
            <div className="p-2 border">
              {formatTimestamp(reading.timestamp)}
            </div>
            {reading.data.map((value, idx) => (
              <div
                key={`val-${reading.timestamp}-${idx}`}
                className="p-2 border"
              >
                {value.toFixed(2)}
              </div>
            ))}
          </>
        ))}
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button
          label="Newer"
          size="small"
          disabled={currentPage === 0}
          onClick={prevPage}
        />
        <span>
          Page {currentPage + 1} of {Math.max(1, totalPages)}
        </span>
        <Button
          label="Older"
          size="small"
          disabled={currentPage >= totalPages - 1}
          onClick={nextPage}
        />
      </div>
    </div>
  );
}
