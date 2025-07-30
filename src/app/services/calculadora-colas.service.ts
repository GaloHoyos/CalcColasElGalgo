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

    if (rho >= 1) {
      throw new Error(
        "El sistema es inestable (ρ ≥ 1). λ debe ser menor que μ."
      );
    }

    const P0 = 1 - rho;
    const L = rho / (1 - rho);
    const Lq = (rho * rho) / (1 - rho);
    const W = 1 / (mu - lambda);
    const Wq = rho / (mu - lambda);

    return { rho, L, Lq, W, Wq, P0 };
  }

  calculateMM1N(params: MM1NParams): QueueResult {
    const { lambda, mu, N } = params;
    const rho = lambda / mu;

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
    };
  }

  private getProbabilityN(n: number, rho: number, P0: number): number {
    if (rho === 1) {
      return P0;
    }
    return P0 * Math.pow(rho, n);
  }

  calculateMM2(params: MM2Params): QueueResult {
    const { lambda, mu } = params;
    const rho = lambda / (2 * mu);

    if (rho >= 1) {
      throw new Error(
        "El sistema es inestable (ρ ≥ 1). λ debe ser menor que 2μ."
      );
    }

    const P0 = 1 - rho;
    const Lq = Math.pow(rho, 2) / (1 - rho);
    const L = rho / (1 - rho);
    const Wq = Lq / lambda;
    const W = L / lambda;

    return { rho, L, Lq, W, Wq, P0 };
  }

  calculatePriorityNoPreempt(params: PriorityParams): PriorityResult {
    const { lambda1, lambda2, mu, W0 } = params;
    const rho = (lambda1 + lambda2) / mu;

    if (rho >= 1) {
      throw new Error("El sistema es inestable (ρ ≥ 1).");
    }

    // Probabilidad de sistema vacío
    const P0 = 1 - rho;

    // Clientes clase 1 (alta prioridad)
    const Ts1 = 1 / mu;
    const Q1 = Math.pow(lambda1, 2) / (mu * (mu - lambda1));
    const Wq1 = W0 + Q1 * Ts1;
    const W1 = Wq1 + Ts1;
    const L1 = lambda1 * W1;
    const Lq1 = lambda1 * Wq1;

    // Clientes clase 2 (baja prioridad)
    const Ts2 = 1 / mu;
    const Q2 =
      (lambda2 * (lambda1 + lambda2)) /
      (mu * (mu - lambda1) * (mu - lambda1 - lambda2));
    const Wq2 = W0 + Q1 * Ts1 + Q2 * Ts2;
    const W2 = Wq2 + Ts2;
    const L2 = lambda2 * W2;
    const Lq2 = lambda2 * Wq2;

    return {
      rho,
      P0,
      class1: { L: L1, Lq: Lq1, W: W1, Wq: Wq1 },
      class2: { L: L2, Lq: Lq2, W: W2, Wq: Wq2 },
      system: { L: L1 + L2, Lq: Lq1 + Lq2 },
    };
  }

  calculateMG1(params: MG1Params): QueueResult {
    const { lambda, mu, sigma } = params;
    const rho = lambda / mu;

    if (rho >= 1) {
      throw new Error("El sistema es inestable (ρ ≥ 1).");
    }

    // Esperanza matemática del número de clientes
    const En =
      (rho / (1 - rho)) * (1 - (rho / 2) * (1 - Math.pow(mu * sigma, 2)));

    // Esperanza matemática del tiempo en el sistema
    const ET = En / lambda;

    // Valores tradicionales
    const P0 = 1 - rho;
    const variance = Math.pow(sigma, 2);
    const Lq =
      (Math.pow(lambda, 2) * variance + Math.pow(rho, 2)) / (2 * (1 - rho));
    const L = Lq + rho;
    const Wq = Lq / lambda;
    const W = L / lambda;

    return { rho, L, Lq, W, Wq, P0, En, ET };
  }

  calculateMD1(params: MD1Params): QueueResult {
    const { lambda, mu } = params;
    const rho = lambda / mu;

    if (rho >= 1) {
      throw new Error("El sistema es inestable (ρ ≥ 1).");
    }

    // Esperanza matemática del número de clientes
    const En = (rho / (1 - rho)) * (1 - rho / 2);

    // Esperanza matemática del tiempo en el sistema
    const ET = En / lambda;

    // Valores tradicionales
    const P0 = 1 - rho;
    const Lq = Math.pow(rho, 2) / (2 * (1 - rho));
    const L = Lq + rho;
    const Wq = Lq / lambda;
    const W = L / lambda;

    return { rho, L, Lq, W, Wq, P0, En, ET };
  }
}
