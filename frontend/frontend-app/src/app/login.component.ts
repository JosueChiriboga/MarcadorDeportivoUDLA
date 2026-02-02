import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface LoginModel { username: string; password: string; role: string }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="login-container">
    <div class="card" role="main">
      <div class="brand">
        <div class="logo">U</div>
        <h1>Marcador Udla</h1>
      </div>
      <form class="form" (submit)="login($event)">
        <input #username type="text" placeholder="Usuario" required />
        <input #password type="password" placeholder="Contraseña" required />
        <select #role required>
          <option value="">Seleccione rol</option>
          <option value="Administrador">Administrador</option>
          <option value="Visualizador">Visualizador</option>
          <option value="Juez">Juez</option>
        </select>
        <div class="role-note">Roles demo: admin/adminpass (Administrador), viewer/viewerpass (Visualizador), juez/juezpass (Juez)</div>
        <button type="submit">Ingresar</button>
      </form>
    </div>
  </div>
  `
})
export class LoginComponent {
  constructor(private http: HttpClient, private router: Router) { }

  login(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const username = (form.querySelector('input[type="text"]') as HTMLInputElement).value;
    const password = (form.querySelector('input[type="password"]') as HTMLInputElement).value;
    const role = (form.querySelector('select') as HTMLSelectElement).value;

    const payload = { username, password, role };
    this.http.post<any>('/api/auth/login', payload).subscribe({
      next: res => {
        if (res?.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', role);
          localStorage.setItem('username', username);
          
          // Pequeño delay para asegurar que localStorage se sincronice
          setTimeout(() => {
            // Redirigir según el rol
            if (role === 'Administrador') {
              this.router.navigate(['/admin']);
            } else if (role === 'Juez') {
              this.router.navigate(['/juez']);
            } else if (role === 'Visualizador') {
              this.router.navigate(['/visualizador']);
            }
          }, 50);
        }
      },
      error: err => {
        alert(err?.error?.message || 'Error al iniciar sesión');
      }
    });
  }
}
