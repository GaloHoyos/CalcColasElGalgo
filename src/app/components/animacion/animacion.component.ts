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
  position: number;
  state: "waiting" | "being-served" | "leaving";
  serverId?: number;
  arrivalTime: number;
  priority?: number;
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
  @Input() arrivalRate: number = 0;
  @Input() serviceRate: number = 0;
  @Input() serverRates?: number[]; // Para sistemas con múltiples servidores de diferentes velocidades
  @Input() systemCapacity?: number;

  waitingCustomers: Customer[] = [];
  servers: Server[] = [];
  servedCustomers: number = 0;
  rejectedCustomers: number = 0;
  totalInSystem: number = 0;
  utilization: number = 0;
  expectedInQueue: number = 0;
  isRunning: boolean = false;
  isValidSystem: boolean = false;
  isUnstableSystem: boolean = false;

  elapsedTime: number = 0;
  simulationSpeed: number = 1;
  timeScale: number = 5;
  timeScaleOptions: number[] = [1, 5, 10, 15, 30, 60];

  customerWidth: number = 30;

  private nextCustomerId: number = 0;
  private nextEventTime: number = 0;
  private simulationTimer: any = null;
  private lastUpdateTime: number = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    // Solo resetear si realmente hay cambios en parámetros importantes
    let hasImportantChanges = false;

    if (changes["queueType"]) {
      console.log(
        "queueType changed:",
        changes["queueType"].previousValue,
        "->",
        changes["queueType"].currentValue
      );
      hasImportantChanges = true;
    }

    if (changes["arrivalRate"]) {
      console.log(
        "arrivalRate changed:",
        changes["arrivalRate"].previousValue,
        "->",
        changes["arrivalRate"].currentValue
      );
      hasImportantChanges = true;
    }

    if (changes["serviceRate"]) {
      console.log(
        "serviceRate changed:",
        changes["serviceRate"].previousValue,
        "->",
        changes["serviceRate"].currentValue
      );
      hasImportantChanges = true;
    }

    if (changes["systemCapacity"]) {
      console.log(
        "systemCapacity changed:",
        changes["systemCapacity"].previousValue,
        "->",
        changes["systemCapacity"].currentValue
      );
      hasImportantChanges = true;
    }

    // Para serverRates, verificar si realmente cambió el contenido
    if (changes["serverRates"]) {
      const prev = changes["serverRates"].previousValue;
      const curr = changes["serverRates"].currentValue;

      if (!prev && curr) {
        console.log("serverRates initialized:", curr);
        hasImportantChanges = true;
      } else if (prev && !curr) {
        console.log("serverRates removed");
        hasImportantChanges = true;
      } else if (prev && curr) {
        // Comparar arrays elemento por elemento
        if (
          prev.length !== curr.length ||
          !prev.every((val: number, index: number) => val === curr[index])
        ) {
          console.log("serverRates content changed:", prev, "->", curr);
          hasImportantChanges = true;
        }
      }
    }

    // Para result, solo resetear en el primer cambio (cuando se inicializa)
    if (
      changes["result"] &&
      !changes["result"].previousValue &&
      changes["result"].currentValue
    ) {
      console.log("result initialized");
      hasImportantChanges = true;
    }

    if (hasImportantChanges) {
      console.log("Important parameter changes detected, resetting simulation");
      this.resetSimulation();
      this.updateSimulationParameters();
    }
  }

  ngOnDestroy() {
    this.stopSimulation();
  }

  private updateSimulationParameters() {
    console.log("updateSimulationParameters - Debug info:");
    console.log("arrivalRate:", this.arrivalRate);
    console.log("serviceRate:", this.serviceRate);
    console.log("serverRates:", this.serverRates);
    console.log("queueType:", this.queueType);
    console.log("result:", this.result);

    // Validación mejorada para sistemas con múltiples servidores
    if (
      this.queueType === "MM2" &&
      this.serverRates &&
      this.serverRates.length > 0
    ) {
      // Para MM2, verificar que haya tasas válidas para ambos servidores
      this.isValidSystem =
        this.arrivalRate > 0 && this.serverRates.every((rate) => rate > 0);
    } else {
      this.isValidSystem = this.arrivalRate > 0 && this.serviceRate > 0;
    }
    console.log("isValidSystem:", this.isValidSystem);

    if (!this.result) {
      this.isUnstableSystem = false;
      return;
    }

    this.utilization = Math.round(this.result.rho * 100);
    this.expectedInQueue = Math.round(this.result.Lq * 10) / 10;

    this.isUnstableSystem = this.queueType !== "MM1N" && this.result.rho >= 1;

    const serverCount = this.getServerCount();
    this.servers = Array(serverCount)
      .fill(null)
      .map((_, i) => ({
        id: i,
        busy: false,
        customer: null,
        serviceEndTime: null,
      }));

    console.log("servers created:", this.servers);
  }

  private getServerCount(): number {
    switch (this.queueType) {
      case "MM2":
        return 2;
      case "Prioridades":
        return 1;
      default:
        return 1;
    }
  }

  toggleSimulation() {
    console.log(
      "toggleSimulation called - isRunning:",
      this.isRunning,
      "isValidSystem:",
      this.isValidSystem
    );
    if (this.isRunning) {
      console.log("Stopping simulation...");
      this.stopSimulation();
    } else {
      console.log("Attempting to start simulation...");
      this.startSimulation();
    }
  }

  private startSimulation() {
    console.log("startSimulation called - isValidSystem:", this.isValidSystem);
    if (!this.isValidSystem) {
      console.log("Simulation blocked: invalid system");
      return;
    }

    console.log("Starting simulation...");
    this.isRunning = true;
    this.lastUpdateTime = Date.now();

    if (this.nextEventTime <= 0) {
      console.log("Scheduling next arrival...");
      this.scheduleNextArrival();
    }

    console.log("Setting up timer...");
    this.simulationTimer = setInterval(() => this.update(), 50);
    console.log("Simulation started successfully");
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

    const simulatedSeconds = (deltaTimeMs / 1000) * this.timeScale * 60;
    this.elapsedTime += simulatedSeconds;

    this.processEvents();
    this.updateStats();
    this.cdr.detectChanges();
  }

  private processEvents() {
    this.servers.forEach((server) => {
      if (
        server.busy &&
        server.serviceEndTime &&
        server.serviceEndTime <= this.elapsedTime
      ) {
        this.completeService(server.id);
      }
    });

    if (this.nextEventTime > 0 && this.nextEventTime <= this.elapsedTime) {
      this.processArrival();
      this.scheduleNextArrival();
    }
  }

  private scheduleNextArrival() {
    if (!this.isRunning) {
      console.log("scheduleNextArrival: simulation not running");
      return;
    }

    const interarrivalTime = this.getRandomInterarrivalTime();
    this.nextEventTime = this.elapsedTime + interarrivalTime;
    console.log(
      "Next arrival scheduled at:",
      this.nextEventTime,
      "interarrival time:",
      interarrivalTime
    );
  }

  private getRandomInterarrivalTime(): number {
    let lambda = this.arrivalRate;
    console.log("getRandomInterarrivalTime - initial lambda:", lambda);

    if (this.queueType === "Prioridades") {
      lambda = this.getPriorityLambda1() + this.getPriorityLambda2();
      console.log("Priority queue - combined lambda:", lambda);
    }

    // Apply time scale to make simulation more responsive
    // Convert from customers/hour to customers/simulation-second
    const scaledLambda = (lambda * this.timeScale) / 3600;
    const interarrivalTime = -Math.log(Math.random()) / scaledLambda;
    console.log(
      "Calculated interarrival time:",
      interarrivalTime,
      "scaledLambda:",
      scaledLambda,
      "timeScale:",
      this.timeScale
    );

    return interarrivalTime;
  }
  private processArrival() {
    if (this.queueType === "MM1N" && this.systemCapacity) {
      if (this.totalInSystem >= this.systemCapacity) {
        this.rejectedCustomers++;
        return;
      }
    }

    let priority: number | undefined;
    if (this.queueType === "Prioridades") {
      const lambda1 = this.getPriorityLambda1();
      const lambda2 = this.getPriorityLambda2();
      const totalLambda = lambda1 + lambda2;

      const isPriority1 = Math.random() < lambda1 / totalLambda;
      priority = isPriority1 ? 1 : 2;
    }

    const customer: Customer = {
      id: this.nextCustomerId++,
      position: this.waitingCustomers.length,
      state: "waiting",
      arrivalTime: this.elapsedTime,
      priority: priority,
    };

    const availableServerIndex = this.servers.findIndex((s) => !s.busy);

    if (availableServerIndex !== -1) {
      this.serveCustomer(customer, availableServerIndex);
    } else {
      this.waitingCustomers.push(customer);

      if (this.queueType === "Prioridades") {
        this.waitingCustomers.sort((a, b) => {
          if (a.priority !== b.priority) {
            return (a.priority || 0) - (b.priority || 0);
          }
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

    customer.state = "being-served";
    customer.serverId = serverId;

    server.busy = true;
    server.customer = customer;

    const serviceTime = this.getRandomServiceTime(serverId);
    server.serviceEndTime = this.elapsedTime + serviceTime;
  }

  private getRandomServiceTime(serverId?: number): number {
    const serverRate =
      serverId !== undefined ? this.getServerRate(serverId) : this.serviceRate;
    // Apply time scale to make simulation more responsive
    // Convert from services/hour to services/simulation-second
    const scaledMu = (serverRate * this.timeScale) / 3600;

    switch (this.queueType) {
      case "MD1":
        return 1 / scaledMu;

      case "MG1":
        const mean = 1 / scaledMu;
        const variance = 0.5;
        return this.generateGammaTime(mean, variance);

      default:
        return -Math.log(Math.random()) / scaledMu;
    }
  }

  private generateGammaTime(mean: number, variance: number): number {
    const shape = Math.pow(mean, 2) / variance;
    const scale = variance / mean;

    let result = 0;
    for (let i = 0; i < shape; i++) {
      result -= Math.log(Math.random());
    }

    return result * scale;
  }

  private completeService(serverId: number) {
    const server = this.servers[serverId];

    if (server.customer) {
      this.servedCustomers++;
    }

    server.busy = false;
    server.customer = null;
    server.serviceEndTime = null;

    if (this.waitingCustomers.length > 0) {
      const nextCustomer = this.waitingCustomers.shift()!;
      this.serveCustomer(nextCustomer, serverId);
      this.reorderQueue();
    }

    this.totalInSystem =
      this.waitingCustomers.length + this.servers.filter((s) => s.busy).length;
  }

  private reorderQueue() {
    this.waitingCustomers.forEach((customer, index) => {
      customer.position = index;
    });
  }

  private updateStats() {
    const busyServers = this.servers.filter((s) => s.busy).length;
    const totalServers = this.servers.length;
    this.utilization = Math.round((busyServers / totalServers) * 100);

    this.totalInSystem = this.waitingCustomers.length + busyServers;
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }

  getCustomerPosition(position: number): string {
    return `${position * this.customerWidth}px`;
  }

  trackCustomer(index: number, customer: Customer): number {
    return customer.id;
  }

  getServerRate(serverId: number): number {
    console.log(
      `getServerRate(${serverId}) - serverRates:`,
      this.serverRates,
      "serviceRate:",
      this.serviceRate
    );
    if (this.serverRates && this.serverRates[serverId] !== undefined) {
      console.log(
        `Returning specific rate for server ${serverId}:`,
        this.serverRates[serverId]
      );
      return this.serverRates[serverId];
    }
    console.log(
      `Returning general rate for server ${serverId}:`,
      this.serviceRate
    );
    return this.serviceRate;
  }

  private getPriorityLambda1(): number {
    if (this.queueType === "Prioridades" && this.result?.priorityData) {
      return this.arrivalRate * 0.65;
    }
    return this.arrivalRate * 0.65;
  }

  private getPriorityLambda2(): number {
    if (this.queueType === "Prioridades" && this.result?.priorityData) {
      return this.arrivalRate * 0.35;
    }
    return this.arrivalRate * 0.35;
  }
}
