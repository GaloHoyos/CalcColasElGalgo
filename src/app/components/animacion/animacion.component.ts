import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { QueueResult, QueueType } from "../../models/colas-modelos";

interface Customer {
  id: number;
  position: number; // Posición en la cola (0, 1, 2...)
  state: "waiting" | "being-served" | "leaving";
  serverId?: number;
  arrivalTime: number;
  priority?: number; // 1 = alta prioridad, 2 = baja prioridad
}

interface Server {
  id: number;
  busy: boolean;
  customer: Customer | null;
  serviceEndTime: number | null;
}

@Component({
  selector: "app-animacion",
  standalone: true,
  templateUrl: "./animacion.component.html",
  styleUrls: ["./animacion.component.css"],
  imports: [CommonModule, FormsModule],
})
export class QueueAnimationComponent implements OnChanges, OnDestroy {
  @Input() queueType: QueueType = "MM1";
  @Input() result: QueueResult | null = null;
  @Input() arrivalRate: number = 0; // λ - llegadas por hora
  @Input() serviceRate: number = 0; // μ - servicios por hora
  @Input() systemCapacity?: number; // Para MM1N

  // Estado de la simulación
  waitingCustomers: Customer[] = [];
  servers: Server[] = [];
  servedCustomers: number = 0;
  rejectedCustomers: number = 0;
  totalInSystem: number = 0;
  utilization: number = 0;
  expectedInQueue: number = 0;
  isRunning: boolean = false;
  isValidSystem: boolean = false;

  // Configuración de tiempo
  elapsedTime: number = 0; // Tiempo simulado en segundos
  simulationSpeed: number = 1; // Multiplicador de velocidad
  timeScale: number = 5; // Minutos simulados por segundo real
  timeScaleOptions: number[] = [1, 5, 10, 15, 30, 60];

  // Parámetros de visualización
  customerWidth: number = 30; // Ancho visual de un cliente en píxeles

