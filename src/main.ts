import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { CalculadoraColasComponent } from "./app/components/calculadora-colas.component";

@Component({
  selector: "app-root",
  template: `<app-calculadora-colas></app-calculadora-colas>`,
  standalone: true,
  imports: [CalculadoraColasComponent],
})
export class App {}

bootstrapApplication(App);
