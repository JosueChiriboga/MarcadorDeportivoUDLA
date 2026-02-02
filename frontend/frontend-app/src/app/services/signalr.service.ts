import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { EstadoJuego } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection?: signalR.HubConnection;
  private estadoJuegoSubject = new BehaviorSubject<EstadoJuego | null>(null);
  public estadoJuego$: Observable<EstadoJuego | null> = this.estadoJuegoSubject.asObservable();

  constructor() {}

  public startConnection(): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/hubs/marcador', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    return this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection started');
        this.registerHandlers();
      })
      .catch(err => {
        console.error('Error starting SignalR connection:', err);
        throw err;
      });
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('EstadoJuegoActualizado', (estado: EstadoJuego) => {
      console.log('Estado actualizado:', estado);
      this.estadoJuegoSubject.next(estado);
    });

    this.hubConnection.on('PuntosActualizados', (partidoId: number, equipo: string, puntos: number) => {
      console.log(`Puntos actualizados - Partido ${partidoId}, ${equipo}: ${puntos}`);
    });

    this.hubConnection.on('CronometroActualizado', (partidoId: number, segundos: number, activo: boolean) => {
      console.log(`Cronómetro - Partido ${partidoId}: ${segundos}s, activo: ${activo}`);
    });

    this.hubConnection.on('CambioCanchaRealizado', (partidoId: number) => {
      console.log(`Cambio de cancha en partido ${partidoId}`);
    });
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

  public actualizarEstadoJuego(estado: EstadoJuego): Promise<void> {
    if (!this.hubConnection) {
      return Promise.reject('No hay conexión activa');
    }
    return this.hubConnection.invoke('ActualizarEstadoJuego', estado);
  }
}
