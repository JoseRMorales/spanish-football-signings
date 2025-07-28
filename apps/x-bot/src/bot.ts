import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
	appKey: process.env.API_KEY as string,
	appSecret: process.env.API_SECRET as string,
	accessToken: process.env.ACCESS_TOKEN as string,
	accessSecret: process.env.ACCESS_SECRET as string,
});
if (!client) {
	throw new Error("Failed to initialize Twitter client");
}

const bot = client.readWrite;
console.log("Twitter bot initialized successfully!");

export default bot;
