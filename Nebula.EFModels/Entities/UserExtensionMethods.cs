using Nebula.Models.DataTransferObjects;

namespace Nebula.EFModels.Entities
{
    public static partial class UserExtensionMethods
    {
        static partial void DoCustomMappings(User user, UserDto userDto)
        {
            userDto.FullName = user.FullName;
            userDto.FullNameLastFirst = user.FullNameLastFirst;
        }
    }
}