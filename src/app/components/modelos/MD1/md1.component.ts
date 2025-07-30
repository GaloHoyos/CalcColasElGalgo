import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MD1Params } from "../../../models/colas-modelos";

@Component({
  selector: "app-md1",
  standalone: true,
  templateUrl: "./md1.component.html",
  imports: [CommonModule, FormsModule],
})
export class MD1Component {
  @Input() params: MD1Params = { lambda: 2, mu: 3 };
  @Output() paramsChange = new EventEmitter<MD1Params>();

  updateLambda(value: number) {
    this.params = { ...this.params, lambda: value };
    this.paramsChange.emit(this.params);
  }

  updateMu(value: number) {
    this.params = { ...this.params, mu: value };
    this.paramsChange.emit(this.params);
  }
}
