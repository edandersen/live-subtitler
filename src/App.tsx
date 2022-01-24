import React, { ChangeEvent, Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { DeepgramTranscriber } from "./DeepgramTranscriber";
import NewWindow from "react-new-window";

interface AppProps {}

interface AppState {
  apiKey: string;
}

class App extends Component<AppProps, AppState> {
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
    if (apiKey?.length === 40) {
      this.setupDeepgram(apiKey);
    }
  }

  setupDeepgram(apiKey: string) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      const deepgramSocket = new DeepgramTranscriber(
        apiKey,
        "api.deepgram.com",
        {
          punctuate: true,
          version: "latest",
          language: "en-GB",
        }
      );

      deepgramSocket.addListener("open", () => {
        mediaRecorder.addEventListener("dataavailable", async (event) => {
          if (event.data.size > 0 && deepgramSocket.getIsReady()) {
            deepgramSocket.send(event.data);
          }
        });
        mediaRecorder.start(1000);
      });

      deepgramSocket.addListener("transcriptReceived", (received: string) => {
        console.log(received);
      });
    });
  }

  render() {
    return (
      <div className="container-fluid mx-0 px-0">
        {/* <NewWindow>
          <h1>Hi 👋</h1>
        </NewWindow> */}
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
