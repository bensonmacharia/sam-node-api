import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
// Import jwt for validating the user token
import jwt from 'jsonwebtoken';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const clientsecret = new SecretsManagerClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * A HTTP get method to get all events from a DynamoDB table.
 */
export const getAllEventsHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get token from the authorization header
    const token = await event.headers.Authorization.split(" ")[1];
    if (!token) {
        throw new Error(`Authorization token required.`);
    }

    // Fetch the JWT secret string from AWS Secrets Manager 
    const secret_value = await clientsecret.send(new GetSecretValueCommand({
        SecretId: "JWTUserTokenSecret",
    }));
    const jwt_secret = JSON.parse(secret_value.SecretString);

    //Check if the token is valid
    const decodedToken = jwt.verify(token, jwt_secret.jwt_secret);
    if (!decodedToken) {
        throw new Error(`Authorization token invalid or it has expired.`);
    }

    // Get all items from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
    var params = {
        TableName : tableName
    };

    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        var items = data.Items;
    } catch (err) {
        console.log("Error", err);
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify(items)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
