namespace MarcadorUdla.Models;

public class Jugador
{
    public int Id { get; set; }
    public required string Nombre { get; set; }
    public required string Apellido { get; set; }
    public int? NumeroCamiseta { get; set; }
    public string? Posicion { get; set; }
    
    // Relación con Universidad
    public int UniversidadId { get; set; }
    public Universidad? Universidad { get; set; }
}
