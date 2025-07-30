import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MG1Params } from "../../../models/colas-modelos";

@Component({
  selector: "app-mg1",
  standalone: true,
  templateUrl: "./mg1.component.html",
  imports: [CommonModule, FormsModule],
})
export class MG1Component {
  @Input() params: MG1Params = { lambda: 2, mu: 3, sigma: 0.5 };
  @Output() paramsChange = new EventEmitter<MG1Params>();

  updateLambda(value: number) {
    this.params = { ...this.params, lambda: value };
    this.paramsChange.emit(this.params);
  }

  updateMu(value: number) {
    this.params = { ...this.params, mu: value };
    this.paramsChange.emit(this.params);
  }

  updateSigma(value: number) {
    this.params = { ...this.params, sigma: value };
    this.paramsChange.emit(this.params);
  }
}
