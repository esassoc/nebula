using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Nebula.Models.DataTransferObjects;
using Nebula.Models.DataTransferObjects.User;

namespace Nebula.EFModels.Entities
{
    public partial class User
    {
        public string FullName => $"{FirstName} {LastName}";
        public string FullNameLastFirst => $"{LastName}, {FirstName}";

        public static UserDto CreateUnassignedUser(NebulaDbContext dbContext, UserCreateDto userCreateDto)
        {
            var userUpsertDto = new UserUpsertDto()
            {
                FirstName = userCreateDto.FirstName,
                LastName = userCreateDto.LastName,
                OrganizationName = userCreateDto.OrganizationName,
                Email = userCreateDto.Email,
                PhoneNumber = userCreateDto.PhoneNumber,
                RoleID = (int)RoleEnum.Unassigned,  // don't allow non-admin user to set their role to something other than Unassigned
                ReceiveSupportEmails = false  // don't allow non-admin users to hijack support emails
            };
            return CreateNewUser(dbContext, userUpsertDto, userCreateDto.LoginName, userCreateDto.UserGuid);
        }

        public static List<ErrorMessage> ValidateCreateUnassignedUser(NebulaDbContext dbContext, UserCreateDto userCreateDto)
        {
            var result = new List<ErrorMessage>();

            var userByGuidDto = GetByUserGuid(dbContext, userCreateDto.UserGuid);  // A duplicate Guid not only leads to 500s, it allows someone to hijack another user's account
            if (userByGuidDto != null)
            {
                result.Add(new ErrorMessage() { Type = "User Creation", Message = "Invalid user information." });  // purposely vague; we don't want a naughty person realizing they figured out someone else's Guid
            }

            var userByEmailDto = GetByEmail(dbContext, userCreateDto.Email);  // A duplicate email leads to 500s, so need to prevent duplicates
            if (userByEmailDto != null)
            {
                result.Add(new ErrorMessage() { Type = "User Creation", Message = "There is already a user account with this email address." });
            }

            return result;
        }

        public static UserDto CreateNewUser(NebulaDbContext dbContext, UserUpsertDto userToCreate, string loginName, Guid userGuid)
        {
            if (!userToCreate.RoleID.HasValue)
            {
                return null;
            }

            var user = new User
            {
                LegacyUserGuid = userGuid,
                LoginName = loginName,
                Email = userToCreate.Email,
                FirstName = userToCreate.FirstName,
                LastName = userToCreate.LastName,
                IsActive = true,
                RoleID = userToCreate.RoleID.Value,
                CreateDate = DateTime.UtcNow,
            };

            dbContext.Users.Add(user);
            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();

            return GetByUserID(dbContext, user.UserID);
        }

        public static IEnumerable<UserDto> List(NebulaDbContext dbContext)
        {
            // right now we are assuming a parcel can only be associated to one user
            return dbContext.Users.AsNoTracking()
                .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
                .Select(x => x.AsDto()).AsEnumerable();
        }

        public static IEnumerable<UserDto> ListByRole(NebulaDbContext dbContext, RoleEnum roleEnum)
        {
            var users = GetUserImpl(dbContext)
                .Where(x => x.IsActive && x.RoleID == (int) roleEnum)
                .OrderBy(x => x.FirstName).ThenBy(x => x.LastName)
                .Select(x => x.AsDto())
                .AsEnumerable();

            return users;
        }

        public static IEnumerable<string> GetEmailAddressesForAdminsThatReceiveSupportEmails(NebulaDbContext dbContext)
        {
            var users = GetUserImpl(dbContext)
                .Where(x => x.IsActive && x.RoleID == (int) RoleEnum.Admin && x.ReceiveSupportEmails)
                .Select(x => x.Email)
                .AsEnumerable();

            return users;
        }

        public static UserDto GetByUserID(NebulaDbContext dbContext, int userID)
        {
            var user = GetUserImpl(dbContext).SingleOrDefault(x => x.UserID == userID);
            return user?.AsDto();
        }

        public static List<UserDto> GetByUserID(NebulaDbContext dbContext, List<int> userIDs)
        {
            return GetUserImpl(dbContext).Where(x => userIDs.Contains(x.UserID)).Select(x=>x.AsDto()).ToList();
            
        }

        public static UserDto GetByUserGuid(NebulaDbContext dbContext, Guid userGuid)
        {
            var user = GetUserImpl(dbContext)
                .SingleOrDefault(x => x.LegacyUserGuid == userGuid);

            return user?.AsDto();
        }

        private static IQueryable<User> GetUserImpl(NebulaDbContext dbContext)
        {
            return dbContext.Users.AsNoTracking();
        }

        public static UserDto GetByEmail(NebulaDbContext dbContext, string email)
        {
            var user = GetUserImpl(dbContext).SingleOrDefault(x => x.Email == email);
            return user?.AsDto();
        }

        public static UserDto UpdateUserEntity(NebulaDbContext dbContext, int userID, UserUpsertDto userEditDto)
        {
            if (!userEditDto.RoleID.HasValue)
            {
                return null;
            }

            var user = dbContext.Users.Single(x => x.UserID == userID);

            user.RoleID = userEditDto.RoleID.Value;
            user.ReceiveSupportEmails = userEditDto.RoleID.Value == 1 && userEditDto.ReceiveSupportEmails;
            user.UpdateDate = DateTime.UtcNow;

            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();
            return GetByUserID(dbContext, userID);
        }

        public static UserDto SetDisclaimerAcknowledgedDate(NebulaDbContext dbContext, int userID)
        {
            var user = dbContext.Users.Single(x => x.UserID == userID);

            user.UpdateDate = DateTime.UtcNow;
            user.DisclaimerAcknowledgedDate = DateTime.UtcNow;

            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();

            return GetByUserID(dbContext, userID);
        }

        public static UserDto UpdateUserGuid(NebulaDbContext dbContext, int userID, Guid userGuid)
        {
            var user = dbContext.Users
                .Single(x => x.UserID == userID);

            user.LegacyUserGuid = userGuid;
            user.UpdateDate = DateTime.UtcNow;

            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();
            return GetByUserID(dbContext, userID);
        }

        public static List<ErrorMessage> ValidateUpdate(NebulaDbContext dbContext, UserUpsertDto userEditDto, int userID)
        {
            var result = new List<ErrorMessage>();
            if (!userEditDto.RoleID.HasValue)
            {
                result.Add(new ErrorMessage() { Type = "Role ID", Message = "Role ID is required." });
            }

            return result;
        }
    }
}