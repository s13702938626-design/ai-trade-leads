import { NextResponse } from "next/server";
import { preflightLegacyMigration } from "@/server/application/legacy-migration/preflight";
import { getRepositories } from "@/server/repositories/sqlite/create-sqlite-repositories";
import { SystemClock } from "@/server/domain/entities/common";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const safeError = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message.slice(0, 240) : "Migration request failed." }, { status: 400, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) { if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 400 }); if (Number(request.headers.get("content-length") ?? 0) > 10 * 1024 * 1024) return NextResponse.json({ error: "Request is too large." }, { status: 413 }); try { const value: unknown = await request.json(); const repositories = getRepositories(); const run = await preflightLegacyMigration(value, { legacyMigrationRepository: repositories.legacyMigrations, accountRepository: repositories.accounts, clock: new SystemClock() }); return NextResponse.json(run, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return safeError(error); } }
