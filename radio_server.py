# radio_server.py
import asyncio
import websockets
import json

connected_clients = set()

async def handler(websocket, path):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            # Expect JSON from clients
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                continue

            # Only relay radio messages
            if data.get("type") == "radio_tx":
                # Broadcast to everyone except sender
                await asyncio.gather(*[
                    client.send(message)
                    for client in connected_clients
                    if client is not websocket
                ])
    finally:
        connected_clients.remove(websocket)

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("Radio server running on ws://0.0.0.0:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())

