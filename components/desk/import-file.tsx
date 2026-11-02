"use client";

import { useState } from "react";
import { confirmImport } from "@/lib/desk-actions";
import { parseCsv } from "@/lib/csv";

export function ImportFile() {
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<string[][]>([]);

  function load(text: string) {
    setCsv(text);
    setRows(parseCsv(text).slice(0, 8));
  }

  return (
    <form action={confirmImport} className="grid max-w-3xl gap-3">
      <label className="grid gap-1">
        Choose a CSV file
        <input
          className="field"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void file.text().then(load);
          }}
        />
      </label>
      <label className="grid gap-1">
        Or paste the rows
        <textarea className="field" name="csv" value={csv} onChange={(event) => load(event.target.value)} />
      </label>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-line">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-2 pr-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Blank cells keep what is already saved. A row needs a filename or a slug that matches a piece.</p>
      )}
      <button className="btn btn-primary w-fit" type="submit">
        Bring these in
      </button>
    </form>
  );
}
