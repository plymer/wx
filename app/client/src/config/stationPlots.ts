import type { SymbolLayerSpecification } from "maplibre-gl";

export const CAT_COLOURS = {
  lifr: "#c203fc",
  ifr: "#ff0000",
  mvfr: "#ff9900",
  vfr: "#00bd00",
  none: "#4a4a4a",
};

// prettier-ignore
export const STATION_PRIORITY_CANADA = ["CBBC","CWSA","CYAB","CYAH","CYAM","CYAS","CYAT","CYAW","CYAY","CYAZ","CYBB","CYBC","CYBG","CYBK","CYBL","CYBN","CYBR","CYBW","CYBX","CYCA","CYCB","CYCD","CYCG","CYCO","CYCX","CYCY","CYDA","CYDB","CYDF","CYDL","CYDN","CYDP","CYDQ","CYED","CYEG","CYEK","CYEN","CYER","CYEU","CYEV","CYFB","CYFC","CYFS","CYGH","CYGK","CYGL","CYGP","CYGQ","CYGR","CYGT","CYGV","CYGW","CYGX","CYHA","CYHD","CYHI","CYHK","CYHM","CYHU","CYHY","CYHZ","CYIK","CYIO","CYIV","CYJT","CYKA","CYKF","CYKG","CYKJ","CYKL","CYKQ","CYLD","CYLK","CYLL","CYLT","CYLW","CYMA","CYMH","CYMJ","CYMM","CYMO","CYMT","CYMX","CYNA","CYND","CYNE","CYOC","CYOD","CYOJ","CYOO","CYOW","CYOY","CYPA","CYPC","CYPE","CYPG","CYPH","CYPL","CYPQ","CYPR","CYPX","CYPY","CYQA","CYQB","CYQD","CYQF","CYQG","CYQH","CYQI","CYQK","CYQL","CYQM","CYQQ","CYQR","CYQT","CYQU","CYQV","CYQW","CYQX","CYQY","CYQZ","CYRA","CYRB","CYRJ","CYRL","CYRQ","CYRT","CYSB","CYSC","CYSF","CYSJ","CYSM","CYSN","CYSP","CYSY","CYTE","CYTH","CYTL","CYTQ","CYTR","CYTS","CYTZ","CYUB","CYUL","CYUT","CYUX","CYUY","CYVC","CYVM","CYVO","CYVP","CYVQ","CYVR","CYVT","CYVV","CYWA","CYWE","CYWG","CYWH","CYWJ","CYWK","CYWL","CYXC","CYXE","CYXH","CYXJ","CYXL","CYXP","CYXR","CYXS","CYXT","CYXU","CYXX","CYXY","CYXZ","CYYB","CYYC","CYYD","CYYE","CYYF","CYYG","CYYH","CYYJ","CYYL","CYYN","CYYQ","CYYR","CYYT","CYYU","CYYY","CYYZ","CYZE","CYZF","CYZG","CYZH","CYZP","CYZR","CYZS","CYZT","CYZU","CYZV","CYZW","CYZX","CYZY","CZBF","CZFA","CZFM","CZMD","CZMT","CZSJ","CZUM","CZVL"];

// prettier-ignore
export const STATION_PRIORITY_MIN = [...STATION_PRIORITY_CANADA, "KABE","KABI","KACT","KACY","KAGC","KAGS","KALB","KAMA","KAPN","KATL","KAUS","KAVP","KBDL","KBFI","KBGR","KBHM","KBIL","KBNA","KBOI","KBOS","KBPT","KBTM","KBTR","KBTV","KBUF","KBWG","KBWI","KCAK","KCHA","KCHS","KCLE","KCLL","KCLT","KCMH","KCOD","KCPR","KCVG","KCYS","KDAL","KDAY","KDBQ","KDCA","KDEC","KDEN","KDFW","KDLH","KDSM","KDTW","KEAU","KERI","KEUG","KEVV","KEWR","KFAR","KFAT","KFAY","KFLG","KFOE","KFWA","KGCK","KGCN","KGEG","KGFK","KGJT","KGPT","KGRB","KGRR","KGSO","KGSP","KGTF","KHIO","KHKS","KHLN","KHOU","KHPN","KHRL","KHSV","KHUL","KHVN","KIAD","KIAH","KICT","KIDA","KIGM","KILM","KILN","KIND","KINW","KJAC","KJAN","KJFK","KLAF","KLAS","KLAX","KLBL","KLEB","KLEX","KLFT","KLGA","KLGB","KLGU","KLIT","KLRD","KMCI","KMCN","KMDT","KMDW","KMEI","KMEM","KMFD","KMGM","KMHT","KMKC","KMKE","KMOB","KMOT","KMSN","KMSO","KMSP","KMSS","KMSY","KMTJ","KNMM","KOAK","KOGD","KOKC","KOMA","KONT","KORD","KORF","KPDX","KPHF","KPHL","KPHX","KPIH","KPIT","KPLN","KPQI","KPSM","KPSP","KPVD","KPWM","KRDU","KRIC","KRKS","KRNO","KROA","KROC","KRST","KSAN","KSAT","KSAV","KSBN","KSBY","KSDF","KSEA","KSFO","KSHV","KSJC","KSLC","KSMF","KSPS","KSTC","KSTL","KSUS","KSWF","KSYR","KTEB","KTOL","KTUL","KTVC","KTWF","KTXK","KTYS","KVCT","KYKM","KYNG","PAJN","PANC","PASI","PAYA","CYOA","KHVR","KGGW","KOLF","KISN","KCOE","KMLS","KDIK","KBIS","KINL","KHIB","CYCK","CYDC","CWLY","CYHE","KPHP","KPIR","KFSD","CYPD","CYFT","CYLA","CYLU","CYKO","CYMU","CYSK","CYPO","CYNC","CZEM","CYLH","CYKP","CYYW","CYBV","CYBQ","CYFR","CYXQ","CWEU","CYLT","CWGZ","CYLC","CYCS","CYXN","CZST","CZPC","CYKY","CYBU","CYFO","CYET","PAYA","PAFA","PABR","PABA","PAAD","PASC","PAKU","PALP","PATQ","PALU","PAPO","PADG","PAOT","PFNO","PABL","PASH","PAIW","PAOM","PFEL","PAMK","PATA","PAGH","PABT","PFYU","PAVD","PAMD","PADQ",'PADL',"PAHO","PAEG","PAOR","PFTO",'PAVA','PABE','PACD','PASD','PADU','PAAK','PADK','PAEI','PAMC','PHTO','PHNL','PHMK','PHNY','PHOG','PHKO','PHLI','KABQ','KSAF','KELP','KFMN','KHOB','KROW','KRYN','KDUG','KSAD','KSVC','KPRC','KELY','KEKO','KWMC','KCIC','KUKI','KLLR','KFOT','KACV','KCEC','KBOK','KMOD','KBFL','KSNS','KTPA','KFMY','KMIA','KEYW','KXMR','KDAB','KPBI','KMCO','KJAX','KTLH','KPNS',"KCMX"];

