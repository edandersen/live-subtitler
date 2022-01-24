import EventEmitter from "events";
import WebSocket from "isomorphic-ws";
import * as QueryString from "query-string";

export class DeepgramTranscriber extends EventEmitter {
  private _socket: WebSocket;

  constructor(credentials: string, apiUrl: string, options?: any) {
    super(undefined);
    const endpoint =
      "wss://" + apiUrl + "/v1/listen?" + QueryString.stringify(options);
    this._socket = new WebSocket(endpoint, ["token", credentials]);
    this._bindSocketEvents();
  }

  private _bindSocketEvents(): void {
    this._socket.onopen = () => {
      this.emit("open", this);
    };

    this._socket.onclose = (event: WebSocket.CloseEvent) => {
      this.emit("close", event);
    };

    this._socket.onerror = (event: any) => {
      this.emit("error", event);
    };

    this._socket.onmessage = (m: any) => {
      const received = JSON.parse(m.data);
      const transcript = received.channel.alternatives[0].transcript;
      if (transcript && received.is_final) {
        this.emit("transcriptReceived", transcript);
      }
    };
  }

  public getIsReady(): boolean {
    return this._socket.readyState === 1;
  }

  /**
   * Sends data to the Deepgram API via websocket connection
   * @param data Audio data to send to Deepgram
   */
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.getIsReady()) {
      this._socket.send(data);
    } else {
      this.emit("error", "Could not send. Connection not open.");
    }
  }

  /**
   * Denote that you are finished sending audio and close
   * the websocket connection when transcription is finished
   */
  public finish(): void {
    this._socket.close(1000);
  }
}
