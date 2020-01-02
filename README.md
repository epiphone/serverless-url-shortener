# URL shortener

A simple URL shortener API running on NodeJS/Typescript/AWS Lambda/Serverless Framework/DynamoDB.

Original version (see [branch](https://github.com/epiphone/serverless-url-shortener/tree/3hours)) completed in a mad 3-hour dash for a coding exercise, tidied up later. The basic features are
- `POST /?url={longUrl}` endpoint for creating short URLS
  - returns short URL if given URL is already shortened
- `GET /{shortUrl}` endpoint that redirects to given target URL if found
  - we're keeping track of successful redirects for statistics
- `GET /{shortUrl}/stats` endpoint that returns hourly redirect counts per given `shortUrl`

## Future work
- [x] ~~Use an async DynamoDB client to get rid of nested callbacks~~
- [ ] Write an OpenAPI schema and use API Gateway to validate requests
- [ ] Integration tests: try running integration tests locally against `serverless-offline` and `serverless-dynamodb-local`
- [x] ~~Smarter hourly time-series aggregation as opposed to the naive full-table scan~~
- [ ] CI/CD: build, run tests and lint on GitHub actions + run `sls deploy` if on `master` branch
- [x] ~~Set DynamoDB table names as Serverless Framework config variables and pass to Lambda handlers as env vars to avoid hardcoding table names to code~~
- [ ] Tune the Lambda IAM policy to avoid overly wide permissions

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