// prettier-ignore
export const STATION_PRIORITY_MED = [...STATION_PRIORITY_MIN,"CYGE","CYRV","CYCP","CYIN","CYBD","CYPW","CWAE","KBLI","KBVS","KAWO","KLCM","KPWT","KFHR","KOMK","KSZT","KWMH","KPSC","KLWS","KALW","KHQM","KAST","KOLM","KSLE","KONP","KRDM","KOTH","KMFR","KLMT","KLKV","KBKE","KONO","KBZN","KDVL","KROX","KBDE","KTVF","KBJI","KJMS","KGWR","KDTL","KSAZ","KMZH","KGHW","KAQP","KMML","KATY","KABR","KHON","KMHE","KULM","KRAP","KRGN","KAIA","KBFF","KSNY","KLBF","KANW","KONL","KVMR","KOLU","KGRI","KLNK","KCID","KMLI","KPIA","KJVL","KUGN","KOSH","KAXA","KCWA","KRHI","KMQT","KLNL","KSAW","KDRM","KGLR","KBAX","KFNT","KLAN","KPTK","KJXN","KAZO","KBEH","KLDM","KMKG","KSJX","KSUE","KESC","KPCW","KDKK","KOLE","KOYM","KIDI","KELM","KIPT","KGTB","KSLK","KRME","KBML","KMPV","KMLT","KBHB","KAUG","PAQT","PAWM","PAGL","PFSH","PAKK","PAUN","PFKT","PATE","PASK","PAIK","PAIM","PAHL","PACX","PAGK","PAZK","PACV","PFCB","PAKH","PASO","PAWD","PATO","PAEN","PAED","PAAQ","PAWS","PABV","PATK","PAPT",'PAIG','PAKN','PANW','PAII','PAPN','PAMB','PATG','PAEH','PAPM','PAQH','PAKI','PAIL','PASV','PASL','PFKW','PANI','PARS','PAHC','PASM','PANV','PAHX','PAMO','PAEM','PFKO','PAVC','PAOU','PAPH','PANN','PAIN','PAMH','PABI','PATL','PAFS','PAKV','PANU','PAGA','PARY','PAMM','PAKT','PAHY','PAKW','PAWG','PAPG','PAFE','PASI','PAEL','PAOH','PAGS','PAGY','PAHN'];

export const CATEGORIES = ["lifr", "ifr", "mvfr", "vfr", "none"] as const;

export const OBS_TYPES = ["AUTO", "MANNED"] as const;

export const WINDBARB_COLOURS = {
  50: "black",
  40: "red",
  30: "orange",
  20: "yellow",
};

export const STATION_TEXT_STYLE: SymbolLayerSpecification = {
  id: "layer-station-text",
  type: "symbol",
  source: "stations",
  layout: {
    "text-optional": false,
    "text-size": 12,
    "text-font": ["Consolas-Regular"],
    "text-allow-overlap": true,
  },
  paint: {
    "text-color": "white",
    "text-halo-color": "#000000",
    "text-halo-width": 1,
  },
};

export const ICON_SIZES = {
  mini: { station: 0.4, windbarb: 0.5 },
  reduced: { station: 0.6, windbarb: 0.75 },
  maximum: { station: 0.8, windbarb: 1 },
};

export const STATION_DENSITY_THRESHOLDS = {
  global: 2.8,
  min: 4.8,
  max: 6.5,
};
