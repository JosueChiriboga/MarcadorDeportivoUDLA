namespace MarcadorUdla.Models;

public class EventoPartido
{
    public int Id { get; set; }
    public int PartidoId { get; set; }
    public Partido? Partido { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public required string TipoEvento { get; set; } // "Punto", "Falta", "CambioCancha", "InicioSet", "FinSet", etc.
    public string? Equipo { get; set; } // "Local" o "Visitante"
    public string? Descripcion { get; set; }
    public string? Datos { get; set; } // JSON con datos adicionales
}
