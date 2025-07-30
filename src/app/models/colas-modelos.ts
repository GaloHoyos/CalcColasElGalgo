export interface QueueResult {
  rho: number; // Utilización del sistema
  L: number; // Número promedio de clientes en el sistema
  Lq: number; // Número promedio de clientes en cola
  W: number; // Tiempo promedio en el sistema
  Wq: number; // Tiempo promedio en cola
  P0: number; // Probabilidad de que el sistema esté vacío
  PB?: number; // Probabilidad de bloqueo (para sistemas con capacidad limitada)
  lambdaEff?: number; // Tasa de llegada efectiva
  En?: number; // Esperanza matemática del número de clientes
  ET?: number; // Esperanza matemática del tiempo en el sistema
  priorityData?: PriorityResult; // Datos completos para sistemas con prioridades
}

export interface PriorityParams {
  lambda1: number; // Tasa de llegada de clientes de alta prioridad
  lambda2: number; // Tasa de llegada de clientes de baja prioridad
  mu: number; // Tasa de servicio
  W0: number; // Tiempo restante de servicio para el cliente actual
}

export interface PriorityClassResult {
  L: number; // Número promedio de clientes de esta clase en el sistema
  Lq: number; // Número promedio de clientes de esta clase en cola
  W: number; // Tiempo promedio de esta clase en el sistema
  Wq: number; // Tiempo promedio de esta clase en cola
}

export interface PriorityResult {
  rho: number; // Utilización del sistema
  P0: number; // Probabilidad de que el sistema esté vacío
  class1: PriorityClassResult; // Resultados para clientes de alta prioridad
  class2: PriorityClassResult; // Resultados para clientes de baja prioridad
  system: {
    // Resultados del sistema completo
    L: number; // Número total de clientes en el sistema
    Lq: number; // Número total de clientes en cola
  };
}

export interface MM1Params {
  lambda: number;
  mu: number;
}

export interface MM1NParams {
  lambda: number;
  mu: number;
  N: number;
}

export interface MM2Params {
  lambda: number;
  mu: number;
}

export interface MG1Params {
  lambda: number;
  mu: number;
  sigma: number;
}

export interface MD1Params {
  lambda: number;
  mu: number;
}

export type QueueType = "MM1" | "MM1N" | "MM2" | "MG1" | "MD1" | "Prioridades";
