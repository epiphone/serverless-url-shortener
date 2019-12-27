import { APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as shortId from 'shortid'
import 'source-map-support/register'

const URLS_TABLE = 'urls'

const dynamoDb = process.env.IS_OFFLINE
  ? new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  : new AWS.DynamoDB.DocumentClient()

export const getUrl: APIGatewayProxyHandler = (event, _context, callback) => {
  dynamoDb.get(
    {
      TableName: URLS_TABLE,
      Key: { id: event.pathParameters!.id }
    },
    (error, data) => {
      if (error) {
        callback(error)
      }

      const response = data.Item
        ? { statusCode: 200, body: JSON.stringify(data.Item) }
        : { statusCode: 404, body: JSON.stringify({ error: 'not found' }) }

      callback(null, response)
    }
  )
}

export const createUrl: APIGatewayProxyHandler = (
  event,
  _context,
  callback
) => {
  const url = event.queryStringParameters!.url // TODO: handle missing
  const scanParams = {
    TableName: URLS_TABLE
  }

  dynamoDb.scan(scanParams, (error, data) => {
    if (error) {
      callback(error)
    } else {
      const existingUrl = (data.Items || []).find(item => item.url === url)

      if (existingUrl) {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(existingUrl) // TODO: check response body type
        })
      } else {
        const putParams = {
          TableName: URLS_TABLE,
          Item: {
            id: shortId.generate(),
            url
          }
        }

        dynamoDb.put(putParams, error => {
          if (error) {
            callback(error)
          } else {
            callback(null, {
              statusCode: 201,
              body: JSON.stringify(putParams.Item)
            })
          }
        })
      }
    }
  })
}

export const getStats: APIGatewayProxyHandler = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'stats TODO' })
  }
}
