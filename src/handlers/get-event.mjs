import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import jwt from 'jsonwebtoken';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const clientsecret = new SecretsManagerClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * A HTTP get method to get one item by id from a DynamoDB table.
 */
export const getEventByIdHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  // get the token from the authorization header
  const token = await event.headers.Authorization.split(" ")[1];
  //console.info('jwt-token:', token);
  if (!token) {
      throw new Error(`Authorization token required.`);
  }

  const secret_value = await clientsecret.send(new GetSecretValueCommand({
      SecretId: "JWTUserTokenSecret",
  }));

  const jwt_secret = JSON.parse(secret_value.SecretString);

  //check if the token matches the supposed origin
  const decodedToken = jwt.verify(token, jwt_secret.jwt_secret);
  if (!decodedToken) {
      throw new Error(`Authorization token invalid or it has expired.`);
  }
 
  // Get id from pathParameters from APIGateway because of `/{id}` at template.yaml
  const id = event.pathParameters.id;
 
  // Get the item from the table
  var params = {
    TableName : tableName,
    Key: { id: id },
  };

  try {
    const data = await ddbDocClient.send(new GetCommand(params));
    var item = data.Item;
  } catch (err) {
    console.log("Error", err);
  }
 
  const response = {
    statusCode: 200,
    body: JSON.stringify(item)
  };
 
  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}
