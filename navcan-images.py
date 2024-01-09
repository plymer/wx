#----------------------------------------------------------------------------#
# navcan-images.py                                                         #
# interrogates the NavCan CFPS website to retrieve the URLs for GFA images   #
#                                                                            #
# Ryan Pimiskern                                                             #
# 2023.10.29                                                                 #
#                                                                            #
#----------------------------------------------------------------------------#

import requests as html, json, os

# boilerplate URL to request all of the imagery data for the whole country's airspace
URL = "https://plan.navcanada.ca/weather/api/alpha/?polygon=CZEG|fir|-107.908,71.977&polygon=CZYZ|fir|-81.478,47.525&polygon=CZQX|fir|-46.479,53.645&polygon=CZUL|fir|-71.114,55.435&polygon=CZWG|fir|-93.048,54.717&polygon=CZQM|fir|-62.875,45.425&polygon=CZVR|fir|-125.768,52.205&image=GFA/CLDWX&image=GFA/TURBC&image=LGF&image=SIG_WX//MID_LEVEL/*&image=TURBULENCE&_=1670956986347"

# the default base image URL for all the returned images
navCan = "https://plan.navcanada.ca/weather/images/"

# set up the output path for when we write the formatted data to a file
path = os.path.dirname(os.path.realpath(__file__))

# load and normalize the JSON returned from our request string
imageJSON = html.get(URL)
imageJSON = imageJSON.json()
imageJSON = imageJSON["data"]

# set up an empty output dictionary
output = {}

# loop through all of the returned JSON data to find each type of image available
i = 0
while i < len(imageJSON):
    
    # set up a temp array to hold out data as we collate and remove duplicate data
    #    this is necessary since the request we send to navcan gets information from all *FIRs* and therefore there is overlap
    tempArr = ""
    
    # JSONify the text within the actual returned JSON data, since for some reason NavCan's site returns JSON-within-JSON *shrug emoji*
    imageInfo = json.loads(imageJSON[i]["text"]) 
    
    # start by filtering out the GFAs
    if imageInfo["product"] == "GFA":
        
        # if we encounter a GFA region already in the list, we'll append the new data to it rather than just overwriting it
        if imageInfo["geography"] in output:
            
            # get the previous data we had
            prev = output.get(imageInfo["geography"])

            #find the number of images (regular issues and corrections) and set our search for the 'latest' one
            x = len(imageInfo["frame_lists"][2]["frames"][0]["images"]) - 1
            y = len(imageInfo["frame_lists"][2]["frames"][1]["images"]) - 1
            z = len(imageInfo["frame_lists"][2]["frames"][2]["images"]) - 1
            
            # this is either CLDWX or TURBC followed by the list of three image URLs
            tempArr = {
                    imageInfo["sub_product"] : list((navCan + str(imageInfo["frame_lists"][2]["frames"][0]["images"][x]["id"]) + ".image", navCan + str(imageInfo["frame_lists"][2]["frames"][1]["images"][y]["id"]) + ".image", navCan + str(imageInfo["frame_lists"][2]["frames"][2]["images"][z]["id"]) + ".image"))
            }
            
            # append the new data to the pre-existing entry in the output dictionary
            prev.update(tempArr)
            
        else:

            #find the number of images (regular issues and corrections) and set our search for the 'latest' one
            x = len(imageInfo["frame_lists"][2]["frames"][0]["images"]) - 1
            y = len(imageInfo["frame_lists"][2]["frames"][1]["images"]) - 1
            z = len(imageInfo["frame_lists"][2]["frames"][2]["images"]) - 1
            
            # we have encountered a 'new' GFA region so we build the full entry, including the GFA region, panel type (CLDWX/TURBC), and the three panel URLs
            tempArr = {
                imageInfo["geography"] : {
                    imageInfo["sub_product"] : list((navCan + str(imageInfo["frame_lists"][2]["frames"][0]["images"][x]["id"]) + ".image", navCan + str(imageInfo["frame_lists"][2]["frames"][1]["images"][y]["id"]) + ".image", navCan + str(imageInfo["frame_lists"][2]["frames"][2]["images"][z]["id"]) + ".image"))
                }
            }
            
            # add the new data to the output
            output.update(tempArr)
        
    # now we grab the latest CanSigWx chart
    elif imageInfo["product"] == "SIG_WX":
        if imageInfo["sub_geography"] == "CANADA":
            tempArr = {
                    imageInfo["product"] : navCan + str(imageInfo["frame_lists"][0]["frames"][3]["images"][0]["id"]) + ".image"                        
            }
            
            output.update(tempArr)
    # finally we grab the latest CanHLT chart
    elif imageInfo["product"] == "TURBULENCE":
        tempArr = {
                imageInfo["product"] : navCan + str(imageInfo["frame_lists"][0]["frames"][1]["images"][0]["id"]) + ".image"                        
        }
        
        output.update(tempArr)
    
    # get ready to move to the next item in the navcan list
    i += 1


# we've looped through all of the navcan data
output = json.dumps(output, indent=4)

filename = path + "/current-gfas.json"

f = open(filename, "w")
f.write(output)
f.close()

print("Image links written to", filename)

