export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  lastModelUsed: string;
  branchedFrom: {
    chatId: string;
    messageId: string;
    timestamp: string;
  } | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model: string;
}

export interface BranchPoint {
  originalChatId: string;
  messages: Message[];
  branchedFromMessageId: string;
  timestamp: string;
}

export interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  rawfs: number;
  lmdate: number;
  timestamp: number;
  foldercon: number;
  ftype: string;
  parent: string;
}
export interface ModelRow {
  id: string
  context_length:number
  model: string
  cost: {
      prompt_token: number
      completion_token: number
  }
  supported_parameters:string[]
}

export interface Choice {
    finish_reason: string
    message: Message
}

export interface ChatCompletion {
    id: string
    model: string
    choices: Choice[]
}

export interface ModelArchitecture {
    modality: string
    input_modalities: string[]
    output_modalities: string[]
    tokenizer: string
    instruct_type: string | null
}

export interface ModelPricing {
    prompt: string
    completion: string
    request: string
    image: string
    web_search: string
    internal_reasoning: string
}

export interface ModelTopProvider {
    context_length: number
    max_completion_tokens: number
    is_moderated: boolean
}

export interface OpenRouterModel {
    id: string
    canonical_slug: string
    hugging_face_id: string
    name: string
    created: number
    description: string
    context_length: number
    architecture: ModelArchitecture
    pricing: ModelPricing
    top_provider: ModelTopProvider
    per_request_limits: any
    supported_parameters: string[]
}