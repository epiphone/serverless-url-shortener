import { APIGatewayProxyHandler } from 'aws-lambda' // tslint:disable-line:no-implicit-dependencies
import * as AWS from 'aws-sdk'
import * as shortId from 'shortid'

const URLS_TABLE = process.env.URLS_TABLE_NAME!
const URL_INDEX = process.env.URL_INDEX_NAME!

const dynamoDb = process.env.IS_OFFLINE
  ? new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  : new AWS.DynamoDB.DocumentClient()

export const getUrl: APIGatewayProxyHandler = async event => {
  const id = event.pathParameters!.id

  const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: URLS_TABLE,
    Key: { id },
    UpdateExpression:
      'SET hits.#key = if_not_exists(hits.#key, :default) + :increment',
    ExpressionAttributeNames: { '#key': timestampToKey(Date.now()) },
    ExpressionAttributeValues: { ':default': 0, ':increment': 1 },
    ReturnValues: 'ALL_NEW'
  }

  try {
    const data = await dynamoDb.update(params).promise()

    return {
      statusCode: 301,
      headers: { Location: data.Attributes!.url },
      body: 'redirecting to ' + data.Attributes!.url
    }
  } catch (error) {
    if (error.code === 'ValidationException') {
      return { statusCode: 404, body: JSON.stringify({ error: 'not found' }) }
    }

    throw error
  }
}

export const createUrl: APIGatewayProxyHandler = async event => {
  const url = event.queryStringParameters!.url // TODO: handle missing

  // Check whether URL has already been shortened;
  // Note the potential race condition though:
  const queryParams: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: URLS_TABLE,
    IndexName: URL_INDEX,
    KeyConditionExpression: '#url = :url',
    ExpressionAttributeNames: { '#url': 'url' },
    ExpressionAttributeValues: { ':url': url },
    ProjectionExpression: 'id',
    Limit: 1
  }

  const data = await dynamoDb.query(queryParams).promise()
  if (data.Items && data.Items.length > 0) {
    return { statusCode: 200, body: JSON.stringify(data.Items[0]) }
  }

  const putParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: URLS_TABLE,
    Item: {
      id: shortId.generate(),
      url,
      hits: {}
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

  const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: URLS_TABLE,
    Key: { id },
    ProjectionExpression: 'hits'
  }

  const data = await dynamoDb.get(params).promise()

  if (!data.Item) {
    return { statusCode: 404, body: JSON.stringify({ error: 'not found' }) }
  }

  return { statusCode: 200, body: JSON.stringify(data.Item.hits) }
}

function timestampToKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.toISOString().substr(0, 10)} ${date
    .getUTCHours()
    .toString()
    .padStart(2, '0')}:00:00`
}
