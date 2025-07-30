import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MM1Params } from "../../../models/colas-modelos";

@Component({
  selector: "app-mm1",
  standalone: true,
  templateUrl: "./mm1.component.html",
  imports: [CommonModule, FormsModule],
})
export class MM1Component {
  @Input() params: MM1Params = { lambda: 2, mu: 3 };
  @Output() paramsChange = new EventEmitter<MM1Params>();

  updateLambda(value: number) {
    this.params = { ...this.params, lambda: value };
    this.paramsChange.emit(this.params);
  }

  updateMu(value: number) {
    this.params = { ...this.params, mu: value };
    this.paramsChange.emit(this.params);
  }
}
