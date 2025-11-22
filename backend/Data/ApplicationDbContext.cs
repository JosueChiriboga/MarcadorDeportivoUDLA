using Microsoft.EntityFrameworkCore;

namespace MarcadorUdla.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Models.Universidad> Universidades { get; set; }
    public DbSet<Models.Jugador> Jugadores { get; set; }
    public DbSet<Models.Partido> Partidos { get; set; }
    public DbSet<Models.SetPartido> Sets { get; set; }
    public DbSet<Models.EventoPartido> Eventos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuración de Universidad
        modelBuilder.Entity<Models.Universidad>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Nombre).IsRequired().HasMaxLength(200);
            entity.HasIndex(u => u.Nombre);
        });

        // Configuración de Jugador
        modelBuilder.Entity<Models.Jugador>(entity =>
        {
            entity.HasKey(j => j.Id);
            entity.Property(j => j.Nombre).IsRequired().HasMaxLength(100);
            entity.Property(j => j.Apellido).IsRequired().HasMaxLength(100);
            
            entity.HasOne(j => j.Universidad)
                .WithMany(u => u.Jugadores)
                .HasForeignKey(j => j.UniversidadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuración de Partido
        modelBuilder.Entity<Models.Partido>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Deporte).IsRequired().HasMaxLength(50);
            entity.Property(p => p.Estado).IsRequired().HasMaxLength(50);
            
            // Relación con UniversidadLocal
            entity.HasOne(p => p.UniversidadLocal)
                .WithMany(u => u.PartidosLocal)
                .HasForeignKey(p => p.UniversidadLocalId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Relación con UniversidadVisitante
            entity.HasOne(p => p.UniversidadVisitante)
                .WithMany(u => u.PartidosVisitante)
                .HasForeignKey(p => p.UniversidadVisitanteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuración de SetPartido
        modelBuilder.Entity<Models.SetPartido>(entity =>
        {
            entity.HasKey(s => s.Id);
            
            entity.HasOne(s => s.Partido)
                .WithMany(p => p.Sets)
                .HasForeignKey(s => s.PartidoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuración de EventoPartido
        modelBuilder.Entity<Models.EventoPartido>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TipoEvento).IsRequired().HasMaxLength(50);
            
            entity.HasOne(e => e.Partido)
                .WithMany(p => p.Eventos)
                .HasForeignKey(e => e.PartidoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Datos de prueba (seed data)
        modelBuilder.Entity<Models.Universidad>().HasData(
            new Models.Universidad { Id = 1, Nombre = "Universidad de Las Américas", LogoUrl = "/logos/udla.png", FechaCreacion = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Models.Universidad { Id = 2, Nombre = "Universidad Central", LogoUrl = "/logos/central.png", FechaCreacion = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}
