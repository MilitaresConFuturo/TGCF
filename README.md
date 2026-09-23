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

La app Android e iOS se empaqueta con Capacitor. La APK debug usa el identificador `.preview` y es solo para pruebas. La rama local dispone de una primera APK **release** 1.1 firmada, pero no está publicada ni probada en un dispositivo; Play Store requiere además un AAB y su flujo de firma correspondiente.

### Firma y actualizaciones Android (Windows)

- La primera versión estable usa el identificador `es.militaresconfuturo.tgcf` y `versionCode 2`. Al dejar atrás la APK anterior, firmada con otra clave, habrá que desinstalarla antes de instalar esta; sus datos locales no se trasladan.
- La clave estable está **fuera de Git**, en `%LOCALAPPDATA%/TGCF-Signing/tgcf-release.p12`. Su contraseña aleatoria está protegida por DPAPI para el usuario Windows actual; jamás se guarda en texto claro en este repositorio ni en `keystore.properties`.
- Para una versión futura, aumenta `versionCode` en `android/app/build.gradle`, ejecuta `python scripts/tgcf-signing.py build` desde la raíz del proyecto y comprueba firma, identificador y versión con `apksigner verify --print-certs` y `aapt dump badging`. No regeneres ni sustituyas la clave.
- `python scripts/tgcf-signing.py status` muestra la huella pública. Ejecutado personalmente fuera de un terminal registrado, `python scripts/tgcf-signing.py recovery` abre una ventana local para que el titular anote la contraseña de recuperación en un gestor seguro o soporte físico fuera del PC; no la pegues en chats, incidencias ni repositorios.
- Hay copias del `.p12` y del blob DPAPI en `D:/MCF/TGCF_CUSTODIA_PRIVADA/` y `E:/TGCF_CUSTODIA_PRIVADA/` de este equipo. **No son una recuperación independiente ante pérdida del PC o perfil Windows**: conservar una copia cifrada del `.p12` y la contraseña en un gestor seguro o fuera del PC antes de distribuir la APK estable.
- No existe todavía una prueba de actualización ni de conservación de datos en un teléfono Android. Hazla antes de una distribución real.

> Información orientativa. Consulta siempre la normativa oficial vigente.
