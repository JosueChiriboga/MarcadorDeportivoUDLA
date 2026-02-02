export interface Universidad {
  id: number;
  nombre: string;
  logoUrl?: string;
  fechaCreacion: string;
  jugadores?: Jugador[];
}

export interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  numeroCamiseta?: number;
  posicion?: string;
  universidadId: number;
}

export interface Partido {
  id: number;
  fechaHora: string;
  deporte: string;
  estado: string; // 'Programado', 'En Juego', 'Finalizado'
  universidadLocalId: number;
  universidadVisitanteId: number;
  universidadLocal?: Universidad;
  universidadVisitante?: Universidad;
  juezUsername?: string;
  sets?: SetPartido[];
}

export interface SetPartido {
  id: number;
  partidoId: number;
  numeroSet: number;
  puntosLocal: number;
  puntosVisitante: number;
  finalizado: boolean;
  ganador?: string;
}

export interface EstadoJuego {
  partidoId: number;
  setActual: number;
  puntosLocal: number;
  puntosVisitante: number;
  setsLocal: number;
  setsVisitante: number;
  cronometroActivo: boolean;
  tiempoCronometro: number; // segundos
  equipoSirve?: string; // 'Local' o 'Visitante'
  cambioCanchaPendiente: boolean;
  universidadLocalNombre: string;
  universidadVisitanteNombre: string;
  universidadLocalLogo?: string;
  universidadVisitanteLogo?: string;
  sets: SetInfo[];
}

export interface SetInfo {
  numero: number;
  puntosLocal: number;
  puntosVisitante: number;
  finalizado: boolean;
}
