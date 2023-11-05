// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
// Import jwt for validating the user token
import jwt from 'jsonwebtoken';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const clientsecret = new SecretsManagerClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * A HTTP post method to add one Event item to a DynamoDB table.
 */
export const addEventHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get token from the authorization header
    const token = await event.headers.Authorization.split(" ")[1];
    if (!token) {
        throw new Error(`Authorization token required.`);
    }

    // Get Event id, title and description from the body of the request
    const body = JSON.parse(event.body);
    const id = body.id;
    const title = body.title;
    const description = body.description;

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

    // Decode the JWT token to get user data
    const userID = decodedToken.userId;
    const userName = decodedToken.userName;

     console.info('decode-username:', userName);
     console.info('decode-userid:', userID);

    // Creates a new Event item, or replaces an old item with a new item
    var params = {
        TableName : tableName,
        Item: { id : id, title: title, description: description, added_by:  userName, added_by_id: userID}
    };

    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - event added successfully", data);
      } catch (err) {
        console.log("Error", err.stack);
      }

    const response = {
        statusCode: 200,
        body: JSON.stringify(body)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
