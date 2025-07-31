import { Injectable } from "@angular/core";
import {
  QueueResult,
  MM1Params,
  MM1NParams,
  MM2Params,
  MG1Params,
  MD1Params,
  PriorityParams,
  PriorityResult,
} from "../models/colas-modelos";

@Injectable({
  providedIn: "root",
})
export class CalculadoraColasService {
  calculateMM1(params: MM1Params): QueueResult {
    const { lambda, mu } = params;
    const rho = lambda / mu;

    let isUnstable = false;
    let warningMessage = "";

    if (rho >= 1) {
      isUnstable = true;
      warningMessage =
        "⚠️ Sistema inestable (ρ ≥ 1). Los valores teóricos pueden no ser válidos en la práctica.";
    }

    const P0 = rho >= 1 ? 0 : 1 - rho;
    const L = rho >= 1 ? Infinity : rho / (1 - rho);
    const Lq = rho >= 1 ? Infinity : (rho * rho) / (1 - rho);
    const W = rho >= 1 ? Infinity : 1 / (mu - lambda);
    const Wq = rho >= 1 ? Infinity : rho / (mu - lambda);

    return { rho, L, Lq, W, Wq, P0, isUnstable, warningMessage };
  }

  calculateMM1N(params: MM1NParams): QueueResult {
    const { lambda, mu, N } = params;
    const rho = lambda / mu;

    let warningMessage = "";

    if (rho > 1) {
      warningMessage =
        "ℹ️ Alta utilización (ρ > 1). El sistema permanece estable debido a la capacidad limitada.";
    }

    // Probabilidad de que el sistema esté vacío (P0)
    let P0: number;
    if (rho === 1) {
      P0 = 1 / (N + 1);
    } else {
      P0 = (1 - rho) / (1 - Math.pow(rho, N + 1));
    }

    // Probabilidad de bloqueo (PB)
    const PB = Math.pow(rho, N) * P0;

    // Tasa de llegada efectiva
    const lambdaEff = lambda * (1 - PB);

    // Longitud promedio del sistema (L)
    let L: number;
    if (rho === 1) {
      L = N / 2;
    } else {
      L =
        (rho * (1 - (N + 1) * Math.pow(rho, N) + N * Math.pow(rho, N + 1))) /
        ((1 - rho) * (1 - Math.pow(rho, N + 1)));
    }

    // Longitud promedio de la cola (Lq)
    const Lq = L - lambdaEff / mu;

    // Tiempo promedio en el sistema (W)
    const W = L / lambdaEff;

    // Tiempo promedio en la cola (Wq)
    const Wq = Lq / lambdaEff;

    return {
      rho,
      L,
      Lq,
      W,
      Wq,
      P0,
      PB, // Probabilidad de bloqueo
      lambdaEff, // Tasa de llegada efectiva
      isUnstable: false, // MM1N siempre es estable
      warningMessage: warningMessage.length > 0 ? warningMessage : undefined,
    };
  }

  calculateMM2(params: MM2Params): QueueResult {
    const { lambda, mu, differentSpeeds, mu2 } = params;

    if (differentSpeeds && mu2) {
      // MM2 con servidores de velocidades diferentes
      return this.calculateMM2DifferentSpeeds(lambda, mu, mu2);
    } else {
      // MM2 tradicional con servidores de velocidades iguales
      return this.calculateMM2EqualSpeeds(lambda, mu);
    }
  }

  private calculateMM2EqualSpeeds(lambda: number, mu: number): QueueResult {
    const rho = lambda / (2 * mu);

    let isUnstable = false;
    let warningMessage = "";

    if (rho >= 1) {
      isUnstable = true;
      warningMessage =
        "⚠️ Sistema inestable (ρ ≥ 1). λ debe ser menor que 2μ para estabilidad.";
    }

    const P0 =
      rho >= 1 ? 0 : 1 / (1 + lambda / mu + Math.pow(lambda / mu, 2) / 2);
    const Lq =
      rho >= 1 ? Infinity : (Math.pow(lambda / mu, 2) * P0) / (2 * (1 - rho));
    const L = rho >= 1 ? Infinity : Lq + lambda / mu;
    const Wq = rho >= 1 ? Infinity : Lq / lambda;
    const W = rho >= 1 ? Infinity : L / lambda;

    return { rho, L, Lq, W, Wq, P0, isUnstable, warningMessage };
  }

  private calculateMM2DifferentSpeeds(
    lambda: number,
    mu1: number,
    mu2: number
  ): QueueResult {
    const mu = mu1 + mu2;
    const rho = lambda / mu;

    let isUnstable = false;
    let warningMessage = "";

    if (rho >= 1) {
      isUnstable = true;
      warningMessage =
        "⚠️ Sistema inestable (ρ ≥ 1). λ debe ser menor que μ₁ + μ₂ para estabilidad.";
    }

    const aPrime = ((2 * lambda + mu) * mu1 * mu2) / (mu * (lambda + mu2));
    const P0 = rho >= 1 ? 0 : (1 - rho) / (1 - rho + lambda / aPrime);
    const L =
      rho >= 1
        ? Infinity
        : lambda / ((1 - rho) * (lambda + (1 - rho) * aPrime));
    const W = rho >= 1 ? Infinity : L / lambda;

    // Estimación de clientes en cola:
    const serversUsed = Math.min(rho * 2, 2); // aproximado
    const Lq = rho >= 1 ? Infinity : Math.max(0, L - serversUsed);
    const Wq = lambda > 0 ? Lq / lambda : 0;

    return {
      rho,
      L,
      Lq,
      W,
      Wq,
      P0,
      aPrime,
      isUnstable,
      warningMessage,
    };
  }

