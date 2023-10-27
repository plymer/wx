#!/opt/alt/python37/bin/python3 -bb

import datetime, sys
from suntime import Sun, SunTimeException

lat = float(sys.argv[1])
lon = float(sys.argv[2])


def getTimes(latitude, longitude):

  # pass the lat/lon on program start

  sun = Sun(latitude, longitude)

  riseTime = sun.get_sunrise_time()
  setTime = sun.get_sunset_time()

  return "&uarr;" + riseTime.strftime('%H:%M') + "Z &darr;" + setTime.strftime('%H:%M') + "Z"

print(getTimes(lat, lon))