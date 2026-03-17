using Microsoft.AspNetCore.Http;
using Nebula.EFModels.Entities;
using Nebula.Models.DataTransferObjects;
using Nebula.Models.Helpers;
using System.Linq;

namespace Nebula.API.Services
{
    public class UserContext
    {
        public static UserDto GetUserFromHttpContext(NebulaDbContext dbContext, HttpContext httpContext)
        {

            var claimsPrincipal = httpContext.User;
            if (!claimsPrincipal.Claims.Any())
            {
                return null;
            }

            var globalID = claimsPrincipal.Claims.Single(c => c.Type == ClaimsConstants.Sub).Value;
            var user = User.GetByGlobalUserID(dbContext, globalID);
            return user;
        }
    }
}