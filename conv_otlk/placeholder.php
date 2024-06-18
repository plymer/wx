<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

//variables 
$sectors = array ("pspc/bc-yt", "paspc/mk-mk", "paspc/prairies", "ospc/on", "qspc/qc", "aspc/atlantic", "to", "focn");
$valids = array ("-day_1", "-night_1", "-day_2", "-day_3", "_night_1", "");
$file_age_limit = 28;
$path = '/home/ryanpimi/public_html/wx/conv_otlk/images/today/';
$placeholder_path = '/home/ryanpimi/public_html/wx/conv_otlk/images/placeholders/';

//loop through each sector
foreach($sectors as $sector) {
//loop through valid times for each sector
    foreach($valids as $valid) {
//check if files exist, as not every sector has every valid time and mixing .png and .txt files
        echo "{$path}{$sector}{$valid}.png <br>";
        if (file_exists("{$path}{$sector}{$valid}.png")) {
            //if the file exists, check the file age, and replace it with the placeholder if the file is older than 15 hours old
            if(time() - filemtime("{$path}{$sector}{$valid}.png") > ($file_age_limit * 3600)) {
                copy("{$placeholder_path}{$sector}_placeholder.png", "{$path}{$sector}{$valid}.png");
            }//if time
        } else {
            copy("{$placeholder_path}{$sector}_placeholder.png", "{$path}{$sector}{$valid}.png");
        }//if else exists
    }//inner foreach
}//outer foreach

?>