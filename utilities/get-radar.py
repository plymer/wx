import requests as html, os, re

URL = "https://dd.weather.gc.ca/radar/CAPPI/GIF/PNR/"

try:
    raw = html.get(URL).text
except html.exceptions.Timeout:
    print("Request for image list timed out")
except html.exceptions.TooManyRedirects:
    print("Invalid image list URL")
except html.exceptions.RequestException as e:
    raise SystemExit(e)

imgSearch = "(?:<a href=\")(.*.gif)(?:\")"

imgURL = ""

# imgList = {}

for radarImg in re.findall(imgSearch, raw):
    imgURL = URL + radarImg

    #  eventually we want to make the radar loop-able so we will be
    #    creating an array/list of the URLs
    # imgList.update({})

# print(imgURL)

try:
    response = html.get(imgURL, stream=True)
except html.exceptions.Timeout:
    print("Request for radar image timed out")
except html.exceptions.TooManyRedirects:
    print("Invalid radar image URL")
except html.exceptions.RequestException as e:
    raise SystemExit(e)

# set up the output path for when we write the formatted data to a file
path = os.path.dirname(os.path.realpath(__file__))
os.chdir(path)
os.chdir("../images/")
path = os.getcwd()

filename = path + "/latest.gif"

with open(filename, "wb") as handler:
    handler.write(response.content)

print("current radar image written to", filename)

del response