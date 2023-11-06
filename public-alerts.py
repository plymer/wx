#!/usr/bin/python3

import requests as html, json, os

URL = "https://weather.gc.ca/data/dms/alert_geojson/alerts.en.geojson"

# check out geojson.io for testing output on mapbox static images, including styling of polygons

path = os.path.dirname(os.path.realpath(__file__))

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

output = {} # this is a type dict
parNames = [] # this is a type list

i = 0
while i < len(alertsList):
    
    prov = alertsList[i]["properties"]["prov"]
    alerts = alertsList[i]["properties"]["alerts"]

    j = 0
    while j < len(alerts):
        alertType = alerts[j]["alertBannerText"]
        alertId = alerts[j]["id"]
        parName = alerts[j]["parentName"]

        # print(prov, " - ", parName, " - ", alertType, " - ", alertId)

        if alertId in output:
            # print("++ ", alertType, " already exists, adding new parent region")
            if parName in parNames:
                # we are skipping this parentName
                pass

            else:
                # we are adding this parentName

                if type(output[alertId]["parentName"]) is str:
                    # this branch is for if there is a single parentName in the list, it will be read in as a type string
                    parNames = list((output[alertId]["parentName"], parName)) # double brackets here to make sure the 'list' is one element being passed
                    
                else:
                    # this branch is for if there is a pre-existing list of parentNames in the list, it will be read in as a type list
                    parNames = list(output[alertId]["parentName"])                
                    parNames.append(parName)

                # convert the list to a set so we can remove the duplicates
                noDupes = set()
                for entry in parNames:
                    noDupes.add(entry)
                
                # now convert back to a list
                noDupes = list(noDupes)

                output[alertId]["parentName"] = noDupes
                    
            
        else:
            # print ("++ ", alertType, " not found in the list of alerts, adding it")
            output[alertId] = {"alertType" : alertType, "prov" : prov , "parentName" : parName}



        j += 1
    
    i += 1

    #clear out the parNames set
    parNames = []


formatted = json.dumps(output, indent=2)

filename = path + "/current-alerts.json"

f = open(filename, "w")
f.write(formatted)
f.close()

print("Current Alerts written to ", filename)
