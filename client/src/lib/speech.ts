export function isSTTSupported(): boolean {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

export function isTTSSupported(): boolean {
  return "speechSynthesis" in window;
}

export function createSpeechRecognition(): any | null {
  if (!isSTTSupported()) return null;
  
  const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  
  return recognition;
}

export function speak(text: string): void {
  if (!isTTSSupported()) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
}
