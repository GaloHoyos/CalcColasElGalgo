import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { QueueType } from "../../models/colas-modelos";

@Component({
  selector: "app-selector-modelo",
  standalone: true,
  templateUrl: "./selector-modelo.component.html",
  styleUrls: ["./selector-modelo.component.css"],
  imports: [CommonModule],
})
export class QueueSelectorComponent {
  @Input() selectedQueue: QueueType = "MM1";
  @Input() queueTypes: QueueType[] = [];
  @Output() queueSelected = new EventEmitter<QueueType>();

  onQueueSelect(type: QueueType) {
    this.queueSelected.emit(type);
  }
}
