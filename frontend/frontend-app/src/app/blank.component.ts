import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-blank',
  standalone: true,
  template: `
  <div class="blank-page">
    <div>
      <div style="text-align:center">
        <h2>Pantalla en blanco</h2>
        <p>Autenticado. Esta es la fase 1 — UI en blanco.</p>
      </div>
    </div>
  </div>
  `
})
export class BlankComponent implements OnInit {
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // Optionally call a protected endpoint to validate token — silent fail
    const token = localStorage.getItem('token');
    if (token) {
      this.http.get('/api/auth/protected').subscribe({ next: () => { }, error: () => { /* ignore */ } });
    }
  }
}
