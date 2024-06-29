import os, json
import requests as html

path = os.path.dirname(os.path.realpath(__file__))
os.chdir(path)
os.chdir("../data/")
path = os.getcwd()

url = "https://metaviation.ec.gc.ca/hubwx/scripts/getForecasterNotes.php?site0=CYYZ&site1=CYUL&site2=CYYC&site3=CYVR"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'}

tafPlus = html.get(url, headers=headers)
tafPlus = tafPlus.json()

output = json.dumps(tafPlus, indent=4)

filename = path + "/taf-plus.json"

f = open(filename, "w")
f.write(output)
f.close()

print("taf discussions written to", filename)
