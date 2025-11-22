namespace MarcadorUdla.Backend.Models
{
    public class User
    {
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty; // in-memory hashed password (demo)
        public string Role { get; set; } = string.Empty;
    }
}
