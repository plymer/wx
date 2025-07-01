import {
  useBedpostsOverlay,
  useFIROverlay,
  useGFAOverlay,
  useLGFOverlay,
  useMarineRegionsOverlay,
  usePublicRegionsOverlay,
  useTAFsOverlay,
} from "@/stateStores/map/vectorOverlays";
import MapOverlay from "./map-layers/MapOverlay";

// vector overlay data
import gfaBoundaries from "@/assets/cmac-product-overlays/gfa-boundaries.json";
import lgfBoundaries from "@/assets/cmac-product-overlays/lgf-boundaries.json";
import firBoundaries from "@/assets/general-overlays/fir-boundaries.json";
import tafSites from "@/assets/general-overlays/taf-sites.json";
import bedposts from "@/assets/general-overlays/bedposts.json";
import publicRegions from "@/assets/general-overlays/public-regions.json";
import marineRegions from "@/assets/general-overlays/marine-regions.json";

// overlay configurations
import {
  TAF_OVERLAY,
  BEDPOSTS_OVERLAY,
  LGF_OVERLAY,
  FIR_OVERLAY,
  GFA_OVERLAY,
  PUBLIC_OVERLAY,
  MARINE_OVERLAY,
} from "@/config/overlays";

import { FeatureCollection } from "geojson";

const overlays = {
  gfa: gfaBoundaries as FeatureCollection,
  lgf: lgfBoundaries as FeatureCollection,
  fir: firBoundaries as FeatureCollection,
  taf: tafSites as FeatureCollection,
  bedposts: bedposts as FeatureCollection,
  publicRegions: publicRegions as FeatureCollection,
  marineRegions: marineRegions as FeatureCollection,
};

// import { ParsedTaf, PopupData } from "@/lib/types";
// import { Popup, useMap } from "react-map-gl/maplibre";
// import { formatSigWx, popupAnchor } from "@/lib/utils";
// import MetarContainer from "./alpha-data/MetarContainer";
// import TafContainer from "./alpha-data/TafContainer";

// interface Props {
//   popupData: PopupData | undefined;
//   popupDataHandler: React.Dispatch<React.SetStateAction<PopupData | undefined>>;
// }

const OverlayManager = () => {
  const firOverlay = useFIROverlay();
  const gfaOverlay = useGFAOverlay();
  const lgfOverlay = useLGFOverlay();
  const bedpostsOverlay = useBedpostsOverlay();
  const tafsOverlay = useTAFsOverlay();
  const publicRegionsOverlay = usePublicRegionsOverlay();
  const marineRegionsOverlay = useMarineRegionsOverlay();

  // const mapRef = useMap().current;

  // const metars =
  //   popupData?.feature.properties.metars &&
  //   (JSON.parse(popupData?.feature.properties.metars).slice(-3) as string[]).map((m) => formatSigWx(m, "metar"));
  // const taf =
  //   popupData?.feature.properties.taf && (formatSigWx(popupData?.feature.properties.taf as string, "taf") as ParsedTaf);

  return (
    <>
      {firOverlay && (
        <MapOverlay overlayId="firBoundaries" key="firBoundaries" data={overlays.fir} overlayOptions={FIR_OVERLAY} />
      )}
      {gfaOverlay && (
        <MapOverlay overlayId="gfaBoundaries" key="gfaBoundaries" data={overlays.gfa} overlayOptions={GFA_OVERLAY} />
      )}
      {lgfOverlay && (
        <MapOverlay overlayId="lgfBoundaries" key="lgfBoundaries" data={overlays.lgf} overlayOptions={LGF_OVERLAY} />
      )}
      {bedpostsOverlay && (
        <MapOverlay overlayId="bedposts" key="bedposts" data={overlays.bedposts} overlayOptions={BEDPOSTS_OVERLAY} />
      )}
      {publicRegionsOverlay && (
        <MapOverlay
          overlayId="publicRegions"
          key="publicRegions"
          data={overlays.publicRegions}
          overlayOptions={PUBLIC_OVERLAY}
        />
      )}

      {marineRegionsOverlay && (
        <MapOverlay
          overlayId="marineRegions"
          key="marineRegions"
          data={overlays.marineRegions}
          overlayOptions={MARINE_OVERLAY}
        />
      )}
      {tafsOverlay && (
        <MapOverlay overlayId="tafSites" key="tafSites" data={overlays.taf} overlayOptions={TAF_OVERLAY} />
      )}

      {/* {popupData && (
        <Popup
          offset={15}
          closeOnClick={true} // for testing
          onClose={() => popupDataHandler(undefined)}
          latitude={popupData.coords.lat}
          longitude={popupData.coords.lng}
          anchor={popupAnchor(popupData, mapRef)}
          closeButton={false}
          className="min-w-1/2 rounded-lg p-0 m-0 text-white"
        >
          {popupData.dataType !== "site" && (
            <>
              <h1 className="border-b-2 border-white font-bold">{popupData.dataType.toUpperCase()} Details</h1>
              <div className="font-mono">{popupData.feature.properties.text}</div>
            </>
          )}
          {popupData.dataType === "site" && (
            <>
              <h1 className="text-center">
                {popupData.feature.properties.siteId.toUpperCase()} - {popupData.feature.properties.name}
              </h1>
              <>
                {popupData.feature.properties.metars && (
                  <>
                    <h1 className="border-b-2 border-white font-bold">Recent METARs:</h1>
                    <MetarContainer metarList={metars} />
                  </>
                )}
                {taf && (
                  <div>
                    <h1 className="border-b-2 border-white font-bold">Current TAF:</h1>
                    <TafContainer tafData={taf} />
                  </div>
                )}
              </>
            </>
          )}
        </Popup>
      )} */}
    </>
  );
};

export default OverlayManager;
