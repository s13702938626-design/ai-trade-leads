import { NextResponse } from "next/server";
import { addManualUrlEvidence } from "@/server/application/sources/adapters";
import { SystemClock } from "@/server/domain/entities/common";
import { getRepositories } from "@/server/repositories/sqlite/create-sqlite-repositories";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { const body = await request.json() as { url?: string; title?: string; rawText?: string; excerpt?: string; publishedAt?: string }; if (!body.url) return NextResponse.json({ error: "url is required." }, { status: 400 }); const repositories = getRepositories(); const evidence = await addManualUrlEvidence(body as { url: string; title?: string; rawText?: string; excerpt?: string; publishedAt?: string }, { evidence: repositories.evidence, sourceRuns: repositories.sourceRuns, clock: new SystemClock() }); return NextResponse.json(evidence, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message.slice(0, 240) : "Manual source failed." }, { status: 400 }); } }
