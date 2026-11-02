using Nebula.EFModels.Entities;
using Nebula.Models.DataTransferObjects;

namespace Nebula.API.Services.Authorization
{
    /// <summary>
    /// Record-level check for endpoints keyed by a userID: the caller may read their own record, and only an Admin may read anyone else's.
    /// A role check alone let any signed-in user (including a fresh, Unassigned signup) read other users' email and phone by sequential ID.
    /// </summary>
    public static class UserRecordAccess
    {
        public static bool IsSelfOrAdmin(UserDto caller, int userID)
        {
            if (caller == null)
            {
                return false;
            }

            return caller.UserID == userID || caller.Role?.RoleID == (int) RoleEnum.Admin;
        }
    }
}
