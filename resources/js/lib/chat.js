const PROVIDERS = {
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat',
  },
  claude: {
    label: 'Claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
    endpoint: 'https://api.anthropic.com/v1/messages',
    docsUrl: 'https://docs.anthropic.com/en/api/messages',
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    defaultModel: 'your-model-id',
    endpoint: '',
    docsUrl: 'https://github.com/openai/openai-openapi',
  },
}

const SYSTEM_PROMPT =
  'You are a helpful AI assistant. Keep replies clear and friendly.'

const PRICING = {
  openai: {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // USD per 1K tokens
    default: { input: 0.0005, output: 0.0015 },
  },
  claude: {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    default: { input: 0.003, output: 0.015 },
  },
  default: { input: 0.0005, output: 0.001 },
}

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)

const createStarterMessage = () => ({
  id: makeId(),
  role: 'assistant',
  content: 'Welcome back! Start a new prompt whenever you are ready.',
  status: 'done',
  createdAt: Date.now(),
})

const toOpenAIMessages = (history, systemPrompt = SYSTEM_PROMPT) => [
  { role: 'system', content: systemPrompt },
  ...history.map(({ role, content }) => ({ role, content })),
]

const toClaudeMessages = (history) =>
  history.map(({ role, content }) => ({
    role: role === 'assistant' ? 'assistant' : 'user',
    content: [{ type: 'text', text: content }],
  }))

const extractAssistantText = (providerKey, payload) => {
  if (providerKey === 'claude') {
    const piece = payload?.content?.[0]
    if (piece?.type === 'text') {
      return piece.text
    }
    return payload?.content?.map((entry) => entry.text).join('\n') ?? ''
  }

  const choice = payload?.choices?.[0]
  return choice?.message?.content ?? ''
}

const getPricing = (providerKey, model) => {
  const providerPricing = PRICING[providerKey] || {}
  return (
    (model && providerPricing[model]) ||
    providerPricing.default ||
    PRICING.default
  )
}

const computeUsage = (providerKey, model, usagePayload) => {
  if (!usagePayload) {
    return null
  }
  const promptTokens =
    usagePayload.prompt_tokens ??
    usagePayload.input_tokens ??
    usagePayload.inputTokens ??
    0
  const completionTokens =
    usagePayload.completion_tokens ??
    usagePayload.output_tokens ??
    usagePayload.outputTokens ??
    0
  const totalTokens =
    usagePayload.total_tokens ??
    usagePayload.totalTokens ??
    promptTokens + completionTokens

  const pricing = getPricing(providerKey, model)
  const costUsd =
    (promptTokens / 1000) * pricing.input +
    (completionTokens / 1000) * pricing.output

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd: Number(costUsd.toFixed(6)),
  }
}

async function callProvider(providerKey, { apiKey, model, baseUrl, history, systemPrompt }) {
  const provider = PROVIDERS[providerKey]
  if (!provider) {
    throw new Error('Please pick a supported provider.')
  }
  if (!apiKey.trim()) {
    throw new Error('Add an API key before sending a prompt.')
  }

  const endpoint = baseUrl.trim() || provider.endpoint
  if (!endpoint) {
    throw new Error('Provide a base URL for this provider.')
  }

  const requestInit = { method: 'POST', headers: {}, body: '' }

  // Use provided system prompt or default
  const finalSystemPrompt = systemPrompt || SYSTEM_PROMPT;

  if (providerKey === 'claude') {
    requestInit.headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
    requestInit.body = JSON.stringify({
      model: model || provider.defaultModel,
      max_tokens: 1024,
      system: finalSystemPrompt,
      messages: toClaudeMessages(history),
    })
  } else {
    requestInit.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    }
    requestInit.body = JSON.stringify({
      model: model || provider.defaultModel,
      temperature: 0.7,
      messages: toOpenAIMessages(history, finalSystemPrompt),
    })
  }

  const response = await fetch(endpoint, requestInit)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Provider error (${response.status}): ${errorText.slice(0, 200)}`,
    )
  }
  const data = await response.json()
  const assistantReply = extractAssistantText(providerKey, data)

  if (!assistantReply) {
    throw new Error('The provider returned an empty response.')
  }

  const normalizedUsage = computeUsage(
    providerKey,
    model || provider.defaultModel,
    data?.usage,
  )

  return {
    text: assistantReply.trim(),
    usage: normalizedUsage,
  }
}

export {
  PROVIDERS,
  SYSTEM_PROMPT,
  callProvider,
  createStarterMessage,
  makeId,
}
