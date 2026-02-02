import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EstadoJuego, Partido } from '../models/models';
import { SignalRService } from '../services/signalr.service';

@Component({
  selector: 'app-visualizador',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- TABLA DE PARTIDOS -->
    <div class="partidos-container" *ngIf="!partidoActivo">
      <div class="header-section">
        <img src="../../assets/logos/MARCADORES UDLA ARENA-04.png" alt="UDLA" class="header-logo">
        <button (click)="logout()" class="btn-logout">Cerrar Sesión</button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Universidad Local</th>
              <th>Universidad Visitante</th>
              <th>Juez Asignado</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let partido of partidos">
              <td>{{formatDate(partido.fechaHora)}}</td>
              <td>{{partido.universidadLocal?.nombre || 'N/A'}}</td>
              <td>{{partido.universidadVisitante?.nombre || 'N/A'}}</td>
              <td>{{partido.juezUsername || 'Sin asignar'}}</td>
              <td>
                <span class="estado-badge" [class]="'estado-' + partido.estado.toLowerCase().replace(' ', '-')">
                  {{partido.estado}}
                </span>
              </td>
              <td>
                <button (click)="visualizarPartido(partido)" class="btn-visualizar">
                  Visualizar Partido
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MARCADOR FULLSCREEN -->
    <div class="scoreboard-container" *ngIf="partidoActivo && estado">
      <!-- Mensaje de fin de partida -->
      <div *ngIf="partidoActivo?.estado === 'Finalizado'" class="fin-partida-banner">
        <span>Fin de la partida</span>
      </div>
      <!-- Fondo rojo principal -->
      <div class="bg-red"></div>

      <!-- Timer Figma -->
      <div class="figma-timer-container">
        <span class="figma-timer">{{formatTiempo(estado.tiempoCronometro || 0)}}</span>
      </div>

      <!-- Números grandes Figma -->
      <div class="main-scores-figma">
        <div class="score-figma-left">
          <span class="score-figma-number">{{estado.puntosLocal}}</span>
        </div>
        <div class="score-figma-right">
          <span class="score-figma-number">{{estado.puntosVisitante}}</span>
        </div>
      </div>

      <!-- Forma decorativa inferior -->
      <div class="bottom-shape"></div>

      <!-- Trapecio negro central -->
      <div class="trapezoid"></div>

      <!-- Sección negra inferior -->
      <div class="black-section-1"></div>

      <!-- Vector decorativo -->
      <div class="vector-shape"></div>

      <!-- Círculos de sets con puntajes -->
      <ng-container *ngIf="estado.sets">
        <div *ngFor="let i of [0,1,2,3]"
             [ngClass]="{
               'circle-1': i === 0,
               'circle-2': i === 1,
               'circle-3': i === 2,
               'circle-4-red': i === 3 && (estado.sets[3]?.puntosLocal !== undefined && estado.sets[3]?.puntosVisitante !== undefined),
               'circle-white': i === 3 && !(estado.sets[3]?.puntosLocal !== undefined && estado.sets[3]?.puntosVisitante !== undefined)
             }">
          <span class="set-score-figma">
            <ng-container *ngIf="i < 3">
              {{
                (estado.sets[i]?.puntosLocal !== undefined && estado.sets[i]?.puntosVisitante !== undefined)
                  ? (estado.sets[i].puntosLocal + ' - ' + estado.sets[i].puntosVisitante)
                  : '—'
              }}
            </ng-container>
            <ng-container *ngIf="i === 3">
              {{
                (estado.sets[3]?.puntosLocal !== undefined && estado.sets[3]?.puntosVisitante !== undefined)
                  ? (estado.sets[3].puntosLocal + ' - ' + estado.sets[3].puntosVisitante)
                  : ''
              }}
            </ng-container>
          </span>
        </div>
      </ng-container>

      <!-- Sección blanca -->
      <div class="white-section"></div>

      <!-- Sección negra inferior 2 -->
      <div class="black-section-2"></div>

      <!-- Textos SET debajo de los círculos -->
      <div class="set-labels">
        <span class="set-label set-label-1">SET 1</span>
        <span class="set-label set-label-2">SET 2</span>
        <span class="set-label set-label-3">SET 3</span>
        <span class="set-label set-label-4">SET 4</span>
      </div>

      <!-- Banner superior con imagen de fondo -->
      <div class="top-banner-bg"></div>
      <div class="top-banner-overlay"></div>

      <!-- Logo UDLA -->
      <div class="logo-udla">
        <img src="../../assets/logos/MARCADORES UDLA ARENA-04.png" alt="UDLA">
      </div>

      <!-- Barra negra superior -->
      <div class="top-black-bar"></div>
    </div>
  `,
  styles: [`
    @font-face {
      font-family: 'Crossfly Expanded Display';
      src: url('/assets/fonts/CrossflyExpandedDisplay.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    .fin-partida-banner {
      position: absolute;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      background: #C8102E;
      color: #fff;
      font-size: 64px;
      font-family: 'Crossfly Expanded Display', 'Impact', sans-serif;
      font-weight: 900;
      padding: 32px 64px;
      border-radius: 32px;
      z-index: 200;
      box-shadow: 0 4px 32px rgba(0,0,0,0.25);
      text-align: center;
    }
    .set-score-figma {
      font-family: 'Crossfly Expanded Display', 'Impact', sans-serif;
      font-size: 64px;
      color: #fff;
      font-weight: 900;
      margin: 0 18px;
      line-height: 1;
      letter-spacing: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    .figma-timer, .score-figma-number {
      font-family: 'Crossfly Expanded Display', 'Impact', sans-serif !important;
    }
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .figma-timer-container {
      position: absolute;
      top: 11%;
      left: 50%;
      transform: translateX(-45%);
      z-index: 100;
      width: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
    }
    .figma-timer {
      font-family: 'Crossfly Expanded Display', 'Crossfly', 'Impact', sans-serif;
      font-size: 140px;
      color: #000;
      font-weight: 800;
      letter-spacing: 15px;
      line-height: normal;
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      text-align: center;
      text-transform: none;
    }

    .main-scores-figma {
      position: absolute;
      top: 30%;
      left: 8%;
      width: 87vw;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      z-index: 20;
      padding: 2vw 4vw 0 4vw;
      pointer-events: none;
    }
    .score-figma-left, .score-figma-right {
      display: flex;
      align-items: flex-start;
    }
    .score-figma-number {
      font-family: 'Crossfly Expanded Display', 'Crossfly', 'Impact', sans-serif;
      font-size: 250px;
      color: #fff;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 0;
      text-transform: none;
      background: none;
      border: none;
      padding: 0;
      margin: 0;
    }

    /* === TABLA DE PARTIDOS === */
    .partidos-container {
      padding: 30px;
      max-width: 1400px;
      margin: 0 auto;
      overflow: auto;
      height: 100vh;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header-logo {
      height: 80px;
      object-fit: contain;
    }

    .btn-logout {
      background: #C8102E;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-logout:hover {
      background: #A00D25;
    }

    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #C8102E;
      color: white;
    }

    th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
    }

    tbody tr {
      border-bottom: 1px solid #eee;
    }

    td {
      padding: 16px;
      color: #333;
    }

    .btn-visualizar {
      background: #C8102E;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
    }

    /* === MARCADOR FULLSCREEN === */
    .scoreboard-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #C10230;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Fondo rojo principal */
    .bg-red {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #C10230;
      z-index: 1;
    }

    /* Forma decorativa inferior */
    .bottom-shape {
      position: absolute;
      top: 30.56%;
      left: 0;
      width: 100%;
      height: 69.4vh;
      background-image: url('https://www.figma.com/api/mcp/asset/b7fa3a4c-a340-4635-b150-b6369dcc0057');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      z-index: 2;
    }

    /* Trapecio negro central */
    .trapezoid {
      position: absolute;
      top: 56%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 28.54vw;
      height: 8.8vh;
      background-image: url('https://www.figma.com/api/mcp/asset/3952f2a6-dfef-4b1c-b759-edb0ed3cafcd');
      background-size: cover;
      z-index: 1;
    }

    /* Sección negra inferior 1 */
    .black-section-1 {
      position: absolute;
      top: 82.87%;
      left: 0;
      width: 100%;
      height: 17.13%;
      background: #020202;
      z-index: 3;
    }

    /* Vector decorativo */
    .vector-shape {
      position: absolute;
      top: 59.63%;
      left: 0;
      width: 100%;
      height: 30.56%;
      background-image: url('https://www.figma.com/api/mcp/asset/5f500e0d-4048-4aa9-91d7-9d135ef28115');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      z-index: 5;
    }

    /* Círculos rojos */
    .circle-1 {
      position: absolute;
      top: 62.78%;
      left: 11.2%;
      width: 18.54%;
      height: 17.31%;
      background: #C10230;
      border-radius: 49px;
      z-index: 6;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 20px;
    }

    .circle-2 {
      position: absolute;
      top: 62.78%;
      left: 30.83%;
      width: 18.54%;
      height: 17.31%;
      background: #C10230;
      border-radius: 49px;
      z-index: 6;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 20px;
    }

    /* Sección blanca */
    .white-section {
      position: absolute;
      top: 69.44%;
      left: 0;
      width: 100%;
      height: 30.56%;
      background: #FFFFFF;
      z-index: 4;
    }

    /* Sección negra inferior 2 */
    .black-section-2 {
      position: absolute;
      top: 83.24%;
      left: 0;
      width: 100%;
      height: 17.13%;
      background: #020202;
      z-index: 4;
    }

    .circle-3 {
      position: absolute;
      top: 62.78%;
      left: 50.52%;
      width: 18.59%;
      height: 17.31%;
      background: #C10230;
      border-radius: 49px;
      z-index: 6;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 20px;
    }

    .circle-white {
      position: absolute;
      top: 62.78%;
      left: 70.16%;
      width: 18.54%;
      height: 17.31%;
      background: #FFFFFF;
      border-radius: 49px;
      z-index: 6;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 20px;
    }
    .circle-4-red {
      position: absolute;
      top: 62.78%;
      left: 70.16%;
      width: 18.54%;
      height: 17.31%;
      background: #C10230;
      border-radius: 49px;
      z-index: 6;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 20px;
    }



    

    /* Contenedor de labels SET debajo de círculos */
    .set-labels {
      position: absolute;
      top: 80.5%;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0 10%;
      z-index: 10;
    }

    .set-label {
      font-family: 'Bizmo', sans-serif;
      font-weight: 700;
      font-size: 50px;
      color: #ffffffff;
      letter-spacing: 9px;
      line-height: normal;
      font-style: normal;
    }

    /* Banner superior con imagen de fondo */
    .top-banner-bg {
      position: absolute;
      top: 0;
      left: 22.55%;
      width: 54.9%;
      height: 26.67%;
      background-image: url('https://www.figma.com/api/mcp/asset/87c4ee6c-f5aa-4b4c-8c18-ceb9a4de7238');
      background-size: cover;
      z-index: 6;
    }

    .top-banner-overlay {
      position: absolute;
      top: 0;
      left: 26.25%;
      width: 54.9%;
      height: 26.67%;
      background-image: url('https://www.figma.com/api/mcp/asset/118617c6-577b-45cb-ba16-d39abbb096fa');
      background-size: cover;
      transform: scaleY(-1) rotate(180deg);
      z-index: 7;
    }

    /* Logo UDLA */
    .logo-udla {
      position: absolute;
      top: 0%;
      left: 26.5%;
      width: 50%;
      height: 100%;
      background-image: url('https://www.figma.com/api/mcp/asset/4e019071-e81a-4856-adb8-8fb33253faf6');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 10;
    }

    .logo-udla img {
      display: none;
    }

   
    
  `]
})
export class VisualizadorComponent implements OnInit, OnDestroy {
  partidos: Partido[] = [];
  partidoActivo: Partido | null = null;
  estado: EstadoJuego | null = null;
  cronometro = 0;
  equipoSirve: 'Local' | 'Visitante' | null = null;
  username = '';
  // El visualizador ya no necesita intervalo local

  constructor(
    private http: HttpClient,
    private router: Router,
    private signalR: SignalRService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.username = localStorage.getItem('username') || '';

    setTimeout(() => {
      this.loadPartidos();
    }, 100);
  }

  ngOnDestroy() {
    this.signalR.stopConnection();
  }

  loadPartidos() {
    this.http.get<Partido[]>('/api/visualizador/partidos').subscribe({
      next: data => {
        console.log('[VISUALIZADOR] Partidos recibidos:', data);
        this.partidos = data;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('[VISUALIZADOR] Error cargando partidos:', err);
      }
    });
  }

  visualizarPartido(partido: Partido) {
    console.log('[VISUALIZADOR] Visualizando partido:', partido);
    this.partidoActivo = partido;
    this.loadEstado(partido.id);
    this.conectarSignalR(partido.id);
  }

  loadEstado(partidoId: number) {
    this.http.get<EstadoJuego>(`/api/visualizador/partidos/${partidoId}`).subscribe({
      next: data => {
        console.log('[VISUALIZADOR] Estado recibido:', data);
        this.estado = data;
        this.cronometro = data.tiempoCronometro || 0;
        this.equipoSirve = data.equipoSirve as any;
        // Solo mostrar el valor recibido, no incrementar localmente
        // Log para depuración de puntajes
        console.log('[VISUALIZADOR] puntosLocal:', data.puntosLocal, 'puntosVisitante:', data.puntosVisitante);
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('[VISUALIZADOR] Error cargando estado:', err);
        // Reintentar cada 5 segundos
        setTimeout(() => this.loadEstado(partidoId), 5000);
      }
    });
  }

  conectarSignalR(partidoId: number) {
    this.signalR.startConnection().then(() => {
      console.log('[VISUALIZADOR] SignalR conectado');

      // Suscribirse a actualizaciones
      this.signalR.estadoJuego$.subscribe(estado => {
        if (estado && estado.partidoId === partidoId) {
          this.estado = estado;
          this.cronometro = estado.tiempoCronometro || 0;
          this.equipoSirve = estado.equipoSirve as any;
          // Solo mostrar el valor recibido, no incrementar localmente
          // Log para depuración de puntajes en tiempo real
          console.log('[VISUALIZADOR][SignalR] puntosLocal:', estado.puntosLocal, 'puntosVisitante:', estado.puntosVisitante);
          this.cdr.detectChanges();
        }
      });
    });

  }



  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }

  formatDate(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTiempo(segundos: number): string {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
