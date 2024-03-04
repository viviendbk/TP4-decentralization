import crypto from "crypto";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string; privateKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

export async function launchRegistry() {
  const _registry = express();
  // Define array to store registered nodes
  let registeredNodes: GetNodeRegistryBody = { nodes: [] };

  _registry.use(express.json());
  _registry.use(bodyParser.json());


  _registry.get("/status", (req, res) => {
    res.send("live");
  });

  _registry.post("/registerNode", (req, res) => {
    const { nodeId, pubKey }: RegisterNodeBody = req.body;

    if (nodeId && pubKey) {
      // Generate private key
      const privateKey = crypto.randomBytes(32).toString("base64");

      const newNode: Node = { nodeId, pubKey, privateKey };
      registeredNodes.nodes.push(newNode);
      res.status(201).json({ message: "Node registered successfully" });
    } else {
      res.status(400).json({ error: "Invalid request body" });
    }
  });

  // Get node registry route
  _registry.get("/getNodeRegistry", (req, res) => {
    res.json(registeredNodes);
  });

  _registry.get("/getPrivateKey/:nodeId", (req, res) => {
    const nodeId: number = parseInt(req.params.nodeId);

    const node = registeredNodes.nodes.find((n) => n.nodeId === nodeId);

    if (node) {
      res.json({ result: node.privateKey });
    } else {
      res.status(404).json({ error: "Node not found" });
    }
  });

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`Registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
