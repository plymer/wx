import requests as html, json, os, re

path = os.path.dirname(os.path.realpath(__file__))
os.chdir(path)
os.chdir("../data/")
path = os.getcwd()

rawStationData = json.load(open(path + "/stations-raw.json"))
irisStationList = open(path + "/iris-station-list.txt").read().split(",")

output = {
    "type" : "FeatureCollection",
    "features" : []
    }

featureList = []


i = 0
while i < len(rawStationData):
    if rawStationData[i]["icaoId"] in irisStationList:        

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
