# Paralelo

Calculadora de tasas para viajar a Venezuela. Una sola página, sin build, sin dependencias.

Responde cuatro preguntas:

- **¿Cuánto me ahorro pagando en bolívares?** La Ley Orgánica de Precios Justos (art. 46, num. 5) obliga a
  facturar al tipo de cambio del BCV. Como tus bolívares los compraste a tasa P2P, que es mas alta, pagar en
  bolívares en un comercio que cumple te deja un descuento de ~16%.

- **¿A qué tasa me van a cobrar?** Los comercios usan la más alta entre BCV Dólar, BCV Euro y Binance P2P.
- **¿Cuánto estoy pagando de verdad?** Tu costo real sale de tu tasa de reposición (vender USDT en P2P), no de la tasa oficial.
- **¿Me están sobrecobrando?** Semáforo con la tasa aplicada y el sobreprecio en dólares.

## Pestañas

| | |
|---|---|
| **Tasas** | Cotizaciones del día al estilo monitordolarvzla, brechas y tabla de bolsillo |
| **Pagar** | Un solo monto: semáforo, desglose y análisis de la tasa. Aparte, el pago con billetes |
| **Cambiar** | La ruta completa: tu moneda → USDT → bolívares, comparada contra las tasas oficiales |
| **Gastos** | Saldo real: compras con su tasa, gastos descontados y sobreprecio acumulado, exportable a CSV |
| **Calcular** | Solo en modo residente: conversor con copiar, las 5 monedas del BCV, tasa de cualquier fecha |
| **Gráfico** | Histórico de BCV y P2P con brecha, y proyección |

## Dos modos

**Viajero** (por defecto): moneda de origen configurable y la ruta completa fiat → USDT → bolívares.

**Residente**: para quien vive allá, cobra o ahorra en dólares y gasta en bolívares. Desaparecen la moneda de
origen y la ruta desde el exterior; aparece la pestaña Calcular. Se cambia en Ajustes.

## Fuentes

| Dato | Fuente | Notas |
|---|---|---|
| BCV USD/EUR en vivo | `ve.dolarapi.com` | también `bcv.today` como respaldo |
| BCV histórico | `bcv.today/api/v1/history.json` | ~1.800 días; el euro desde enero 2026 |
| P2P en bolívares | `criptoya.com/api/usdt/ves` | Binance, Bybit, OKX, Bitget y más |
| P2P en tu moneda | `criptoya.com/api/usdt/<fiat>` | 13 monedas |
| Dolar oficial FX | `open.er-api.com` | el mismo USD/xxx que grafica TradingView |
| Semilla P2P | `seed-p2p.json` | 218 dias de usdt.com.ve (CC BY 4.0), export completo |

Todas son gratis, sin llave y con CORS abierto: la app las consulta directo desde el navegador, no hay servidor.

No hay API gratuita en vivo del histórico del P2P: [p2p.army](https://p2p.army/es/p2p/fiats/VES/charts/USDT)
la cobra, y usdt.com.ve no expone CORS ni publica más de 7 días al cliente. Lo que sí publica es un export
completo del dataset, que va en `seed-p2p.json` (17-ene-2026 a 24-ago-2026). De ahí en adelante la app acumula
sus propias lecturas, que siempre pisan a la semilla.

## Notas de diseño

- **Los comercios cobran con la BCV más alta**, dólar o euro, no con las paralelas (reportado por gente que
  vive allá). Las paralelas y el P2P quedan como referencia de cuánto vale tu dinero, no como tasas de cobro.
  Configurable en Ajustes, pero el valor útil es la identificación automática.
- **Moneda detectada sola**: en el primer arranque se deduce del `timeZone` del dispositivo, con el idioma
  como respaldo. Todo local: no se consulta ningún servicio de geolocalización ni se pide permiso. Si detecta
  `America/Caracas` activa el modo residente, porque ahí no hay moneda de origen que convertir. Se puede
  cambiar desde Pagar, desde Tasas o desde Ajustes — los tres selectores están sincronizados.
- **Identificar la tasa, no solo medirla**: frente al vendedor sirve el nombre, no el porcentaje. Con el precio
  en dólares la app compara la tasa aplicada contra todas las publicadas y dice cuál es, o que no es ninguna.
- **Una sola entrada en Pagar**: antes el monto se pedía tres veces (semáforo, desglose y detector) y las
  tres hacían la misma cuenta. Ahora un campo alimenta todo; el precio en USD es opcional y desbloquea el
  análisis de la tasa. El pago con billetes sigue aparte porque es otra pregunta: ahí el problema es el vuelto.
- **El patrón es el BCV, no tu tasa P2P**: el semáforo y el detector miden contra el BCV, porque es la tasa
  que la ley exige facturar. Medir contra la propia tasa P2P haría pasar por "justo" un cobro a 935 que
  legalmente debe ser 784 — que es exactamente donde se pierde el descuento de pagar en bolívares. La tasa
  P2P sigue apareciendo, pero como segundo umbral: por encima de ella ya se pierde plata de verdad.
- **`alta()` vs `bcvAlta()`**: la primera es la más alta de las tres (lo que te cobran); la segunda solo entre
  las oficiales (para medir la brecha). Confundirlas hace que la app se compare contra sí misma.
- **Euro paralelo**: existe y se publica, pero no es un mercado aparte — no hay libro de órdenes EUR/VES con
  volumen propio. Sale de multiplicar el dólar paralelo por el cruce EUR/USD (verificado: 923,10 × 1,1644 =
  1.074,83). Entra como candidata porque un comercio puede aplicarlo, y se muestra también llevado a dólares
  para que se vea el riesgo real: que apliquen una tasa por euro a un precio marcado en dólares.
- **Costo congelado**: una compra fija tu costo por bolivar. Los gastos se valoran contra esa tasa,
  no contra la del dia en que gastas, porque comprar y gastar no ocurren juntos.
- **Avisos**: se disparan al cruzar el umbral, no mientras siga alto, y con una espera mínima entre avisos.
  Solo funcionan con la app abierta: no hay servidor de push.
- **Auto-refresco**: mínimo 15 minutos y se detiene con la pestaña en segundo plano, para no castigar APIs gratis.
- **Offline**: service worker con network-first para el shell. Las tasas nunca se sirven desde caché — se
  guardan en `localStorage` y siempre se muestran con su antigüedad.

## Correr en local

```sh
python -m http.server 8731
```

Y abrir <http://127.0.0.1:8731>.
