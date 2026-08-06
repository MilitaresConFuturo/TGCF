# TGCF

Simulador público de evaluación física periódica de las Fuerzas Armadas, basado en los baremos del Anexo II de la Orden DEF/15/2026 (BOE de 21/01/2026).

## Uso

Abre `index.html` en un navegador o visita la versión publicada mediante GitHub Pages.

- Configura sexo y edad en el perfil.
- Introduce tus marcas o consulta el corte general APTO.
- La aptitud exige al menos 20 puntos en cada prueba aplicable; no hay compensación por media.

## Desarrollo y validación

```bash
npm test
```

Los baremos se encuentran en `src/data/annex-ii.json`; la lógica de cálculo está en `src/calculator.js`.

## Distribución móvil

La app Android e iOS se empaqueta con Capacitor. La APK debug es solo para pruebas; una publicación requiere un AAB Android firmado y, para iOS, macOS/Xcode y TestFlight.

> Información orientativa. Consulta siempre la normativa oficial vigente.
