import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import TerminalViewer from "../TerminalViewer";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Web Speech API
const mockRecognition = {
  lang: "",
  continuous: false,
  interimResults: false,
  onstart: null as (() => void) | null,
  onresult: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  onend: null as (() => void) | null,
  start: jest.fn(),
  stop: jest.fn(),
};

Object.defineProperty(window, "SpeechRecognition", {
  writable: true,
  value: jest.fn(() => mockRecognition),
});

Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  value: jest.fn(() => mockRecognition),
});

describe("TerminalViewer", () => {
  const defaultProps = {
    connectionId: "test-conn-123",
    connectionName: "Test Server",
    connectionUrl: "https://test.example.com",
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Default successful connection mock
    mockFetch.mockResolvedValue({
      ok: true,
      statusText: "OK",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("1. Renders terminal header with connection name", () => {
    it("should render the connection name in the header", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      expect(screen.getByText("Test Server")).toBeInTheDocument();
    });

    it("should display the terminal icon in header", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      expect(screen.getByText("💻")).toBeInTheDocument();
    });

    it("should display connection URL on initial load", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      expect(screen.getByText(/URL: https:\/\/test.example.com/)).toBeInTheDocument();
    });
  });

  describe("2. Shows connection status (connected/disconnected)", () => {
    it("should show disconnected status initially before connection completes", async () => {
      // Use a slow-resolving mock to capture initial state
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, statusText: "OK" }), 10000)
          )
      );

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      // Check disconnected status before timers run
      expect(screen.getByText("○ Disconnected")).toBeInTheDocument();
    });

    it("should show connected status after successful connection", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        statusText: "OK",
      });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      expect(screen.getByText("● Connected")).toBeInTheDocument();
      expect(screen.getByText("✓ Connected successfully")).toBeInTheDocument();
    });

    it("should show disconnected status after failed connection", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Service Unavailable",
      });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      expect(screen.getByText("○ Disconnected")).toBeInTheDocument();
      expect(screen.getByText(/Connection failed: Service Unavailable/)).toBeInTheDocument();
    });

    it("should show disconnected status on connection error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      expect(screen.getByText("○ Disconnected")).toBeInTheDocument();
      expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
    });
  });

  describe("3. Sends command on Enter key", () => {
    it("should send command when Enter key is pressed", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ output: "Command executed" }),
        });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "ls -la" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      // Component uses /api/connections/${connectionId}/execute for commands
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/connections/test-conn-123/execute",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ command: "ls -la" }),
        })
      );
    });

    it("should not send empty command on Enter", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const initialCallCount = mockFetch.mock.calls.length;
      const input = screen.getByPlaceholderText("Enter command...");

      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
      });

      // Should not make additional fetch calls for empty command
      expect(mockFetch.mock.calls.length).toBe(initialCallCount);
    });

    it("should not send command while processing", async () => {
      // Create a promise we can control
      let resolveCommand: (value: any) => void;
      const commandPromise = new Promise((resolve) => {
        resolveCommand = resolve;
      });

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockImplementationOnce(() => commandPromise);

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");

      // Start first command
      await act(async () => {
        fireEvent.change(input, { target: { value: "long-command" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      // Wait for state to update
      await act(async () => {
        await Promise.resolve();
      });

      const callCountAfterFirstCommand = mockFetch.mock.calls.length;

      // Verify the input is disabled (processing state)
      expect(input).toBeDisabled();

      // Try to send another command while processing - Enter should be ignored
      // because isProcessing is true
      fireEvent.change(input, { target: { value: "second-command" } });
      fireEvent.keyDown(input, { key: "Enter" });

      // Should not have made additional call
      expect(mockFetch.mock.calls.length).toBe(callCountAfterFirstCommand);

      // Resolve the command to clean up
      await act(async () => {
        resolveCommand!({
          ok: true,
          json: async () => ({ output: "Done" }),
        });
        await Promise.resolve();
      });
    });
  });

  describe("4. Navigates command history with arrow keys", () => {
    it("should navigate to previous command with ArrowUp", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ output: "output1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ output: "output2" }),
        });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...") as HTMLInputElement;

      // Execute first command
      await act(async () => {
        fireEvent.change(input, { target: { value: "first-command" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      // Execute second command
      await act(async () => {
        fireEvent.change(input, { target: { value: "second-command" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      // Press ArrowUp to get previous command
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowUp" });
      });

      expect(input.value).toBe("second-command");

      // Press ArrowUp again to get first command
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowUp" });
      });

      expect(input.value).toBe("first-command");
    });

    it("should navigate forward in history with ArrowDown", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ output: "output1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ output: "output2" }),
        });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...") as HTMLInputElement;

      // Execute two commands
      await act(async () => {
        fireEvent.change(input, { target: { value: "first-command" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      await act(async () => {
        fireEvent.change(input, { target: { value: "second-command" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      // Navigate up twice to get first command
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowUp" });
      });
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowUp" });
      });

      expect(input.value).toBe("first-command");

      // Navigate down once to get second command
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      expect(input.value).toBe("second-command");
    });

    it("should clear input when navigating past most recent command", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ output: "output1" }),
        });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...") as HTMLInputElement;

      // Execute a command
      await act(async () => {
        fireEvent.change(input, { target: { value: "my-command" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      // Navigate up to get command
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowUp" });
      });

      expect(input.value).toBe("my-command");

      // Navigate down to clear
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      });

      expect(input.value).toBe("");
    });

    it("should not navigate history when empty", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...") as HTMLInputElement;

      // Try to navigate up with no history
      await act(async () => {
        fireEvent.keyDown(input, { key: "ArrowUp" });
      });

      expect(input.value).toBe("");
    });
  });

  describe("5. Clear button clears output", () => {
    it("should clear all terminal output when Clear button is clicked", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ output: "Command output" }),
        });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      // Verify there is output
      expect(screen.getByText(/Connecting to Test Server/)).toBeInTheDocument();

      // Click Clear button
      const clearButton = screen.getByText("Clear");
      await act(async () => {
        fireEvent.click(clearButton);
      });

      // Output should be cleared
      expect(screen.queryByText(/Connecting to Test Server/)).not.toBeInTheDocument();
    });

    it("should preserve input field after clearing output", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");
      fireEvent.change(input, { target: { value: "test input" } });

      const clearButton = screen.getByText("Clear");
      await act(async () => {
        fireEvent.click(clearButton);
      });

      // Input should still be present
      expect(input).toHaveValue("test input");
    });
  });

  describe("6. Close button calls onClose callback", () => {
    it("should call onClose when Close button is clicked", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      const closeButton = screen.getByText("✕ Close");
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when Escape key is pressed", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");
      await act(async () => {
        fireEvent.keyDown(input, { key: "Escape" });
      });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("7. Voice input button is visible", () => {
    it("should render voice input button", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      // The voice input button contains a microphone emoji
      const voiceButtons = screen.getAllByRole("button").filter((btn) =>
        btn.textContent?.includes("🎤")
      );
      expect(voiceButtons.length).toBeGreaterThan(0);
    });

    it("should start voice recognition when voice button is clicked", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const voiceButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("🎤") && !btn.textContent?.includes("Send"));

      await act(async () => {
        fireEvent.click(voiceButton!);
      });

      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it("should display listening indicator when recording", async () => {
      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const voiceButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("🎤") && !btn.textContent?.includes("Send"));

      await act(async () => {
        fireEvent.click(voiceButton!);
        // Trigger onstart callback
        if (mockRecognition.onstart) {
          mockRecognition.onstart();
        }
      });

      expect(screen.getByText("🎤...")).toBeInTheDocument();
    });

    it("should show error when speech recognition is not supported", async () => {
      // Remove Speech API
      Object.defineProperty(window, "SpeechRecognition", { value: undefined, writable: true });
      Object.defineProperty(window, "webkitSpeechRecognition", {
        value: undefined,
        writable: true,
      });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const voiceButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("🎤") && !btn.textContent?.includes("Send"));

      await act(async () => {
        fireEvent.click(voiceButton!);
      });

      expect(screen.getByText(/语音识别不支持此浏览器/)).toBeInTheDocument();

      // Restore Speech API
      Object.defineProperty(window, "SpeechRecognition", {
        value: jest.fn(() => mockRecognition),
        writable: true,
      });
      Object.defineProperty(window, "webkitSpeechRecognition", {
        value: jest.fn(() => mockRecognition),
        writable: true,
      });
    });
  });

  describe("8. Error handling for failed commands", () => {
    it("should display error message when command fails", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ error: "Command not found" }),
        });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "invalid-cmd" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      expect(screen.getByText("Command not found")).toBeInTheDocument();
    });

    it("should handle network errors gracefully", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockRejectedValueOnce(new Error("Network failure"));

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "test" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      expect(screen.getByText(/Error: Network failure/)).toBeInTheDocument();
    });

    it("should handle JSON parsing errors", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error("Invalid JSON");
          },
        });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "test" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      // Should show error message
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });

    it("should display command input with prompt symbol", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ output: "Success" }),
        });

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "echo hello" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      // The command should be displayed with $ prefix
      expect(screen.getByText("$ echo hello")).toBeInTheDocument();
    });

    it("should show processing indicator while command is executing", async () => {
      // Create a promise we can control
      let resolveCommand: (value: any) => void;
      const commandPromise = new Promise((resolve) => {
        resolveCommand = resolve;
      });

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // initial connection
        .mockImplementationOnce(() => commandPromise);

      await act(async () => {
        render(<TerminalViewer {...defaultProps} />);
      });

      await act(async () => {
        jest.runAllTimersAsync();
      });

      const input = screen.getByPlaceholderText("Enter command...");

      // Start the command
      await act(async () => {
        fireEvent.change(input, { target: { value: "slow-command" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      // Wait for state to update
      await act(async () => {
        await Promise.resolve();
      });

      // The component shows "Executing..." when isLoading is true (set alongside isProcessing)
      expect(screen.getByText("Executing...")).toBeInTheDocument();

      // Resolve the command to clean up
      await act(async () => {
        resolveCommand!({
          ok: true,
          json: async () => ({ output: "Done" }),
        });
        await Promise.resolve();
      });
    });
  });
});
