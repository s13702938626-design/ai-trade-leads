"use client";

import { ChangeEvent, useEffect, useState } from "react";
import type { Lead } from "@/types/lead";
import { csvToLeads, leadsToCsv } from "@/lib/csv";
import { getLeads, replaceLeads } from "@/lib/lead-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ExportPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  function refresh() {
    setLeads(getLeads());
  }

  useEffect(() => {
    refresh();
  }, []);

  function exportCsv() {
    const csv = leadsToCsv(leads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-trade-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    setMessage("");
    setErrors([]);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const result = csvToLeads(text);
    if (result.errors.length > 0) {
      setErrors(result.errors);
      event.target.value = "";
      return;
    }

    replaceLeads([...result.leads, ...getLeads()]);
    refresh();
    setMessage(`导入成功：${result.leads.length} 条客户`);
    event.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">导入导出</h2>
        <p className="mt-1 text-sm text-slate-600">
          CSV 包含所有 Lead 字段。导入时 companyName、productKeyword、sourceUrl 必填。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-950">导出 CSV</h3>
          <p className="mt-2 text-sm text-slate-600">导出当前浏览器 localStorage 中的真实客户数据。</p>
          <Button className="mt-5" disabled={leads.length === 0} onClick={exportCsv} type="button">
            导出 CSV
          </Button>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-slate-950">导入 CSV</h3>
          <p className="mt-2 text-sm text-slate-600">只导入你自己整理的真实客户。不会自动补全邮箱或国家。</p>
          <input
            accept=".csv,text/csv"
            className="mt-5 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            onChange={importCsv}
            type="file"
          />
        </Card>
      </div>

      {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {errors.length > 0 ? (
        <Card className="border-red-200 bg-red-50">
          <h3 className="text-base font-semibold text-red-800">导入失败</h3>
          <ul className="mt-3 space-y-2 text-sm text-red-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {leads.length === 0 ? (
        <EmptyState title="暂无真实客户数据" description="当前没有可导出的客户。请先手动录入或导入真实客户 CSV。" />
      ) : (
        <Card>
          <p className="text-sm text-slate-600">当前可导出客户数</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{leads.length}</p>
        </Card>
      )}
    </div>
  );
}
