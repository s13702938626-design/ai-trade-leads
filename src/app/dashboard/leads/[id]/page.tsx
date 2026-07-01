"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Lead } from "@/types/lead";
import { getLeads } from "@/lib/lead-storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadDetail } from "@/components/leads/LeadDetail";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLead(getLeads().find((item) => item.id === params.id) ?? null);
    setLoaded(true);
  }, [params.id]);

  if (!loaded) {
    return null;
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Link className="text-sm font-medium text-sky-700 hover:underline" href="/dashboard/leads">
          返回客户列表
        </Link>
        <EmptyState title="未找到客户" description="该客户可能已被删除，或当前浏览器 localStorage 中没有这条记录。" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link className="text-sm font-medium text-sky-700 hover:underline" href="/dashboard/leads">
        返回客户列表
      </Link>
      <LeadDetail lead={lead} />
    </div>
  );
}
