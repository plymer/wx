<?php

// acts as a poorman's chron to update all local files
// to speed up site loading/navigation because NavCanada's site
// is such a slow piece of garbage. this still takes about
// a minute, since their site is so slow. *le sigh*

for ($i = 0; $i <= 6; $i++) {

	$gfaRgn = 31 + $i;

	for ($j = 0; $j <= 2; $j ++) {
	
		if ($j == 0) {$gfaTime = "000";} else if ($j == 1) {$gfaTime = "006";} else if ($j == 2) {$gfaTime = "012";}
		
		for ($k = 0; $k <= 1; $k++) {
		
			if ($k == 0) {$gfaPanel = "cldwx";} else if ($k == 1) {$gfaPanel = "turbc";}
			
		
$remoteGFA = "https://flightplanning.navcanada.ca/Latest/gfa/anglais/produits/uprair/gfa/gfacn{$gfaRgn}/Latest-gfacn{$gfaRgn}_{$gfaPanel}_{$gfaTime}.png";
$localGFA = "images/gfa/{$gfaRgn}_{$gfaPanel}_{$gfaTime}.png";
$remoteHash = md5_file($remoteGFA);

// check to see if the local version exists
// download if it doesn't
if (file_exists($localGFA)) {
	//get the hash of the local file
	$localHash = md5_file($localGFA);
	
	//check local hash against hash on NavCanada site
	//if they differ, grab the new remote file
	
	if ($localHash != $remoteHash) {
		//hashes differ, download the new remote file
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $remoteGFA);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
		
		//get the image data and close the curl session
		$data = curl_exec ($ch);
		curl_close ($ch);
		
		//save the remote data to the local directory
		$file = fopen($localGFA, "w+");
		fputs($file, $data);
		fclose($file);	
	}
	
} else {

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $remoteGFA);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	
	//get the image data and close the curl session
	$data = curl_exec ($ch);
	curl_close ($ch);
	
	//save the remote data to the local directory
	$file = fopen($localGFA, "w+");
	fputs($file, $data);
	fclose($file);

	//echo "Saving {$localGFA} ...<br>";

}

}

}

}

//echo "Done!";

?>