import axios from "axios";
import crypto from "crypto";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";

let lastReceivedEncryptedMessage: string | null = null;
let lastReceivedDecryptedMessage: string | null = null;
let lastMessageDestination: number | null = null;

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  onionRouter.get("/getLastReceivedEncryptedMessage", (req: Request, res: Response) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });

  onionRouter.get("/getLastReceivedDecryptedMessage", (req: Request, res: Response) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  onionRouter.get("/getLastMessageDestination", (req: Request, res: Response) => {
    res.json({ result: lastMessageDestination });
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
        `Onion router ${nodeId} is listening on port ${
            BASE_ONION_ROUTER_PORT + nodeId
        }`
    );
  });

  const privateKey = crypto.randomBytes(32).toString("base64");

  // Register the node on the registry
  try {
    await axios.post(`http://localhost:${REGISTRY_PORT}/registerNode`, {
      nodeId,
      pubKey: 'SomePublicKey', // You would need to generate or obtain a public key for the node
      privateKey
    });
    console.log(`Node ${nodeId} registered successfully.`);
  } catch (error) {
    // @ts-ignore
    console.error(`Error registering node ${nodeId}:`, error.message);
  }


  return server;
}