  calculatePriorityNoPreempt(params: PriorityParams): PriorityResult {
    const { lambda1, lambda2, mu, W0 } = params;
    const rho = (lambda1 + lambda2) / mu;

    let isUnstable = false;
    let warningMessage = "";

    if (rho >= 1) {
      isUnstable = true;
      warningMessage =
        "⚠️ Sistema inestable (ρ ≥ 1). Los valores teóricos pueden no ser válidos.";
    }

    // Probabilidad de sistema vacío
    const P0 = rho >= 1 ? 0 : 1 - rho;

    // Clientes clase 1 (alta prioridad)
    const Ts1 = 1 / mu;
    const Q1 =
      lambda1 <= mu ? Math.pow(lambda1, 2) / (mu * (mu - lambda1)) : Infinity;
    const Wq1 = lambda1 <= mu ? W0 + Q1 * Ts1 : Infinity;
    const W1 = lambda1 <= mu ? Wq1 + Ts1 : Infinity;
    const L1 = lambda1 <= mu ? lambda1 * W1 : Infinity;
    const Lq1 = lambda1 <= mu ? lambda1 * Wq1 : Infinity;

    // Clientes clase 2 (baja prioridad)
    const Ts2 = 1 / mu;
    const Q2 =
      lambda1 + lambda2 <= mu
        ? (lambda2 * (lambda1 + lambda2)) /
          (mu * (mu - lambda1) * (mu - lambda1 - lambda2))
        : Infinity;
    const Wq2 = lambda1 + lambda2 <= mu ? W0 + Q1 * Ts1 + Q2 * Ts2 : Infinity;
    const W2 = lambda1 + lambda2 <= mu ? Wq2 + Ts2 : Infinity;
    const L2 = lambda1 + lambda2 <= mu ? lambda2 * W2 : Infinity;
    const Lq2 = lambda1 + lambda2 <= mu ? lambda2 * Wq2 : Infinity;

    return {
      rho,
      P0,
      class1: { L: L1, Lq: Lq1, W: W1, Wq: Wq1 },
      class2: { L: L2, Lq: Lq2, W: W2, Wq: Wq2 },
      system: { L: L1 + L2, Lq: Lq1 + Lq2 },
      isUnstable,
      warningMessage,
    };
  }

  calculateMG1(params: MG1Params): QueueResult {
    const { lambda, mu, sigma } = params;
    const rho = lambda / mu;

    let isUnstable = false;
    let warningMessage = "";

    if (rho >= 1) {
      isUnstable = true;
      warningMessage =
        "⚠️ Sistema inestable (ρ ≥ 1). Los valores teóricos pueden no ser válidos.";
    }

    // Esperanza matemática del número de clientes
    const En =
      rho >= 1
        ? Infinity
        : (rho / (1 - rho)) * (1 - (rho / 2) * (1 - Math.pow(mu * sigma, 2)));

    // Esperanza matemática del tiempo en el sistema
    const ET = rho >= 1 ? Infinity : En / lambda;

    // Valores tradicionales
    const P0 = rho >= 1 ? 0 : 1 - rho;
    const variance = Math.pow(sigma, 2);
    const Lq =
      rho >= 1
        ? Infinity
        : (Math.pow(lambda, 2) * variance + Math.pow(rho, 2)) / (2 * (1 - rho));
    const L = rho >= 1 ? Infinity : Lq + rho;
    const Wq = rho >= 1 ? Infinity : Lq / lambda;
    const W = rho >= 1 ? Infinity : L / lambda;

    return { rho, L, Lq, W, Wq, P0, En, ET, isUnstable, warningMessage };
  }

  calculateMD1(params: MD1Params): QueueResult {
    const { lambda, mu } = params;
    const rho = lambda / mu;

    let isUnstable = false;
    let warningMessage = "";

    if (rho >= 1) {
      isUnstable = true;
      warningMessage =
        "⚠️ Sistema inestable (ρ ≥ 1). Los valores teóricos pueden no ser válidos.";
    }

    // Esperanza matemática del número de clientes
    const En = rho >= 1 ? Infinity : (rho / (1 - rho)) * (1 - rho / 2);

    // Esperanza matemática del tiempo en el sistema
    const ET = rho >= 1 ? Infinity : En / lambda;

    // Valores tradicionales
    const P0 = rho >= 1 ? 0 : 1 - rho;
    const Lq = rho >= 1 ? Infinity : Math.pow(rho, 2) / (2 * (1 - rho));
    const L = rho >= 1 ? Infinity : Lq + rho;
    const Wq = rho >= 1 ? Infinity : Lq / lambda;
    const W = rho >= 1 ? Infinity : L / lambda;

    return { rho, L, Lq, W, Wq, P0, En, ET, isUnstable, warningMessage };
  }
}
