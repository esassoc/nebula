DECLARE @MigrationNumber INT;
SET @MigrationNumber = 9

IF NOT EXISTS(SELECT * FROM dbo.DatabaseMigration DM WHERE DM.DatabaseMigrationNumber = @MigrationNumber)
BEGIN
    PRINT @MigrationNumber

    DELETE FROM dbo.[User] WHERE EMAIL = 'jamie.quishenberry@sitkatech.com'  -- Somehow she has two user records with the same UserGuid

    INSERT INTO dbo.DatabaseMigration(DatabaseMigrationNumber)
    SELECT @MigrationNumber
END