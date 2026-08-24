# Paralelo

Calculadora de tasas para viajar a Venezuela. Una sola página, sin build, sin dependencias.

Responde tres preguntas:

- **¿A qué tasa me van a cobrar?** Los comercios usan la más alta entre BCV Dólar, BCV Euro y Binance P2P.
- **¿Cuánto estoy pagando de verdad?** Tu costo real sale de tu tasa de reposición (vender USDT en P2P), no de la tasa oficial.
- **¿Me están sobrecobrando?** Semáforo con la tasa aplicada y el sobreprecio en dólares.

## Pestañas

| | |
|---|---|
| **Tasas** | Cotizaciones del día al estilo monitordolarvzla, brechas y tabla de bolsillo |
| **Pagar** | Semáforo de sobreprecio, desglose, pago con billetes en efectivo y detector de tasa abusiva |
| **Cambiar** | La ruta completa: tu moneda → USDT → bolívares, comparada contra las tasas oficiales |
| **Gastos** | Saldo real: compras con su tasa, gastos descontados y sobreprecio acumulado, exportable a CSV |
| **Gráfico** | Histórico de BCV y P2P con brecha, y proyección |

## Fuentes

| Dato | Fuente | Notas |
|---|---|---|
| BCV USD/EUR en vivo | `ve.dolarapi.com` | también `bcv.today` como respaldo |
| BCV histórico | `bcv.today/api/v1/history.json` | ~1.800 días; el euro desde enero 2026 |
| P2P en bolívares | `criptoya.com/api/usdt/ves` | Binance, Bybit, OKX, Bitget y más |
| P2P en tu moneda | `criptoya.com/api/usdt/<fiat>` | 13 monedas |
| Dolar oficial FX | `open.er-api.com` | el mismo USD/xxx que grafica TradingView |
| Semilla P2P | `seed-p2p.json` | 8 dias de usdt.com.ve (CC BY 4.0), una sola vez |

Todas son gratis, sin llave y con CORS abierto: la app las consulta directo desde el navegador, no hay servidor.

No existe API pública gratuita del histórico del P2P — [p2p.army](https://p2p.army/es/p2p/fiats/VES/charts/USDT)
lo tiene pero su API es de pago, y una llave metida en una página estática queda a la vista. Por eso la app
acumula sus propias lecturas: cada vez que la abres guarda la tasa del día.

## Notas de diseño

- **`alta()` vs `bcvAlta()`**: la primera es la más alta de las tres (lo que te cobran); la segunda solo entre
  las oficiales (para medir la brecha). Confundirlas hace que la app se compare contra sí misma.
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
