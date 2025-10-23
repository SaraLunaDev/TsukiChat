# TsukiChat

Extensión que traduce mensajes del chat de YouTube Live y los adapta a un formato similar al de Twitch.

El objetivo que busco con esta extension es poder resubir los Chats de Twitch a Youtube ya que Twitch puso limite a la cantida de VODs que puedes tener, resubir el directo es algo que suele hacer todo el mundo pero no hay forma de resubir el chat de forma limpia mas alla de mostrarlo en pantalla. Con esta extension puedes traducir mensajes con un formato en concreto para simular ese chat resubido.

## Instalación

**Chrome/Edge:**
- https://chromewebstore.google.com/detail/tsukichat/dojcelbefjhbapbhgkplifhcfblpgaab

**Firefox:**
- https://chromewebstore.google.com/detail/tsukichat/dojcelbefjhbapbhgkplifhcfblpgaab

## Uso

**Aplicacion para clonar los mensajes**

Usa cualquier aplicacion que pueda leer mensajes de Twitch y enviar mensajes a Youtube

- https://sammi.solutions/ (os dejo el Deck ya hecho en los archivos del proyecto para que podais importarlo)

- https://streamer.bot/ (teneis que hacerlo vosotros, pero es sencillo seguro que podeis <3)

**Formato de mensaje:**

Con alguna de esas aplicaciones debes obtener la informacion del mensaje recibido de twitch y clonarlo a youtube con este formato

```
BADGES#COLOR[USERNAME]MESSAGE
```
Ejemplo: `0#FF5733[TsukiSoft]¡Hola mundo! Kappa`

- Badges disponibles: 0: Streamer - 1: Vip - 2: Mod - 3: Subs

Para eventos mas de lo mismo, obten la informacion del evento recibido en twitch y clonalo a youtube de esta forma

```
PREFIJO_[USERNAME][DATA]
```
Ejemplo: `sub_[TsukiSoft]se acaba de suscribir x23 meses!`

- Prefijos disponibles: sub - bit - raid - gifted - kofi

## Configuración

En el popup puedes activar/desactivar:
- Modo oscuro/claro
- Fondos alternados  
- Líneas divisorias
- Ajuste de colores
- Tamaño de fuente
- Timestamps
- Badges individuales
- Emotes 7TV