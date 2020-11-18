/* eslint-disable max-len */

require("dotenv").config();

import "cross-fetch/polyfill";

import {
  callPhoneAsync,
  sendIsAvailableTextAsync,
  sendIsUnavailableTextAsync,
} from "./text-messages";
import moment = require("moment");
const open = require("open");

const CronJob = require("cron").CronJob;

/*
ts-node -O '{"module":"commonjs", "target":"es2017"}' ./find-ps5-script.ts
 */

export enum Stores {
  AMAZON = "AMAZON",
  BESTBUY = "BEST BUY",
  TARGET = "TARGET",
  PLAYSTATION_DIRECT = "PLAYSTATION DIRECT",
}

export let availableStoresCache = {
  [Stores.AMAZON]: false,
  [Stores.BESTBUY]: false,
  [Stores.TARGET]: false,
  [Stores.PLAYSTATION_DIRECT]: false,
};

export const retailSites = {
  [Stores.BESTBUY]:
    "https://www.bestbuy.com/site/sony-playstation-5-digital-edition-console/6430161.p?skuId=6430161",
  [Stores.AMAZON]: "https://www.amazon.com/dp/B08FC6MR62",
  [Stores.TARGET]:
    "https://www.target.com/p/playstation-5-digital-edition-console/-/A-81114596#lnk=sametab",
  [Stores.PLAYSTATION_DIRECT]:
    "https://direct.playstation.com/en-us/consoles/console/playstation5-digital-edition-console.3005817",
};

const payload = {
  [Stores.AMAZON]: {
    url:
      "https://www.amazon.com/dp/B08FC6MR62/ref=twister_B08JDXP7CG?_encoding=UTF8&tag=cnet-buy-button-20&ascsubtag=d5dd1dc1-bd46-4706-a714-717b3e86a3e1%7C___VIEW_GUID___%7Cdtp%7Cus",
    matcher: "399.99",
  },
};

const findViaHTMLDocumentAsync = async (retailer: Stores): Promise<void> => {
  const { url, matcher } = payload[retailer];
  const res = await fetch(url);
  const content = await res.text();

  const isAvailable = content.includes(matcher);
  await updateCacheAndSendTextAsync({ isAvailable, retailer });
};

const findAtBestBuyAsync = async (): Promise<void> => {
  const res = await fetch(
    `https://api.bestbuy.com/v1/products(sku=6430161)?apiKey=${process.env.BEST_BUY_API_KEY}&format=json`
  );
  const {
    products: [productInfo],
  } = await res.json();

  const { orderable, inStoreAvailability, onlineAvailability } = productInfo;
  const isAvailable =
    (orderable !== "SoldOut" && orderable !== "ComingSoon") ||
    inStoreAvailability ||
    onlineAvailability;
  await updateCacheAndSendTextAsync({ isAvailable, retailer: Stores.BESTBUY });
};

const findInAustinTargetAsync = async (): Promise<void> => {
  const res = await fetch(
    "https://api.target.com/fulfillment_aggregator/v1/fiats/81114596?key=ff457966e64d5e877fdbad070f276d18ecec4a01&nearby=78758&limit=20&requested_quantity=1&radius=50&fulfillment_test_mode=grocery_opu_team_member_test"
  );
  const {
    products: [productInfo],
  } = await res.json();

  const { locations } = productInfo;
  const availableLocations = locations.filter(
    ({ order_pickup, curbside, ship_to_store, in_store_only }) => {
      const unavailableKeywords = [
        "UNAVAILABLE",
        "NOT_SOLD_IN_STORE",
        "OUT_OF_STOCK",
      ];
      return (
        !unavailableKeywords.includes(order_pickup.availability_status) ||
        !unavailableKeywords.includes(curbside.availability_status) ||
        !unavailableKeywords.includes(ship_to_store.availability_status) ||
        !unavailableKeywords.includes(in_store_only.availability_status)
      );
    }
  );
  await updateCacheAndSendTextAsync({
    isAvailable: availableLocations.length > 0,
    retailer: Stores.TARGET,
    data: availableLocations,
  });
};

const findOnPlaystationDirectAsync = async (): Promise<void> => {
  const res = await fetch(
    "https://api.direct.playstation.com/commercewebservices/ps-direct-us/users/anonymous/products/productList?fields=BASIC&productCodes=3005817"
  );
  const { products } = await res.json();

  const {
    stock: { stockLevelStatus },
  } = products[0];
  const isAvailable = stockLevelStatus != "outOfStock";
  await updateCacheAndSendTextAsync({
    isAvailable,
    retailer: Stores.PLAYSTATION_DIRECT,
  });
};

/*
Helper Functions Below:
*/

const updateCacheAndSendTextAsync = async ({
  isAvailable,
  retailer,
  data = [],
}: {
  isAvailable: boolean;
  retailer: Stores;
  data?: String[];
}) => {
  // debug log
  console.log(`isAvailable ${retailer}`, isAvailable);
  if (data?.length > 0) {
    console.log("extra data", data);
  }

  // If available and previously not available then send text
  if (isAvailable && !availableStoresCache[retailer]) {
    // cache that we've marked retailer's ps5 stock as available.
    availableStoresCache[retailer] = true;
    await open(retailSites[retailer], { app: ["google chrome"] });
    await sendIsAvailableTextAsync(retailer);
    await callPhoneAsync();
  } // If not available and previously was available
  else if (!isAvailable && availableStoresCache[retailer]) {
    // cache that we've marked retailer's ps5 stock as unavailable
    availableStoresCache[retailer] = false;
    await sendIsUnavailableTextAsync(retailer);
  }
};

console.log("----- RUNNING FIND PS5 SCRIPT -----", {
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TO_PHONE_NUMBER: process.env.TO_PHONE_NUMBER,
  FROM_PHONE_NUMBER: process.env.FROM_PHONE_NUMBER,
  BEST_BUY_API_KEY: process.env.BEST_BUY_API_KEY,
});

const checkEveryTwoSecondsJob = new CronJob("*/2 * * * * *", async () => {
  var now = moment().format("MMM DD h:mm:ss A");
  console.log(`Checking at ${now}`);
  await findAtBestBuyAsync();
  // await findViaHTMLDocumentAsync(Stores.AMAZON);
});

const checkEveryTwentySecondsJob = new CronJob("*/20 * * * * *", async () => {
  var now = moment().format("MMM DD h:mm:ss A");
  console.log(`Checking at ${now}`);
  await findInAustinTargetAsync();
  await findOnPlaystationDirectAsync();
  // await findViaHTMLDocumentAsync(Stores.AMAZON);
});

checkEveryTwentySecondsJob.start();
checkEveryTwoSecondsJob.start();
