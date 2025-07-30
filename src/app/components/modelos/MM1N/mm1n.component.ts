import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MM1NParams } from "../../../models/colas-modelos";

@Component({
  selector: "app-mm1n",
  standalone: true,
  templateUrl: "./mm1n.component.html",
  imports: [CommonModule, FormsModule],
})
export class MM1NComponent {
  @Input() params: MM1NParams = { lambda: 2, mu: 3, N: 10 };
  @Output() paramsChange = new EventEmitter<MM1NParams>();

  updateLambda(value: number) {
    this.params = { ...this.params, lambda: value };
    this.paramsChange.emit(this.params);
  }

  updateMu(value: number) {
    this.params = { ...this.params, mu: value };
    this.paramsChange.emit(this.params);
  }

  updateN(value: number) {
    this.params = { ...this.params, N: value };
    this.paramsChange.emit(this.params);
  }
}
