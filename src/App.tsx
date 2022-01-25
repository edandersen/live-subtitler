import React, { ChangeEvent, Component } from "react";
import "./App.css";
import { DeepgramTranscriber } from "./DeepgramTranscriber";
import NewWindow from "react-new-window";

interface AppProps {}

interface AppState {
  apiKey: string;
  isRunning: boolean;
}

class App extends Component<AppProps, AppState> {
  private deepgramSocket: DeepgramTranscriber | null;
  private mediaStream: MediaStream | null;
  private mediaRecorder: MediaRecorder | null;
  constructor(props: AppProps) {
    super(props);
    this.state = {
      apiKey: "",
      isRunning: false,
    };
    this.deepgramSocket = null;
    this.mediaStream = null;
    this.mediaRecorder = null;

    this.handleApiKeyChange = this.handleApiKeyChange.bind(this);
    this.handleStartStopButton = this.handleStartStopButton.bind(this);
  }

  handleApiKeyChange(event: ChangeEvent<HTMLInputElement>) {
    const apiKey = event.target.value;
    this.setState({ apiKey: apiKey });
    // if (apiKey?.length === 40) {
    //   this.setupDeepgram(apiKey);
    // }
  }

  handleStartStopButton() {
    this.setState({ isRunning: !this.state.isRunning });

    if (this.state.isRunning) {
      this.deepgramSocket?.finish();
      this.mediaRecorder?.stop();
      this.deepgramSocket = null;
    }

    if (!this.state.isRunning) {
      if (this.state.apiKey?.length === 40) {
        this.setupDeepgram(this.state.apiKey);
      }
    }
  }

  async setupDeepgram(apiKey: string) {
    if (this.mediaStream == null) {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: "audio/webm",
      });
    }

    console.log("starting dg api");

    console.log("got media recorder");

    this.deepgramSocket = new DeepgramTranscriber(apiKey, "api.deepgram.com", {
      punctuate: true,
      version: "latest",
      language: "en-GB",
    });

    this.deepgramSocket.addListener("open", () => {
      this.mediaRecorder?.addEventListener("dataavailable", async (event) => {
        if (event.data.size > 0 && this.deepgramSocket?.getIsReady()) {
          this.deepgramSocket.send(event.data);
        }
      });
      this.mediaRecorder?.start(1000);
    });

    this.deepgramSocket.addListener(
      "transcriptReceived",
      (received: string) => {
        console.log(received);
      }
    );
  }

  render() {
    return (
      <div>
        <header className="bg-zinc-900 shadow">
          <div className="max-w-7xl bg-slate mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-zinc-100">
              Livestream Subtitler
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl text-zinc-100 mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="h-96">
                <label className="block">
                  <span>API Key</span>
                  <input
                    type="password"
                    maxLength={40}
                    id="apiKey"
                    value={this.state.apiKey}
                    onChange={this.handleApiKeyChange}
                    className="
                    bg-zinc-600
                    mt-1
                    block
                    w-full
                    rounded-md
                    border-gray-300
                    shadow-sm
                    focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50
                  "
                    placeholder="Enter deepgram API key"
                  />
                  <button
                    onClick={this.handleStartStopButton}
                    className="rounded-full mt-3 px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm"
                  >
                    {this.state.isRunning ? "Stop" : "Start"}
                  </button>
                </label>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
