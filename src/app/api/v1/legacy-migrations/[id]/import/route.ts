import { NextResponse } from "next/server";
import { importLegacyMigrationRun } from "@/server/application/legacy-migration/import-run";
import { getRepositories } from "@/server/repositories/sqlite/create-sqlite-repositories";
import { SystemClock } from "@/server/domain/entities/common";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const repositories = getRepositories(); return NextResponse.json(await importLegacyMigrationRun(id, { accounts: repositories.accounts, evidence: repositories.evidence, sourceRuns: repositories.sourceRuns, migrations: repositories.legacyMigrations, clock: new SystemClock() }), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message.slice(0, 240) : "Import failed." }, { status: 409 }); } }
