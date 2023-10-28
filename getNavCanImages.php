<?php

$url = "https://plan.navcanada.ca/weather/api/alpha/?polygon=CZEG|fir|-107.908,71.977&polygon=CZYZ|fir|-81.478,47.525&polygon=CZQX|fir|-46.479,53.645&polygon=CZUL|fir|-71.114,55.435&polygon=CZWG|fir|-93.048,54.717&polygon=CZQM|fir|-62.875,45.425&polygon=CZVR|fir|-125.768,52.205&image=GFA/CLDWX&image=GFA/TURBC&image=LGF&image=SIG_WX//MID_LEVEL/*&image=TURBULENCE&_=1670956986347";


// image location: https://plan.navcanada.ca/weather/images/XXXXXXXX.image

// this JSON will contain duplicates because we've asked for all FIRs - we'll need to purge all the dupes

$json = "";
$navCan = "https://plan.navcanada.ca/weather/images/";
$output = array();

if (file_get_contents($url)) {    
  $json = json_decode(file_get_contents($url));
  $json = $json->data;
  

} else {
  return;
}



for ($i = 0; $i < count($json); $i++) {
  $img = json_decode($json[$i]->text);
  $tempArr = "";
  
  if ($img->product == "GFA") {
    
    $tempArr[$img->sub_product] = array($navCan . $img->frame_lists[2]->frames[0]->images[0]->id . ".image", $navCan . $img->frame_lists[2]->frames[1]->images[0]->id . ".image", $navCan . $img->frame_lists[2]->frames[2]->images[0]->id . ".image");
    
    if (!array_key_exists($img->geography, $output)) {
        $output[$img->geography] = $tempArr;
    } else {
        
        $output[$img->geography] = $output[$img->geography] + $tempArr;
    }
    
  } else if($img->product == "LGF") {
  
    $tempArr = array($navCan . $img->frame_lists[2]->frames[0]->images[0]->id . ".image", $navCan . $img->frame_lists[2]->frames[1]->images[0]->id . ".image", $navCan . $img->frame_lists[2]->frames[2]->images[0]->id . ".image");
    
    if (!array_key_exists($img->geography, $output)) {
        $output[$img->geography] = $tempArr;
    } else {
        
        $output[$img->geography] = $output[$img->geography] + $tempArr;
    }
    
  } else if($img->product == "SIG_WX") {
    if ($img->sub_geography == "CANADA") {
        $tempArr[$img->sub_geography] = array($navCan . $img->frame_lists[0]->frames[0]->images[0]->id . ".image", $navCan . $img->frame_lists[0]->frames[1]->images[0]->id . ".image", $navCan . $img->frame_lists[0]->frames[2]->images[0]->id . ".image", $navCan . $img->frame_lists[0]->frames[3]->images[0]->id . ".image");
    } else {
        $tempArr[$img->sub_geography] = array($navCan . $img->frame_lists[0]->frames[0]->images[0]->id . ".image", $navCan . $img->frame_lists[0]->frames[1]->images[0]->id . ".image");
    }
    
    
    if (!array_key_exists($img->product, $output)) {
        $output[$img->product] = $tempArr;
    } else {
        $output[$img->product] = $output[$img->product] + $tempArr;
    }
    
  } else if($img->product == "TURBULENCE"){
    $tempArr[$img->geography] = array($navCan . $img->frame_lists[0]->frames[0]->images[0]->id . ".image", $navCan . $img->frame_lists[0]->frames[1]->images[0]->id . ".image");
    
    if (!array_key_exists($img->product, $output)) {
        $output[$img->product] = $tempArr;
    } else {
        $output[$img->product] = $output[$img->product] + $tempArr;
    }
    
  }
}

echo "<pre>\n\n";
    $outJSON = json_encode($output);

    chdir("/var/www/html/wx");
    $cwd = getcwd();
    echo "$cwd\n\n";
    file_put_contents("navcan-images.json", $outJSON);
    print_r($output);
echo "</pre>";


?>

