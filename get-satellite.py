

import requests as html, json, os

path = os.path.dirname(os.path.realpath(__file__))

# URLs for satellite images are set up like this:
# https://weather.cod.edu/data/satellite/regional/ca_reg_west/ntmicro/ca_reg_west.ntmicro.20231130.155020.jpg
# https://weather.cod.edu/data/satellite/<scale>/<region>/<product>/<region>.<product>.<YYYYMMDD>.<HHM>020.jpg
#     with the minutes being only 0-5 as the images are saved on the 10s
#
# map overlays are found in a similar format (png with alpha)
# https://weather.cod.edu/data/satellite/regional/ca_reg_west/maps/ca_reg_west_map.png
# https://weather.cod.edu/data/satellite/<scale>/<region>/maps/<region>_map.png
#
# regional scale: ca_reg_west, ca_reg_cen regions, can_reg_east, northeast
# global scale: northernhemiwest, northernhemi
# products: ntmicro, 02, truecolor, sandwich


##### THE IMPORTANT QUESTION: DO WE WANT TO DOWNLOAD THE "CURRENT" FILE AND STORE IT LOCALLY, UPDATING AND CACHING UP TO 6 HOURS OF IMAGERY OR DO WE WANT TO JUST HOTLINK? #####
# ex. https://weather.cod.edu/data/satellite/regional/ca_reg_cen/current/ca_reg_cen.ntmicro.jpg
# storing and caching the files locally this way means not having to do any overlaying on this website and can rely on CoD's server to do it
# it means shuffling file names around every 10 minutes on this server

# set up an empty output dictionary
output = {}

# we've looped through all of the CoD satellite images
output = json.dumps(output, indent=4)

filename = path + "/satellite.json"

f = open(filename, "w")
f.write(output)
f.close()