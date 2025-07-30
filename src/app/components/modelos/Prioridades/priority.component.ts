import { Component, EventEmitter, Input, Output } from "@angular/core";
import { PriorityParams } from "../../../models/colas-modelos";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-priority",
  standalone: true,
  templateUrl: "./priority.component.html",
  imports: [CommonModule, FormsModule],
})
export class PriorityComponent {
  @Input() params: PriorityParams = {
    lambda1: 2,
    lambda2: 1,
    mu: 5,
    W0: 0,
  };

  @Output() paramsChange = new EventEmitter<PriorityParams>();

  updateLambda1(value: number) {
    this.params = { ...this.params, lambda1: value };
    this.paramsChange.emit(this.params);
  }

  updateLambda2(value: number) {
    this.params = { ...this.params, lambda2: value };
    this.paramsChange.emit(this.params);
  }

  updateMu(value: number) {
    this.params = { ...this.params, mu: value };
    this.paramsChange.emit(this.params);
  }

  updateW0(value: number) {
    this.params = { ...this.params, W0: value };
    this.paramsChange.emit(this.params);
  }
}
