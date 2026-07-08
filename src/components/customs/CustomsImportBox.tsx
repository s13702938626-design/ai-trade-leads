"use client";

import { ChangeEvent, useState } from "react";
import { parseCustomsCsv } from "@/lib/customs-csv";
import { addCustomsLeads } from "@/lib/customs-storage";
import { Card } from "@/components/ui/Card";

export function CustomsImportBox({ onImported }: { onImported: () => void }) {
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = parseCustomsCsv(await file.text());
    setErrors(result.errors);
    if (result.leads.length > 0) {
      addCustomsLeads(result.leads);
      setMessage(`导入成功：${result.leads.length} 条海关线索`);
      onImported();
    } else {
      setMessage("");
    }
    event.target.value = "";
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-950">海关 CSV 导入</h3>
      <p className="mt-2 text-sm text-slate-600">支持不同平台字段名。缺少来源可导入为待补来源，但不能转为 Lead。</p>
      <input
        accept=".csv,text/csv"
        className="mt-5 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        onChange={importCsv}
        type="file"
      />
      {message ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {errors.length > 0 ? (
        <ul className="mt-4 space-y-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      ) : null}
    </Card>
  );
}
