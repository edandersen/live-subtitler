import { Deepgram } from "@deepgram/sdk";
import React, { ChangeEvent, ChangeEventHandler, Component } from "react";
import "./App.css";

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
        const deepgramSocket = this.deepgram.transcription.live({
          punctuate: true,
          version: "latest",
        });

        deepgramSocket.addListener("open", () => {
          mediaRecorder.addEventListener("dataavailable", async (event) => {
            if (event.data.size > 0 && deepgramSocket.getReadyState() == 1) {
              deepgramSocket.send(event.data);
            }
          });
          mediaRecorder.start(1000);
        });

        deepgramSocket.addListener("transcriptReceived", (received) => {
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
      <div className="container-fluid">
        <header className="bg-white shadow">
          <h1>Subtitler</h1>
        </header>
        <main>
          <span className="text-gray-700">API Key</span>
          <input
            type="password"
            maxLength={40}
            className="
                    mt-1
                    block
                    w-full
                    rounded-md
                    border-gray-300
                    shadow-sm
                    focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50
                  "
            value={this.state.apiKey}
            onChange={this.handleApiKeyChange}
            placeholder="Enter deepgram API key"
          />
        </main>
      </div>
    );
  }
}

export default App;
