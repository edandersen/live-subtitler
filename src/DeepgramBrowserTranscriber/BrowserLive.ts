import { ConnectionState } from "@deepgram/sdk/dist/enums";
import { LiveTranscriptionOptions } from "@deepgram/sdk/dist/types";
import EventEmitter from "events";
import querystring from "querystring";
import WebSocket from "isomorphic-ws";
import { userAgent } from "./userAgent";
// import { ConnectionState, LiveTranscriptionEvents } from "../enums";

export class BrowserLiveTranscription extends EventEmitter {
  private _socket: WebSocket;

  constructor(
    credentials: string,
    apiUrl: string,
    options?: LiveTranscriptionOptions
  ) {
    super(undefined);
    const endpoint =
      "wss://" + apiUrl + "/v1/listen?" + querystring.stringify(options);
    console.log(endpoint);
    this._socket = new WebSocket(
      endpoint,
      // "wss://" + apiUrl + "/v1/listen?" + querystring.stringify(options),
      {
        headers: {
          Authorization: "token " + credentials,
          "User-Agent": "Subtitler",
        },
      }
    );
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
      this.emit("transcriptReceived", m.data);
    };
  }

  /**
   * Returns the ready state of the websocket connection
   */
  public getReadyState(): ConnectionState {
    return this._socket.readyState;
  }

  /**
   * Sends data to the Deepgram API via websocket connection
   * @param data Audio data to send to Deepgram
   */
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this._socket.readyState === ConnectionState.OPEN) {
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
