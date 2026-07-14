/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm";
import { accounts, evidence } from "../../db/schema";
import { RepositoryNotFoundError } from "../../domain/repositories";
export function withAccountRestore(repository: any, connection: any, clock: any) { repository.restore = async (id: string) => { const account = await repository.getById(id, { includeDeleted: true }); if (!account) throw new RepositoryNotFoundError("Account not found."); if (account.deletedAt === null) return account; connection.db.update(accounts).set({ deletedAt: null, updatedAt: clock.now().getTime() }).where(eq(accounts.id, id)).run(); return repository.getById(id); }; return repository; }
export function withEvidenceRestore(repository: any, connection: any, clock: any) { repository.restore = async (id: string) => { const item = await repository.getById(id, { includeDeleted: true }); if (!item) throw new RepositoryNotFoundError("Evidence not found."); if (item.deletedAt === null) return item; connection.db.update(evidence).set({ deletedAt: null, updatedAt: clock.now().getTime() }).where(eq(evidence.id, id)).run(); return repository.getById(id); }; return repository; }
