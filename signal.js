addEventListener("fetch", event => {
  event.respondWith(handle(event.request));
});

let peers = {};

async function handle(req) {
  const { pathname } = new URL(req.url);

  if (pathname === "/ws") {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    const id = crypto.randomUUID();
    peers[id] = server;

    server.addEventListener("message", msg => {
      const data = msg.data;
      for (const pid in peers) {
        if (pid !== id) peers[pid].send(data);
      }
    });

    server.addEventListener("close", () => {
      delete peers[id];
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  return new Response("OK");
}
