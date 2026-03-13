CREATE TABLE [dbo].[User] (
	[UserID] [int] IDENTITY(1,1) NOT NULL,
	[LegacyUserGuid] [uniqueidentifier] NULL,
	[GlobalUserID] VARCHAR (254) NULL,
	[FirstName] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[LastName] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Email] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Phone] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[RoleID] [int] NOT NULL,
	[CreateDate] [datetime] NOT NULL,
	[UpdateDate] [datetime] NULL,
	[LastActivityDate] [datetime] NULL,
	[DisclaimerAcknowledgedDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL,
	[ReceiveSupportEmails] [bit] NOT NULL,
	[LoginName] [varchar](128) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Company] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT [PK_User_UserID] PRIMARY KEY CLUSTERED ([UserID] ASC),
	CONSTRAINT [AK_User_Email] UNIQUE NONCLUSTERED ([Email] ASC),
	CONSTRAINT [FK_User_Role_RoleID] FOREIGN KEY ([RoleID]) REFERENCES [dbo].[Role] ([RoleID])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_User_LegacyUserGuid] ON [dbo].[User]([LegacyUserGuid] ASC) WHERE LegacyUserGuid IS NOT NULL;
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_User_GlobalUserID] ON [dbo].[User]([GlobalUserID] ASC) WHERE GlobalUserID IS NOT NULL;
GO