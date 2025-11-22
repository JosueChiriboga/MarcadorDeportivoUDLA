namespace MarcadorUdla.Models;

// Modelo para el estado en tiempo real del partido
public class EstadoJuego
{
    public int PartidoId { get; set; }
    public int SetActual { get; set; } = 1;
    public int PuntosLocal { get; set; }
    public int PuntosVisitante { get; set; }
    public int SetsLocal { get; set; }
    public int SetsVisitante { get; set; }
    public bool CronometroActivo { get; set; }
    public int TiempoCronometro { get; set; } // En segundos
    public string? EquipoSirve { get; set; } // "Local" o "Visitante"
    public bool CambioCanchaPendiente { get; set; }
    public string UniversidadLocalNombre { get; set; } = string.Empty;
    public string UniversidadVisitanteNombre { get; set; } = string.Empty;
    public string? UniversidadLocalLogo { get; set; }
    public string? UniversidadVisitanteLogo { get; set; }
    
    // Historial de sets
    public List<SetInfo> Sets { get; set; } = new();
}

public class SetInfo
{
    public int Numero { get; set; }
    public int PuntosLocal { get; set; }
    public int PuntosVisitante { get; set; }
    public bool Finalizado { get; set; }
}
