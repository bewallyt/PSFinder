import * as moment from "moment";

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

import { Stores } from "./find-ps5-script";

const sendIsAvailableTextAsync = async (retailer: Stores) => {
  // Log store
  var now = moment().format("MMM DD h:mm A");
  const text = `${now}: PS5 available at on ${retailer}`;
  console.log(text);

  // Send text
  await client.messages.create({
    body: text,
    from: process.env.FROM_PHONE_NUMBER,
    to: process.env.TO_PHONE_NUMBER,
  });
};

const sendIsUnavailableTextAsync = async (retailer: Stores) => {
  // Log store
  var now = moment().format("MMM DD h:mm A");
  const text = `${now}: PS5 no longer available at ${retailer}`;
  console.log(text);

  // Send text
  await client.messages.create({
    body: text,
    from: process.env.FROM_PHONE_NUMBER,
    to: process.env.TO_PHONE_NUMBER,
  });
};

const callPhoneAsync = (): Promise<void> =>
  client.calls
    .create({
      twiml: "<Response><Say>We out here</Say></Response>",
      from: process.env.FROM_PHONE_NUMBER,
      to: process.env.TO_PHONE_NUMBER,
    })
    .then((call) => console.log(call.sid));

export { sendIsAvailableTextAsync, sendIsUnavailableTextAsync, callPhoneAsync };
