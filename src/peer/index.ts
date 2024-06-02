import { TypedEventEmitter } from "@src/shared/emitter";
import { globalState$, peerState$ } from "@src/shared/state";
import type { EventTypes, Message, P2PMessage } from "@src/shared/types";
import { Socket, createServer } from "node:net";
import { v4 } from "uuid";

const emitter = new TypedEventEmitter<EventTypes>();
const connections = peerState$.connections.get();
const neighbors = peerState$.neighbors.get();
const NODE_ID = globalState$.applicationId.get();
const NODE_NAME = globalState$.deviceName.get();
const DEVICE_TYPE = globalState$.deviceType.get();
const alreadySentMessages = peerState$.alreadySent.get();
const alreadySeenMessages = new Set();

const p2pSend = (data: P2PMessage) => {
  if (data.ttl < 1) {
    return;
  }

  if (data.type === "dm") {
    nodeSend(data.destination, {
      data: data.data,
      type: data.type,
    });
  }

  if (data.type === "broadcast") {
    for (const $nodeId of neighbors.keys()) {
      nodeSend($nodeId, {
        data: data.data,
        type: data.type,
      });
      alreadySentMessages.add(data);
    }
  }
};

const broadcast = (
  message: Message,
  destination: string,
  id: string = v4(),
  origin: string = NODE_ID,
  ttl = 1000,
) => {
  p2pSend({ id, ttl, origin, ...message, type: "broadcast", destination });
};

const dm = (
  message: Message,
  destination: string,
  id: string = v4(),
  origin: string = NODE_ID,
  ttl = 1000,
) => {
  p2pSend({ id, ttl, ...message, origin, type: "dm", destination });
};

const findNodeId = (connectionId: string) => {
  for (const [nodeId, node] of neighbors) {
    if (connectionId === node.connectionId) {
      return nodeId;
    }
  }
};

const nodeSend = (nodeId: string, data: Message) => {
  const node = neighbors.get(nodeId);

  if (!node) {
    return;
  }

  send(node.connectionId, {
    type: "message",
    data,
  });
};

emitter.on("message", ({ connectionId, message }) => {
  const { type, data } = message;

  if (type === "handshake") {
    const { nodeId, nodeName, deviceType, ip, port } = data;

    neighbors.set(nodeId, {
      connectionId,
      nodeName,
      deviceType,
    });

    emitter.emit("node-connect", { ip, port });
  }

  if (type === "message") {
    const nodeId = findNodeId(connectionId);

    if (!nodeId) {
      console.log(`unknown node-id ${nodeId}`);
    }

    emitter.emit("node-message", { nodeId, packet: message });
  }
});

emitter.on("node-connect", ({ ip, port }) => {
  connnect(ip, Number(port), () => {
    console.log("connection established");
  });
});

emitter.on("node-disconnect", ({ nodeId }) => {
  connections.delete(nodeId);
  console.log(`Disconnected from ${nodeId}`);
});

emitter.on("node-message", ({ nodeId, packet }) => {
  if (!alreadySentMessages.has(packet)) {
    broadcast(
      packet,
      packet.data.destination,
      packet.data.id,
      packet.data.origin,
      packet.data.ttl - 1,
    );
  }

  if (packet.type === "broadcast") {
    if (alreadySeenMessages.has(packet.data.id)) {
      return;
    }

    alreadySeenMessages.add(packet.data.id);

    if (packet.data.destination === NODE_ID) {
      emitter.emit("broadcast", {
        packet: packet,
        nodeId: nodeId!,
      });
    } else {
      alreadySentMessages.add(packet);
      broadcast(
        packet,
        packet.data.destination,
        v4(),
        packet.data.origin,
        packet.data.ttl - 1,
      );
    }
  }

  if (packet.type === "dm") {
    if (packet.data.destination === NODE_ID) {
      emitter.emit("dm", {
        message: packet,
        origin: packet.data.origin,
      });
    } else {
      dm(
        packet,
        packet.data.destination,
        packet.data.id,
        packet.data.origin,
        packet.data.ttl - 1,
      );
    }
  }
});

emitter.on("dm", ({ origin, message }) => {
  console.log(origin, message);
});

emitter.on("broadcast", ({ packet, nodeId }) => {
  console.log(`Recieved a broadcast from ${nodeId} with data ${packet.data}`);
});

emitter.on("disconnect", (connectionId) => {
  const nodeId = findNodeId(connectionId);

  if (!nodeId) {
    return;
  }

  console.log(`disconnecting from ${nodeId}`);

  neighbors.delete(nodeId);

  emitter.emit("node-disconnect", { nodeId });
});

const handleNewSocket = (socket: Socket) => {
  const connectionId = v4();

  connections.set(connectionId, socket);
  emitter.emit("connect", connectionId);

  socket.on("close", () => {
    connections.delete(connectionId);
    emitter.emit("disconnect", connectionId);
  });

  emitter.on("connect", (connectionId) => {
    console.log(`attempting to handshake ${connectionId}`);

    send(connectionId, {
      type: "handshake",
      data: {
        nodeId: NODE_ID,
        nodeName: NODE_NAME,
        deviceType: DEVICE_TYPE,
        port: socket.remotePort,
        ip: socket.remoteAddress,
      },
    });
  });

  socket.on("data", (data) => {
    try {
      emitter.emit("message", {
        connectionId,
        message: JSON.parse(data.toString()),
      });
    } catch (e) {
      console.error(`Cannot parse message from peer ${e}`);
    }
  });
};

const send = (connectionId: string, message: Message) => {
  const socket = connections.get(connectionId);

  if (!socket) {
    throw new Error(
      `Attempting to send data to connection that doesn't exist ${connectionId}`,
    );
  }

  console.log(message);

  socket.write(JSON.stringify(message));
};

const connnect = (ip: string, port: number, cb: () => void) => {
  const socket = new Socket();

  socket.connect(port, ip, () => {
    handleNewSocket(socket);
    cb();
  });
};

export default function createP2PNode(opts: {
  port: number;
}) {
  const server = createServer((socket) => handleNewSocket(socket));

  return {
    broadcast,
    dm,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    connnect,
    start: () => {
      console.log(`Spinning up TCP server on ${opts.port}`);
      server.listen(opts.port);
    },
    close: (cb: () => void) => {
      console.log("Spinning down TCP server");
      server.close(cb);
    },
  };
}
