using System;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Nebula.API.Controllers;
using Nebula.API.Services.Authorization;
using Nebula.EFModels.Entities;
using Nebula.Models.DataTransferObjects;

namespace Nebula.Tests
{
    /// <summary>
    /// A signed-in user may read only their own record; an Admin may read anyone's.
    /// </summary>
    [TestClass]
    public class UserRecordAccessTests
    {
        private static UserDto MakeUser(int userID, RoleEnum role) => new UserDto
        {
            UserID = userID,
            Role = new RoleDto { RoleID = (int) role }
        };

        [TestMethod]
        public void IsSelfOrAdmin_AllowsOwnRecordForEveryRole()
        {
            foreach (var role in Enum.GetValues<RoleEnum>())
            {
                Assert.IsTrue(UserRecordAccess.IsSelfOrAdmin(MakeUser(7, role), 7), role.ToString());
            }
        }

        [TestMethod]
        public void IsSelfOrAdmin_AllowsAdminOnAnyRecord()
        {
            Assert.IsTrue(UserRecordAccess.IsSelfOrAdmin(MakeUser(7, RoleEnum.Admin), 8));
        }

        [TestMethod]
        public void IsSelfOrAdmin_DeniesNonAdminOnAnotherRecord()
        {
            foreach (var role in Enum.GetValues<RoleEnum>().Where(x => x != RoleEnum.Admin))
            {
                Assert.IsFalse(UserRecordAccess.IsSelfOrAdmin(MakeUser(7, role), 8), role.ToString());
            }
        }

        [TestMethod]
        public void IsSelfOrAdmin_DeniesUnknownCaller()
        {
            Assert.IsFalse(UserRecordAccess.IsSelfOrAdmin(null, 8));
        }

        [TestMethod]
        [DataRow(nameof(UserController.GetByUserID))]
        [DataRow(nameof(UserController.SetDisclaimerAcknowledgedDate))]
        public void UserRecordActions_RequireASignedInUser(string actionName)
        {
            var action = typeof(UserController).GetMethod(actionName, BindingFlags.Public | BindingFlags.Instance);
            Assert.IsNotNull(action);
            Assert.IsTrue(action.GetCustomAttributes<AuthorizeAttribute>(true).Any(), $"{actionName} must not be anonymous");
        }

        [TestMethod]
        public void SetDisclaimerAcknowledgedDate_TakesNoUserIDFromTheRequest()
        {
            var action = typeof(UserController).GetMethod(nameof(UserController.SetDisclaimerAcknowledgedDate), BindingFlags.Public | BindingFlags.Instance);
            Assert.IsNotNull(action);
            Assert.AreEqual(0, action.GetParameters().Length, "the caller must come from the token, not the request");
        }
    }
}
