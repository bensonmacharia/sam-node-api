import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import jwt from 'jsonwebtoken';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const clientsecret = new SecretsManagerClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * A HTTP post method to add one item to a DynamoDB table.
 */
export const addEventHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // get the token from the authorization header
    const token = await event.headers.Authorization.split(" ")[1];
    //console.info('jwt-token:', token);
    if (!token) {
        throw new Error(`Authorization token required.`);
    }

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const id = body.id;
    const title = body.title;
    const description = body.description;

    const secret_value = await clientsecret.send(new GetSecretValueCommand({
        SecretId: "JWTUserTokenSecret",
    }));

    const jwt_secret = JSON.parse(secret_value.SecretString);

    //check if the token matches the supposed origin
    const decodedToken = jwt.verify(token, jwt_secret.jwt_secret);
    if (!decodedToken) {
        throw new Error(`Authorization token invalid or it has expired.`);
    }

    const userID = decodedToken.userId;
    const userName = decodedToken.userName;

     console.info('decode-username:', userName);
     console.info('decode-userid:', userID);

    // Creates a new item, or replaces an old item with a new item
    var params = {
        TableName : tableName,
        Item: { id : id, title: title, description: description, username:  userName, userid: userID}
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
