const cloudPattern = /\b(OVC|BKN|VV)[0][0]\d\b/g;
const fzPrecipitation = /((-|\+|\b)(FZRA|PL|SNPL|FZRASN|FZDZ)+)\b/g;
const windPattern =
  /(WS\d{3}\/)?(\b\d{3}|\bVRB)([2-9][5-9]|[3-9]\d|\d{3})G?([2-9][5-9]|[3-9][0-9]|\d{3})?KT\b|\b((\b\d{3}|\bVRB)\d{2,3}G([2-9][6-9]|[3-9][0-9]|\d{3}))KT\b/g;

// const visPattern = /\b([0-2](\s[0-9]\/[0-9])?|[0-9]\/[0-9])SM\b/g;
// const rvrPattern = /(\sR\d{2}\/\d{1,4}(V\d{1,4})FT\/[DNU])*/g;

/*

going to move to a more legible, combinatorial regex that is easier to maintain

*/

// const ifrWxPattern = new RegExp(String.raw`${visPattern.source}${rvrPattern.source}`, "g");

const ifrWxPattern =
  /\b([0-2](\s[0-9]\/[0-9])?|[0-9]\/[0-9])SM(\sR\d{2}\/\d{1,4}(V\d{1,4})FT\/[DNU])*(?:\s(?:[-+])?(?:(?:PR|BL|SH|TS|FZ|VC|)?(?:(?:RA|SN|DZ){1,3}|(?:DZ|RA|SN|SG|IC|PE|PL|GR|GS|FC|BR|FG|FZFG|HZ|FU|VA|DU|SA|PY))(?:\s(?:[-+])?(?:BL|SH|TS|FZ|VC|)?(?:(?:RA|SN|DZ){1,3}|(?:DZ|RA|SN|SG|IC|PE|PL|GR|GS|FC|BR|FG|FZFG|HZ|FU|VA|DU|SA|PY)))*))?\b/g;

const tsPattern =
  /((((VRB)?\d{2,}G\d{0,2}KT\s)(\d{2,3}V\d{2,3}\s))?(P?\d{0,2}\/?\dSM\s)(-SHRA\s)?(\+|-)?(TSRAGR|TSRAGS|TSSNGR|TSRA|TSSN|TSGR|VCTS|TS)(\s\+?FC|\sBR|\sFG)?((\s(\w{3}\d{3}\s)*(\w{3}\d{3}CB))?)?)/g;

export const siteIdPattern = /(C[YWZ][A-Z]{2})\b/g;

export const SIGWX_REGEX = { tsPattern, cloudPattern, fzPrecipitation, windPattern, ifrWxPattern, siteIdPattern };
