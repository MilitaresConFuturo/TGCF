# iOS — preparación local, sin distribución

Este proyecto Capacitor contiene TGCF y Permanencia. Por decisión del usuario, **no publicar, subir a TestFlight ni distribuir el binario** hasta nueva autorización. La web de producción y Android tampoco se modifican por esta preparación iOS.

## Estado preparado en Windows

- Proyecto nativo: `ios/App/App.xcodeproj` (Capacitor iOS, dependencias Swift Package Manager).
- Identificador previsto: `es.militaresconfuturo.tgcf` (coincide como texto con Android, pero **no** está registrado ni reservado ante Apple).
- Nombre bajo el icono: `TGCF MCF`; versión de proyecto: `1.2` / build `1`, iPhone y iPad, mínimo iOS 15. Son valores de trabajo, no una release iOS validada.
- Icono iOS MCF existente de 1024 × 1024 y recursos de pantalla de inicio presentes. Revisar apariencia final en Xcode/iPhone antes de aprobarla.
- Contenido web de TGCF y Permanencia: `npm run build:web` y `npx cap sync ios` copian el bundle local a `ios/App/App/public/` (esa carpeta generada está ignorada por Git). `npm run mobile:sync` también sincroniza Android; para preparar solo iOS, usar los dos comandos anteriores.
- `npm test` cubre lógica y contrato estático de iOS; no equivale a ejecutar la app iOS. Mantener fuentes web aprobadas sin cambios; la app iOS reutiliza su código.

## Borrador de ficha (no publicado)

- Nombre propuesto: **TGCF MCF**.
- Descripción corta de trabajo: «Consulta los baremos de pruebas físicas TGCF y Permanencia y calcula resultados orientativos según tus marcas».
- Descripción funcional: dos calculadoras independientes, normativa enlazada, marcas introducidas voluntariamente y almacenamiento local para restaurarlas. No presentar resultados como acreditación oficial.
- Material existente: icono MCF, splash e interfaz en español. Capturas iPhone/iPad válidas para una ficha de tienda requieren primero una build ejecutada en simulador/dispositivo Apple; no fabricar capturas ni afirmar aprobación de Apple.
- Antes de cualquier distribución revisar la política `privacy.html`: ahora describe solo TGCF/Anexo II y debe reflejar también Permanencia; no se cambia aquí porque es fuente compartida con la web aprobada. Comprobar también enlace público de privacidad, atribuciones y declaraciones de datos en App Store Connect.

## Validación pendiente en macOS

El emulador Android de Windows no puede ejecutar iOS: contiene Android y su WebView, no el runtime de iPhone/Safari WKWebView. Para una prueba nativa hace falta macOS con Xcode y el simulador de iOS **o un iPhone conectado a un Mac**. Puede ser un Mac propio/prestado o acceso remoto a un Mac; VMware/Kali/AVD Android en este PC no sustituyen Xcode y el SDK de Apple. Un navegador de Windows puede detectar errores web genéricos, no validar firma, permisos, navegación ni comportamiento WKWebView nativo.

En macOS, antes de generar un `.ipa`:

1. Clonar/copiar el repositorio privado de trabajo sin secretos de firma Android; instalar dependencias (`npm ci`, si el lockfile está disponible); ejecutar `npm test`, `npm run build:web` y `npx cap sync ios`.
2. Abrir `ios/App/App.xcodeproj` en Xcode; resolver Swift Packages y comprobar la versión mínima iOS y compatibilidad con la versión de Xcode/Capacitor instalada.
3. Elegir equipo de desarrollo y confirmar disponibilidad del bundle ID en Apple antes de firmar. **No añadir certificados ni perfiles al repositorio.** Una cuenta Apple gratuita puede servir para pruebas locales limitadas con Xcode; para TestFlight/App Store se necesita la membresía de pago del Apple Developer Program.
4. Ejecutar en simulador y, preferiblemente, iPhone real: TGCF → Permanencia → TGCF; cálculo, baremos, icono, pantalla de inicio, orientación, recursos sin red, persistencia y enlaces normativos. Revisar consola y errores de WKWebView (incluidas rutas explícitas a `index.html`). Repetir en iPad si se mantiene `TARGETED_DEVICE_FAMILY = "1,2"`.
5. Solo después de aprobación explícita, planificar certificados de distribución, privacidad, ficha y revisión de App Store. No automatizar subida ni crear distribución pública aquí.

Estado: **preparado estructuralmente; compilación, simulador iOS y dispositivo Apple NO verificados**. Android v1.2 verificado por separado; esa prueba no acredita iOS.

## Copia privada de QA en Codemagic (2026-09-27)

- Instantánea local **nueva**, sin reemplazar anteriores: `../IOS_CI_PRIVADO/snapshot-v1.2-ios-2026-09-27/` (relativa a `PERMANENCIA_2026/TGCF-repo/`). Repositorio nuevo con historial propio: [MCF-Admin28/TGCF-iOS-CI-private](https://github.com/MCF-Admin28/TGCF-iOS-CI-private), visibilidad `PRIVATE` comprobada después de subir el commit `034152e`.
- Revisión del árbol remoto: 72 archivos, sin APK/IPA ni claves de firma, sin workflow de Pages. Contiene el código web, proyecto Xcode y `codemagic.yaml`; no se ha subido la rama local del repo público ni cambiado `main`.
- El workflow de Codemagic es **manual**, usa un Mac M2, ejecuta pruebas Node, sincroniza iOS, compila `.app` sin firma para el simulador, arranca la app y guarda una captura inicial. No hay sección `publishing` ni artefacto de app firmado; por ahora **no se ha ejecutado en un Mac**. La captura inicial no demuestra navegación ni cálculos: falta automatizar esas interacciones o comprobarlas en un Mac interactivo.
- `npm ci --ignore-scripts`, 36/36 tests, `npm run build:web` y `npx cap sync ios` pasaron localmente en la instantánea. `npm ci` informó **1 vulnerabilidad alta** en dependencias: investigar antes de distribución, no aplicar actualizaciones automáticas a ciegas.
- Falta vincular la cuenta personal de Codemagic a GitHub **con acceso solo a este repo privado**, seleccionar el workflow y ejecutarlo manualmente. No activar plan Team, facturación ni webhooks. No compartir públicamente capturas, logs ni enlaces de artefactos. Almacenar cada resultado local con nombre de versión distinto; no borrar versiones previas.

