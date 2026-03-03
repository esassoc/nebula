using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nebula.API.Services;
using Nebula.API.Services.Authorization;
using Nebula.EFModels.Entities;
using Nebula.Models.DataTransferObjects;
using Nebula.Models.DataTransferObjects.User;
using Nebula.Models.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Nebula.API.Controllers
{
    [ApiController]
    public class UserController : SitkaController<UserController>
    {
        public UserController(NebulaDbContext dbContext, ILogger<UserController> logger, IOptions<NebulaConfiguration> nebulaConfiguration) : base(dbContext, logger, nebulaConfiguration)
        {
        }

        [HttpPost("user-claims")]
        [Authorize]
        public async Task<ActionResult<UserDto>> PostUserClaims()
        {
            // Access claims via the User property instead of injecting ClaimsPrincipal
            var claims = User;
            
            var globalID = claims.Claims.Single(c => c.Type == ClaimTypes.NameIdentifier).Value;
            var email = claims.Claims.Single(c => c.Type == ClaimTypes.Email).Value;
            if (string.IsNullOrWhiteSpace(globalID) || string.IsNullOrWhiteSpace(email))
            {
                return BadRequest();
            }

            UserDto updatedUserDto;
            var userDto = EFModels.Entities.User.GetByGlobalUserID(_dbContext, globalID) ?? EFModels.Entities.User.GetByEmail(_dbContext, email);  // get by globalid or email
            if (userDto == null)
            {
                var firstName = claims?.Claims.SingleOrDefault(c => c.Type == ClaimsConstants.GivenName)?.Value;
                var lastName = claims?.Claims.SingleOrDefault(c => c.Type == ClaimsConstants.FamilyName)?.Value;
                var userCreateDto = new UserCreateDto()
                {
                    FirstName = firstName ?? "First",
                    LastName = lastName ?? "Last",
                    Email = email,
                    LoginName = email,
                    GlobalUserID = globalID,
                };
                var validationMessages = EFModels.Entities.User.ValidateCreateUnassignedUser(_dbContext, userCreateDto);
                validationMessages.ForEach(vm => { ModelState.AddModelError(vm.Type, vm.Message); });

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                updatedUserDto = EFModels.Entities.User.CreateUnassignedUser(_dbContext, userCreateDto);

                var smtpClient = HttpContext.RequestServices.GetRequiredService<SitkaSmtpClientService>();
                var mailMessage = GenerateUserCreatedEmail(_nebulaConfiguration.WEB_URL, updatedUserDto, _dbContext, smtpClient);
                SitkaSmtpClientService.AddCcRecipientsToEmail(mailMessage,EFModels.Entities.User.GetEmailAddressesForAdminsThatReceiveSupportEmails(_dbContext));
                await SendEmailMessage(smtpClient, mailMessage);
            }
            else
            {
                updatedUserDto = EFModels.Entities.User.UpdateClaims(_dbContext, userDto.UserID, claims, globalID);
            }

            return Ok(updatedUserDto);
        }

        [HttpPost("/users/invite")]
        [AdminFeature]
        public async Task<IActionResult> InviteUser([FromBody] UserInviteDto inviteDto)
        {
            if (inviteDto.RoleID.HasValue)
            {
                var role = Role.GetByRoleID(_dbContext, inviteDto.RoleID.Value);
                if (role == null)
                {
                    return BadRequest($"Could not find a Role with the ID {inviteDto.RoleID}");
                }
            }
            else
            {
                return BadRequest("Role ID is required.");
            }

            var newUser = new UserUpsertDto
            {
                FirstName = inviteDto.FirstName,
                LastName = inviteDto.LastName,
                Email = inviteDto.Email,
                RoleID = inviteDto.RoleID.Value
            };

            var user = EFModels.Entities.User.CreateNewUser(_dbContext, newUser);

            var smtpClient = HttpContext.RequestServices.GetRequiredService<SitkaSmtpClientService>();
            var mailMessage = GenerateInviteUserEmail(_nebulaConfiguration.WEB_URL, user, _dbContext, smtpClient);
            await SendEmailMessage(smtpClient, mailMessage);

            return Ok(user);
        }

        [HttpGet("users")]
        [AdminFeature]
        public ActionResult<IEnumerable<UserDto>> List()
        {
            var userDtos = EFModels.Entities.User.List(_dbContext);
            return Ok(userDtos);
        }

        [HttpGet("users/unassigned-report")]
        [AdminFeature]
        public ActionResult<UnassignedUserReportDto> GetUnassignedUserReport()
        {
            var report = new UnassignedUserReportDto
                {Count = _dbContext.Users.Count(x => x.RoleID == (int) RoleEnum.Unassigned)};
            return Ok(report);
        }

        [HttpGet("users/{userID}")]
        [UserViewFeature]
        public ActionResult<UserDto> GetByUserID([FromRoute] int userID)
        {
            var userDto = EFModels.Entities.User.GetByUserID(_dbContext, userID);
            return RequireNotNullThrowNotFound(userDto, "User", userID);
        }

        [HttpGet("user-claims/{globalID}")]
        public ActionResult<UserDto> GetByGlobalID([FromRoute] string globalID)
        {
            if (!string.IsNullOrWhiteSpace(globalID))
            {
                return BadRequest();
            }

            var userDto = EFModels.Entities.User.GetByGlobalUserID(_dbContext, globalID);
            if (userDto == null)
            {
                var notFoundMessage = $"User with GUID {globalID} does not exist!";
                _logger.LogError(notFoundMessage);
                return NotFound(notFoundMessage);
            }

            return Ok(userDto);
        }

        [HttpPut("users/{userID}")]
        [AdminFeature]
        public ActionResult<UserDto> UpdateUser([FromRoute] int userID, [FromBody] UserUpsertDto userUpsertDto)
        {
            var userDto = EFModels.Entities.User.GetByUserID(_dbContext, userID);
            if (ThrowNotFound(userDto, "User", userID, out var actionResult))
            {
                return actionResult;
            }

            var validationMessages = EFModels.Entities.User.ValidateUpdate(_dbContext, userUpsertDto, userDto.UserID);
            validationMessages.ForEach(vm => { ModelState.AddModelError(vm.Type, vm.Message); });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = Role.GetByRoleID(_dbContext, userUpsertDto.RoleID.GetValueOrDefault());
            if (role == null)
            {
                return BadRequest($"Could not find a System Role with the ID {userUpsertDto.RoleID}");
            }

            var updatedUserDto = EFModels.Entities.User.UpdateUserEntity(_dbContext, userID, userUpsertDto);
            return Ok(updatedUserDto);
        }

        [HttpPut("users/set-disclaimer-acknowledged-date")]
        public ActionResult<UserDto> SetDisclaimerAcknowledgedDate([FromBody] int userID)
        {
            var userDto = EFModels.Entities.User.GetByUserID(_dbContext, userID);
            if (ThrowNotFound(userDto, "User", userID, out var actionResult))
            {
                return actionResult;
            }

            var updatedUserDto = EFModels.Entities.User.SetDisclaimerAcknowledgedDate(_dbContext, userID);
            return Ok(updatedUserDto);
        }


        private MailMessage GenerateUserCreatedEmail(string nebulaUrl, UserDto user, NebulaDbContext dbContext,
            SitkaSmtpClientService smtpClient)
        {
            var messageBody = $@"A new user has signed up to the Smart Watershed Network Platform: <br/><br/>
 {user.FullName} ({user.Email}) <br/><br/>
As an administrator of the Smart Watershed Network Platform, you can assign them a role and associate them with a Billing Account by following <a href='{nebulaUrl}/users/{user.UserID}'>this link</a>. <br/><br/>
{smtpClient.GetSupportNotificationEmailSignature()}";

            var mailMessage = new MailMessage
            {
                Subject = $"New User in the Smart Watershed Network Platform",
                Body = $"Hello,<br /><br />{messageBody}",
            };

            mailMessage.To.Add(smtpClient.GetDefaultEmailFrom());
            return mailMessage;
        }

        private MailMessage GenerateInviteUserEmail(string nebulaUrl, UserDto user, NebulaDbContext dbContext, SitkaSmtpClientService smtpClient)
        {
            var messageBody = $@"You are receiving this notification because an administrator of the Smart Watershed Network Platform, an online service of the 
                Environmental Science Associates, has invited you to create an account. <br /><br />
                Please go to the <a href='{nebulaUrl}'>Smart Watershed Network Platform</a> website and click the Create Account button. <br /> <br />
                Environmental Science Associates<br /><a href='mailto:{_nebulaConfiguration.LeadOrganizationEmail}'>{_nebulaConfiguration.LeadOrganizationEmail}</a><a href='https://esassoc.com'>https://esassoc.com</a>";

            var mailMessage = new MailMessage
            {
                Subject = $"Invitation to the Smart Watershed Network Platform",
                Body = $"Hello,<br /><br />{messageBody}",
            };

            mailMessage.To.Add(user.Email);
            return mailMessage;
        }

        private async Task SendEmailMessage(SitkaSmtpClientService smtpClient, MailMessage mailMessage)
        {
            mailMessage.IsBodyHtml = true;
            mailMessage.From = smtpClient.GetDefaultEmailFrom();
            mailMessage.ReplyToList.Add(!String.IsNullOrWhiteSpace(_nebulaConfiguration.LeadOrganizationEmail) ? _nebulaConfiguration.LeadOrganizationEmail : "donotreply@sitkatech.com");
            await smtpClient.Send(mailMessage);
        }
    }
}
