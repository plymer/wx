import requests as html, json, os, re

path = os.path.dirname(os.path.realpath(__file__))
os.chdir(path)
os.chdir("../data/")
path = os.getcwd()

raw = open(path + "/stations-raw.json")
rawStationData = json.load(raw)

idPattern = "([A-Z]{4})"

output = {
    "type" : "FeatureCollection",
    "features" : []
    }

featureList = []


i = 0
while i < len(rawStationData):
    if len(rawStationData[i]["icaoId"]) == 4 and rawStationData[i]["iataId"] and rawStationData[i]["lon"] < -45 and rawStationData[i]["lat"] > 15:
        if re.search(idPattern, rawStationData[i]["icaoId"]):

            temp = {}
            temp["type"] = "Feature"
            temp["geometry"] = {}
            temp["geometry"]["type"] = "Point"
            temp["geometry"]["coordinates"] = [rawStationData[i]["lon"], rawStationData[i]["lat"]]
            temp["properties"] = {}
            temp["properties"]["siteID"] = rawStationData[i]["icaoId"]
            temp["properties"]["name"] = rawStationData[i]["site"]
            temp["properties"]["elev"] = rawStationData[i]["elev"]
            temp["properties"]["priority"] = rawStationData[i]["priority"]

            # add the geojson encoded data to the output array
            featureList.append(temp)
    
    i += 1

output["features"] = featureList
output = json.dumps(output, indent=4)

filename = path + "/stations.geojson"

f = open(filename, "w")
f.write(output)
f.close()

print("station data written to", filename)
