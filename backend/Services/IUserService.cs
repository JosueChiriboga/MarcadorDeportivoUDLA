using MarcadorUdla.Backend.Models;

namespace MarcadorUdla.Backend.Services
{
    public interface IUserService
    {
        User? ValidateCredentials(string username, string password, string role);
        List<User> GetUsersByRole(string role);
    }
}
