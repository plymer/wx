var loopLength;
var container;       // get ready to find the container we need to point to
var productList = [];
var productImages = [];
var imageIndex = 0;  // for choosing the image to display
var fps = 4;
var frameHoldTime = 1000 / fps;
var delayTime = 2000;
var playing, iteration;
var jsonData;
var productType;
var loaded = 0;
var playButtonVal;

function playerControl(data, cmd) {
  // controls the direction and loading of the player loop
  // can be used for satellite images, or NWP data (or whatever else I can come up with)

  if (data == "sat") { // make sure we're pointing at the correct containers
    container = $("#satellite-image");
    channel = $("#channel-select").val();
  }

  switch (cmd) {
    case "play":
      // call the image preloader function first.
      preloadImages();

      // due to the structure of the playLoop function, it puts a delay on the last image;
      // to get around this, if we're at the last image already, we'll switch to the first.
      // either way, we push one interation of the loop to avoid the delay in the setInterval

      if (imageIndex == loopLength) {
        imageIndex = 0;
        container.attr("src", productImages[imageIndex]); // update the source to the new data
      }

      playLoop();
      playing = setInterval(function() { playLoop(); }, (delayTime + (loopLength * frameHoldTime)));
      break;

    case "stop":
      stopLoop();
      break;

    case "next":
      nextImage();
      break;

    case "prev":
      prevImage();
      break;

    case "load":
      loadProduct();
      break;

    case "first":
      firstImage();
      break;

    case "last":
      lastImage();
      break;
  }

}

function playLoop() {
  // modify the play button into a stop button
  $("#play").attr("onclick","playerControl('sat','stop')");
  $("#play").attr("value","\u25A0");

  iteration = setTimeout(function(){
    updateProgressBar(); // update the progress bar display
    container.attr("src", productImages[imageIndex]); // update the source to the new data
    if (imageIndex < loopLength) {
      imageIndex++; // increment to the next image
      playLoop(); // every interval, self-reference the function call
    } else { // we've reached the end of the loop so we'll clean up
      clearInterval(iteration); // kill the interval (since we don't want infinite looping due to the delayTime)
      imageIndex = 0; // reset to the zeroth image index and then exit the function
      return;
    }
  }, frameHoldTime);

}

function nextImage() {
  stopLoop();
  imageIndex++; // incremement the index and then check for the bounds, resetting as necessary
  if (imageIndex > loopLength) { imageIndex = 0; }
  updateProgressBar();
  container.attr("src", productImages[imageIndex]); // display the new image
}

function prevImage() {
  stopLoop();
  imageIndex--; // decrement the index and then check for the bounds, resetting as necessary
  if (imageIndex < 0) { imageIndex = loopLength; }
  updateProgressBar();
  container.attr("src", productImages[imageIndex]);
}

function lastImage() {
  stopLoop();
  imageIndex = loopLength;
  updateProgressBar();
  container.attr("src", productImages[imageIndex]);
}

function firstImage() {
  stopLoop();
  imageIndex = 0;
  updateProgressBar();
  container.attr("src", productImages[imageIndex]);
}

function stopLoop() {
  clearInterval(playing);    // main loop control
  clearInterval(iteration);  // loop frame control
  $("#play").attr("onclick","playerControl('sat','play')");
  $("#play").attr("value",playButtonVal);
}

function loadProduct() {
  stopLoop();
  getJSONData();
}

function updateProgressBar() {
  var width = ((imageIndex / loopLength) * 100);
  $("#progress-content").css({"width" : width + "%"});
}

function getJSONData() {
  var jsonFileName = "loopData.json?" + (new Date()).getTime();
  console.log("Loading", jsonFileName, "...");
  jsonData = $.get(jsonFileName)
    .done(function(jsonData){
      // populate the dropdown menu with the available products
      if (loaded == 0) {
        addProducts(jsonData);
        loaded = 1;
      }
      for (i = 0; i < jsonData.length; i++) {
        if (jsonData[i].productType == productType && jsonData[i].product == $("#channel-select").val()) {
          imageIndex = loopLength = jsonData[i].loopLength;
          for (j = 0; j <= loopLength; j++) {
            productImages[j] = jsonData[i].baseURL + (jsonData[i].startIndex + j) + jsonData[i].fileType;
          }
          break;
        } else {
          completeURL = null;
        }
      }
      updateProgressBar();
      container.attr("src", productImages[loopLength]);
    })
    .fail(function(){
      console.log("Unable to open json file");
    });
}

function addProducts(jsonData) {
  var options = $("#channel-select");
  var productList = "<option";
  for (i = 0; i < jsonData.length; i++) {
    if (jsonData[i].productType == productType) {
      productList += " value=\""  + jsonData[i].product + "\" id=\"" + jsonData[i].product + "\"";
      if (i == 0) { // TODO: this will change to read the cookie for the selected default product
        productList += " selected";
      }
      productList += ">" + jsonData[i].display + "</option>";
      if (i < (jsonData.length - 1)) {
        productList += "<option";
      }
    }
  }
  // fill the options with the product choices
  options.html(productList);
}

function preloadImages() {
  // set up our counter
  var k = 0;
  // set up a hidden, dummy DOM element to initiate the preload
  var e = document.createElement("img");
  e.setAttribute("style", "display: none;");
  e.setAttribute("id", "preload-container");
  document.body.appendChild(e);

  // loop through the images
  while (k < productImages.length) {
    e.setAttribute("src", productImages[k]);
    k++;
  }
  // destroy the DOM element once we've initiated the preload
  e.parentNode.removeChild(e);
}
