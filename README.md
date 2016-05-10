# Chart komponens
## Követelmények
* npm csomagok: `d3 moment.js node-uuid d3 jquery lodash bluebird`
* Bower/CDN/statikus/akármi: `jquery jquery-ui`

## Telepítés
* minden ami a komponenshez kell a `medchart` könyvtárban van
* húzd be a `chart.css`-t és a JQueryUI cuccait
* bootstrapeld be a `ReadingService`-t
* használat előtt adj minta adatot a `ReadingService`-nek
* használd a `GraphPaginatorComp`-ot mint `<graph-paginator>` vagy a `GraphComp`-ot mint `<graph-graph [data]=valami>`-ot ha nem kell a 'szerver' lapozás

# Használat
* A felső JQueryUI slider a lekérdendő idő intervallumot kezeli.
Ennek módosításával változik az alatta lévő chart.
* A chart az aktuálisan lekért adatokat mutatja. A szürke sávval
lehet zoomolni.

# Minta oldal
* `npm i bower -g` (ha nem lenne fent)
* `bower install`
* `npm install`
* `tsc` és hagyd figyelmen kívül az errorokat
* `webpack-dev-server --colors --progress`
* `app.html` megnyit

## Felépítés
* A GraphPaginatorComp `<graph-paginator>` megjelenít egy JQueryUI slidert a 'szerveren lévő'
 maximális időintervallummal és alatta egy `GrapComp`-ot magával a chart-tal.
 Ez a komponens a `ReadingService`-ből veszi az intervallumot és az aktuális kiválasztott
 intervallum alapján kéri le a megfigyeléseket amit átad a chart komponens
 inputjának
* A GraphComp `<graph-graph>` maga a chart ami a `data` inputon várja a
megjeleníteni kívánt adatokat (más formátumban mint ahogy a mockolt data.ts-ben van!). Amennyiben az input változik a chart is frissül
* A `ReadingService` a szerveren lévő adatokat mockolja.
  * a `setSource(pulseFlat, sysFlat, diasFlat, timestampFlat)` állítja be
  a mockolt értékeket. A paraméreteri mind tömbök.
  * a `dateRange()` egy promise-szal tér vissza ami a mockolt dátumok min/max értékét adja vissza
  `{start: kezdőTimestamp, end: végTimestamp}` formában
  * a `queryRange(start, stop)` egy promise-t ad vissza ami az adott időintervallumba eső megfigyelésekkel tér vissza

## Mock adatok
A mock adatok egy TS modulban vannak `data.ts` néven a következő formában:
```javascript
var pulseFlat=[89,84,62, ...];
var sysFlat=[130,138,99, ...];
var diasFlat=[120,118,69, ...];
var timestampFlat=[1433052000,1433066400,1433080800, ...];
export default {pulseFlat, sysFlat, diasFlat, timestampFlat};
```
A `csv1.rb` egy meglehetősen tróger minőségű szkript amivel az Excell fájlból kigenerált
csv-ből (adatok_v2.csv) tud ilyen formába konvertálni. Két paramétere van: kezdő index és az elemek száma.

`ruby csv.rb > data.ts`

A mockadatok a példában az `App` komponens konstruktorában van behúzva mint modul és
átadva a `ReadingService`-nek a `setSource()`-on keresztül.

# Ha a lapozás nem működik de közel a demó
A chart <graph-graph> komponensét önállóan is lehet használni, nem kell neki a
szerver lapozás. Ennek a komponensnek a `data` inputja a következő
formában várja a megfigyeléseket:
```javascript
{
  dias: 124,
  sys: 154,
  pulse: 98,
  timestamp: new Date(...)
}
```
# Know issues
* lapozás után a csuszka csak átméretezhető, nem huzogazható