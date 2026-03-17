DECLARE @MigrationNumber INT;
SET @MigrationNumber = 8

IF NOT EXISTS(SELECT * FROM dbo.DatabaseMigration DM WHERE DM.DatabaseMigrationNumber = @MigrationNumber)
BEGIN
    PRINT @MigrationNumber

    DELETE FROM dbo.[User] WHERE EMAIL = 'stewart.gordon@sitkatech.com'  -- Already has a User with the esassoc email
    DELETE FROM dbo.[User] WHERE EMAIL = 'andy.schultheiss@sitkatech.com'  -- These people are gone...
    DELETE FROM dbo.[User] WHERE EMAIL = 'sherryl.schown@sitkatech.com'

    UPDATE dbo.[User] SET Email = 'JBurns@esassoc.com' WHERE Email = 'john.burns@sitkatech.com';  -- Replace active sitkatech users with esassoc
	UPDATE dbo.[User] SET Email = 'KElmquist@esassoc.com' WHERE Email = 'kathleen.elmquist@sitkatech.com';
	UPDATE dbo.[User] SET Email = 'MPeters@esassoc.com' WHERE Email = 'mack.peters@sitkatech.com';
    UPDATE dbo.[User] SET Email = 'RLee@esassoc.com' WHERE Email = 'ray@sitkatech.com';

    -- His Nebula user record is tied to Keith's Keystone guid...
    UPDATE dbo.[User] SET LegacyUserGuid = '76addc70-2ee5-438a-a7ad-17876f76ec30' WHERE Email = 'sgordon@esassoc.com';

    -- She has two Keystone accounts, one for sitkatech and one for esassoc.  However, the esassoc account was tied to an invalid email... cannot migrate
    UPDATE dbo.[User] SET RoleID = 4 WHERE Email = 'jquishenberry@esassoc.com';

    -- I am trying to scrub out all sitkatech emails, but his keystone account still uses sitkatech, so he gets deactivated and is not migrated
    UPDATE dbo.[User] SET Email = 'MFerrante@esassoc.com', RoleID = 4 WHERE Email = 'michael@sitkatech.com';

    INSERT INTO dbo.[User](LegacyUserGuid, FirstName, LastName, Email, RoleID, CreateDate, IsActive, ReceiveSupportEmails, LoginName)
    SELECT 'b374c4b7-f83a-475f-88d0-ec270220da8e', 'Michael', 'Spelman', 'mspelman@esassoc.com', 1, GetDate(), 1, 0, 'mspelman'

    INSERT INTO dbo.DatabaseMigration(DatabaseMigrationNumber)
    SELECT @MigrationNumber
END