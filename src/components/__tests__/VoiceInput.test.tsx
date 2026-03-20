import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceInput from "../VoiceInput";

// Mock Web Speech API
const mockRecognition = {
  lang: "",
  continuous: false,
  interimResults: false,
  onresult: null as ((event: SpeechRecognitionEvent) => void) | null,
  onerror: null as ((event: SpeechRecognitionErrorEvent) => void) | null,
  onend: null as (() => void) | null,
  start: jest.fn(),
  stop: jest.fn(),
};

// Mock window objects
Object.defineProperty(window, "SpeechRecognition", {
  writable: true,
  value: jest.fn(() => mockRecognition),
});

Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  value: jest.fn(() => mockRecognition),
});

describe("VoiceInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render voice input button", () => {
    render(<VoiceInput />);
    expect(screen.getByText("使用语音输入")).toBeInTheDocument();
  });

  it("should start recording when button is clicked", () => {
    render(<VoiceInput />);
    const button = screen.getByText("使用语音输入");
    fireEvent.click(button);
    expect(mockRecognition.start).toHaveBeenCalled();
  });

  it("should display transcript when speech is recognized", async () => {
    const onTranscript = jest.fn();
    render(<VoiceInput onTranscript={onTranscript} />);

    // Start recording
    const button = screen.getByText("使用语音输入");
    fireEvent.click(button);

    // Simulate speech recognition result
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: "测试语音" },
          isFinal: true,
        },
      ],
    } as unknown as SpeechRecognitionEvent;

    if (mockRecognition.onresult) {
      mockRecognition.onresult(mockEvent);
    }

    await waitFor(() => {
      expect(screen.getByText("测试语音")).toBeInTheDocument();
      expect(onTranscript).toHaveBeenCalledWith("测试语音");
    });
  });

  it("should handle speech recognition not supported", () => {
    // Remove Speech API
    Object.defineProperty(window, "SpeechRecognition", { value: undefined });
    Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined });

    render(<VoiceInput />);
    const button = screen.getByText("使用语音输入");
    fireEvent.click(button);

    expect(screen.getByText(/不支持语音识别/)).toBeInTheDocument();
  });
});
