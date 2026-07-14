/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabaseConnection } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import { createSqliteRepositories } from "../src/server/repositories/sqlite/create-sqlite-repositories";
import { RepositoryNotFoundError } from "../src/server/domain/repositories";
const dir=mkdtempSync(join(tmpdir(),"restore-")); const file=join(dir,"test.db"); let c:any,r:any;
test.before(()=>{migrateDatabase(file);c=createDatabaseConnection(file);r=createSqliteRepositories(c);});test.after(()=>{c.close();rmSync(dir,{recursive:true,force:true});});
test("Account restore clears only deletedAt",async()=>{const a=await r.accounts.create({displayName:"Restore Co"});const d=await r.accounts.softDelete(a.id);const x=await r.accounts.restore(a.id);assert.ok(d.deletedAt);assert.equal(x.deletedAt,null);assert.equal(x.displayName,a.displayName);});
test("Account restore is idempotent",async()=>{const a=await r.accounts.create({displayName:"Active Co"});const x=await r.accounts.restore(a.id);const y=await r.accounts.restore(a.id);assert.equal(x.updatedAt.getTime(),y.updatedAt.getTime());await assert.rejects(()=>r.accounts.restore("missing"),RepositoryNotFoundError);});
test("Evidence restore preserves immutable fields",async()=>{const run=await r.sourceRuns.create({adapterId:"t",sourceType:"manual_url",inputSummary:{}});const a=await r.accounts.create({displayName:"Evidence Co"});const out=await r.evidence.create({sourceType:"manual_url",sourceExternalId:"restore-e",title:"Title",rawText:"Raw",sourceRunId:run.id});if(out.status!=="created")throw new Error();const m=await r.evidence.attachToAccount(out.evidence.id,a.id);await r.evidence.softDelete(m.id);const x=await r.evidence.restore(m.id);assert.equal(x.deletedAt,null);assert.equal(x.accountId,m.accountId);assert.equal(x.resolutionStatus,"matched");assert.equal(x.rawText,m.rawText);assert.equal(x.contentHash,m.contentHash);assert.equal(x.sourceRunId,m.sourceRunId);});
test("Evidence restore is idempotent and rejects unknown IDs",async()=>{const run=await r.sourceRuns.create({adapterId:"t",sourceType:"manual_url",inputSummary:{}});const out=await r.evidence.create({sourceType:"manual_url",sourceExternalId:"restore-active",title:"T",sourceRunId:run.id});if(out.status!=="created")throw new Error();const x=await r.evidence.restore(out.evidence.id);const y=await r.evidence.restore(out.evidence.id);assert.equal(x.updatedAt.getTime(),y.updatedAt.getTime());await assert.rejects(()=>r.evidence.restore("missing"),RepositoryNotFoundError);assert.deepEqual(c.sqlite.pragma("foreign_key_check"),[]);});
