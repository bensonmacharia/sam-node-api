// Import bcrypt for encrypting user password and comparing the password hash
import bcrypt from 'bcryptjs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
// Import jwt for generating the user token
import jwt from 'jsonwebtoken';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const clientsecret = new SecretsManagerClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.USER_TABLE;

/**
 * A HTTP post method for user login.
 */
export const loginUserHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get username and password from the body of the request
    const body = JSON.parse(event.body);
    const username = body.username;
    const password = body.password;

    // Fetch the JWT secret string from AWS Secrets Manager 
    const secret_value = await clientsecret.send(new GetSecretValueCommand({
        SecretId: "JWTUserTokenSecret",
    }));
    const jwt_secret = JSON.parse(secret_value.SecretString);

    var params = {
        TableName: tableName,
        Key: { username: username },
    };

    var token = "";
    var message = "";
    var status_code = 200;

    try {
        const data = await ddbDocClient.send(new GetCommand(params));
        var item = data.Item;
        // Comprate a hash of the received password from the request body with the password hash from the database, if they match login the user and generate a JWT token
        if (bcrypt.compareSync(password, item.password)) {
            // create JWT token
            const jwttoken = jwt.sign(
                {
                    userId: item.id,
                    userName: body.username,
                },
                jwt_secret.jwt_secret,
                { expiresIn: "1h" }
            );
            message = "Login successful.";
            token = jwttoken;
        } else {
            status_code = 403;
            message = "Wrong password. Try again";
            token = "NOT OKAY";
        }
    } catch (err) {
        console.log("Error", err);
    }

    const responseData = {
        message: message,
        user: {
            username: body.username,
            token: token
        }
    }

    const response = {
        statusCode: status_code,
        body: JSON.stringify(responseData)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
