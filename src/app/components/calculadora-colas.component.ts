import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CalculadoraColasService } from "../services/calculadora-colas.service";
import {
  QueueResult,
  QueueType,
  MM1Params,
  MM1NParams,
  MM2Params,
  MG1Params,
  MD1Params,
  PriorityParams,
} from "../models/colas-modelos";
import { QueueAnimationComponent } from "./animacion/animacion.component";
import { QueueSelectorComponent } from "./selector-modelo/selector-modelo.component";
import { MM1Component } from "./modelos/MM1/mm1.component";
import { MM1NComponent } from "./modelos/MM1N/mm1n.component";
import { MM2Component } from "./modelos/MM2/mm2.component";
import { MG1Component } from "./modelos/MG1/mg1.component";
import { MD1Component } from "./modelos/MD1/md1.component";
import { QueueResultsComponent } from "./resultados/resultados.component";
import { PriorityComponent } from "./modelos/Prioridades/priority.component";

@Component({
  selector: "app-calculadora-colas",
  standalone: true,
  templateUrl: "calculadora-colas.component.html",
  imports: [
    CommonModule,
    QueueAnimationComponent,
    QueueSelectorComponent,
    MM1Component,
    MM1NComponent,
    MM2Component,
    MG1Component,
    MD1Component,
    PriorityComponent,
    QueueResultsComponent,
  ],
})
export class CalculadoraColasComponent {
  selectedQueue: QueueType = "MM1";
  queueTypes: QueueType[] = ["MM1", "MM1N", "MM2", "MG1", "MD1", "Prioridades"];
  queueParams: any = null;

  mm1Params: MM1Params = { lambda: 2, mu: 3 };
  mm1nParams: MM1NParams = { lambda: 2, mu: 3, N: 10 };
  mm2Params: MM2Params = { lambda: 3, mu: 2, differentSpeeds: false };
  mg1Params: MG1Params = { lambda: 2, mu: 3, sigma: 0.5 };
  md1Params: MD1Params = { lambda: 2, mu: 3 };
  priorityParams: PriorityParams = {
    lambda1: 2,
    lambda2: 1,
    mu: 5,
    W0: 0,
  };

  result: QueueResult | null = null;
  errorMessage: string = "";

  constructor(private queueCalculator: CalculadoraColasService) {
    this.calculateResults();
  }

  selectQueue(type: QueueType) {
    this.selectedQueue = type;
    this.calculateResults();
  }

  onMM1ParamsChange(params: MM1Params) {
    this.mm1Params = params;
    this.calculateResults();
  }

  onMM1NParamsChange(params: MM1NParams) {
    this.mm1nParams = params;
    this.calculateResults();
  }

  onMM2ParamsChange(params: MM2Params) {
    this.mm2Params = params;
    this.calculateResults();
  }

  onMG1ParamsChange(params: MG1Params) {
    this.mg1Params = params;
    this.calculateResults();
  }

  onMD1ParamsChange(params: MD1Params) {
    this.md1Params = params;
    this.calculateResults();
  }

  calculateResults() {
    try {
      this.errorMessage = "";

      switch (this.selectedQueue) {
        case "MM1":
          if (this.mm1Params.lambda > 0 && this.mm1Params.mu > 0) {
            this.queueParams = this.mm1Params;
            this.result = this.queueCalculator.calculateMM1(this.mm1Params);
          }
          break;

        case "MM1N":
          if (
            this.mm1nParams.lambda > 0 &&
            this.mm1nParams.mu > 0 &&
            this.mm1nParams.N > 0
          ) {
            this.queueParams = this.mm1nParams;
            this.result = this.queueCalculator.calculateMM1N(this.mm1nParams);
          }
          break;

        case "MM2":
          if (this.mm2Params.lambda > 0 && this.mm2Params.mu > 0) {
            this.queueParams = this.mm2Params;
            this.result = this.queueCalculator.calculateMM2(this.mm2Params);
          }
          break;

        case "MG1":
          if (
            this.mg1Params.lambda > 0 &&
            this.mg1Params.mu > 0 &&
            this.mg1Params.sigma >= 0
          ) {
            this.queueParams = this.mg1Params;
            this.result = this.queueCalculator.calculateMG1(this.mg1Params);
          }
          break;

        case "MD1":
          if (this.md1Params.lambda > 0 && this.md1Params.mu > 0) {
            this.queueParams = this.md1Params;
            this.result = this.queueCalculator.calculateMD1(this.md1Params);
          }
          break;
        case "Prioridades":
          if (
            this.priorityParams.lambda1 > 0 &&
            this.priorityParams.lambda2 > 0 &&
            this.priorityParams.mu > 0
          ) {
            this.queueParams = this.priorityParams;
            const priorityResult =
              this.queueCalculator.calculatePriorityNoPreempt(
                this.priorityParams
              );

            this.result = {
              rho: priorityResult.rho,
              P0: priorityResult.P0,
              L: priorityResult.system.L,
              Lq: priorityResult.system.Lq,
              W:
                (priorityResult.class1.W * this.priorityParams.lambda1 +
                  priorityResult.class2.W * this.priorityParams.lambda2) /
                (this.priorityParams.lambda1 + this.priorityParams.lambda2),
              Wq:
                (priorityResult.class1.Wq * this.priorityParams.lambda1 +
                  priorityResult.class2.Wq * this.priorityParams.lambda2) /
                (this.priorityParams.lambda1 + this.priorityParams.lambda2),
              priorityData: priorityResult,
            };
          }
          break;
      }
    } catch (error: any) {
      this.errorMessage = error.message;
      this.result = null;
      this.queueParams = null;
    }
  }
  onPriorityParamsChange(params: PriorityParams) {
    this.priorityParams = params;
    this.calculateResults();
  }
  getCurrentArrivalRate(): number {
    switch (this.selectedQueue) {
      case "MM1":
        return this.mm1Params.lambda;
      case "MM1N":
        return this.mm1nParams.lambda;
      case "MM2":
        return this.mm2Params.lambda;
      case "MG1":
        return this.mg1Params.lambda;
      case "MD1":
        return this.md1Params.lambda;
      case "Prioridades":
        return this.priorityParams.lambda1 + this.priorityParams.lambda2;
      default:
        return 0;
    }
  }

  getCurrentServiceRate(): number {
    switch (this.selectedQueue) {
      case "MM1":
        return this.mm1Params.mu;
      case "MM1N":
        return this.mm1nParams.mu;
      case "MM2":
        return this.mm2Params.mu;
      case "MG1":
        return this.mg1Params.mu;
      case "MD1":
        return this.md1Params.mu;
      case "Prioridades":
        return this.priorityParams.mu;
      default:
        return 0;
    }
  }

  getCurrentServerRates(): number[] | undefined {
    switch (this.selectedQueue) {
      case "MM2":
        // Para MM2, verificar si tiene velocidades diferentes
        if (this.mm2Params.differentSpeeds && this.mm2Params.mu2) {
          return [this.mm2Params.mu, this.mm2Params.mu2];
        }
        return [this.mm2Params.mu, this.mm2Params.mu];
      default:
        return undefined; // Para otros sistemas usar la velocidad general
    }
  }

  getCurrentCapacity(): number | undefined {
    return this.selectedQueue === "MM1N" ? this.mm1nParams.N : undefined;
  }
}
