import { NextResponse } from "next/server";
import { rollbackLegacyMigrationRun } from "@/server/application/legacy-migration/rollback-run";
import { getRepositories } from "@/server/repositories/sqlite/create-sqlite-repositories";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const repositories = getRepositories(); return NextResponse.json(await rollbackLegacyMigrationRun(id, { accounts: repositories.accounts, evidence: repositories.evidence, migrations: repositories.legacyMigrations }), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message.slice(0, 240) : "Rollback failed." }, { status: 409 }); } }
