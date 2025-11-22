using Microsoft.AspNetCore.SignalR;
using MarcadorUdla.Models;

namespace MarcadorUdla.Hubs;

public class MarcadorHub : Hub
{
    // Método para que el juez envíe actualizaciones en tiempo real
    public async Task ActualizarEstadoJuego(EstadoJuego estado)
    {
        // Enviar a todos los clientes conectados (visualizadores)
        await Clients.All.SendAsync("EstadoJuegoActualizado", estado);
    }

    // Método para actualizar puntos
    public async Task ActualizarPuntos(int partidoId, string equipo, int puntos)
    {
        await Clients.All.SendAsync("PuntosActualizados", partidoId, equipo, puntos);
    }

    // Método para actualizar cronómetro
    public async Task ActualizarCronometro(int partidoId, int segundos, bool activo)
    {
        await Clients.All.SendAsync("CronometroActualizado", partidoId, segundos, activo);
    }

    // Método para cambio de cancha
    public async Task CambioCancha(int partidoId)
    {
        await Clients.All.SendAsync("CambioCanchaRealizado", partidoId);
    }

    // Métodos de conexión
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
        Console.WriteLine($"Cliente conectado: {Context.ConnectionId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
        Console.WriteLine($"Cliente desconectado: {Context.ConnectionId}");
    }
}
