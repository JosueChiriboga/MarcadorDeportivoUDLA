namespace MarcadorUdla.Models;

public class Universidad
{
    public int Id { get; set; }
    public required string Nombre { get; set; }
    public string? LogoUrl { get; set; } // URL o path del logo
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    
    // Relaciones
    public ICollection<Jugador> Jugadores { get; set; } = new List<Jugador>();
    public ICollection<Partido> PartidosLocal { get; set; } = new List<Partido>();
    public ICollection<Partido> PartidosVisitante { get; set; } = new List<Partido>();
}
