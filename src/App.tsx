import { Deepgram } from "@deepgram/sdk";
import React, { ChangeEvent, ChangeEventHandler, Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { BrowserLiveTranscription } from "./DeepgramBrowserTranscriber/BrowserLive";

const WebSocket = require("isomorphic-ws");

interface AppProps {}

interface AppState {
  apiKey: string;
}

class App extends Component<AppProps, AppState> {
  private deepgram: Deepgram | undefined;

  constructor(props: AppProps) {
    super(props);
    this.state = {
      apiKey: "",
    };

    this.handleApiKeyChange = this.handleApiKeyChange.bind(this);
  }

  handleApiKeyChange(event: ChangeEvent<HTMLInputElement>) {
    const apiKey = event.target.value;
    this.setState({ apiKey: apiKey });
    if (apiKey?.length == 40) {
      this.setupDeepgram(apiKey);
    }
  }

  setupDeepgram(apiKey: string) {
    this.deepgram = new Deepgram(apiKey);
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      if (this.deepgram != undefined) {
        // const deepgramSocket = this.deepgram.transcription.live({
        //   punctuate: true,
        //   version: "latest",
        // });

        const deepgramSocket = new BrowserLiveTranscription(
          apiKey,
          "api.deepgram.com",
          {
            punctuate: true,
            version: "latest",
          }
        );

        deepgramSocket.addListener("open", () => {
          mediaRecorder.addEventListener("dataavailable", async (event) => {
            if (event.data.size > 0 && deepgramSocket.getReadyState() == 1) {
              deepgramSocket.send(event.data);
            }
          });
          mediaRecorder.start(1000);
        });

        deepgramSocket.addListener("transcriptReceived", (received: any) => {
          const transcript = received.channel.alternatives[0].transcript;
          if (transcript && received.is_final) {
            console.log(transcript);
          }
        });
      }
    });
  }

  render() {
    return (
      <div className="container-fluid mx-0 px-0">
        <div className="container-fluid bg-white shadow py-3">
          <header className="container">
            <h1>Subtitler</h1>
          </header>
        </div>

        <main className="container mt-2">
          <div className="mb-3">
            <label htmlFor="apiKey" className="form-label">
              API Key
            </label>
            <input
              type="password"
              maxLength={40}
              className="form-control"
              id="apiKey"
              value={this.state.apiKey}
              onChange={this.handleApiKeyChange}
              placeholder="Enter deepgram API key"
            />
          </div>
        </main>
      </div>
    );
  }
}

export default App;
