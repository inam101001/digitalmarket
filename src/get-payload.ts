import dotenv from "dotenv";
import path from "path";
import type { InitOptions } from "payload/config";
import payload, { Payload } from "payload";

// Load environment variables from a .env file located one directory above the current directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Declare a variable `cached` that will be used to store the initialized payload client
// `global` is a global object, and we are using TypeScript's `any` type to avoid type errors
let cached = (global as any).payload;

// If `cached` is not already defined, initialize it with default values
if (!cached) {
  cached = (global as any).payload = {
    client: null, // Will hold the payload client instance
    promise: null, // Will hold the promise that resolves to the payload client
  };
}

// Define an interface for the arguments that the `getPayloadClient` function can accept
interface Args {
  initOptions?: Partial<InitOptions>;
}

// Define an asynchronous function that returns an initialized payload client
export const getPayloadClient = async ({ initOptions }: Args = {}) => {
  // Check if the PAYLOAD_SECRET environment variable is set
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error("PAYLOAD_SECRET is missing");
  }

  // If the client is already cached, return it
  if (cached.client) {
    return cached.client;
  }

  // If there is no cached promise, initialize one
  if (!cached.promise) {
    cached.promise = payload.init({
      secret: process.env.PAYLOAD_SECRET, // Use the PAYLOAD_SECRET from environment variables
      local: initOptions?.express ? false : true, // Set the local option based on the presence of an express server in initOptions
      ...(initOptions || {}), // Spread any additional initialization options
    });
  }

  // Await the promise to resolve the payload client
  try {
    cached.client = await cached.promise;
  } catch (e: unknown) {
    // If an error occurs, reset the promise to null and rethrow the error
    cached.promise = null;
    throw e;
  }

  // Return the cached client
  return cached.client;
};
