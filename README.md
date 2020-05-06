# ws-remoting

A library for remote procedure call using websockets and promises. This library was built with the intention of doing rpc like method invocations from javascript running on a client browser. The main concept is:


- Connect to a server using websockets
- Send a message to the server and return a promise to the caller
- Wait for the server to respond
- Resolve the promise with the result of that call.

## Broadcast

In addition to sending requests and receiving responses from the server, we added **broadcast** support.
That is, a server can send messages to all clients to notify changes. That comes in handy when developing real time systems.

## Tutorial

This is a simple tutorial to help you get started. More advanced examples will be provided on the samples repository.

### The server

Set up a very simple server, register a test action to be invoked from the client.

> Use **WsRemotingServer**. This is expected to run on a nodejs environment.

```javascript
const http = require("http");
const remotingServer = require("ws-remoting/dist/server/WsRemotingServer");

// Create a server
const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Hello World!");
});

// Create a remoting server
const rs = new remotingServer({ server: server });

// Register the actions that can be executed remotely
rs.register("test_action", (params) => {
  return "ok, we " + (params ? "do" : "don't") + " have params";
});

// Start listening
server.listen(process.env.PORT || 1337);
console.log("Server running at http://localhost:%d", port);
```

### The client

Set up a very simple client, connect to the server and invoke a remote method.

> Use **WsRemotingClient**. This is expected to use native WebSocket from a browser.

```javascript
import WsRemotingClient from "ws-remoting/dist/client/WsRemotingClient";
const remoting = new WsRemotingClient("ws://localhost:1337");
remoting
  .call("test_action", null)
  .then((result) => {
    console.log("got response", result);
  })
  .catch((error) => {
    console.error("got error", error);
  });
```
