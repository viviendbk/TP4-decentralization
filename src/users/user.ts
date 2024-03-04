import axios from "axios";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { BASE_USER_PORT } from "../config";

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

let lastReceivedMessage: string | null = null;
let lastSentMessage: string | null = null;

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  _user.get("/status", (req, res) => {
    res.send("live");
  });

  _user.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

  _user.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });

  _user.post("/message", (req, res) => {
    const { message }: { message: string } = req.body;

    if (message) {
      lastReceivedMessage = message;
      res.status(200).json({ message: "Message received successfully" });
    } else {
      res.status(400).json({ error: "Invalid request body" });
    }
  });

  _user.post("/sendMessage", async (req, res) => {
    const { message, destinationUserId }: { message: string; destinationUserId: number } = req.body;

    // Fetch the node registry to get information about registered nodes
    try {
      const response = await axios.get("http://localhost:8080/getNodeRegistry");
      const nodes: any[] = response.data.nodes;

      // Pick 3 random distinct nodes from the registry
      const selectedNodes = getRandomDistinctNodes(nodes, 3);

      // Encrypt the message with layers of encryption and forward to entry node
      const entryNode = selectedNodes[0];
      const encryptedMessage = await encryptAndForwardMessage(message, destinationUserId, selectedNodes);

      // Forward the encrypted message to the entry node
      await axios.post(`http://localhost:${entryNode.nodeId + 4000}/message`, { message: encryptedMessage });

      lastSentMessage = message; // Update last sent message

      res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
      // @ts-ignore
      console.error("Error sending message:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(`User ${userId} is listening on port ${BASE_USER_PORT + userId}`);
  });

  return server;
}

// Helper function to pick 'count' random distinct nodes from the node registry
function getRandomDistinctNodes(nodes: any[], count: number): any[] {
  const result: any[] = [];
  const indexes = new Set();

  while (result.length < count && indexes.size < nodes.length) {
    const index = Math.floor(Math.random() * nodes.length);
    if (!indexes.has(index)) {
      indexes.add(index);
      result.push(nodes[index]);
    }
  }

  return result;
}

// Helper function to encrypt message with layers of encryption and forward to entry node
async function encryptAndForwardMessage(message: string, destinationUserId: number, nodes: any[]): Promise<string> {
  let encryptedMessage = message;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const currentNode = nodes[i];
    const nextNode = i === 0 ? destinationUserId.toString().padStart(10, "0") : nodes[i - 1].nodeId.toString().padStart(10, "0");

    // Step 1: Encrypt the message with the symmetric key
    // Step 2: Encrypt the symmetric key with the RSA public key of the current node
    // Concatenate the results in the required order
    encryptedMessage = await encryptWithSymmetricKey(encryptedMessage, nextNode) + await encryptWithPublicKey(currentNode.pubKey, encryptedMessage);
  }

  return encryptedMessage;
}

// Placeholder functions for encryption with symmetric key and RSA public key
async function encryptWithSymmetricKey(message: string, key: string): Promise<string> {
  // Implement encryption with symmetric key
  return "Encrypted with symmetric key";
}

async function encryptWithPublicKey(publicKey: string, message: string): Promise<string> {
  // Implement encryption with RSA public key
  return "Encrypted with RSA public key";
}
