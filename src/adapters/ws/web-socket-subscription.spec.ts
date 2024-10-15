import getPort from "get-port";
import { WebSocketServer } from "isomorphic-ws";

import { createLogger } from "../logger";
import { SerializerNativeImpl } from "../serializers";
import { WebSocketConnectorImpl } from "./web-socket-connector";
import { WebSocketSubscription } from "./web-socket-subscription";
import { WebSocketSubscriptionCounterImpl } from "./web-socket-subscription-counter";

describe("WebSocketSubscription", () => {
  it("doesn't do anything if no connection was established", async () => {
    const logger = createLogger();

    const subscription = new WebSocketSubscription(
      new WebSocketConnectorImpl(
        { constructorParameters: ["ws://localhost:0"] },
        logger,
      ),
      new WebSocketSubscriptionCounterImpl(),
      new SerializerNativeImpl(),
      "public",
      logger,
    );

    const res = subscription.unsubscribe();
    expect(res).toBeUndefined();
  });

  it("implements async iterator", async () => {
    const logger = createLogger();
    const port = await getPort();
    const server = new WebSocketServer({ port });

    server.on("connection", (socket) => {
      socket.on("message", () => {
        socket.send(
          JSON.stringify({
            stream: ["public"],
            event: "delete",
            payload: "123",
          }),
        );
      });
    });

    const connection = new WebSocketConnectorImpl(
      { constructorParameters: [`ws://localhost:${port}`] },
      logger,
    );
    const subscription = new WebSocketSubscription(
      connection,
      new WebSocketSubscriptionCounterImpl(),
      new SerializerNativeImpl(),
      "public",
      logger,
    );

    let value!: string;
    for await (const message of subscription) {
      value = message.payload as string;
      break;
    }

    expect(value).toBe("123");

    connection.close();
    server.close();
  });
});
