/*

What if we used Martin and served our own satellite tiles?

https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/02/
https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/02/

I don't know if these are COGs or what it would take to convert the GeoTIFFs to COGs
but Martin has an experimental COG -> raster tile pipeline that could solve our reliance
on external WMS servers

Pros:
- No more dependency on GeoMet's offerings
- We can cache the tiles on our own server
- Single channel data can be served

Cons:
- Storage for full-disk images
- Transfer (time + bandwidth)
- Compute requried for COG -> raster tile conversion through Martin
- Development time

 */
