using MarcadorUdla.Backend.Models;
using System.Security.Cryptography;
using System.Text;

namespace MarcadorUdla.Backend.Services
{
    // Simple in-memory user service for demo purposes.
    public class UserService : IUserService
    {
        private readonly List<User> _users;

        public UserService()
        {
            // Passwords are stored as SHA256 hashes here for demo; do NOT use this in production.
            _users = new List<User>
            {
                new User{ Username = "admin", PasswordHash = ComputeHash("adminpass"), Role = "Administrador" },
                new User{ Username = "viewer", PasswordHash = ComputeHash("viewerpass"), Role = "Visualizador" },
                new User{ Username = "juez", PasswordHash = ComputeHash("juezpass"), Role = "Juez" }
            };
        }

        public User? ValidateCredentials(string username, string password, string role)
        {
            var hash = ComputeHash(password);
            var user = _users.FirstOrDefault(u => u.Username == username && u.PasswordHash == hash && u.Role == role);
            return user;
        }

        public List<User> GetUsersByRole(string role)
        {
            return _users.Where(u => u.Role == role).ToList();
        }

        private static string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes);
        }
    }
}
