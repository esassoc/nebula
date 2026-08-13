-- Least-privilege role granting EXECUTE on all stored procedures / functions.
-- The passwordless workload identity (nebula-<env>-identity) is added to this
-- role by the pipeline db-aad-user step, alongside db_datareader /
-- db_datawriter / db_ddladmin. This lets the app identity execute procs without
-- the broader membership a legacy SQL login would need -- no ownership,
-- permission-management, or impersonation rights an app identity shouldn't have.
-- (Ported from the zybach/Shasta standard via wave-runup.)
CREATE ROLE [db_executor];
GO

GRANT EXECUTE TO [db_executor];
