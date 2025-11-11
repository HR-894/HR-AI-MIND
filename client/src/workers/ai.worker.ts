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
    console.error("Worker error:", error);
    self.postMessage({
      type: "error",
      error: error?.message || error?.toString() || "Unknown error occurred",
    });
  }
};

async function handleInit(modelId: string) {
  try {
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

    // Create engine with optimized configuration for faster loading
    // Use prebuilt app config with proper model list
    const selectedConfig = webllm.prebuiltAppConfig;
    
    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback,
      logLevel: "ERROR", // Reduce console noise
      appConfig: {
        ...selectedConfig,
        // Use IndexedDB caching for faster subsequent loads
        useIndexedDBCache: true,
      },
    });

    currentModelId = modelId;
    
    self.postMessage({ type: "initComplete" });
  } catch (error: any) {
    console.error("Model initialization error:", error);
    throw new Error(`Failed to initialize model: ${error.message}`);
  }
}

async function handleGenerate(messages: any[], options: any) {
  if (!engine) {
    throw new Error("Engine not initialized. Please load a model first.");
  }

  const startTime = performance.now();
  let tokenCount = 0;

  try {
    // Build system prompt from persona settings
    let systemPrompt = options.systemPrompt || "You are a helpful, intelligent AI assistant.";
    
    // Add response length instruction
    const lengthInstructions = {
      concise: "Keep your responses brief and to the point. Be direct and concise.",
      balanced: "Provide balanced responses with appropriate detail.",
      detailed: "Provide comprehensive, detailed responses with thorough explanations.",
    };
    
    // Add tone instruction
    const toneInstructions = {
      professional: "Maintain a professional, formal tone.",
      friendly: "Be warm, approachable, and friendly.",
      casual: "Use a casual, conversational style.",
      enthusiastic: "Be energetic, enthusiastic, and encouraging!",
      technical: "Use precise technical language and focus on accuracy.",
    };
    
    const lengthGuide = lengthInstructions[options.responseLength as keyof typeof lengthInstructions] || "";
    const toneGuide = toneInstructions[options.responseTone as keyof typeof toneInstructions] || "";
    
    // Combine all instructions
    if (lengthGuide || toneGuide || options.customInstructions) {
      systemPrompt += "\n\n";
      if (lengthGuide) systemPrompt += lengthGuide + " ";
      if (toneGuide) systemPrompt += toneGuide + " ";
      if (options.customInstructions) systemPrompt += "\n" + options.customInstructions;
    }
    
    // Clean and validate messages format
    const cleanMessages = messages.map(msg => ({
      role: msg.role,
      content: String(msg.content || ""),
    }));
    
    // Inject system message at the start if not already present
    if (cleanMessages.length === 0 || cleanMessages[0]?.role !== "system") {
      cleanMessages.unshift({
        role: "system",
        content: systemPrompt,
      });
    } else if (cleanMessages[0]) {
      // Replace existing system message with enhanced one
      cleanMessages[0].content = systemPrompt;
    }

    const chunks = await engine.chat.completions.create({
      messages: cleanMessages,
      temperature: Math.max(0, Math.min(2, options.temperature ?? 0.7)),
      max_tokens: Math.max(1, Math.min(4096, options.maxTokens ?? 2048)),
      stream: true,
      top_p: options.top_p ?? 0.95,
      frequency_penalty: options.frequency_penalty ?? 0,
      presence_penalty: options.presence_penalty ?? 0,
    });

    for await (const chunk of chunks) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        tokenCount++;
        self.postMessage({
          type: "token",
          content,
        });
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const tokensPerSecond = tokenCount / (duration / 1000);

    self.postMessage({ 
      type: "complete",
      metrics: {
        tokenCount,
        duration,
        tokensPerSecond: tokensPerSecond.toFixed(2),
      }
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    if (error.message?.includes("abort") || error.message?.includes("interrupt")) {
      self.postMessage({ type: "aborted" });
    } else {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }
}

async function handleAbort() {
  if (engine) {
    await engine.interruptGenerate();
    self.postMessage({ type: "aborted" });
  }
}
