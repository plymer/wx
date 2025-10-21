import { XMLParser } from "fast-xml-parser";
import { transformName } from "./utils.js";

export class WMSXMLParser {
  parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      removeNSPrefix: true,
      ignoreAttributes: false,
      textNodeName: "value",
      attributeNamePrefix: "",
      transformAttributeName: (attrName) => transformName(attrName),
      transformTagName: (tagName) => transformName(tagName),
    });
  }
}
