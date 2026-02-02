import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EstadoJuego, Partido } from '../models/models';
import { SignalRService } from '../services/signalr.service';

@Component({
  selector: 'app-juez',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="juez-container">
      <!-- VISTA DE TABLA CRUD -->
      <div *ngIf="!partidoActivo" class="partido-crud">
        <header class="crud-header">
          <h1>Gestión de Partidos</h1>
          <div class="user-info">
            <span>Juez: {{username}}</span>
            <button class="btn-logout" (click)="logout()">Cerrar Sesión</button>
          </div>
        </header>

        <div class="section-header">
          <h2>Todos los Partidos</h2>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Universidad Local</th>
              <th>Universidad Visitante</th>
              <th>Estado</th>
              <th>Juez Asignado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="misPartidos.length === 0">
              <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                No hay partidos registrados
              </td>
            </tr>
            <tr *ngFor="let partido of misPartidos">
              <td>{{formatDate(partido.fechaHora)}}</td>
              <td>{{partido.universidadLocal?.nombre || 'N/A'}}</td>
              <td>{{partido.universidadVisitante?.nombre || 'N/A'}}</td>
              <td><span [class]="'badge ' + partido.estado.toLowerCase()">{{partido.estado}}</span></td>
              <td>{{partido.juezUsername || 'Sin asignar'}}</td>
              <td>
                <button class="btn-control" (click)="selectPartido(partido)">Controlar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CONTROL DEL PARTIDO -->
      <div *ngIf="partidoActivo && !estado" class="loading-panel">
        <h2>Cargando partido...</h2>
        <p>Por favor espere</p>
      </div>

      <div *ngIf="partidoActivo && estado" class="control-panel">
        <div class="panel-header">
          <h2>{{estado.universidadLocalNombre}} vs {{estado.universidadVisitanteNombre}}</h2>
          <button class="btn-back" (click)="volverALista()">← Volver</button>
        </div>

        <!-- MARCADOR PRINCIPAL -->
        <div class="scoreboard">
          <div class="team">
            <h3>{{estado.universidadLocalNombre}}</h3>
            <div class="score">{{estado.puntosLocal}}</div>
            <div class="sets">Sets: {{estado.setsLocal}}</div>
            <div class="controls">
              <button class="btn-point" (click)="sumarPunto('Local')">+1 Punto</button>
              <button class="btn-minus" (click)="restarPunto('Local')">-1</button>
            </div>
          </div>

          <div class="center-info">
            <div class="set-actual">SET {{estado.setActual}}</div>
            <div class="cronometro">
              <div class="tiempo">{{formatTiempo(cronometro)}}</div>
              <div class="cronometro-btns">
                <button *ngIf="!cronometroActivo" (click)="iniciarCronometro()">▶ Iniciar</button>
                <button *ngIf="cronometroActivo" (click)="pausarCronometro()">⏸ Pausar</button>
                <button (click)="reiniciarCronometro()">↻ Reiniciar</button>
              </div>
            </div>
          </div>

          <div class="team">
            <h3>{{estado.universidadVisitanteNombre}}</h3>
            <div class="score">{{estado.puntosVisitante}}</div>
            <div class="sets">Sets: {{estado.setsVisitante}}</div>
            <div class="controls">
              <button class="btn-point" (click)="sumarPunto('Visitante')">+1 Punto</button>
              <button class="btn-minus" (click)="restarPunto('Visitante')">-1</button>
            </div>
          </div>
        </div>

        <!-- CONTROLES ADICIONALES -->
        <div class="additional-controls">
          <button class="btn-cambio-cancha" (click)="cambioCancha()">🔄 Cambio de Cancha</button>
          <button class="btn-sirve-local" [class.active]="equipoSirve === 'Local'" (click)="cambiarSaque('Local')">
            Sirve Local
          </button>
          <button class="btn-sirve-visitante" [class.active]="equipoSirve === 'Visitante'" (click)="cambiarSaque('Visitante')">
            Sirve Visitante
          </button>
        </div>

        <!-- HISTORIAL DE SETS -->
        <div class="sets-history">
          <div class="sets-grid">
            <div *ngFor="let set of estado.sets" class="set-box" [class.active]="set.numero === estado.setActual">
              <div class="set-score">{{set.puntosLocal}} - {{set.puntosVisitante}}</div>
              <div class="set-num">SET {{set.numero}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .juez-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 20px;
    }

    /* CRUD TABLE STYLES */
    .partido-crud {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    .crud-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }

    .crud-header h1 {
      color: var(--red-1, #be0e2c);
      margin: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .user-info span {
      color: #333;
      font-weight: 600;
    }

    .section-header {
      margin-bottom: 20px;
    }

    .section-header h2 {
      color: #333;
      font-size: 1.5rem;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .data-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .data-table th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }

    .data-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }

    .data-table tbody tr:hover {
      background: #f8f9fa;
    }

    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge.programado {
      background: #ffc107;
      color: #000;
    }

    .badge.en {
      background: #28a745;
      color: white;
    }

    .badge.finalizado {
      background: #6c757d;
      color: white;
    }

    .btn-control {
      background: var(--red-1, #be0e2c);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-control:hover {
      background: var(--red-2, #8a0b1d);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(190,14,44,0.3);
    }

    .btn-logout {
      background: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-logout:hover {
      background: #5a6268;
    }

    /* LOADING PANEL */
    .loading-panel {
      max-width: 800px;
      margin: 100px auto;
      background: white;
      border-radius: 15px;
      padding: 60px 30px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    .loading-panel h2 {
      color: var(--red-1, #be0e2c);
      margin-bottom: 20px;
      font-size: 2rem;
    }

    .loading-panel p {
      color: #666;
      font-size: 1.2rem;
    }

    /* CONTROL PANEL STYLES */
    .control-panel {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      padding: 30px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .panel-header h2 {
      color: var(--red-1, #be0e2c);
      margin: 0;
    }

    .scoreboard {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 30px;
      margin-bottom: 30px;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      color: white;
    }

    .team {
      text-align: center;
    }

    .team h3 {
      margin: 0 0 15px 0;
      font-size: 1.5rem;
    }

    .score {
      font-size: 5rem;
      font-weight: bold;
      margin: 20px 0;
    }

    .sets {
      font-size: 1.2rem;
      margin-bottom: 20px;
    }

    .controls {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .btn-point {
      background: #28a745;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
    }

    .btn-minus {
      background: #dc3545;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
    }

    .center-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 30px;
    }

    .set-actual {
      font-size: 2rem;
      font-weight: bold;
      background: rgba(255,255,255,0.2);
      padding: 15px 40px;
      border-radius: 10px;
    }

    .cronometro {
      text-align: center;
    }

    .tiempo {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .cronometro-btns {
      display: flex;
      gap: 10px;
    }

    .cronometro-btns button {
      background: white;
      color: #667eea;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }

    .additional-controls {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-bottom: 30px;
    }

    .additional-controls button {
      padding: 15px 30px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-cambio-cancha {
      background: #ff9800;
      color: white;
    }

    .btn-sirve-local, .btn-sirve-visitante {
      background: #e0e0e0;
      color: #333;
    }

    .btn-sirve-local.active, .btn-sirve-visitante.active {
      background: var(--red-1, #be0e2c);
      color: white;
    }

    .sets-history {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
    }

    .sets-history h4 {
      margin-top: 0;
      color: #333;
    }

    .sets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
    }

    .set-box {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border: 2px solid #ddd;
      text-align: center;
    }

    .set-box.active {
      border-color: var(--red-1, #be0e2c);
      background: #fff5f7;
    }

    .set-num {
      font-weight: bold;
      margin-bottom: 8px;
    }

    .set-score {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--red-1, #be0e2c);
      margin: 8px 0;
    }

    .btn-logout, .btn-back {
      background: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
    }
  `]
})
export class JuezComponent implements OnInit, OnDestroy {
  username = localStorage.getItem('username') || 'Juez';
  misPartidos: Partido[] = [];
  partidoActivo: Partido | null = null;
  estado: EstadoJuego | null = null;
  cronometro = 0;
  cronometroActivo = false;
  cronometroInterval: any;
  equipoSirve: 'Local' | 'Visitante' | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private signalR: SignalRService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Verificar que hay token antes de cargar datos
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token, redirigiendo a login...');
      this.router.navigate(['/']);
      return;
    }

    // Pequeño delay para asegurar que el interceptor esté listo
    setTimeout(() => {
      this.loadMisPartidos();
      this.signalR.startConnection().then(() => {
        this.signalR.estadoJuego$.subscribe(estado => {
          if (this.partidoActivo && estado && estado.partidoId === this.partidoActivo.id) {
            this.estado = estado;
            this.cdr.detectChanges();
          }
        });
      });
    }, 100);
  }

  ngOnDestroy() {
    if (this.cronometroInterval) {
      clearInterval(this.cronometroInterval);
    }
    this.signalR.stopConnection();
  }

  loadMisPartidos() {
    console.log('[JUEZ] Cargando partidos...');
    this.http.get<Partido[]>('/api/juez/mis-partidos').subscribe({
      next: data => {
        console.log('[JUEZ] Partidos recibidos:', data);
        console.log('[JUEZ] Cantidad de partidos:', data.length);
        this.misPartidos = data;
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('[JUEZ] Array actualizado, length:', this.misPartidos.length);
      },
      error: err => {
        console.error('[JUEZ] Error loading partidos:', err);
        console.error('[JUEZ] Status:', err.status);
        console.error('[JUEZ] Message:', err.message);
        if (err.status === 401) {
          alert('Sesión expirada. Por favor inicie sesión nuevamente.');
          this.logout();
        } else {
          alert('Error al cargar partidos: ' + err.message);
        }
      }
    });
  }

  selectPartido(partido: Partido) {
    console.log('[JUEZ] Seleccionando partido:', partido);
    this.partidoActivo = partido;

    // Si está programado, iniciarlo
    if (partido.estado === 'Programado') {
      console.log('[JUEZ] Iniciando partido...');
      this.http.post(`/api/juez/partidos/${partido.id}/iniciar`, {}).subscribe({
        next: () => {
          console.log('[JUEZ] Partido iniciado, cargando estado...');
          this.loadEstadoPartido(partido.id);
        },
        error: err => {
          console.error('[JUEZ] Error al iniciar partido:', err);
          alert('Error al iniciar partido');
        }
      });
    } else {
      console.log('[JUEZ] Cargando estado del partido...');
      this.loadEstadoPartido(partido.id);
    }
  }

  loadEstadoPartido(id: number) {
    this.http.get<EstadoJuego>(`/api/juez/partidos/${id}/estado`).subscribe({
      next: data => {
        console.log('[JUEZ] Estado del partido recibido:', data);
        this.estado = data;
        this.cdr.detectChanges();
        console.log('[JUEZ] Estado actualizado en la vista');
      },
      error: err => {
        console.error('[JUEZ] Error loading estado:', err);
        alert('Error al cargar el estado del partido');
      }
    });
  }

  sumarPunto(equipo: 'Local' | 'Visitante') {
    if (!this.estado) return;

    const puntos = equipo === 'Local' ? this.estado.puntosLocal + 1 : this.estado.puntosVisitante + 1;

    this.http.post(`/api/juez/partidos/${this.estado.partidoId}/puntos`, {
      equipo,
      puntos
    }).subscribe({
      next: (nuevoEstado: any) => {
        this.estado = nuevoEstado;
      }
    });
  }

  restarPunto(equipo: 'Local' | 'Visitante') {
    if (!this.estado) return;

    const puntosActuales = equipo === 'Local' ? this.estado.puntosLocal : this.estado.puntosVisitante;
    if (puntosActuales > 0) {
      const puntos = puntosActuales - 1;

      this.http.post(`/api/juez/partidos/${this.estado.partidoId}/puntos`, {
        equipo,
        puntos
      }).subscribe({
        next: (nuevoEstado: any) => {
          this.estado = nuevoEstado;
        }
      });
    }
  }

  iniciarCronometro() {
    this.cronometroActivo = true;
    this.cronometroInterval = setInterval(() => {
      this.cronometro++;
      this.actualizarCronometro();
      // Emitir EstadoJuegoActualizado por SignalR
      if (this.estado) {
        this.estado.tiempoCronometro = this.cronometro;
        this.estado.cronometroActivo = this.cronometroActivo;
        this.signalR.actualizarEstadoJuego(this.estado);
      }
    }, 1000);
  }

  pausarCronometro() {
    this.cronometroActivo = false;
    if (this.cronometroInterval) {
      clearInterval(this.cronometroInterval);
    }
    this.actualizarCronometro();
    // Emitir EstadoJuegoActualizado por SignalR
    if (this.estado) {
      this.estado.tiempoCronometro = this.cronometro;
      this.estado.cronometroActivo = this.cronometroActivo;
      this.signalR.actualizarEstadoJuego(this.estado);
    }
  }

  reiniciarCronometro() {
    this.cronometro = 0;
    this.cronometroActivo = false;
    if (this.cronometroInterval) {
      clearInterval(this.cronometroInterval);
    }
    this.actualizarCronometro();
    // Emitir EstadoJuegoActualizado por SignalR
    if (this.estado) {
      this.estado.tiempoCronometro = this.cronometro;
      this.estado.cronometroActivo = this.cronometroActivo;
      this.signalR.actualizarEstadoJuego(this.estado);
    }
  }

  actualizarCronometro() {
    if (!this.estado) return;

    this.http.post(`/api/juez/partidos/${this.estado.partidoId}/cronometro`, {
      segundos: this.cronometro,
      activo: this.cronometroActivo
    }).subscribe();
  }

  cambioCancha() {
    if (!this.estado) return;

    // Cambiar quién sirve SIN sumar puntos
    this.equipoSirve = this.equipoSirve === 'Local' ? 'Visitante' : 'Local';

    // Registrar el evento
    this.http.post(`/api/juez/partidos/${this.estado.partidoId}/eventos`, {
      tipoEvento: 'CambioCancha',
      descripcion: `Cambio de cancha - Ahora sirve ${this.equipoSirve}`
    }).subscribe({
      next: () => {
        console.log('[JUEZ] Cambio de cancha registrado. Sirve:', this.equipoSirve);
      }
    });
  }

  cambiarSaque(equipo: 'Local' | 'Visitante') {
    this.equipoSirve = equipo;
  }

  formatTiempo(segundos: number): string {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-EC');
  }

  volverALista() {
    this.partidoActivo = null;
    this.estado = null;
    this.cronometro = 0;
    this.pausarCronometro();
    this.loadMisPartidos();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