  // Contadores y referencias internas
  private nextCustomerId: number = 0;
  private nextEventTime: number = 0;
  private simulationTimer: any = null;
  private lastUpdateTime: number = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    this.resetSimulation();
    this.updateSimulationParameters();
  }

  ngOnDestroy() {
    this.stopSimulation();
  }

  private updateSimulationParameters() {
    if (!this.result) {
      this.isValidSystem = false;
      return;
    }

    this.utilization = Math.round(this.result.rho * 100);
    this.expectedInQueue = Math.round(this.result.Lq * 10) / 10;

    // Para sistemas Priority, verificar si tenemos los datos desglosados
    if (this.queueType === "Prioridades" && this.result.priorityData) {
      // Podríamos mostrar estadísticas adicionales específicas para prioridades
    }

    // Modificar esta línea para incluir Priority
    this.isValidSystem =
      this.arrivalRate > 0 &&
      this.serviceRate > 0 &&
      (this.queueType === "MM1N" ||
        this.queueType === "Prioridades" ||
        this.result.rho < 1);

    // Inicializar servidores
    const serverCount = this.getServerCount();
    this.servers = Array(serverCount)
      .fill(null)
      .map((_, i) => ({
        id: i,
        busy: false,
        customer: null,
        serviceEndTime: null,
      }));
  }

  private getServerCount(): number {
    switch (this.queueType) {
      case "MM2":
        return 2;
      case "Prioridades":
        return 1; // Sistemas con prioridad generalmente tienen 1 servidor
      default:
        return 1;
    }
  }

  // CONTROL DE SIMULACIÓN
  toggleSimulation() {
    if (this.isRunning) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  private startSimulation() {
    if (!this.isValidSystem) return;

    this.isRunning = true;
    this.lastUpdateTime = Date.now();

    // Programar primera llegada si no hay eventos pendientes
    if (this.nextEventTime <= 0) {
      this.scheduleNextArrival();
    }

    // Iniciar bucle principal de simulación
    this.simulationTimer = setInterval(() => this.update(), 50); // 20 FPS
  }

  private stopSimulation() {
    this.isRunning = false;
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  resetSimulation() {
    this.stopSimulation();
    this.waitingCustomers = [];
    this.servers.forEach((server) => {
      server.busy = false;
      server.customer = null;
      server.serviceEndTime = null;
    });
    this.servedCustomers = 0;
    this.rejectedCustomers = 0;
    this.totalInSystem = 0;
    this.nextCustomerId = 0;
    this.elapsedTime = 0;
    this.nextEventTime = 0;
  }

  updateSimulationSpeed() {
    // Si estamos ejecutando, reiniciar para aplicar nuevos parámetros
    if (this.isRunning) {
      this.stopSimulation();
      this.startSimulation();
    }
  }

  private update() {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaTimeMs = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Actualizar tiempo simulado
    const simulatedSeconds = (deltaTimeMs / 1000) * this.timeScale * 60;
    this.elapsedTime += simulatedSeconds;

    // Procesar eventos (AÑADIR ESTA LÍNEA - FALTABA ESTA LLAMADA)
    this.processEvents();

    // Actualizar estadísticas (AÑADIR ESTA LÍNEA - FALTABA ESTA LLAMADA)
    this.updateStats();

    // Forzar actualización de la UI
    this.cdr.detectChanges();
  }

  private processEvents() {
    // 1. Verificar si algún servidor ha terminado de atender
    this.servers.forEach((server) => {
      if (
        server.busy &&
        server.serviceEndTime &&
        server.serviceEndTime <= this.elapsedTime
      ) {
        this.completeService(server.id);
      }
    });

    // 2. Verificar si es momento de una nueva llegada
    if (this.nextEventTime > 0 && this.nextEventTime <= this.elapsedTime) {
      this.processArrival();
      this.scheduleNextArrival();
    }
  }

  private scheduleNextArrival() {
    if (!this.isRunning) return;

    // Calcular tiempo hasta próxima llegada (distribución exponencial)
    const interarrivalTime = this.getRandomInterarrivalTime();
    this.nextEventTime = this.elapsedTime + interarrivalTime;
  }

  private getRandomInterarrivalTime(): number {
    // Tiempo entre llegadas sigue distribución exponencial
    // Para Priority, usamos la suma de ambas tasas
    let lambda = this.arrivalRate;

    if (this.queueType === "Prioridades") {
      lambda = this.getPriorityLambda1() + this.getPriorityLambda2();
    }

    // λ es tasa por hora, convertir a tasa por segundo
    const lambdaPerSecond = lambda / 3600;
    return -Math.log(Math.random()) / lambdaPerSecond;
  }
  private processArrival() {
    // Para MM1N, verificar si el sistema está lleno
    if (this.queueType === "MM1N" && this.systemCapacity) {
      if (this.totalInSystem >= this.systemCapacity) {
        this.rejectedCustomers++;
        return; // Cliente rechazado
      }
    }

    // Determinar la prioridad para sistemas Priority
    let priority: number | undefined;
    if (this.queueType === "Prioridades") {
      // Decidir si es cliente de alta o baja prioridad basado en las tasas
      const lambda1 = this.getPriorityLambda1();
      const lambda2 = this.getPriorityLambda2();
      const totalLambda = lambda1 + lambda2;

      // Probabilidad de ser cliente de alta prioridad = lambda1 / (lambda1 + lambda2)
      const isPriority1 = Math.random() < lambda1 / totalLambda;
      priority = isPriority1 ? 1 : 2;
    }

    // Crear nuevo cliente
    const customer: Customer = {
      id: this.nextCustomerId++,
      position: this.waitingCustomers.length,
      state: "waiting",
      arrivalTime: this.elapsedTime,
      priority: priority,
    };

    // Buscar servidor disponible
    const availableServerIndex = this.servers.findIndex((s) => !s.busy);

    if (availableServerIndex !== -1) {
      // Servir inmediatamente
      this.serveCustomer(customer, availableServerIndex);
    } else {
      // Agregar a la cola
      this.waitingCustomers.push(customer);

      // Para Priority, reordenar por prioridad
      if (this.queueType === "Prioridades") {
        this.waitingCustomers.sort((a, b) => {
          // Primero por prioridad (menor número = mayor prioridad)
          if (a.priority !== b.priority) {
            return (a.priority || 0) - (b.priority || 0);
          }
          // Luego por tiempo de llegada (FIFO dentro de la misma prioridad)
          return a.arrivalTime - b.arrivalTime;
        });
      }

      this.reorderQueue();
    }

    this.totalInSystem =
      this.waitingCustomers.length + this.servers.filter((s) => s.busy).length;
  }

  private serveCustomer(customer: Customer, serverId: number) {
    const server = this.servers[serverId];

    // Actualizar cliente
    customer.state = "being-served";
    customer.serverId = serverId;

    // Actualizar servidor
    server.busy = true;
    server.customer = customer;

    // Calcular tiempo de servicio
    const serviceTime = this.getRandomServiceTime();
    server.serviceEndTime = this.elapsedTime + serviceTime;
  }

  private getRandomServiceTime(): number {
    // Tiempo de servicio según el tipo de sistema
    const muPerSecond = this.serviceRate / 3600; // convertir por hora a por segundo

    switch (this.queueType) {
      case "MD1":
        // Determinístico (constante)
        return 1 / muPerSecond;

      case "MG1":
        // Distribución gamma como aproximación de distribución general
        const mean = 1 / muPerSecond;
        const variance = 0.5; // Varianza configurada para MG1
        return this.generateGammaTime(mean, variance);

      default:
        // Distribución exponencial (MM1, MM2, MM1N)
        return -Math.log(Math.random()) / muPerSecond;
    }
  }

  private generateGammaTime(mean: number, variance: number): number {
    // Aproximación de distribución gamma
    const shape = Math.pow(mean, 2) / variance;
    const scale = variance / mean;

    // Algoritmo simple para distribución gamma
    let result = 0;
    for (let i = 0; i < shape; i++) {
      result -= Math.log(Math.random());
    }

    return result * scale;
  }

  private completeService(serverId: number) {
    const server = this.servers[serverId];

    // Incrementar contador de clientes atendidos
    if (server.customer) {
      this.servedCustomers++;
    }

    // Liberar servidor
    server.busy = false;
    server.customer = null;
    server.serviceEndTime = null;

    // Atender siguiente cliente en cola si hay alguno
    if (this.waitingCustomers.length > 0) {
      const nextCustomer = this.waitingCustomers.shift()!;
      this.serveCustomer(nextCustomer, serverId);
      this.reorderQueue();
    }

    // Actualizar estadísticas
    this.totalInSystem =
      this.waitingCustomers.length + this.servers.filter((s) => s.busy).length;
  }

  private reorderQueue() {
    // Actualizar posiciones en la cola
    this.waitingCustomers.forEach((customer, index) => {
      customer.position = index;
    });
  }

  private updateStats() {
    // Actualizar estadísticas basadas en el estado actual
    const busyServers = this.servers.filter((s) => s.busy).length;
    const totalServers = this.servers.length;
    this.utilization = Math.round((busyServers / totalServers) * 100);

    // Otras estadísticas que podrían ser útiles
    this.totalInSystem = this.waitingCustomers.length + busyServers;
  }

  // HELPERS PARA LA VISTA
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }

  getCustomerPosition(position: number): string {
    // Calcular posición visual del cliente en la cola
    return `${position * this.customerWidth}px`;
  }

  trackCustomer(index: number, customer: Customer): number {
    return customer.id;
  }

  private getPriorityLambda1(): number {
    // Obtener la tasa de llegada para clientes de alta prioridad
    if (this.queueType === "Prioridades" && this.result?.priorityData) {
      return this.arrivalRate * 0.65; // Si no está disponible, asumimos 65% del total
    }
    return this.arrivalRate * 0.65;
  }

  private getPriorityLambda2(): number {
    // Obtener la tasa de llegada para clientes de baja prioridad
    if (this.queueType === "Prioridades" && this.result?.priorityData) {
      return this.arrivalRate * 0.35; // Si no está disponible, asumimos 35% del total
    }
    return this.arrivalRate * 0.35;
  }
}
