using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MarcadorUdla.Data;
using MarcadorUdla.Models;
using MarcadorUdla.Backend.Services;

namespace MarcadorUdla.Controllers;

[Authorize(Roles = "Administrador")]
[Route("api/[controller]")]
[ApiController]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IUserService _userService;

    public AdminController(ApplicationDbContext context, IUserService userService)
    {
        _context = context;
        _userService = userService;
    }

    // Obtener lista de jueces
    [HttpGet("jueces")]
    public IActionResult GetJueces()
    {
        var jueces = _userService.GetUsersByRole("Juez");
        return Ok(jueces.Select(j => new { j.Username, j.Role }));
    }

    // CRUD Universidades
    [HttpGet("universidades")]
    public async Task<IActionResult> GetUniversidades()
    {
        Console.WriteLine("[ADMIN] GET /api/admin/universidades");
        var universidades = await _context.Universidades
            .Include(u => u.Jugadores)
            .ToListAsync();
        Console.WriteLine($"[ADMIN] Devolviendo {universidades.Count} universidades");
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
    public async Task<IActionResult> CreateUniversidad([FromForm] string nombre, [FromForm] string? fechaCreacion, [FromForm] IFormFile? logo)
    {
        var universidad = new Universidad
        {
            Nombre = nombre,
            FechaCreacion = string.IsNullOrEmpty(fechaCreacion) ? DateTime.UtcNow : DateTime.Parse(fechaCreacion)
        };

        // Si se subió un logo, guardarlo
        if (logo != null && logo.Length > 0)
        {
            // Validar que sea PNG
            if (!logo.ContentType.Equals("image/png", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Solo se permiten archivos PNG");
            }

            // Crear directorio si no existe
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "logos");
            Directory.CreateDirectory(uploadsPath);

            // Generar nombre único
            var fileName = $"{Guid.NewGuid()}.png";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Guardar archivo
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await logo.CopyToAsync(stream);
            }

            // Guardar URL relativa en la base de datos
            universidad.LogoUrl = $"/uploads/logos/{fileName}";
        }

        _context.Universidades.Add(universidad);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetUniversidad), new { id = universidad.Id }, universidad);
    }

    [HttpPut("universidades/{id}")]
    public async Task<IActionResult> UpdateUniversidad(int id, [FromForm] string nombre, [FromForm] string? fechaCreacion, [FromForm] IFormFile? logo)
    {
        var universidad = await _context.Universidades.FindAsync(id);
        if (universidad == null) return NotFound();

        // Actualizar datos básicos
        universidad.Nombre = nombre;
        
        // Si se subió un nuevo logo, guardarlo
        if (logo != null && logo.Length > 0)
        {
            // Validar que sea PNG
            if (!logo.ContentType.Equals("image/png", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Solo se permiten archivos PNG");
            }

            // Eliminar logo anterior si existe
            if (!string.IsNullOrEmpty(universidad.LogoUrl))
            {
                var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", universidad.LogoUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldFilePath))
                {
                    System.IO.File.Delete(oldFilePath);
                }
            }

            // Crear directorio si no existe
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "logos");
            Directory.CreateDirectory(uploadsPath);

            // Generar nombre único
            var fileName = $"{Guid.NewGuid()}.png";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Guardar archivo
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await logo.CopyToAsync(stream);
            }

            // Actualizar URL del logo
            universidad.LogoUrl = $"/uploads/logos/{fileName}";
        }

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
        Console.WriteLine("[ADMIN] GET /api/admin/partidos");
        var partidos = await _context.Partidos
            .Include(p => p.UniversidadLocal)
            .Include(p => p.UniversidadVisitante)
            .Include(p => p.Sets)
            .ToListAsync();
        Console.WriteLine($"[ADMIN] Devolviendo {partidos.Count} partidos");
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
