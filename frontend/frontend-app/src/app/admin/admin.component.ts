import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Universidad, Jugador, Partido } from '../models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <header class="admin-header">
        <h1>Panel de Administración</h1>
        <div class="user-info">
          <span>{{username}}</span>
          <button (click)="logout()">Cerrar Sesión</button>
        </div>
      </header>

      <div class="admin-tabs">
        <button [class.active]="activeTab === 'universidades'" (click)="activeTab = 'universidades'">
          Universidades
        </button>
        <button [class.active]="activeTab === 'jugadores'" (click)="activeTab = 'jugadores'">
          Jugadores
        </button>
        <button [class.active]="activeTab === 'partidos'" (click)="activeTab = 'partidos'">
          Partidos
        </button>
      </div>

      <!-- TAB: Universidades -->
      <div class="tab-content" *ngIf="activeTab === 'universidades'">
        <div class="section-header">
          <h2>Gestión de Universidades</h2>
          <button class="btn-primary" (click)="showUniversidadForm = true">+ Nueva Universidad</button>
        </div>

        <div class="form-card" *ngIf="showUniversidadForm">
          <h3>{{editingUniversidad ? 'Editar' : 'Nueva'}} Universidad</h3>
          <form (submit)="saveUniversidad($event)">
            <input type="text" #uniNombre placeholder="Nombre de la Universidad" required />
            <div class="file-input-group">
              <label for="uniLogo">Logo (PNG):</label>
              <input type="file" #uniLogo id="uniLogo" accept=".png,image/png" (change)="onLogoSelected($event)" />
              <small *ngIf="logoPreview" class="file-selected">✓ Archivo seleccionado</small>
            </div>
            <img *ngIf="logoPreview" [src]="logoPreview" alt="Preview" class="logo-preview" />
            <div class="form-actions">
              <button type="submit" class="btn-primary">Guardar</button>
              <button type="button" class="btn-secondary" (click)="cancelUniversidad()">Cancelar</button>
            </div>
          </form>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Logo</th>
              <th>Jugadores</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let uni of universidades">
              <td>{{uni.id}}</td>
              <td>{{uni.nombre}}</td>
              <td><img *ngIf="uni.logoUrl" [src]="uni.logoUrl" alt="Logo" class="logo-mini"></td>
              <td>{{uni.jugadores?.length || 0}}</td>
              <td>
                <button class="btn-edit" (click)="editUniversidad(uni)">Editar</button>
                <button class="btn-delete" (click)="deleteUniversidad(uni.id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB: Jugadores -->
      <div class="tab-content" *ngIf="activeTab === 'jugadores'">
        <div class="section-header">
          <h2>Gestión de Jugadores</h2>
          <button class="btn-primary" (click)="showJugadorForm = true">+ Nuevo Jugador</button>
        </div>

        <div class="form-card" *ngIf="showJugadorForm">
          <h3>Nuevo Jugador</h3>
          <form (submit)="saveJugador($event)">
            <select #jugUniversidad required>
              <option value="">Seleccione Universidad</option>
              <option *ngFor="let uni of universidades" [value]="uni.id">{{uni.nombre}}</option>
            </select>
            <input type="text" #jugNombre placeholder="Nombre" required />
            <input type="text" #jugApellido placeholder="Apellido" required />
            <input type="number" #jugNumero placeholder="Número de Camiseta" />
            <input type="text" #jugPosicion placeholder="Posición" />
            <div class="form-actions">
              <button type="submit" class="btn-primary">Guardar</button>
              <button type="button" class="btn-secondary" (click)="showJugadorForm = false">Cancelar</button>
            </div>
          </form>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Universidad</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Número</th>
              <th>Posición</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let jug of jugadores">
              <td>{{getUniversidadNombre(jug.universidadId)}}</td>
              <td>{{jug.nombre}}</td>
              <td>{{jug.apellido}}</td>
              <td>{{jug.numeroCamiseta || '-'}}</td>
              <td>{{jug.posicion || '-'}}</td>
              <td>
                <button class="btn-delete" (click)="deleteJugador(jug.id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB: Partidos -->
      <div class="tab-content" *ngIf="activeTab === 'partidos'">
        <div class="section-header">
          <h2>Gestión de Partidos</h2>
          <button class="btn-primary" (click)="showPartidoForm = true">+ Nuevo Partido</button>
        </div>

        <div class="form-card" *ngIf="showPartidoForm">
          <h3>{{editingPartido ? 'Editar' : 'Nuevo'}} Partido</h3>
          <form (submit)="savePartido($event)">
            <select #parLocal required>
              <option value="">Universidad Local</option>
              <option *ngFor="let uni of universidades" [value]="uni.id" 
                      [selected]="editingPartido?.universidadLocalId === uni.id">{{uni.nombre}}</option>
            </select>
            <select #parVisitante required>
              <option value="">Universidad Visitante</option>
              <option *ngFor="let uni of universidades" [value]="uni.id"
                      [selected]="editingPartido?.universidadVisitanteId === uni.id">{{uni.nombre}}</option>
            </select>
            <input type="datetime-local" #parFecha required 
                   [value]="editingPartido ? formatDateForInput(editingPartido.fechaHora) : ''" />
            <select #parJuez>
              <option value="">Seleccione Juez (opcional)</option>
              <option *ngFor="let juez of jueces" [value]="juez.username"
                      [selected]="editingPartido?.juezUsername === juez.username">{{juez.username}}</option>
            </select>
            <div class="form-actions">
              <button type="submit" class="btn-primary">{{editingPartido ? 'Actualizar' : 'Crear'}} Partido</button>
              <button type="button" class="btn-secondary" (click)="cancelPartido()">Cancelar</button>
            </div>
          </form>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Local</th>
              <th>Visitante</th>
              <th>Estado</th>
              <th>Juez</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let partido of partidos">
              <td>{{formatDate(partido.fechaHora)}}</td>
              <td>{{partido.universidadLocal?.nombre}}</td>
              <td>{{partido.universidadVisitante?.nombre}}</td>
              <td><span [class]="'badge ' + partido.estado.toLowerCase()">{{partido.estado}}</span></td>
              <td>{{partido.juezUsername || 'Sin asignar'}}</td>
              <td>
                <button class="btn-edit" (click)="editPartido(partido)">Editar</button>
                <button class="btn-delete" (click)="deletePartido(partido.id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .admin-header {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .admin-header h1 {
      margin: 0;
      color: var(--red-1, #be0e2c);
    }

    .user-info {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .admin-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .admin-tabs button {
      flex: 1;
      padding: 15px;
      background: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .admin-tabs button.active {
      background: var(--red-1, #be0e2c);
      color: white;
    }

    .tab-content {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .form-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
    }

    .form-card form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .form-card input, .form-card select {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .btn-primary {
      background: var(--red-1, #be0e2c);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    .data-table th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #dee2e6;
      font-weight: 600;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #dee2e6;
    }

    .btn-edit, .btn-delete {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 5px;
      font-size: 13px;
    }

    .btn-edit {
      background: #007bff;
      color: white;
    }

    .btn-delete {
      background: #dc3545;
      color: white;
    }

    .logo-mini {
      height: 30px;
    }

    .file-input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .file-input-group label {
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
    }

    .file-input-group input[type="file"] {
      padding: 8px;
      border: 2px dashed #ddd;
      border-radius: 8px;
      cursor: pointer;
      background: #f9f9f9;
    }

    .file-input-group input[type="file"]:hover {
      border-color: var(--red-1, #be0e2c);
      background: #fff;
    }

    .file-selected {
      color: #28a745;
      font-weight: 600;
    }

    .logo-preview {
      max-width: 200px;
      max-height: 150px;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 8px;
      margin: 16px 0;
      background: white;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge.programado { background: #ffc107; color: #000; }
    .badge.en.juego { background: #28a745; color: white; }
    .badge.finalizado { background: #6c757d; color: white; }
  `]
})
export class AdminComponent implements OnInit {
  activeTab: 'universidades' | 'jugadores' | 'partidos' = 'universidades';
  username = localStorage.getItem('username') || '';
  
  universidades: Universidad[] = [];
  jugadores: Jugador[] = [];
  partidos: Partido[] = [];
  jueces: { username: string, role: string }[] = [];
  
  showUniversidadForm = false;
  showJugadorForm = false;
  showPartidoForm = false;
  editingUniversidad: Universidad | null = null;
  editingPartido: Partido | null = null;
  
  // Para logo de universidad
  logoFile: File | null = null;
  logoPreview: string | null = null;
  
  // Para edición de juez
  editandoJuez: { [key: number]: boolean } = {};
  nuevoJuez: { [key: number]: string } = {};

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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
      this.loadUniversidades();
      this.loadJugadores();
      this.loadPartidos();
      this.loadJueces();
    }, 100);
  }

  loadJueces() {
    this.http.get<{ username: string, role: string }[]>('/api/admin/jueces').subscribe({
      next: data => {
        console.log('Jueces cargados:', data);
        this.jueces = data;
      },
      error: err => console.error('Error al cargar jueces:', err)
    });
  }

  loadUniversidades() {
    this.http.get<Universidad[]>('/api/admin/universidades').subscribe({
      next: data => {
        console.log('Universidades cargadas:', data);
        this.universidades = data;
      },
      error: err => {
        console.error('Error loading universidades:', err);
        alert('Error al cargar universidades: ' + (err.status === 401 ? 'No autorizado' : err.message));
      }
    });
  }

  loadJugadores() {
    // Cargar todos los jugadores de todas las universidades
    this.http.get<Universidad[]>('/api/admin/universidades').subscribe({
      next: univs => {
        this.jugadores = univs.flatMap(u => u.jugadores || []);
      }
    });
  }

  loadPartidos() {
    console.log('[ADMIN] Cargando partidos...');
    this.http.get<Partido[]>('/api/admin/partidos').subscribe({
      next: data => {
        console.log('[ADMIN] Partidos recibidos:', data);
        console.log('[ADMIN] Cantidad de partidos:', data.length);
        this.partidos = data;
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('[ADMIN] Array actualizado, length:', this.partidos.length);
      },
      error: err => {
        console.error('[ADMIN] Error loading partidos:', err);
        console.error('[ADMIN] Status:', err.status);
        console.error('[ADMIN] Message:', err.message);
        if (err.status === 401) {
          alert('Sesión expirada. Por favor inicie sesión nuevamente.');
          this.logout();
        }
      }
    });
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar que sea PNG
      if (!file.type.match('image/png')) {
        alert('Por favor seleccione un archivo PNG');
        input.value = '';
        return;
      }
      
      this.logoFile = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveUniversidad(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const nombre = (form.querySelector('[placeholder="Nombre de la Universidad"]') as HTMLInputElement).value;

    // Crear FormData para enviar archivo
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('fechaCreacion', new Date().toISOString());
    
    if (this.logoFile) {
      formData.append('logo', this.logoFile);
    }

    // Si estamos editando, hacer PUT, sino POST
    if (this.editingUniversidad) {
      // Actualizar universidad existente
      this.http.put(`/api/admin/universidades/${this.editingUniversidad.id}`, formData).subscribe({
        next: () => {
          this.loadUniversidades();
          this.cancelUniversidad();
        },
        error: err => alert('Error al actualizar universidad')
      });
    } else {
      // Crear nueva universidad
      this.http.post('/api/admin/universidades', formData).subscribe({
        next: () => {
          this.loadUniversidades();
          this.cancelUniversidad();
        },
        error: err => alert('Error al guardar universidad')
      });
    }
  }

  cancelUniversidad() {
    this.showUniversidadForm = false;
    this.editingUniversidad = null;
    this.logoFile = null;
    this.logoPreview = null;
  }

  editUniversidad(uni: Universidad) {
    this.editingUniversidad = uni;
    this.showUniversidadForm = true;
    
    // Cargar el logo actual como preview si existe
    if (uni.logoUrl) {
      this.logoPreview = uni.logoUrl;
    }
    
    // Esperar a que el formulario se renderice y luego cargar los datos
    setTimeout(() => {
      const nombreInput = document.querySelector('[placeholder="Nombre de la Universidad"]') as HTMLInputElement;
      if (nombreInput) {
        nombreInput.value = uni.nombre;
      }
    }, 0);
  }

  deleteUniversidad(id: number) {
    if (confirm('¿Eliminar esta universidad?')) {
      this.http.delete(`/api/admin/universidades/${id}`).subscribe({
        next: () => this.loadUniversidades(),
        error: err => alert('Error al eliminar')
      });
    }
  }

  saveJugador(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const universidadId = +(form.querySelector('select') as HTMLSelectElement).value;
    const nombre = (form.querySelectorAll('input')[0] as HTMLInputElement).value;
    const apellido = (form.querySelectorAll('input')[1] as HTMLInputElement).value;
    const numeroCamiseta = +(form.querySelectorAll('input')[2] as HTMLInputElement).value || null;
    const posicion = (form.querySelectorAll('input')[3] as HTMLInputElement).value || null;

    const jugador: any = { nombre, apellido, numeroCamiseta, posicion, universidadId };

    this.http.post('/api/admin/jugadores', jugador).subscribe({
      next: () => {
        this.loadJugadores();
        this.showJugadorForm = false;
      },
      error: err => alert('Error al guardar jugador')
    });
  }

  deleteJugador(id: number) {
    if (confirm('¿Eliminar este jugador?')) {
      this.http.delete(`/api/admin/jugadores/${id}`).subscribe({
        next: () => this.loadJugadores(),
        error: err => alert('Error al eliminar')
      });
    }
  }

  savePartido(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const selects = form.querySelectorAll('select');
    const inputs = form.querySelectorAll('input');
    
    const universidadLocalId = +selects[0].value;
    const universidadVisitanteId = +selects[1].value;
    const fechaHoraInput = inputs[0].value;
    const juezUsername = selects[2].value || null; // Ahora es el tercer select

    // Convertir el datetime-local a formato ISO 8601
    const fechaHora = new Date(fechaHoraInput).toISOString();

    const partido: any = {
      universidadLocalId,
      universidadVisitanteId,
      fechaHora,
      juezUsername,
      deporte: 'Voleibol',
      estado: 'Programado'
    };

    if (this.editingPartido) {
      // Modo edición - PUT
      this.http.put(`/api/admin/partidos/${this.editingPartido.id}`, partido).subscribe({
        next: (response) => {
          console.log('Partido actualizado:', response);
          this.loadPartidos();
          this.cancelPartido();
          alert('Partido actualizado exitosamente');
        },
        error: err => {
          console.error('Error:', err);
          alert('Error al actualizar partido: ' + (err.error?.message || err.message));
        }
      });
    } else {
      // Modo creación - POST
      this.http.post('/api/admin/partidos', partido).subscribe({
        next: (response) => {
          console.log('Partido creado:', response);
          form.reset();
          this.showPartidoForm = false;
          this.loadPartidos();
          alert('Partido creado exitosamente');
        },
        error: err => {
          console.error('Error:', err);
          alert('Error al crear partido: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deletePartido(id: number) {
    if (confirm('¿Eliminar este partido?')) {
      this.http.delete(`/api/admin/partidos/${id}`).subscribe({
        next: () => this.loadPartidos(),
        error: err => alert('Error al eliminar')
      });
    }
  }

  editarJuez(partido: Partido) {
    this.editandoJuez[partido.id] = true;
    this.nuevoJuez[partido.id] = partido.juezUsername || '';
  }

  guardarJuez(partido: Partido) {
    const juezUsername = this.nuevoJuez[partido.id] || '';
    
    this.http.put(`/api/admin/partidos/${partido.id}/asignar-juez`, { juezUsername }).subscribe({
      next: () => {
        this.editandoJuez[partido.id] = false;
        this.loadPartidos();
        alert('Juez asignado correctamente');
      },
      error: err => {
        console.error('Error:', err);
        alert('Error al asignar juez');
      }
    });
  }

  cancelarEditarJuez(partidoId: number) {
    this.editandoJuez[partidoId] = false;
    delete this.nuevoJuez[partidoId];
  }

  getUniversidadNombre(id: number): string {
    return this.universidades.find(u => u.id === id)?.nombre || '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-EC');
  }

  editPartido(partido: Partido) {
    this.editingPartido = partido;
    this.showPartidoForm = true;
  }

  cancelPartido() {
    this.editingPartido = null;
    this.showPartidoForm = false;
  }

  formatDateForInput(dateString: string): string {
    // Convierte ISO 8601 a formato datetime-local (YYYY-MM-DDTHH:mm)
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
