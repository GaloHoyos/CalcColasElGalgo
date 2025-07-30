import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  QueueResult,
  QueueType,
  PriorityClassResult,
} from "../../models/colas-modelos";

@Component({
  selector: "app-resultados",
  standalone: true,
  templateUrl: "./resultados.component.html",
  styleUrls: ["./resultados.component.css"],
  imports: [CommonModule],
})
export class QueueResultsComponent {
  @Input() result: QueueResult | null = null;
  @Input() queueType: QueueType = "MM1";
  @Input() params: any = null; // Para acceder a parámetros específicos como lambda, mu, etc.

  // Métodos específicos para cálculos adicionales según modelo
  getProbabilityN(n: number): number {
    if (!this.result) return 0;

    switch (this.queueType) {
      case "MM1":
        return this.result.P0 * Math.pow(this.result.rho, n);
      case "MM1N":
        if (this.params && n > this.params.N) return 0;
        const { rho, P0 } = this.result;
        return P0 * Math.pow(rho, n);
      case "MM2":
        if (n === 0) return this.result.P0;
        if (n === 1)
          return (this.params.lambda / this.params.mu) * this.result.P0;
        return (
          (Math.pow(this.params.lambda / this.params.mu, n) * this.result.P0) /
          (2 * Math.pow(2, n - 2))
        );
      default:
        return 0;
    }
  }

  isStateAllowed(n: number): boolean {
    if (this.queueType === "MM1N" && this.params) {
      return n <= this.params.N;
    }
    return true;
  }

  // Calcula la probabilidad de tener que esperar (específico para modelos con múltiples servidores)
  getWaitingProbability(): number {
    if (!this.result || this.queueType !== "MM2") return 0;

    return this.result.Lq / this.result.rho; // Pw para MM2
  }

  // Calcula el factor de condición (específico para MG1)
  getConditionFactor(): number {
    if (!this.result || this.queueType !== "MG1" || !this.params) return 0;

    const { sigma, mu } = this.params;
    return (this.params.lambda * Math.pow(sigma, 2) * Math.pow(mu, 2)) / 2;
  }

  // Calcula la probabilidad de pérdida para MM1N
  getLossProbability(): number {
    if (!this.result || this.queueType !== "MM1N" || !this.params) return 0;

    const { rho, P0 } = this.result;
    const N = this.params.N;

    if (rho === 1) return 1 / (N + 1);
    return P0 * Math.pow(rho, N);
  }

  // Agrega este método para calcular la proporción de clientes de alta prioridad
  getWaitTimeRatio(): number {
    const class1W = this.getClass1Value("W");
    const class2W = this.getClass2Value("W");

    if (class1W <= 0) {
      return 0;
    }

    return class2W / class1W;
  }

  getQueueTimeRatio(): number {
    const class1Wq = this.getClass1Value("Wq");
    const class2Wq = this.getClass2Value("Wq");

    // Evitar división por cero
    return class1Wq <= 0 ? 0 : class2Wq / class1Wq;
  }

  getPriorityRatio(): number {
    if (!this.params || this.queueType !== "Prioridades") {
      return 0;
    }

    const totalLambda = this.params.lambda1 + this.params.lambda2;
    return totalLambda > 0 ? (this.params.lambda1 / totalLambda) * 100 : 0;
  }

  // Helper methods for priority class values to avoid template warnings
  getClass1Value(property: "L" | "Lq" | "W" | "Wq"): number {
    if (!this.result || !this.result.priorityData) {
      return 0;
    }
    return this.result.priorityData.class1[property];
  }

  getClass2Value(property: "L" | "Lq" | "W" | "Wq"): number {
    if (!this.result || !this.result.priorityData) {
      return 0;
    }
    return this.result.priorityData.class2[property];
  }
}
