import { APIGatewayProxyHandler } from 'aws-lambda' // tslint:disable-line:no-implicit-dependencies
import * as AWS from 'aws-sdk'
import * as shortId from 'shortid'

const REDIRECTS_TABLE = 'redirects'
const URLS_TABLE = 'urls'

const dynamoDb = process.env.IS_OFFLINE
  ? new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  : new AWS.DynamoDB.DocumentClient()

export const getUrl: APIGatewayProxyHandler = async event => {
  const data = await dynamoDb
    .get({
      TableName: URLS_TABLE,
      Key: { id: event.pathParameters!.id }
    })
    .promise()

  if (!data.Item) {
    return { statusCode: 404, body: JSON.stringify({ error: 'not found' }) }
  }

  const putParams = {
    TableName: REDIRECTS_TABLE,
    Item: {
      id: shortId.generate(),
      urlId: data.Item.id,
      timestamp: Date.now()
    }
  }

  await dynamoDb.put(putParams).promise()

  return {
    statusCode: 301,
    headers: { Location: data.Item.url },
    body: 'redirecting to ' + data.Item!.url
  }
}

export const createUrl: APIGatewayProxyHandler = async event => {
  const url = event.queryStringParameters!.url // TODO: handle missing
  const scanParams = {
    TableName: URLS_TABLE
  }

  const data = await dynamoDb.scan(scanParams).promise()
  const existingUrl = (data.Items || []).find(item => item.url === url)

  if (existingUrl) {
    return {
      statusCode: 200,
      body: JSON.stringify(existingUrl) // TODO: check response body type
    }
  }

  const putParams = {
    TableName: URLS_TABLE,
    Item: {
      id: shortId.generate(),
      url
    }
  }

  await dynamoDb.put(putParams).promise()

  return {
    statusCode: 201,
    body: JSON.stringify(putParams.Item)
  }
}

export const getStats: APIGatewayProxyHandler = async event => {
  const id = event.pathParameters!.id
  const params = {
    TableName: REDIRECTS_TABLE
  }

  // TODO fix naive scan query:
  const data = await dynamoDb.scan(params).promise()
  const redirects = (data.Items || [])
    .filter(item => item.urlId === id)
    .reduce((acc, item) => {
      const key = timestampToKey(item.timestamp)
      if (!(key in acc)) {
        return { ...acc, [key]: 1 }
      }
      return { ...acc, [key]: acc[key] + 1 }
    }, {})

  return { statusCode: 200, body: JSON.stringify(redirects) }
}

function timestampToKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.toISOString().substr(0, 10)} ${date
    .getUTCHours()
    .toString()
    .padStart(2, '0')}:00:00`
}
