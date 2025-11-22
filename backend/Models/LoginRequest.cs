namespace MarcadorUdla.Backend.Models
{
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        // Role selected by the user: Administrator, Visualizador, Juez
        public string Role { get; set; } = string.Empty;
    }
}
