"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/types/lead";
import { addLead, deleteLead, getLeads, updateLead } from "@/lib/lead-storage";
import { LEAD_STATUSES, MATCH_LEVELS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadTable } from "@/components/leads/LeadTable";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [productKeyword, setProductKeyword] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [status, setStatus] = useState("");
  const [matchLevel, setMatchLevel] = useState("");

  function refresh() {
    setLeads(getLeads());
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const textMatch =
        !text ||
        lead.companyName.toLowerCase().includes(text) ||
        lead.website.toLowerCase().includes(text) ||
        (lead.email ?? "").toLowerCase().includes(text);
      return (
        textMatch &&
        (!country || lead.country === country) &&
        (!productKeyword || lead.productKeyword.toLowerCase().includes(productKeyword.toLowerCase())) &&
        (!customerType || lead.customerType.toLowerCase().includes(customerType.toLowerCase())) &&
        (!status || lead.status === status) &&
        (!matchLevel || lead.matchLevel === matchLevel)
      );
    });
  }, [country, customerType, leads, matchLevel, productKeyword, query, status]);

  function closeForm() {
    setShowForm(false);
    setEditingLead(undefined);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">客户列表</h2>
          <p className="mt-1 text-sm text-slate-600">所有客户必须来自手动录入或 CSV 导入的真实公开来源。</p>
        </div>
        <Button type="button" onClick={() => setShowForm(true)}>
          新增客户
        </Button>
      </div>

      {showForm || editingLead ? (
        <Card>
          <h3 className="mb-4 text-base font-semibold text-slate-950">{editingLead ? "编辑客户" : "新增客户"}</h3>
          <LeadForm
            lead={editingLead}
            onCancel={closeForm}
            onSubmit={(input) => {
              if (editingLead) {
                updateLead(editingLead.id, input);
              } else {
                addLead(input);
              }
              refresh();
              closeForm();
            }}
          />
        </Card>
      ) : null}

      <Card>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Input placeholder="搜索公司名、官网、邮箱" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Input placeholder="国家筛选" value={country} onChange={(event) => setCountry(event.target.value)} />
          <Input placeholder="产品关键词" value={productKeyword} onChange={(event) => setProductKeyword(event.target.value)} />
          <Input placeholder="客户类型" value={customerType} onChange={(event) => setCustomerType(event.target.value)} />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">全部状态</option>
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={matchLevel} onChange={(event) => setMatchLevel(event.target.value)}>
            <option value="">全部匹配度</option>
            {MATCH_LEVELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {leads.length === 0 ? (
        <EmptyState title="暂无真实客户数据" description="请新增真实客户，或从 CSV 导入真实公开来源中的客户。" />
      ) : filtered.length === 0 ? (
        <EmptyState title="没有匹配筛选条件的客户" />
      ) : (
        <LeadTable
          leads={filtered}
          onEdit={(lead) => {
            setEditingLead(lead);
            setShowForm(false);
          }}
          onDelete={(id) => {
            deleteLead(id);
            refresh();
          }}
        />
      )}
    </div>
  );
}
