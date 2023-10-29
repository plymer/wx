#!/usr/bin/python3

import requests as html, re, json, sys, shutil

URL = "https://weather.gc.ca/data/dms/alert_geojson/alerts.en.geojson"

# check out geojson.io for testing output on mapbox static images, including styling of polygons

try:
    raw = html.get(URL).text
except html.exceptions.Timeout:
    print("Request for alerts list timed out")
except html.exceptions.TooManyRedirects:
    print("Invalid alerts list URL")
except html.exceptions.RequestException as e:
    raise SystemExit(e)

alertsList = json.loads(raw)
alertsList = alertsList["features"]

output = {}
parNames = []

i = 0
while i < len(alertsList):
    
    prov = alertsList[i]["properties"]["prov"]
    alerts = alertsList[i]["properties"]["alerts"]

    j = 0
    while j < len(alerts):
        alertType = alerts[j]["alertCode"]
        alertId = alerts[j]["id"]
        parName = alerts[j]["parentName"]

        # print(prov, " - ", parName, " - ", alertType, " - ", alertId)

        if alertId in output:
            # print("++ ", alertType, " already exists, adding new parent region")
            if parName in parNames:
                # print("  skipping", parName)
                pass
            else:
                # print("++ adding", parName)

                if type(output[alertId]["parentName"]) is str:
                    parNames = list((output[alertId]["parentName"], parName)) # double brackets here to make sure the 'list' is one element being passed
                else:
                    parNames = list(output[alertId]["parentName"])                
                    parNames.append(parName)

                output[alertId]["parentName"] = parNames
                    
            
        else:
            # print ("++ ", alertType, " not found in the list of alerts, adding it")
            output[alertId] = {"alertType" : alertType, "parentName" : parName}



        j += 1
    
    i += 1
    parNames = []


formatted = json.dumps(output, indent=2)

print(formatted)
