import axios from "axios";
import { Hono } from "hono";
import { NavCanImageList, NavCanResponse } from "../lib/alphanumeric.types.js";

const route = new Hono();

route.get("/gfa", async (c) => {
  try {
    const url =
      "https://plan.navcanada.ca/weather/api/alpha/?site=CYEG&site=CYVR&site=CYZF&site=CYFB&site=CYYZ&site=CYHZ&site=CYRB&image=GFA/CLDWX&image=GFA/TURBC";

    console.log("requesting gfas from:", url);

    const ncAPIData: NavCanResponse = await axios.get(url).then((gfas) => gfas.data);

    const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

    // i am too lazy to define this type-shape so we will ts-ignore the type assigment error below because this is a valid piece of code
    let results = {};
    rawList.forEach((gfa) => {
      if (Object.hasOwn(results, gfa.geography.toLowerCase())) {
        // the gfa is already in our results, but we need to add it's CLDWX or TURBC data to the results
        //@ts-ignore
        Object.assign(results[gfa.geography.toLowerCase()], {
          [gfa.sub_product.toLowerCase()]: gfa.frame_lists[2].frames.map(
            (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
          ),
        });
      } else {
        Object.assign(results, {
          [gfa.geography.toLowerCase()]: {
            [gfa.sub_product.toLowerCase()]: gfa.frame_lists[2].frames.map(
              (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
            ),
          },
        });
      }
    });

    type GFAList = {
      domain: string;
      cldwx: string[];
      turbc: string[];
    };

    let output: GFAList[] = [];

    // continue to ts-ignore the non-shaped 'results' because eff that right now
    // @ts-ignore
    Object.keys(results).forEach((d) => output.push({ domain: d, cldwx: results[d].cldwx, turbc: results[d].turbc }));

    return c.json(output, 200);
  } catch (error) {
    console.log(error);
    c.json({ status: "error", error: error }, 400);
  }
});

route.get("/", async (c) => {
  try {
    const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CYHZ&image=SIG_WX//MID_LEVEL/*";

    console.log("requesting sigwx charts from:", url);

    const ncAPIData: NavCanResponse = await axios.get(url).then((gfas) => gfas.data);

    const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

    // i am too lazy to define this type-shape so we will ts-ignore the type assigment error below because this is a valid piece of code
    let results = {};
    rawList.forEach((p) => {
      const product = p.product.toLowerCase();

      if (Object.hasOwn(results, product)) {
        // the product is already in our results, but we need to add the other type of chart to the results
        //@ts-ignore
        Object.assign(results[product], {
          [p.sub_geography.toLowerCase()]: p.frame_lists[0].frames.map(
            (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
          ),
        });
      } else {
        Object.assign(results, {
          [product]: {
            [p.sub_geography.toLowerCase()]: p.frame_lists[0].frames.map(
              (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
            ),
          },
        });
      }
    });

    type SigWxList = { domain: string; images: string[] };

    // continue to ts-ignore the non-shaped 'results' because eff that right now
    // @ts-ignore
    let output: SigWxList[] = [{ domain: "atlantic", images: results.sig_wx.atlantic },{ domain: "canada", images: results.sig_wx.canada }]; // prettier-ignore

    return c.json(output, 200);
  } catch (error) {
    console.log(error);
    c.json({ status: "error", error: error }, 400);
  }
});

route.get("/", async (c) => {
  try {
    const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CYHZ&image=TURBULENCE";

    console.log("requesting hlt charts from:", url);

    const ncAPIData: NavCanResponse = await axios.get(url).then((gfas) => gfas.data);

    const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

    // i am too lazy to define this type-shape so we will ts-ignore the type assigment error below because this is a valid piece of code
    let results = {};
    rawList.forEach((p) => {
      const product = p.product.toLowerCase();

      if (Object.hasOwn(results, product)) {
        // the product is already in our results, but we need to add the other type of chart to the results
        //@ts-ignore
        Object.assign(results[product], {
          [p.geography.toLowerCase()]: p.frame_lists[0].frames.map(
            (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
          ),
        });
      } else {
        Object.assign(results, {
          [product]: {
            [p.geography.toLowerCase()]: p.frame_lists[0].frames.map(
              (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
            ),
          },
        });
      }
    });

    type HLTList = { domain: string; images: string[] };

    // continue to ts-ignore the non-shaped 'results' because eff that right now
    // @ts-ignore
    let output: HLTList[] = [{ domain: "canada", images: results.turbulence.canada },{ domain: "north_atlantic", images: results.turbulence.north_atlantic },]; // prettier-ignore

    return c.json(output, 200);
  } catch (error) {
    console.log(error);
    c.json({ status: "error", error: error }, 400);
  }
});

route.get("/", async (c) => {
  try {
    const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CZVR&image=LGF";

    console.log("requesting lgfs from:", url);

    const ncAPIData: NavCanResponse = await axios.get(url).then((lgfs) => lgfs.data);

    const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

    let results = {};
    rawList.forEach((lgf) => {
      Object.assign(results, {
        [lgf.geography.toLowerCase()]: lgf.frame_lists[lgf.frame_lists.length - 1].frames.map(
          (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
        ),
      });
    });

    type LGFList = {
      domain: string;
      images: string[];
    };

    let output: LGFList[] = [];

    // continue to ts-ignore the non-shaped 'results' because eff that right now
    // @ts-ignore
    Object.keys(results).forEach((p) => output.push({ domain: p, images: results[p] }));

    return c.json(output, 200);
  } catch (error) {
    console.log(error);
    c.json({ status: "error", error: error }, 400);
  }
});

route.get("/", async (c) => {
  try {
    // base url for all navcan images
    const RESOURCE_URL = "https://plan.navcanada.ca/weather/images/";

    // query to navcan api
    const apiURL =
      "https://plan.navcanada.ca/weather/api/alpha/?site=CZVR&site=CZEG&site=CZWG&site=CZYZ&site=CZUL&site=CZQM&site=CZQX&image=GFA/CLDWX&image=GFA/TURBC&image=LGF&image=TURBULENCE&image=SIG_WX//MID_LEVEL/*";

    const ncAPIData: NavCanResponse = await axios.get(apiURL).then((imageList) => imageList.data);

    const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

    type GFAList = {
      cldwx?: string[];
      turbc?: string[];
    };

    let output: { [key: string]: GFAList | string[] } = {};

    rawList.forEach((item) => {
      switch (item.product) {
        case "GFA":
          // the gfa was already in the list so we update it with the newest instance of the data for the sub_product we have encountered
          if (Object.keys(output).includes(item.geography)) {
            Object.assign(output[item.geography], {
              [item.sub_product]: item.frame_lists[2].frames.map(
                (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`
              ),
            });
          } else {
            // gfa was not yet added to the list so we add the first instance of it, including its sub_product
            Object.assign(output, {
              [item.geography]: {
                [item.sub_product]: item.frame_lists[2].frames.map(
                  (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`
                ),
              },
            });
          }
          break;
        case "SIG_WX":
          if (Object.keys(output).includes("SIGWX")) {
            Object.assign(output["SIGWX"], {
              [item.sub_geography]: item.frame_lists[0].frames.map(
                (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`
              ),
            });
          } else {
            // sigwx chart was not yet added to the list so we add the first instance of it, including its sub_geography
            Object.assign(output, {
              ["SIGWX"]: {
                [item.sub_geography]: item.frame_lists[0].frames.map(
                  (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`
                ),
              },
            });
          }
          break;
        case "TURBULENCE":
          if (Object.keys(output).includes("HLT")) {
            Object.assign(output["HLT"], {
              [item.geography]: item.frame_lists[0].frames.map(
                (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`
              ),
            });
          } else {
            Object.assign(output, {
              ["HLT"]: {
                [item.geography]: item.frame_lists[0].frames.map(
                  (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`
                ),
              },
            });
          }
          break;
        case "LGF":
          // each lgf region will only appear in the navcan api output once
          Object.assign(output, {
            [item.geography]: item.frame_lists[0].frames.map(
              (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`
            ),
          });
          break;
      }
    });

    return c.json(output, 200);
  } catch (error) {
    c.json({ status: "error", error: error }, 400);
  }
});

export default route;
