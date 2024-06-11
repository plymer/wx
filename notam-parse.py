#------------------------------------------------------------------#
# NOTAM Importer 1.0                                               #
# A Python 3.7 program                                             #
# By Ryan Pimiskern                                                #
# January 23, 2022                                                 #
#                                                                  #
# Used to import, format, and store NOTAMs relating to selected    #
# NAV CANADA aerodromes, to aid CMAC forecasters in understanding  #
# airport operations                                               #
#------------------------------------------------------------------#

import os, re, json
import requests as html --- we can use this if we ever get to install libraries on the server
from subprocess import Popen, PIPE

path = os.path.dirname(os.path.realpath(__file__))

# we are importing the subclass, regular expressions, system, and json libraries
#   subprocess will allow us to do http data requests via running a php script
#   regex will help us parse the data
#   json will help us parse the json text we are returned from the NAVCanada API call


# the URL for grabbing all NOTAMs from all FIRs is as follows, and accesses the Vancouver (ZVR),
#   Edmonton (ZEG), Winnipeg (ZWG), Toronto (ZYZ), Montreal (ZUL), Moncton (ZQM), and Gander (ZQX) FIRs.

allNOTAMs = "https://plan.navcanada.ca/weather/api/alpha/?site=CZEG&site=CZUL&site=CZVR&site=CZWG&site=CZYZ&site=CZQM&site=CZQX&alpha=notam&notam_choice=english"
notamJSON = html.get(allNOTAMs)
notamJSON = notamJSON.json()

# all notams are stored in the "data" dictionary entry aka notamJSON["data"] -- lets normalize this for ease of use=
notamJSON = notamJSON["data"]

rawList = []

#print("There are currently", len(notamJSON), "NOTAMs on NAV Canada's server")

# we now want to loop through each notam in the list that we requested off of the NAVCAN server
# we will skip over the sites that didn't have a location explicitly listed -- these arent relevant for our query

i = 0
while i < len(notamJSON):
    
    # here we use the json.loads method to convert the 'text' field from the json output into a python dictionary
    #    for ease of manipulating and reading
    notamText = json.loads(notamJSON[i]["text"])
    
    # just simplifying the reference
    notamLocation = notamJSON[i]["location"]
    
    # skip over the notams that returned a 'null' location in the navcan data
    if (notamLocation is None):
        i += 1
        continue
    
    # create key:value pairs in a dictionary to be added to the rawList array    
    siteItem = { "site" : notamLocation, "text" : notamText["raw"] }
    
    rawList.append(siteItem)
    
    i += 1


# we now have a raw list of all of the relevant notams
# now we want to collapse all of a site's notams into a list on a per-site basis
# the data format is output as a dictionary with a list of notams as below:
# { "CYYZ" : ["{ notam1 }","{ notam2 }","{ notam3 }", ... ] , "CYYT" : ["{ notam1 }","{ notam2 }","{ notam3 }", ... ] , ... }
    
notamList = {}

# loop through each entry in the raw list of notams
for x in rawList:
    # if the 'site' does not exist in the list yet, create an entry with an empty notam list
    if x["site"] not in notamList:
        notamList.update({ x["site"] : [] })
        
    # now the site exists in the list if it didn't already, so we grab any preexisting notams (prevList)
    #   and append the current one (x["text"])
    prevList = notamList.get(x["site"])
    
    t = x["text"]
    
    # all notams have a start time - we want to snip just the start date out which will be in group 2 of the regex search
    startTime = re.search("((?:\sB\)\s)(\d{10}))", t)
    startTime = startTime.group(2)
    
    # not all notams have end times, so we need a case for null times so we dont error-out
    endTime   = re.search("((?:\sC\)\s)(\d{10}))", t)
    if endTime is not None:
        endTime   = endTime.group(2)
        
    # the actual text of the notam is the last entry, denoted under section E),
    #   and we must account for the linebreaks in the notam content and strip them out
    bodyText  = re.search("((?:E\)\s)((.+\n?){1,}))", t)
    bodyText  = bodyText.group(2)
    
    bodyText  = re.sub("\n", "", bodyText)
    
    
    # create a new dictionary so we can append it to the site's notam list
    notamEntry = { "start" : startTime , "end" : endTime , "text" : bodyText }
    
    prevList.append(notamEntry)        
    
    # overwrite the site's list with the updated/appended notam list
    notamList[x["site"]] = prevList


#print(notamList)


# save the output to an external JSON file for now

output = json.dumps(notamList, indent=4)

filename = path + "/notams.json"

f = open(filename, "w")
f.write(output)
f.close()

print("NOTAMs written to", filename)





