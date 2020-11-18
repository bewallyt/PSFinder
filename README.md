# PSFinder
Pings Amazon, Target, PlayStation Direct, and BestBuy every 20 seconds to see if PS5 Digital Edition is available.

### Initial Setup
```yarn install```
&
Create a `.env` file with the following key value pairs:

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
FROM_PHONE_NUMBER=
TO_PHONE_NUMBER=
BEST_BUY_API_KEY=
```

- BestBuy API Key can be generated [here](https://developer.bestbuy.com/).
- [Twilio](https://www.twilio.com/) account required to receive text messages and phone calls.
- Requires [Node](https://nodejs.org/en/download/) and [Yarn](https://classic.yarnpkg.com/en/docs/install/) to be globally installed.

### How to Run
```yarn start```


### Notes
[This](https://www.zoolert.com/videogames/consoles/playstation5/) also exists.
