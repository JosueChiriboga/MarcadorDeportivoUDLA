import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./login.component').then(m => m.LoginComponent) },
  { path: 'admin', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent) },
  { path: 'juez', loadComponent: () => import('./juez/juez.component').then(m => m.JuezComponent) },
  { path: 'visualizador', loadComponent: () => import('./visualizador/visualizador.component').then(m => m.VisualizadorComponent) },
  { path: 'blank', loadComponent: () => import('./blank.component').then(m => m.BlankComponent) }
];
