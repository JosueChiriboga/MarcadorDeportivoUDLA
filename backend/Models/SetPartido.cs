namespace MarcadorUdla.Models;

public class SetPartido
{
    public int Id { get; set; }
    public int PartidoId { get; set; }
    public Partido? Partido { get; set; }
    
    public int NumeroSet { get; set; } // 1, 2, 3, 4, 5
    public int PuntosLocal { get; set; }
    public int PuntosVisitante { get; set; }
    public bool Finalizado { get; set; }
    public string? Ganador { get; set; } // "Local" o "Visitante"
}
