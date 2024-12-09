import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDocumentClient();
const tableName = process.env.TABLE_NAME;

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Event: ", JSON.stringify(event));

  const { role, movieId } = event.pathParameters || {};

  if (!role || !movieId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing role or movieId in the request path" }),
    };
  }

  const params: QueryCommandInput = {
    TableName: tableName,
    IndexName: "RoleMovieIndex",
    KeyConditionExpression: "role = :role and movieId = :movieId",
    ExpressionAttributeValues: {
      ":role": role,
      ":movieId": movieId,
    },
  };

  try {
    const commandOutput = await ddbDocClient.send(new QueryCommand(params));
    console.log("Query result: ", JSON.stringify(commandOutput));

    const names = commandOutput.Items?.map((item) => item.name) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ names }),
    };
  } catch (error) {
    console.error("Error querying DynamoDB: ", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

function createDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
