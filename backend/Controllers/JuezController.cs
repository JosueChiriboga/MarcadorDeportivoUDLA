using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MarcadorUdla.Data;
using MarcadorUdla.Hubs;
using MarcadorUdla.Models;

namespace MarcadorUdla.Controllers;

[Authorize(Roles = "Juez")]
[Route("api/[controller]")]
[ApiController]
public class JuezController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<MarcadorHub> _hubContext;

    public JuezController(ApplicationDbContext context, IHubContext<MarcadorHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // Obtener partidos asignados al juez
    [HttpGet("mis-partidos")]
    public async Task<IActionResult> GetMisPartidos()
    {
        var username = User.Identity?.Name;
        Console.WriteLine($"[DEBUG] Username del juez logueado: '{username}'");
        
        var todosLosPartidos = await _context.Partidos.ToListAsync();
        Console.WriteLine($"[DEBUG] Total de partidos en BD: {todosLosPartidos.Count}");
        
        foreach (var p in todosLosPartidos)
        {
            Console.WriteLine($"[DEBUG] Partido {p.Id}: JuezUsername='{p.JuezUsername}'");
        }
        
        var partidos = await _context.Partidos
            .Include(p => p.UniversidadLocal)
            .Include(p => p.UniversidadVisitante)
            .Include(p => p.Sets)
            .Where(p => p.JuezUsername == username)
            .ToListAsync();

        Console.WriteLine($"[DEBUG] Partidos filtrados para '{username}': {partidos.Count}");
        return Ok(partidos);
    }

    // Obtener estado actual de un partido
    [HttpGet("partidos/{id}/estado")]
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
            SetActual = setActual?.NumeroSet ?? 1,
            PuntosLocal = setActual?.PuntosLocal ?? 0,
            PuntosVisitante = setActual?.PuntosVisitante ?? 0,
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

    // Iniciar partido
    [HttpPost("partidos/{id}/iniciar")]
    public async Task<IActionResult> IniciarPartido(int id)
    {
        var partido = await _context.Partidos.FindAsync(id);
        if (partido == null) return NotFound();

        partido.Estado = "En Juego";
        
        // Crear primer set si no existe
        if (!await _context.Sets.AnyAsync(s => s.PartidoId == id))
        {
            _context.Sets.Add(new SetPartido
            {
                PartidoId = id,
                NumeroSet = 1,
                PuntosLocal = 0,
                PuntosVisitante = 0,
                Finalizado = false
            });
        }

        await _context.SaveChangesAsync();
        return Ok(partido);
    }

    // Actualizar puntos
    [HttpPost("partidos/{id}/puntos")]
    public async Task<IActionResult> ActualizarPuntos(int id, [FromBody] ActualizarPuntosRequest request)
    {
        var setActual = await _context.Sets
            .Where(s => s.PartidoId == id && !s.Finalizado)
            .FirstOrDefaultAsync();

        if (setActual == null) return NotFound("No hay set activo");

        // Actualizar puntos
        if (request.Equipo == "Local")
            setActual.PuntosLocal = request.Puntos;
        else if (request.Equipo == "Visitante")
            setActual.PuntosVisitante = request.Puntos;

        // Verificar si el set termina (voleibol: 25 puntos con diferencia de 2)
        if ((setActual.PuntosLocal >= 25 || setActual.PuntosVisitante >= 25) &&
            Math.Abs(setActual.PuntosLocal - setActual.PuntosVisitante) >= 2)
        {
            setActual.Finalizado = true;
            setActual.Ganador = setActual.PuntosLocal > setActual.PuntosVisitante ? "Local" : "Visitante";

            // Verificar si el partido termina (mejor de 5 sets)
            var setsGanadosLocal = await _context.Sets
                .Where(s => s.PartidoId == id && s.Finalizado && s.Ganador == "Local")
                .CountAsync() + (setActual.Ganador == "Local" ? 1 : 0);

            var setsGanadosVisitante = await _context.Sets
                .Where(s => s.PartidoId == id && s.Finalizado && s.Ganador == "Visitante")
                .CountAsync() + (setActual.Ganador == "Visitante" ? 1 : 0);

            if (setsGanadosLocal == 3 || setsGanadosVisitante == 3)
            {
                // Partido terminado
                var partido = await _context.Partidos.FindAsync(id);
                if (partido != null)
                    partido.Estado = "Finalizado";
            }
            else if (setActual.NumeroSet < 5)
            {
                // Crear siguiente set
                _context.Sets.Add(new SetPartido
                {
                    PartidoId = id,
                    NumeroSet = setActual.NumeroSet + 1,
                    PuntosLocal = 0,
                    PuntosVisitante = 0,
                    Finalizado = false
                });
            }
        }

        await _context.SaveChangesAsync();

        // Enviar actualización en tiempo real
        var estadoActualizado = await GetEstadoCompleto(id);
        await _hubContext.Clients.All.SendAsync("EstadoJuegoActualizado", estadoActualizado);

        return Ok(estadoActualizado);
    }

    // Registrar evento (falta, cambio cancha, etc.)
    [HttpPost("partidos/{id}/eventos")]
    public async Task<IActionResult> RegistrarEvento(int id, [FromBody] EventoPartido evento)
    {
        evento.PartidoId = id;
        evento.Timestamp = DateTime.UtcNow;
        
        _context.Eventos.Add(evento);
        await _context.SaveChangesAsync();

        // Enviar actualización si es cambio de cancha
        if (evento.TipoEvento == "CambioCancha")
        {
            await _hubContext.Clients.All.SendAsync("CambioCanchaRealizado", id);
        }

        return Ok(evento);
    }

    // Actualizar cronómetro
    [HttpPost("partidos/{id}/cronometro")]
    public async Task<IActionResult> ActualizarCronometro(int id, [FromBody] CronometroRequest request)
    {
        await _hubContext.Clients.All.SendAsync("CronometroActualizado", id, request.Segundos, request.Activo);
        return Ok();
    }

    private async Task<EstadoJuego> GetEstadoCompleto(int partidoId)
    {
        var partido = await _context.Partidos
            .Include(p => p.UniversidadLocal)
            .Include(p => p.UniversidadVisitante)
            .Include(p => p.Sets)
            .FirstOrDefaultAsync(p => p.Id == partidoId);

        if (partido == null) return new EstadoJuego();

        var sets = partido.Sets.OrderBy(s => s.NumeroSet).ToList();
        var setActual = sets.LastOrDefault(s => !s.Finalizado) ?? sets.LastOrDefault();

        return new EstadoJuego
        {
            PartidoId = partido.Id,
            SetActual = setActual?.NumeroSet ?? 1,
            PuntosLocal = setActual?.PuntosLocal ?? 0,
            PuntosVisitante = setActual?.PuntosVisitante ?? 0,
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
    }
}

public record ActualizarPuntosRequest(string Equipo, int Puntos);
public record CronometroRequest(int Segundos, bool Activo);
