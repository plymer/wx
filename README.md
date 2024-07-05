# Readme

## Implemented:

- [x] TAF Plus [JSON](https://metaviation.ec.gc.ca/hubwx/scripts/getForecasterNotes.php?site0=CYYZ&site1=CYUL&site2=CYYC&site3=CYVR)
- [x] Basic Weather Map
- [x] Basic Public Forecast & Alerts retrieval

## To Do:

### Ryan:
- [ ] Enable NOTAM lookup and mode switching
- [ ] PIREPs, SIGMETs, AIRMETs using [dd.weather.gc.ca](https://dd.weather.gc.ca/cgi-bin/bulletin_search.pl?product=ws,wc,wv&header=21,22,23,24,25,26,27&location=cn) or [CFPS](https://plan.navcanada.ca/weather/api/alpha/?site=CZEG&site=CZVR&site=CZWG&site=CZYZ&site=CZUL&site=CZQM&site=CZQX&alpha=sigmet&alpha=airmet); investigate use of `polygon` or `bbox` for CFPS
- [ ] Add HLTs & SIGWXs to AVN mode
- [ ] Add LGF to AVN mode
- [ ] Convert GFA selection from `button` to `select`
- [ ] Convert Obs decode from `button` to `select`
- [ ] Enable looping of Weather Map imagery using [time](https://eccc-msc.github.io/open-data/msc-geomet/wms_en/#handling-time)
- [ ] Polish UI styling for small screen sizes (i.e. wrapping elements to break onto new lines, etc)


### Rose:
- [ ] Set up Public Alerts / TSO Map (map target `public-map`)
- [ ] Polish Public-related info and layout
- [ ] (?) Thunderstorm Outlook static image page modernization