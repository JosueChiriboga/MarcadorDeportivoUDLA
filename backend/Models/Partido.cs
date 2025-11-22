namespace MarcadorUdla.Models;

public class Partido
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public required string Deporte { get; set; } = "Voleibol"; // Por ahora solo voleibol
    public required string Estado { get; set; } = "Programado"; // Programado, En Juego, Finalizado
    
    // Equipos
    public int UniversidadLocalId { get; set; }
    public Universidad? UniversidadLocal { get; set; }
    
    public int UniversidadVisitanteId { get; set; }
    public Universidad? UniversidadVisitante { get; set; }
    
    // Juez asignado
    public string? JuezUsername { get; set; } // Username del juez asignado
    
    // Relaciones
    public ICollection<SetPartido> Sets { get; set; } = new List<SetPartido>();
    public ICollection<EventoPartido> Eventos { get; set; } = new List<EventoPartido>();
}
