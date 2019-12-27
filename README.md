# URL shortener

A simple URL shortener API running on NodeJS/Typescript/AWS Lambda/Serverless Framework/DynamoDB.

Completed in a mad 3-hour dash for a coding exercise. The basic features that I implemented are
- `POST /?url={longUrl}` endpoint for creating short URLS
  - returns short URL if given URL is already shortened
- `GET /{shortUrl}` endpoint that redirects to given target URL if found
  - we're keeping track of successful redirects for statistics
- `GET /{shortUrl}/stats` endpoint that returns hourly redirect counts per given `shortUrl`

Here's what's missing or what I'd improve on:
- Make sure the response data types match the spec. The stats endpoint's response format for example is a bit different than in the spec.
- Use an async DynamoDB client to get rid of nested callbacks
- Write an OpenAPI schema and use API Gateway to validate requests
- Integration tests. My grand plan was to run integration tests locally against `serverless-offline` and `serverless-dynamodb-local`. However, by the time I had this set up, there was no more time to write the actual tests...
- Smarter hourly time-series aggregation as opposed to the naive full-table scan. With more time I'd rethink the whole table design.
- CI/CD: build, run tests and lint on GitHub actions + run `sls deploy` if on `master` branch
- Set DynamoDB table names as Serverless Framework config variables and pass to Lambda handlers as env vars to avoid hardcoding table names to code
- Tune the Lambda IAM policy to avoid overly wide permissions

In general I ended up spending way too much time setting up the local dev environment. In hindsight I probably wouldn't worry that much about having tests considering it's just a 3-hour exercise. The integration tests in particular were an overkill and took way too much time to configure.

## Dependencies
- `yarn`
- Serverless framework
- Java Runtime Engine (JRE) version 6.x or newer for [local DynamoDB](https://github.com/99xt/serverless-dynamodb-local)

## Local development

First install dependencies:

```bash
yarn install
sls dynamodb install
```

Then start local development server with `sls offline start`.

## Test

`yarn test`

## Deploy

`sls deploy`
