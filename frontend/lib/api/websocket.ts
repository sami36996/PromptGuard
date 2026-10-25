let socket: WebSocket | null = null

export function connectWebSocket(
  onMessage: (data: any) => void
) {
  socket = new WebSocket("ws://localhost:8000/ws")

  socket.onopen = () => {
    console.log("WebSocket connected")
  }

  socket.onmessage = (event) => {
    onMessage(JSON.parse(event.data))
  }

  socket.onerror = (err) => {
    console.error(err)
  }

  socket.onclose = () => {
    console.log("WebSocket disconnected")
  }
}

export function disconnectWebSocket() {
  socket?.close()
}

export function send(data: any) {
  socket?.send(JSON.stringify(data))
}