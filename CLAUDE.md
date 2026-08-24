# CLAUDE.md — contexto para Claude Code (Paralelo)

## Idioma y tono
- Responder SIEMPRE en español (de Chile), conciso y directo.
- Yhorvi es contador tributario; las analogías contables ayudan.

## Qué es este proyecto
App web para no dejarse sobrecobrar en Venezuela. Una sola página, sin build ni dependencias,
instalable como PWA. Publicada en **https://yhorving.github.io/paralelo/** (GitHub Pages, cuenta `Yhorving`).

Repo git propio dentro de `Documents/CLAUDE/Projects/Paralelo/`, ignorado por el repo padre
(`Projects/Paralelo/` está en el `.gitignore` de arriba). Rama `main`.

## Archivos
```
index.html              todo: HTML + CSS + JS en un solo archivo (~100 KB)
sw.js                   service worker, network-first para el shell
manifest.webmanifest    PWA
icon.svg / icon-maskable.svg
seed-p2p.json           218 días de P2P (17-ene a 24-ago 2026), CC BY 4.0 de usdt.com.ve
README.md
```

## Correr y publicar
```sh
python -m http.server 8731      # y abrir http://127.0.0.1:8731
git push origin main            # GitHub Pages despliega solo, ~1-2 min
```
El CDN de Pages a veces sirve la copia vieja: subir `CACHE` en `sw.js` cuando el cambio deba llegar seguro.
`gh` está en `C:\Program Files\GitHub CLI\gh.exe` (no está en el PATH de bash).

## Las tasas, que es el corazón del asunto
Hay seis referencias publicadas y **no todas son tasas de cobro**:

| Tasa | Qué es | Rol en la app |
|---|---|---|
| BCV Dólar | oficial | la que la ley exige facturar |
| BCV Euro | oficial | **con esta cobran** cuando está más alta |
| Dólar paralelo | mercado | referencia |
| Euro paralelo | derivado | oculto por defecto |
| Binance / Bybit P2P | mercado | **el costo real del usuario** |

- Los comercios cobran con **la más alta entre las dos del BCV**, no con las paralelas.
  Dato de familia que vive allá. `candidatas()` devuelve solo esas dos.
- El **euro paralelo no es un mercado propio**: es el dólar paralelo por el cruce EUR/USD
  (verificado: 923,10 × 1,1644 = 1.074,83). Oculto por defecto, se activa en Ajustes.
- La **Ley Orgánica de Precios Justos (art. 46, num. 5)** obliga a facturar al tipo de cambio del BCV, y la
  SUNDDE exige exhibirlo con un QR para denunciar. Como los bolívares se compran a tasa P2P pero el comercio
  debe recibirlos a BCV, pagar en bolívares deja descuento: ~16% si facturan a BCV Dólar, ~2% si usan BCV Euro.

## Decisiones de diseño que NO hay que revertir
- **`alta()` vs `bcvAlta()`**: la primera son las candidatas de cobro (las dos BCV); la segunda respeta la
  preferencia del usuario en Ajustes. Confundirlas hace que la app se compare contra sí misma.
- **El patrón es el BCV, no la tasa P2P del usuario.** Medir contra la propia haría pasar por "justo" un cobro
  a 935 que legalmente debe ser 784 — justo donde se pierde el descuento.
- **Identificar la tasa por nombre**, no solo medirla: frente al vendedor sirve "es la BCV Euro", no un
  porcentaje. `identificarTasa()` compara contra todas las publicadas.
- **El costo de los gastos se congela al comprar**, no al gastar: se compra saldo una vez y se gasta en días.
- **Una sola entrada en Pagar.** Antes el monto se pedía tres veces y las tres hacían la misma cuenta.
- **Las tasas nunca se sirven desde caché** del service worker: van a `localStorage` y siempre se muestran con
  su antigüedad. Servir un JSON viejo como fresco es peor que no tener dato.
- **Avisos y auto-refresco con topes**: mínimo 15 min entre consultas, se detiene en segundo plano, avisos al
  cruzar el umbral y no mientras siga alto. Sin servidor de push no hay avisos con la app cerrada; está dicho
  en la interfaz, no hay que prometer lo contrario.

## Fuentes de datos
Todas gratis, sin llave y con CORS abierto — se consultan desde el navegador, no hay servidor.

| Dato | Endpoint |
|---|---|
| BCV y paralelos | `ve.dolarapi.com/v1/dolares` y `/v1/euros` |
| BCV 5 monedas + histórico | `bcv.today/api/v1/rate.json` y `/history.json` (~1.800 días) |
| P2P en 13 monedas | `criptoya.com/api/usdt/<fiat>/100` |
| Dólar oficial FX | `open.er-api.com/v6/latest/USD` (el mismo USD/xxx de TradingView) |

**Descartadas, no reintentar:** `p2p.army` cobra la API. `usdt.com.ve` no expone CORS y solo publica 7 días al
cliente (de ahí salió `seed-p2p.json`, de su export completo). `pydolarve.org` es dominio parqueado.
TradingView no tiene API pública gratis. `cotizave.com` pide llave.

## Estructura de la app
Pestañas: **Tasas · Pagar · Cambiar/Calcular · Gastos · Gráfico** + Ajustes (engranaje del header).

Dos modos, en Ajustes:
- **Viajero** (por defecto): moneda de origen y ruta fiat → USDT → bolívares.
- **Residente**: solo Bs y USD. Oculta lo del exterior (`[data-solo-viajero]`) y habilita la pestaña Calcular.

La moneda se detecta sola en el primer arranque por `Intl...timeZone`, con `navigator.language` de respaldo.
Todo local, sin geolocalización ni permisos. `America/Caracas` activa el modo residente.

## Claves de localStorage
```
paralelo.rates    últimas tasas + timestamp        paralelo.hist     lecturas diarias propias
paralelo.bcvhist  histórico BCV cacheado 12 h      paralelo.seed     semilla P2P
paralelo.gastos   gastos                           paralelo.compras  cargas de saldo
paralelo.fiat     moneda de origen                 paralelo.modo     viajero | residente
paralelo.cfg      avisos y auto-refresco           paralelo.ref      auto | usd | eur
paralelo.eurp     mostrar euro paralelo (0 | 1)
```

## Pendiente
- **Premio del billete físico en efectivo**: Yhorvi iba a preguntar allá si el efectivo se reconoce por encima
  de la tasa P2P. El campo está en 0 y la app no inventa el número. Si confirma que es real y estable,
  dejarlo preconfigurado.

## Trampas conocidas al editar
- `index.html` es grande: los heredoc de bash revientan por tamaño. Escribir el bloque a un archivo del
  scratchpad y empalmarlo con Python, o usar Write.
- En bash, `$('id')` dentro de comillas dobles se expande como sustitución de comando y corrompe el archivo.
  Usar comillas simples o Python.
- Al reemplazar texto, verificar que la ocurrencia sea única antes de escribir (`assert s.count(a)==1`).
