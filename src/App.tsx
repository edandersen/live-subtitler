import React, { ChangeEvent, Component } from "react";
import "./App.css";
import { DeepgramTranscriber } from "./DeepgramTranscriber";
import NewWindow from "react-new-window";

interface AppProps {}

interface AppState {
  apiKey: string;
  isRunning: boolean;
  lastSubtitle: string;
  subtitleTimeout: number;
  isPopOutShown: boolean;
}

class App extends Component<AppProps, AppState> {
  private deepgramSocket: DeepgramTranscriber | null;
  private mediaStream: MediaStream | null;
  private mediaRecorder: MediaRecorder | null;
  private setIntervalId: any;
  constructor(props: AppProps) {
    super(props);
    this.state = {
      apiKey: "",
      isRunning: false,
      lastSubtitle: "",
      subtitleTimeout: 4,
      isPopOutShown: false,
    };
    this.deepgramSocket = null;
    this.mediaStream = null;
    this.mediaRecorder = null;

    this.handleApiKeyChange = this.handleApiKeyChange.bind(this);
    this.handleStartStopButton = this.handleStartStopButton.bind(this);
    this.handlePopoutWindowButton = this.handlePopoutWindowButton.bind(this);
  }

  handleApiKeyChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ apiKey: event.target.value });
  }

  handleTimeoutChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({ subtitleTimeout: parseInt(event.target.value) });
  }

  handlePopoutWindowButton() {
    this.setState({ isPopOutShown: !this.state.isPopOutShown });
  }

  handleStartStopButton() {
    this.setState({ isRunning: !this.state.isRunning });

    if (this.state.isRunning) {
      this.deepgramSocket?.finish();
      this.mediaRecorder?.stop();
      this.deepgramSocket = null;
      // TODD: Fix stop - throws errors in Console
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
        this.setState({ lastSubtitle: received });

        // if (this.setIntervalId) {
        //   clearInterval(this.setIntervalId);
        // }

        // this.setIntervalId = setInterval(() => {
        //   this.setState({ lastSubtitle: "" });
        // }, this.state.subtitleTimeout * 1000);
      }
    );
  }

  render() {
    const subtitleArea = (
      <div
        className="bg-black px-4 py-8 h-48"
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span className="text-white text-4xl my-auto mx-auto">
          {this.state.lastSubtitle}
        </span>
      </div>
    );

    return (
      <div>
        <header className="bg-zinc-900 shadow">
          <div className="max-w-7xl bg-slate mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-zinc-100">
              Livestream Subtitler
            </h1>
          </div>
        </header>

        {this.state.isPopOutShown ? (
          <NewWindow
            title="Livestream Subtitles"
            copyStyles={true}
            features={{
              height: 128 + 32 + 32 + 2,
              width: 800,
              location: false,
            }}
          >
            {subtitleArea}
          </NewWindow>
        ) : (
          subtitleArea
        )}

        <main>
          <div className="max-w-7xl text-zinc-100 mx-auto sm:px-6 lg:px-8 bg-zinc-800">
            <div className="px-4 py-6 sm:px-0">
              <div className="">
                <button
                  onClick={this.handleStartStopButton}
                  className="rounded-full px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm"
                >
                  {this.state.isRunning ? "Stop" : "Start"}
                </button>
                <button
                  onClick={this.handlePopoutWindowButton}
                  className="rounded-full ml-3 px-4 py-2 font-semibold text-sm bg-zinc-500 text-white rounded-full shadow-sm"
                >
                  {this.state.isPopOutShown ? "Close popout" : "Popout window"}
                </button>
                <label className="block mt-2">
                  <h4 className="text-zinc-400 text-2xl">Settings</h4>
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
                  <span>Subtitles disappear after x seconds:</span>
                  <input
                    type="text"
                    maxLength={40}
                    id="subtitleTimeout"
                    value={this.state.subtitleTimeout}
                    onChange={this.handleTimeoutChange}
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
