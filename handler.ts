import { APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as shortId from 'shortid'
import 'source-map-support/register'

const REDIRECTS_TABLE = 'redirects'
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
      } else if (!data.Item) {
        callback(null, {
          statusCode: 404,
          body: JSON.stringify({ error: 'not found' })
        })
      } else {
        const putParams = {
          TableName: REDIRECTS_TABLE,
          Item: {
            id: shortId.generate(),
            urlId: data.Item.id,
            timestamp: Date.now()
          }
        }

        dynamoDb.put(putParams, error => {
          if (error) {
            callback(error)
          } else {
            callback(null, {
              statusCode: 301,
              headers: { Location: data.Item!.url }, // TODO fix coercion
              body: 'redirecting to ' + data.Item!.url
            })
          }
        })
      }
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

export const getStats: APIGatewayProxyHandler = (event, _context, callback) => {
  const id = event.pathParameters!.id
  const params = {
    TableName: REDIRECTS_TABLE
  }

  // TODO fix naive scan query:
  dynamoDb.scan(params, (error, data) => {
    if (error) {
      callback(error)
    } else {
      const redirects = (data.Items || [])
        .filter(item => item.urlId == id)
        .reduce((acc, item) => {
          const key = timestampToKey(item.timestamp)
          if (!(key in acc)) {
            return { ...acc, [key]: 1 }
          }
          return { ...acc, [key]: acc[key] + 1 }
        }, {})

      callback(null, { statusCode: 200, body: JSON.stringify(redirects) })
    }
  })
}

function timestampToKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.toISOString().substr(0, 10)} ${date
    .getUTCHours()
    .toString()
    .padStart(2, '0')}:00:00`
}
