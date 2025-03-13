const cloudPattern = /\b(OVC|BKN|VV)[0][0]\d\b/g;
const fzPrecipitation = /((-|\+|\b)(FZRA|PL|SNPL|FZRASN|FZDZ)+)\b/g;
const windPattern =
  /(WS\d{3}\/)?(\b\d{3}|\bVRB)([2-9][5-9]|[3-9]\d|\d{3})G?([2-9][5-9]|[3-9][0-9]|\d{3})?KT\b|\b((\b\d{3}|\bVRB)\d{2,3}G([2-9][6-9]|[3-9][0-9]|\d{3}))KT\b/g;

const ifrWxPattern =
  /\b(?:[0-2](?:\s[0-9]\/[0-9])?|[0-9]\/[0-9])SM(?:\s(?:[-+])?(?:(?:BL|SH|TS|FZ|VC|)?(?:(?:RA|SN|DZ){1,3}|(?:DZ|RA|SN|SG|IC|PE|PL|GR|GS|FC|BR|FG|FZFG|HZ|FU|VA|DU|SA|PY))(?:\s(?:[-+])?(?:BL|SH|TS|FZ|VC|)?(?:(?:RA|SN|DZ){1,3}|(?:DZ|RA|SN|SG|IC|PE|PL|GR|GS|FC|BR|FG|FZFG|HZ|FU|VA|DU|SA|PY)))*))?\b/g;

const tsPattern =
  /(.{3}\d{2,}G?\d{0,2}KT\sP?\d{0,2}\/?\dSM\s(\+|-)?(VCTS|TSRA|TSSN|TSRAGR|TSSNGR|TSGR|TSRAGR)(\s\+?FC)?\s(\w{3}\d{3}\s)*(\w{3}\d{3}CB))/g;

export const siteIdPattern = /(C[YWZ][A-Z]{2})\b/g;

export const SIGWX_REGEX = { cloudPattern, fzPrecipitation, windPattern, ifrWxPattern, tsPattern, siteIdPattern };
