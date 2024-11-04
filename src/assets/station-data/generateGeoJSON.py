from geojson import Point, Feature, FeatureCollection
import os, json, requests as html

path = os.path.dirname(os.path.realpath(__file__))
os.chdir(path)
path = os.getcwd()

output = {}

features = []

stationJSON = ""

with open(path + "/station.json", "r") as file:
    stationJSON = file.read()

print(stationJSON)