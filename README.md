# Vingle app

A simple URL shortener API running on NodeJS/Typescript, deployed on AWS Lamda with the Serverless Framework.

## Dependencies
- yarn
- Serverless framework
- Java Runtime Engine (JRE) version 6.x or newer for [local DynamoDB](https://github.com/99xt/serverless-dynamodb-local)

## Local development

First install dependencies:

```bash
yarn
sls dynamodb install
```

Then start local development server with `sls offline start`.

## Test

`yarn test`

## Deploy

`sls deploy`

## TODO
- JSON Schema-based request validation at API Gateway
- Integration tests
- Use async DynamoDB client to get rid of nested callbacks
- Smarter hourly time-series aggregation as opposed to the naive full-table scan
