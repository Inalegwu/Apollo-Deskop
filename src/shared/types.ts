import type { Socket } from "node:net";

type DeviceType = "desktop" | "mobile";

export type Node = {
  connectionId: string;
  nodeName: string;
  deviceType: DeviceType;
};

export type Message = {
  type: "message" | "handshake" | "broadcast" | "dm";
  data: Record<string, any>;
};

export type P2PMessage = Message & {
  ttl: number;
  id: string;
  origin: string;
  destination: string;
};

export type GlobalState = {
  colorMode: "dark" | "light";
};

export type PeerState = {
  neighbors: Map<string, Node>;
  connections: Map<string, Socket>;
  alreadySent: Set<Message>;
  applicationId: string | null;
  deviceName: string | null;
  deviceType: DeviceType;
};

export type FileTransferState = {
  files: string[];
};

export type EventTypes = {
  connect: string;
  disconnect: string;
  "node-connect": {
    ip: string;
    port: string;
  };
  "node-disconnect": {
    nodeId: string;
  };
  message: {
    connectionId: string;
    packet: Message;
  };
  "node-message": {
    nodeId: string | undefined;
    packet: Message;
  };
  broadcast: {
    nodeId: string;
    packet: Message;
  };
  dm: {
    origin: string;
    packet: Message;
  };
};

export enum FileTypes {
  MD = "md",
  TXT = "txt",
  DOCX = "docx",
}
