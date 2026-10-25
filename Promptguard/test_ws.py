import asyncio
import websockets
import json


async def main():

    uri = "ws://127.0.0.1:8000/ws/events"

    async with websockets.connect(uri) as ws:

        print("Connected.")

        await ws.send("hello")

        while True:

            message = await ws.recv()

            print(json.loads(message))


if __name__ == "__main__":
    asyncio.run(main())
