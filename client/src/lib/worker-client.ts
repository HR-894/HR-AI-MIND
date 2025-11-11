export type WorkerMessage = 
  | { type: "init"; modelId: string }
  | { type: "generate"; messages: any[]; options: any }
  | { type: "abort" };

export type WorkerResponse =
  | { type: "initProgress"; progress: number }
  | { type: "initComplete" }
  | { type: "token"; content: string }
  | { type: "complete" }
  | { type: "error"; error: string }
  | { type: "aborted" };

export class WorkerClient {
  private static instance: WorkerClient | null = null;
  private worker: Worker | null = null;
  private listeners: Set<(message: WorkerResponse) => void> = new Set();
  private messageQueue: WorkerMessage[] = [];
  private isReady = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): WorkerClient {
    if (!WorkerClient.instance) {
      WorkerClient.instance = new WorkerClient();
    }
    return WorkerClient.instance;
  }

  private initialize() {
    try {
      this.worker = new Worker(
        new URL("../workers/ai.worker.ts", import.meta.url),
        { type: "module" }
      );

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const message = e.data;
        
        if (message.type === "initComplete") {
          this.isReady = true;
          this.flushQueue();
        }
        
        this.listeners.forEach(listener => listener(message));
      };

      this.worker.onerror = (error) => {
        console.error("Worker error:", error);
        this.listeners.forEach(listener => 
          listener({ 
            type: "error", 
            error: error.message || "Worker error occurred" 
          })
        );
      };
    } catch (error) {
      console.error("Failed to create worker:", error);
    }
  }

  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.worker) {
        this.worker.postMessage(message);
      }
    }
  }

  sendMessage(message: WorkerMessage) {
    if (!this.worker) {
      console.error("Worker not available");
      return;
    }

    if (message.type === "init") {
      this.isReady = false;
      this.messageQueue = [];
      this.worker.postMessage(message);
    } else if (message.type === "abort") {
      this.worker.postMessage(message);
    } else if (this.isReady) {
      this.worker.postMessage(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  onMessage(listener: (message: WorkerResponse) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.listeners.clear();
      this.messageQueue = [];
    }
  }
}

export const workerClient = WorkerClient.getInstance();
