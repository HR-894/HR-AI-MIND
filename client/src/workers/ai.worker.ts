import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngine | null = null;
let currentModelId: string | null = null;

self.onmessage = async (e: MessageEvent) => {
  const message = e.data;

  try {
    switch (message.type) {
      case "init":
        await handleInit(message.modelId);
        break;
      
      case "generate":
        await handleGenerate(message.messages, message.options);
        break;
      
      case "abort":
        await handleAbort();
        break;
    }
  } catch (error: any) {
    self.postMessage({
      type: "error",
      error: error.message || "Unknown error occurred",
    });
  }
};

async function handleInit(modelId: string) {
  if (engine && currentModelId === modelId) {
    self.postMessage({ type: "initComplete" });
    return;
  }

  if (engine) {
    await engine.unload();
    engine = null;
  }

  const initProgressCallback = (progress: webllm.InitProgressReport) => {
    const percentage = progress.progress * 100;
    self.postMessage({
      type: "initProgress",
      progress: percentage,
    });
  };

  engine = await webllm.CreateMLCEngine(modelId, {
    initProgressCallback,
  });

  currentModelId = modelId;
  
  self.postMessage({ type: "initComplete" });
}

async function handleGenerate(messages: any[], options: any) {
  if (!engine) {
    throw new Error("Engine not initialized");
  }

  const chunks = await engine.chat.completions.create({
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: true,
  });

  try {
    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        self.postMessage({
          type: "token",
          content,
        });
      }
    }

    self.postMessage({ type: "complete" });
  } catch (error: any) {
    if (error.message?.includes("abort")) {
      self.postMessage({ type: "aborted" });
    } else {
      throw error;
    }
  }
}

async function handleAbort() {
  if (engine) {
    await engine.interruptGenerate();
    self.postMessage({ type: "aborted" });
  }
}
