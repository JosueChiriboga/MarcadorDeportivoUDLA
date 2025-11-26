using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MarcadorUdla.Data;
using MarcadorUdla.Models;

namespace MarcadorUdla.Controllers;

[Route("api/[controller]")]
[ApiController]
public class VisualizadorController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VisualizadorController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Obtener todos los partidos
    [HttpGet("partidos")]
    public async Task<IActionResult> GetPartidos()
    {
        var partidos = await _context.Partidos
            .Include(p => p.UniversidadLocal)
            .Include(p => p.UniversidadVisitante)
            .Include(p => p.Sets)
            .OrderByDescending(p => p.FechaHora)
            .ToListAsync();

        Console.WriteLine($"[VISUALIZADOR] Devolviendo {partidos.Count} partidos");
        return Ok(partidos);
    }

    // Obtener partidos en juego
    [HttpGet("partidos-activos")]
    public async Task<IActionResult> GetPartidosActivos()
    {
        var partidos = await _context.Partidos
            .Include(p => p.UniversidadLocal)
            .Include(p => p.UniversidadVisitante)
            .Include(p => p.Sets)
            .Where(p => p.Estado == "En Juego")
            .ToListAsync();

        return Ok(partidos);
    }

    // Obtener estado de un partido específico
    [HttpGet("partidos/{id}")]
    public async Task<IActionResult> GetEstadoPartido(int id)
    {
        var partido = await _context.Partidos
            .Include(p => p.UniversidadLocal)
            .Include(p => p.UniversidadVisitante)
            .Include(p => p.Sets)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (partido == null) return NotFound();

        var sets = partido.Sets.OrderBy(s => s.NumeroSet).ToList();
        var setActual = sets.LastOrDefault(s => !s.Finalizado);

        var estado = new EstadoJuego
        {
            PartidoId = partido.Id,
            SetActual = setActual?.NumeroSet ?? (sets.Any() ? sets.Last().NumeroSet : 1),
            PuntosLocal = setActual?.PuntosLocal ?? (sets.Any() ? sets.Last().PuntosLocal : 0),
            PuntosVisitante = setActual?.PuntosVisitante ?? (sets.Any() ? sets.Last().PuntosVisitante : 0),
            SetsLocal = sets.Count(s => s.Finalizado && s.Ganador == "Local"),
            SetsVisitante = sets.Count(s => s.Finalizado && s.Ganador == "Visitante"),
            UniversidadLocalNombre = partido.UniversidadLocal?.Nombre ?? "",
            UniversidadVisitanteNombre = partido.UniversidadVisitante?.Nombre ?? "",
            UniversidadLocalLogo = partido.UniversidadLocal?.LogoUrl,
            UniversidadVisitanteLogo = partido.UniversidadVisitante?.LogoUrl,
            Sets = sets.Select(s => new SetInfo
            {
                Numero = s.NumeroSet,
                PuntosLocal = s.PuntosLocal,
                PuntosVisitante = s.PuntosVisitante,
                Finalizado = s.Finalizado
            }).ToList()
        };

        return Ok(estado);
    }
}
