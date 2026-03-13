/*
Post-Deployment Script
--------------------------------------------------------------------------------------
This file is generated on every build, DO NOT modify.
--------------------------------------------------------------------------------------
*/

PRINT N'Nebula.Database - Script.PostDeployment.ReleaseScripts.sql';
GO

:r ".\0008 - Update Users.sql"
GO

