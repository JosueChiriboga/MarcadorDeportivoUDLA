using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MarcadorUdla.Data;
using MarcadorUdla.Models;

namespace MarcadorUdla.Controllers;

[Authorize(Roles = "Administrador")]
[Route("api/[controller]")]
[ApiController]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    // CRUD Universidades
    [HttpGet("universidades")]
    public async Task<IActionResult> GetUniversidades()
    {
        var universidades = await _context.Universidades
            .Include(u => u.Jugadores)
            .ToListAsync();
        return Ok(universidades);
    }

    [HttpGet("universidades/{id}")]
    public async Task<IActionResult> GetUniversidad(int id)
    {
        var universidad = await _context.Universidades
            .Include(u => u.Jugadores)
            .FirstOrDefaultAsync(u => u.Id == id);
        
        if (universidad == null) return NotFound();
        return Ok(universidad);
    }

    [HttpPost("universidades")]
    public async Task<IActionResult> CreateUniversidad([FromBody] Universidad universidad)
    {
        _context.Universidades.Add(universidad);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUniversidad), new { id = universidad.Id }, universidad);
    }

    [HttpPut("universidades/{id}")]
    public async Task<IActionResult> UpdateUniversidad(int id, [FromBody] Universidad universidad)
    {
        if (id != universidad.Id) return BadRequest();

        _context.Entry(universidad).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("universidades/{id}")]
    public async Task<IActionResult> DeleteUniversidad(int id)
    {
        var universidad = await _context.Universidades.FindAsync(id);
        if (universidad == null) return NotFound();

        _context.Universidades.Remove(universidad);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // CRUD Jugadores
    [HttpGet("universidades/{universidadId}/jugadores")]
    public async Task<IActionResult> GetJugadores(int universidadId)
    {
        var jugadores = await _context.Jugadores
            .Where(j => j.UniversidadId == universidadId)
            .ToListAsync();
        return Ok(jugadores);
    }

    [HttpPost("jugadores")]
    public async Task<IActionResult> CreateJugador([FromBody] Jugador jugador)
    {
        _context.Jugadores.Add(jugador);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetJugadores), new { universidadId = jugador.UniversidadId }, jugador);
    }

    [HttpPut("jugadores/{id}")]
    public async Task<IActionResult> UpdateJugador(int id, [FromBody] Jugador jugador)
    {
        if (id != jugador.Id) return BadRequest();

        _context.Entry(jugador).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("jugadores/{id}")]
    public async Task<IActionResult> DeleteJugador(int id)
    {
        var jugador = await _context.Jugadores.FindAsync(id);
        if (jugador == null) return NotFound();

        _context.Jugadores.Remove(jugador);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // CRUD Partidos
    [HttpGet("partidos")]
    public async Task<IActionResult> GetPartidos()
    {
        var partidos = await _context.Partidos
            .Include(p => p.UniversidadLocal)
            .Include(p => p.UniversidadVisitante)
            .Include(p => p.Sets)
            .ToListAsync();
        return Ok(partidos);
    }

    [HttpPost("partidos")]
    public async Task<IActionResult> CreatePartido([FromBody] Partido partido)
    {
        partido.Estado = "Programado";
        _context.Partidos.Add(partido);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPartidos), new { id = partido.Id }, partido);
    }

    [HttpPut("partidos/{id}")]
    public async Task<IActionResult> UpdatePartido(int id, [FromBody] UpdatePartidoRequest request)
    {
        var partido = await _context.Partidos.FindAsync(id);
        if (partido == null) return NotFound();

        partido.UniversidadLocalId = request.UniversidadLocalId;
        partido.UniversidadVisitanteId = request.UniversidadVisitanteId;
        partido.FechaHora = request.FechaHora;
        partido.JuezUsername = request.JuezUsername;
        partido.Deporte = request.Deporte;
        partido.Estado = request.Estado;

        await _context.SaveChangesAsync();
        return Ok(partido);
    }

    [HttpDelete("partidos/{id}")]
    public async Task<IActionResult> DeletePartido(int id)
    {
        var partido = await _context.Partidos.FindAsync(id);
        if (partido == null) return NotFound();

        _context.Partidos.Remove(partido);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("partidos/{id}/asignar-juez")]
    public async Task<IActionResult> AsignarJuez(int id, [FromBody] AsignarJuezRequest request)
    {
        var partido = await _context.Partidos.FindAsync(id);
        if (partido == null) return NotFound();

        partido.JuezUsername = request.JuezUsername;
        await _context.SaveChangesAsync();
        return Ok(partido);
    }
}

public record AsignarJuezRequest(string JuezUsername);
public record UpdatePartidoRequest(
    int UniversidadLocalId, 
    int UniversidadVisitanteId, 
    DateTime FechaHora, 
    string? JuezUsername, 
    string Deporte, 
    string Estado
);
