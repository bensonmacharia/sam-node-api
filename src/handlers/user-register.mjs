// Import bcrypt for encrypting user password
import bcrypt from 'bcryptjs';
// Import uuid for generating unique user ID
import { v4 as uuidv4 } from 'uuid';

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.USER_TABLE;

/**
 * A HTTP post method to add one user to a DynamoDB table.
 */
export const registerUserHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get username and password from the body of the request
    const body = JSON.parse(event.body);
    // Use a random uuidv4 string as a User ID 
    const id = uuidv4();

    const username = body.username;
    
    // Generate a hashed password string
    const password = bcrypt.hashSync(body.password, 8);

    // Creates a new user, or replaces an old user record with a new one
    var params = {
        TableName: tableName,
        Item: { id: id, username: username, password: password }
    };

    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - user registered or updated", data);
    } catch (err) {
        console.log("Error", err.stack);
    }

    const responseData = {
        message: "Registration successful. Proceed to login",
        username: body.username
    
    }

    const response = {
        statusCode: 201,
        body: JSON.stringify(responseData)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
