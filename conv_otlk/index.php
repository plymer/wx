<!DOCTYPE html>
<html lang="en-CA">

<meta content="text/html;charset=utf-8" http-equiv="Content-Type">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta content="utf-8" http-equiv="encoding">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">

<head>
<title>ECCC Thunderstorm Outlooks</title>
<link rel="stylesheet" href="css/style.css">
<script src="javascript/conv.js"></script>
</head>

<body onload="changeText('focn');">
  <div id="header">
    <h2>ECCC Thunderstorm Outlooks</h2>
    <p><span class="office">Storm Prediction Centres Edmonton and Winnipeg</span></p>
    <section class="links">
      <a class="link bc-yt" onclick="changeSector('bc-yt');">BC</a>
      <a class="link mk-mk" onclick="changeSector('mk-mk');">Mackenzie</a>
      <a class="link prairies active" onclick="changeSector('prairies');">Prairies</a>
      <a class="link on" onclick="changeSector('on');">Ontario</a>
      <a class="link qc" onclick="changeSector('qc');">Quebec</a>
      <a class="link atlantic" onclick="changeSector('atlantic');">Atlantic</a>
    </section>
  </div><!--header-->
  <div id="content">
    <div id="hamburger" onclick="openNav();">
      <div class="bar1"></div>
      <div class="bar2"></div>
      <div class="bar3"></div>
    </div>
    <div class="bc-yt hidden">
      <div class="paneLink">
        <section class="links">
          <a class="link underline subnav day_1 active" onclick="changePane('day_1');">Day 1</a>
          <a class="link underline subnav day_2" onclick="changePane('day_2');">Day 2</a>
        </section>
      </div><!--paneLink-->
      <div class="paneContent">
        <img class="bc-yt" src="images/today/pspc/bc-yt-day_1.png?<?php echo time(); ?>" />
      </div><!--paneContent"-->
  </div><!--bc-yt-->
    <div class="mk-mk hidden">
      <div class="paneLink">
        <section class="links">
          <a class="link underline subnav day_1 active" onclick="changePane('day_1');">Day 1</a>
          <a class="link underline subnav night_1" onclick="changePane('night_1');">Night 1</a>
          <a class="link underline subnav day_2" onclick="changePane('day_2');">Day 2</a>
          <!--<a class="link underline subnav day_2_update" onclick="changePane('day_2_update');">D2 Update</a>-->
        </section>
      </div><!--paneLink-->
      <div class="paneContent">
        <div class="flex-container">
          <div class="graphic flex-item">
            <img class="mk-mk" src="images/today/paspc/mk-mk-day_1.png?<?php echo time(); ?>" />
          </div><!--graphic-->
          <div class="text-area flex-item">
              <div class="textlinks">
                <!--<a class="link underline textnav to" onclick="changeText('to');">TO</a>-->
                <a class="link underline textnav focn active" onclick="changeText('focn');">FOCN</a>
              </div><!--textlinks-->
              <div class="bulletin" id="mk-mk_text">
              </div><!--textcontent-->
          </div><!--textarea-->
        </div><!--flexcontainer-->
      </div><!--paneContent"-->
  </div><!--mk-mk"-->
    <div class="prairies">
      <div class="paneLink">
        <section class="links">
            <a class="link underline subnav day_1 active" onclick="changePane('day_1');">Day 1</a>
            <a class="link underline subnav night_1" onclick="changePane('night_1');">Night 1</a>
            <a class="link underline subnav day_2" onclick="changePane('day_2');">Day 2</a>
            <!--<a class="link underline subnav day_2_update" onclick="changePane('day_2_update');">D2 Update</a>-->
        </section>
      </div><!--paneLink-->
      <div class="paneContent">
        <div class="flex-container">
          <div class="graphic flex-item">
            <img class="prairies" src="images/today/paspc/prairies-day_1.png?<?php echo time(); ?>" />
          </div><!--graphic-->
          <div class="text-area flex-item">
              <div class="textlinks">
                <!--<a class="link underline textnav to" onclick="changeText('to');">TO</a>-->
                <a class="link underline textnav focn active" onclick="changeText('focn');">FOCN</a>
              </div><!--textlinks-->
              <div class="bulletin" id="prairies_text">
              </div><!--textcontent-->
          </div><!--textarea-->
        </div><!--flexcontainer-->
      </div><!--paneContent"-->
  </div><!--prairies-->
    <div class="on hidden">
      <div class="paneLink">
        <section class="links">
          <a class="link underline subnav day_1 active" onclick="changePane('day_1');">Day 1</a>
          <a class="link underline subnav night_1" onclick="changePane('night_1');">Night 1</a>
          <a class="link underline subnav day_2" onclick="changePane('day_2');">Day 2</a>
          <a class="link underline subnav day_3" onclick="changePane('day_3');">Day 3</a>
        </section>
      </div><!--paneLink-->
      <div class="paneContent">
        <img class="on" src="images/today/ospc/on-day_1.png?<?php echo time(); ?>" />
      </div><!--paneContent"-->
    </div><!--on-->
    <div class="qc hidden">
      <div class="paneLink">
        <section class="links">
          <a class="link underline subnav day_1 active" onclick="changePane('day_1');">Day 1</a>
          <a class="link underline subnav night_1" onclick="changePane('night_1');">Night 1</a>
          <a class="link underline subnav day_2" onclick="changePane('day_2');">Day 2</a>
        </section>
      </div><!--paneLink-->
      <div class="paneContent">
        <img class="qc" src="images/today/qspc/qc-day_1.png?<?php echo time(); ?>" />
      </div><!--paneContent"-->
  </div><!--qc-->
    <div class="atlantic hidden">
      <div class="paneLink">
        <section class="links">
            <a class="link underline subnav day_1 active" onclick="changePane('day_1');">Day 1</a>
            <a class="link underline subnav night_1" onclick="changePane('night_1');">Night 1</a>
            <a class="link underline subnav day_2" onclick="changePane('day_2');">Day 2</a>
            <a class="link underline subnav day_3" onclick="changePane('day_3');">Day 3</a>
        </section>
      </div><!--paneLink-->
      <div class="paneContent">
        <img class="atlantic" src="images/today/aspc/atlantic-day_1.png?<?php echo time(); ?>" />
      </div><!--paneContent"-->
  </div><!--atlantic-->
        <div class="user">
      <a onclick="modalDisplay('en');">User's Guide/Supplemental Information</a>
    </div><!--user-->
  </div><!--content-->
