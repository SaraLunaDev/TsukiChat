# TsukiChat - Extensión para Firefox

## Instalación para Firefox

### Opción 1: Instalación temporal (para desarrollo/pruebas)

1. Abre Firefox
2. Ve a `about:debugging#/runtime/this-firefox`
3. Haz clic en "Cargar complemento temporal..."
4. Selecciona el archivo `manifest_firefox.json`

### Opción 2: Empaquetado para publicación

1. Asegúrate de tener todos los archivos necesarios:
   - `manifest_firefox.json` (renombrar a `manifest.json`)
   - `popup_firefox.html` (renombrar a `popup.html`)
   - `popup_firefox.js` (renombrar a `popup.js`)
   - `content_firefox.js` (renombrar a `content.js`)
   - `styles.css`
   - Carpeta `icons/` con los iconos

2. Comprime todos los archivos en un ZIP
3. Sube el ZIP a [Firefox Add-ons](https://addons.mozilla.org/developers/)

## Diferencias con la versión de Chrome

### Manifest
- Usa Manifest V2 en lugar de V3
- `browser_action` en lugar de `action`
- Permisos de host incluidos directamente en `permissions`
- Incluye configuración específica de Firefox en `applications.gecko`

### JavaScript
- Usa `browser` API cuando está disponible, con fallback a `chrome`
- Mejor manejo de promesas para compatibilidad
- Manejo de errores mejorado para las APIs de Firefox

### Características soportadas
- ✅ Modificación de apariencia del chat
- ✅ Fondo alternado configurable
- ✅ Almacenamiento de preferencias
- ✅ Popup de configuración
- ✅ Todas las funcionalidades de la versión Chrome

## Publicación en Firefox Add-ons

1. **Crear cuenta**: Regístrate en [Firefox Add-ons](https://addons.mozilla.org/developers/)
2. **Preparar archivos**: Usa el script de build para generar la versión de Firefox
3. **Subir extensión**: Sigue el proceso de revisión de Mozilla
4. **Política de privacidad**: Usa la misma política creada para Chrome

## Compatibilidad

- **Firefox mínimo**: 58.0 (Firefox Quantum)
- **APIs utilizadas**: Storage, Tabs, Runtime
- **Permisos**: Idénticos a la versión Chrome