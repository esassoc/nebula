/*
Pre-Deployment Script
--------------------------------------------------------------------------------------
This file is generated on every build, DO NOT modify.
--------------------------------------------------------------------------------------
*/

PRINT N'Nebula.Database - Script.PreDeployment.ReleaseScripts.sql';
GO

:r ".\0009 - Delete Duplicate User.sql"
GO