<!--
  <div id="orient">
    <button onclick="changeOrient();">
      <svg height="50" width="50">
        <circle cx="25" cy="25" r="24" />
        <rect x="12.5" y="12.5" width="25" height="25"  />
        <path id="vertical" d="M25 12.5 L25 37.5" />
        <path id="horizontal" d="M12.5 25 L37.5 25" style="display:none;" />

        Sorry, your browser does not support inline SVG.
      </svg>
    </button>
  </div>
--><!--orient-->

<!-- modal -->
  <div id="en" class="modal">
    <!-- Modal content -->
    <div class="modal-content">
      <span class="close" onclick="modalClose()">&times;</span>
        <h2>Supplementary Information</h2>
      <p>Severe thunderstorms are thunderstorms with one or more of the following conditions:</p>
      <ul>
        <li>Wind gusts of 90 km/h or greater</li>
        <li>Hail of 2 centimetres or larger in diameter</li>
        <li>Heavy rainfall when 50 mm or more is expected within one hour over the Prairies, or 25 mm or more in one hour over the
          Northwest Territories</li>
        <li>Tornado</li>
      </ul>
      <p>
        <img class="center" src="images/Matrix_Services_Final.jpg" />
      </p>
      <!--<p>The thunderstorm outlook uses a 4-level scale to represent the potential weather expected with thunderstorms within the shaded areas. The weather associated with each colour is:</p>

      <div style="overflow-x:auto;">
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 1rem; background-color: transparent; border: 1px solid #dee2e6; text-align: center; font-family: 'Open Sans', Calibri, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <thead>
          <tr>
            <th colspan="5" style="vertical-align: bottom; border: 1px solid #dee2e6; padding: 0.75rem;">Thunderstorm Threat Legend</th>
          </tr>
          <tr>
            <th colspan="2" style="vertical-align: bottom; border: 1px solid #dee2e6; padding: 0.75rem; border-bottom-width: 2px;">Category</th>
            <th style="vertical-align: bottom; border: 1px solid #dee2e6; padding: 0.75rem; border-bottom-width: 2px;">Wind (km/h)</th>
            <th style="vertical-align: bottom; border: 1px solid #dee2e6; padding: 0.75rem; border-bottom-width: 2px;">Hail (diameter)</th>
            <th style="vertical-align: bottom; border: 1px solid #dee2e6; padding: 0.75rem; border-bottom-width: 2px;">Rain (in 1 hour)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #e7e8e9;">
            <td style="background-color: #B1B5B6; width: 25px; border: 1px solid rgba(0,0,0,0.2);"></td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Minor</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Gust less than 90</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Less than 20mm (nickel)</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Less than 50 mm</td>
          </tr>
          <tr style="background-color: #F7F6CE;">
            <td style="background-color: #E7E35D; width: 25px; border: 1px solid rgba(0,0,0,0.2);"></td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Moderate</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Gust 90 to 100</td>
            <td>20 mm (nickel) to 35 mm (walnut)</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">50 to 75 mm</td>
          </tr>
          <tr style="background-color: #FCE4BD;">
            <td style="background-color: #F5A525; width: 25px; border: 1px solid rgba(0,0,0,0.2);"></td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Severe</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Gust 100 to 120</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">35 mm (toonie) to 50 mm (hen egg)</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">75 to 100 mm</td>
          </tr>
          <tr style="background-color: #F3B4B4;">
            <td style="background-color: #D90505; width: 25px; border: 1px solid rgba(0,0,0,0.2);"></td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Extreme</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Gust over 120</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Greater than 50 mm (hen egg) diameter</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">More than 100 mm</td>
          </tr>
        </tbody>
      </table>
      </div>
      <p>The thunderstorm outlook graphic also includes iconography to highlight the most probable hazards posed by thunderstorms on a given day. It is important to note that the text that accompanies the thunderstorm outlook graphics offers further details regarding exactly what kind of hazards are expected.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 100%; margin-bottom: 1rem; background-color: transparent; border: 1px solid #dee2e6; text-align: center; font-size: 90%; font-family: 'Open Sans', Calibri, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <thead>
          <tr>
            <th colspan="5" style="vertical-align: bottom; border: 1px solid #dee2e6; padding: 0.75rem;">Categorical Probability of Thunderstorms</th>
          </tr>
          <tr>
            <th colspan="2" style="vertical-align: bottom; border: 1px solid #dee2e6; padding: 0.75rem; border-bottom-width: 2px;">Category</th>
            <th style="vertical-align: bottom; border: 1px solid #dee2e6; padding: 0.75rem; border-bottom-width: 2px;">Definition</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #e7e8e9;">
            <td style="background-color: #B1B5B6; width: 25px; border: 1px solid rgba(0,0,0,0.2);"></td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Minor</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">30% or greater probability of <strong>non-</strong>severe or near severe thunderstorms.</td>
          </tr>
          <tr style="background-color: #F7F6CE;">
            <td style="background-color: #E7E35D; width: 25px; border: 1px solid rgba(0,0,0,0.2);"></td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Moderate</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">5-30% probability of severe thunderstorms of either limited organization and longevity, or very low coverage and marginal intensity.</td>
          </tr>
          <tr style="background-color: #FCE4BD;">
            <td style="background-color: #F5A525; width: 25px; border: 1px solid rgba(0,0,0,0.2);"></td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Severe</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">30-60% probability of organized severe thunderstorms with varying levels of intensity.</td>
          </tr>
          <tr style="background-color: #F3B4B4;">
            <td style="background-color: #D90505; width: 25px; border: 1px solid rgba(0,0,0,0.2);"></td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">Extreme</td>
            <td style="padding: 0.75rem; vertical-align: top; border: 1px solid rgba(0,0,0,0.2);">60% or greater probability of widespread severe weather with tornadoes and/or numerous severe thunderstorms, some of which may be extreme.</td>
          </tr>
        </tbody>
      </table>-->
    </div>
  </div><!--modal-->


  <!-- survey modal -->
  <div id="en_survey" class="modal">
  <!-- Modal content -->
    <div class="modal-content">
      <span class="close" onclick="modalClose()">&times;</span>
      <p style="text-align:center;" >If you have used the Thunderstorm Outlook for any region, please fill out <a href="https://eccc.sondage-survey.ca/f/s.aspx?s=459438f8-3ebc-4d2f-84c2-283aa6f4b77d&ds=pbXo7N0E8U" target="_blank">this survey</a>.</p>
      <p style="text-align:center;">Thank you.</p>
    </div>
  </div><!--modal-->


  <div id="mySidenav" class="sidenav">
    <span class="close" onclick="closeNav();">&times;</span>
    <h2>ECCC<br>Thunderstorm<br>Outlooks</h2>
    <section>
      <a class="bc-yt" onclick="changeSector('bc-yt');closeNav();">BC</a>
      <a class="mk-mk" onclick="changeSector('mk-mk');closeNav();">Mackenzie</a>
      <a class="prairies active" onclick="changeSector('prairies');closeNav();">Prairies</a>
      <a class="ON" onclick="changeSector('on');closeNav();">Ontario</a>
      <a class="qc" onclick="changeSector('qc');closeNav();">Quebec</a>
      <a class="atlantic" onclick="changeSector('atlantic');closeNav();">Atlantic</a>
    </section>

    <!--
    <span class="close" onclick="closeNav();">&times;</span>
    <h2 class="link">ECCC Thunderstorm Outlooks</h2>
    <section class="links" style="padding-top:5em;">
      <a class="link bc" onclick="changeSector('bc'); modalClose();">BC</a>
      <a class="link mk" onclick="changeSector('mk'); modalClose();">Mackenzie</a>
      <a class="link pr active" onclick="changeSector('pr'); modalClose();">Prairies</a>
      <a class="link on" onclick="changeSector('on'); modalClose();">Ontario</a>
      <a class="link qc" onclick="changeSector('qc'); modalClose();">Quebec</a>
      <a class="link atl" onclick="changeSector('atl'); modalClose();">Atlantic</a>
    </section>
    -->
  </div><!--sidebar-->

<script type="text/javascript">
//document.addEventListener("DOMContentLoaded", function() {
//  modalDisplay('en_survey');;
//});
</script>

<!-- Default Statcounter code for Thunderstorm outlook
http://umanitoba.ca/environment/envirogeog/weather/conv_otlk/
-->
<!--<script type="text/javascript">
var sc_project=11390804;
var sc_invisible=1;
var sc_security="bbe743cd";
</script>
<script type="text/javascript"
src="https://www.statcounter.com/counter/counter.js"
async></script>
<noscript><div class="statcounter"><a title="Web Analytics"
href="https://statcounter.com/" target="_blank"><img
class="statcounter"
src="https://c.statcounter.com/11390804/0/bbe743cd/1/"
alt="Web Analytics"></a></div></noscript>
 End of Statcounter Code -->
</body>
</html>