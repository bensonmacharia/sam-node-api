# sam-node-api

This project contains source code and supporting files for a serverless application that can be deployed with the AWS Serverless Application Model (AWS SAM) command line interface (CLI).

The application uses several AWS resources, including Lambda functions, an API Gateway API, Amazon DynamoDB tables and Secrets Manager. These resources are defined in the `template.yaml` file in this project.

## Deploy application
To build and deploy the application for the first time, run the following in your shell:

```bash
$ git clone https://github.com/bensonmacharia/sam-node-api.git
$ cd sam-node-api
$ sam build
$ sam deploy --guided
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts:

* **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
* **AWS Region**: The AWS region you want to deploy your app to.
* **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
* **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
* **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

The API Gateway endpoint API and the API Gateway key will be displayed in the outputs when the deployment is complete.

## Cleanup

To delete the application that you created, use the AWS CLI. Run the following:

```bash
sam delete --stack-name sam-node-api
```

## Writeup

For a complete guide on how to create this application with introduction to the AWS SAM specification, the AWS SAM CLI, and serverless application concepts, see the [Implementing Key and Token Authentication for a NodeJS API on AWS SAM](https://dev.to/aws-builders/implementing-key-and-token-authentication-for-a-nodejs-api-on-aws-sam-56ln).
