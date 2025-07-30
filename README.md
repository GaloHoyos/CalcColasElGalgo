# 🧮 Calculadora de Colas

![Versión](https://img.shields.io/badge/versión-1.0.0-blue)
![Angular](https://img.shields.io/badge/Angular-16+-dd0031)

Una aplicación web interactiva para el cálculo, análisis y visualización de sistemas de colas, desarrollada con Angular.

## ✨ Características

- 📊 **Múltiples modelos de colas**:

  - M/M/1: Sistema básico de una cola y un servidor
  - M/M/1/N: Sistema con capacidad limitada
  - M/M/2: Sistema con dos servidores
  - M/G/1: Sistema con distribución general de tiempo de servicio
  - M/D/1: Sistema con tiempo de servicio determinístico
  - Sistema con prioridades: Atención preferencial por tipo de cliente

- 🎯 **Cálculos precisos** de métricas esenciales:

  - Factor de utilización (ρ)
  - Número promedio de clientes en el sistema (L)
  - Número promedio de clientes en cola (Lq)
  - Tiempo promedio en el sistema (W)
  - Tiempo promedio en cola (Wq)
  - Probabilidad de estado vacío (P₀)

- 🎬 **Simulación visual dinámica** del comportamiento del sistema
- 📱 **Interfaz responsive** optimizada para dispositivos móviles y de escritorio

## 🚀 Demo

Puedes probar la aplicación en vivo [aquí](https://galohoyos.github.io/CalcColasElGalgo/).

## 💻 Tecnologías utilizadas

- [Angular 16+](https://angular.io/)
- [TypeScript](https://www.typescriptlang.org/)
- CSS personalizado para animaciones y estilos

## 📝 Cómo utilizar

1. **Selecciona un modelo** de cola del menú desplegable
2. **Ingresa los parámetros** del modelo:
   - λ (tasa de llegada)
   - μ (tasa de servicio)
   - Otros parámetros según el modelo seleccionado
3. **Visualiza los resultados** de forma inmediata
4. **Inicia la simulación** para ver el comportamiento dinámico del sistema

## 🛠️ Instalación y ejecución local

```bash
# Clonar el repositorio
git clone https://github.com/GaloHoyos/CalcColasElGalgo.git

# Navegar al directorio del proyecto
cd calculadora-colas

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start

# La aplicación estará disponible en http://localhost:4200
```

## 👤 Autor

Desarrollado por [Galo Hoyos Aviles](https://github.com/galohoyos) para la materia Modelización Numérica.

---
