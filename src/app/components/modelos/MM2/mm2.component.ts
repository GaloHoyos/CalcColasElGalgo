import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MM2Params } from "../../../models/colas-modelos";

@Component({
  selector: "app-mm2",
  standalone: true,
  templateUrl: "./mm2.component.html",
  imports: [CommonModule, FormsModule],
})
export class MM2Component {
  @Input() params: MM2Params = { lambda: 3, mu: 2, differentSpeeds: false };
  @Output() paramsChange = new EventEmitter<MM2Params>();

  updateLambda(value: number) {
    this.params = { ...this.params, lambda: value };
    this.paramsChange.emit(this.params);
  }

  updateMu(value: number) {
    this.params = { ...this.params, mu: value };
    this.paramsChange.emit(this.params);
  }

  updateMu2(value: number) {
    this.params = { ...this.params, mu2: value };
    this.paramsChange.emit(this.params);
  }

  toggleServerSpeeds(differentSpeeds: boolean) {
    this.params = {
      ...this.params,
      differentSpeeds,
      mu2: differentSpeeds ? this.params.mu2 || this.params.mu : undefined,
    };
    this.paramsChange.emit(this.params);
  }
}
