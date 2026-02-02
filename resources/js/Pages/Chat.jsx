import { useEffect, useMemo, useState } from 'react'
import { Head } from '@inertiajs/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ThreadList from '../Components/Chat/ThreadList'
import SettingsPanel from '../Components/Chat/SettingsPanel'
import MemorySidebar from '../Components/Memory/MemorySidebar'
import {
  PROVIDERS,
  callProvider,
  createStarterMessage,
  makeId,
} from '../lib/chat'
import {
  threadAPI,
  subThreadAPI,
  generateThreadTitle,
} from '../lib/api'

const EMPTY_USAGE = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  costUsd: 0,
}

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

export default function Chat({ aiConfig }) {
  // Load settings from localStorage, then server config, then defaults
  const [providerKey, setProviderKey] = useState(() => {
    return localStorage.getItem('ai_provider') || aiConfig?.provider || 'openai'
  })
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('ai_api_key') || aiConfig?.apiKey || ''
  })
  const [model, setModel] = useState(() => {
    const savedModel = localStorage.getItem('ai_model')
    return savedModel || aiConfig?.model || PROVIDERS.openai.defaultModel
  })
  const [baseUrl, setBaseUrl] = useState(() => {
    return localStorage.getItem('ai_base_url') || aiConfig?.baseUrl || ''
  })
  const [messages, setMessages] = useState(() => [createStarterMessage()])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [usageTotals, setUsageTotals] = useState({ ...EMPTY_USAGE })
  const [currentThreadId, setCurrentThreadId] = useState(null)
  const [threadRefreshKey, setThreadRefreshKey] = useState(0)
  const [relevantMemories, setRelevantMemories] = useState([])
  const [showMemorySidebar, setShowMemorySidebar] = useState(true)

  const selectedProvider = PROVIDERS[providerKey]

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('ai_provider', providerKey)
    localStorage.setItem('ai_api_key', apiKey)
    localStorage.setItem('ai_model', model)
    localStorage.setItem('ai_base_url', baseUrl)
  }, [providerKey, apiKey, model, baseUrl])

  useEffect(() => {
    setModel(PROVIDERS[providerKey].defaultModel)
  }, [providerKey])

  const canSend = draft.trim().length > 0 && !isSending

  const handleSend = async (event) => {
    event.preventDefault()
    if (!draft.trim()) {
      return
    }

    const userMessage = {
      id: makeId(),
      role: 'user',
      content: draft.trim(),
      status: 'done',
      createdAt: Date.now(),
    }
    const conversation = [...messages, userMessage]
    const placeholder = {
      id: makeId(),
      role: 'assistant',
      content: '',
      status: 'thinking',
      createdAt: Date.now(),
    }

    setDraft('')
    setError('')
    setMessages([...conversation, placeholder])
    setIsSending(true)

    try {
      // Create thread if this is the first message
      let threadId = currentThreadId
      if (!threadId) {
        const title = generateThreadTitle(userMessage.content)
        const thread = await threadAPI.create(title, userMessage.content)
        threadId = thread.id
        setCurrentThreadId(threadId)
        setThreadRefreshKey((k) => k + 1)
      }

      // Save user message to database
      await subThreadAPI.create(threadId, 'user', userMessage.content, {
        provider: providerKey,
        model: model,
      })

      // Get relevant memories for this conversation
      let memoryContext = ''
      if (threadId) {
        try {
          const response = await fetch(`/api/threads/${threadId}/memories`)
          const data = await response.json()
          if (data.memories && data.memories.length > 0) {
            // Format memories for AI context
            memoryContext = "RELEVANT USER MEMORIES:\n"
            memoryContext += "------------------------\n\n"

            data.memories.forEach(memory => {
              memoryContext += `Category: ${memory.category}\n`
              memoryContext += `Title: ${memory.title}\n`
              memoryContext += `Content: ${memory.content}\n`
              memoryContext += `Last Updated: ${new Date(memory.updated_at).toLocaleDateString()}\n`
              memoryContext += `Access Count: ${memory.access_count}\n`
              memoryContext += "---\n"
            })
          }
        } catch (memErr) {
          console.error('Error fetching memories:', memErr)
        }
      }

      const { text: replyText, usage } = await callProvider(providerKey, {
        apiKey,
        model,
        baseUrl,
        history: conversation,
        systemPrompt: memoryContext ? `${memoryContext}\n\n${PROVIDERS[providerKey].systemPrompt || ''}` : PROVIDERS[providerKey].systemPrompt || undefined
      })

      setMessages((current) =>
        current.map((message) =>
          message.id === placeholder.id
            ? { ...message, content: replyText, status: 'done' }
            : message,
        ),
      )

      // Save assistant message to database
      await subThreadAPI.create(threadId, 'assistant', replyText, {
        provider: providerKey,
        model: model,
        tokensUsed: usage?.totalTokens || 0,
        costUsd: usage?.costUsd || 0,
      })

      setThreadRefreshKey((k) => k + 1)

      if (usage) {
        setUsageTotals((current) => ({
          promptTokens: current.promptTokens + (usage.promptTokens ?? 0),
          completionTokens:
            current.completionTokens + (usage.completionTokens ?? 0),
          totalTokens: current.totalTokens + (usage.totalTokens ?? 0),
          costUsd: Number(
            (current.costUsd + (usage.costUsd ?? 0)).toFixed(6),
          ),
        }))
      }
    } catch (err) {
      setError(err.message)
      setMessages((current) => [
        ...current.filter((message) => message.id !== placeholder.id),
        {
          id: makeId(),
          role: 'assistant',
          content: err.message,
          status: 'error',
          createdAt: Date.now(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleReset = () => {
    setMessages([createStarterMessage()])
    setError('')
    setUsageTotals({ ...EMPTY_USAGE })
    setCurrentThreadId(null)
    setRelevantMemories([])
  }

  const handleThreadSelect = async (threadId) => {
    try {
      const thread = await threadAPI.getById(threadId)
      setCurrentThreadId(threadId)

      // Convert sub-threads to messages format
      const loadedMessages = thread.sub_threads.map((st) => ({
        id: st.id,
        role: st.role,
        content: st.content,
        status: 'done',
        createdAt: new Date(st.created_at).getTime(),
      }))

      setMessages(loadedMessages.length > 0 ? loadedMessages : [createStarterMessage()])
      setError('')

      // Calculate usage totals from loaded messages
      const totals = thread.sub_threads.reduce(
        (acc, st) => ({
          promptTokens: acc.promptTokens,
          completionTokens: acc.completionTokens,
          totalTokens: acc.totalTokens + (st.tokens_used || 0),
          costUsd: acc.costUsd + parseFloat(st.cost_usd || 0),
        }),
        { ...EMPTY_USAGE }
      )
      setUsageTotals(totals)
    } catch (err) {
      setError('Failed to load thread: ' + err.message)
    }
  }

  const handleNewThread = () => {
    setCurrentThreadId(null)
    setMessages([createStarterMessage()])
    setError('')
    setUsageTotals({ ...EMPTY_USAGE })
    setRelevantMemories([])
  }

  const handleQuestionSelect = (threadId, question, answer) => {
    // Set the current thread
    setCurrentThreadId(threadId)

    // Show only the question and its answer
    const qaPair = []

    // Add the question
    qaPair.push({
      id: question.id,
      role: question.role,
      content: question.content,
      status: 'done',
      createdAt: new Date(question.created_at).getTime(),
    })

    // Add the answer if it exists
    if (answer) {
      qaPair.push({
        id: answer.id,
        role: answer.role,
        content: answer.content,
        status: 'done',
        createdAt: new Date(answer.created_at).getTime(),
      })
    }

    setMessages(qaPair.length > 0 ? qaPair : [createStarterMessage()])
    setError('')
  }

  const handleMemoriesChange = (memories) => {
    setRelevantMemories(memories)
  }

  const providerOptions = useMemo(
    () =>
      Object.entries(PROVIDERS).map(([key, config]) => ({
        value: key,
        label: config.label,
      })),
    [],
  )

  return (
    <>
      <Head title="AI Chat" />

      <div className="relative flex min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/30">
        {/* Thread List Sidebar */}
        <div className="h-screen w-80 border-r border-slate-200">
          <ThreadList
            key={threadRefreshKey}
            currentThreadId={currentThreadId}
            onThreadSelect={handleThreadSelect}
            onNewThread={handleNewThread}
            onQuestionSelect={handleQuestionSelect}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          <section className="flex h-screen w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <section className="flex h-full min-h-0 flex-1 flex-col rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-indigo-400">
                    {selectedProvider.label}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    Conversation
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-indigo-50 px-4 py-1 text-sm font-semibold text-indigo-600">
                    {model}
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-200"
                  >
                    New Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMemorySidebar(!showMemorySidebar)}
                    className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-200"
                  >
                    {showMemorySidebar ? 'Hide Memory' : 'Show Memory'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => {
                  const fallback =
                    message.status === 'thinking' ? 'Thinking…' : message.content
                  const textContent = fallback || ''

                  return (
                    <article
                      key={message.id}
                      className={`rounded-2xl border px-4 py-3 shadow-sm ${
                        message.role === 'user'
                          ? 'border-emerald-200 bg-emerald-50/80'
                          : 'border-indigo-100 bg-indigo-50/70'
                      } ${message.status === 'error' ? 'border-rose-200 bg-rose-50' : ''}`}
                    >
                      <header className="mb-1 flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-400">
                        <span>{message.role === 'user' ? 'You' : 'AI'}</span>
                        <span>{formatTime(message.createdAt)}</span>
                      </header>
                      <div className="markdown space-y-3 text-sm text-slate-900">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ inline, children, ...props }) {
                              if (inline) {
                                return (
                                  <code
                                    className="rounded bg-slate-900/5 px-1.5 py-0.5 font-mono text-[0.85em]"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                )
                              }
                              return (
                                <pre className="overflow-x-auto rounded-2xl bg-slate-900/95 p-4 text-sm text-slate-100">
                                  <code {...props}>{children}</code>
                                </pre>
                              )
                            },
                            a({ children, ...props }) {
                              return (
                                <a
                                  className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-800 transition"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                >
                                  {children}
                                </a>
                              )
                            },
                            ul({ children }) {
                              return (
                                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-900">
                                  {children}
                                </ul>
                              )
                            },
                            ol({ children }) {
                              return (
                                <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-900">
                                  {children}
                                </ol>
                              )
                            },
                            blockquote({ children }) {
                              return (
                                <blockquote className="border-l-4 border-indigo-200 bg-indigo-50/60 px-4 py-2 text-sm text-slate-800">
                                  {children}
                                </blockquote>
                              )
                            },
                            p({ children }) {
                              return <p className="text-sm leading-relaxed">{children}</p>
                            },
                          }}
                        >
                          {textContent}
                        </ReactMarkdown>
                      </div>
                    </article>
                  )
                })}
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
                  {error}
                </p>
              )}

              <form
                className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4"
                onSubmit={handleSend}
              >
                <textarea
                  rows="4"
                  placeholder="Ask anything... (Press Enter to send, Shift+Enter for new line)"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      if (canSend) {
                        handleSend(event)
                      }
                    }
                  }}
                  disabled={isSending}
                  className="min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canSend}
                  >
                    {isSending ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            </section>
          </section>

          {/* Usage Stats */}
          <div className="fixed bottom-4 left-[340px] z-20 w-64 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-900/10 backdrop-blur">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
              Usage
            </p>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Tokens used</dt>
                <dd className="font-semibold text-slate-900">
                  {usageTotals.totalTokens.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Estimated cost</dt>
                <dd className="font-semibold text-slate-900">
                  ${usageTotals.costUsd.toFixed(4)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Memory Sidebar */}
        {showMemorySidebar && (
          <MemorySidebar
            threadId={currentThreadId}
            onMemoriesChange={handleMemoriesChange}
          />
        )}

        {aiConfig?.allowOverride !== false && (
          <>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="fixed right-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-lg shadow-slate-900/10 transition hover:text-indigo-600"
              aria-label="Open settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M11.983 4.5a1 1 0 0 1 .983.804l.347 1.811a5.5 5.5 0 0 1 1.899 1.098l1.828-.55a1 1 0 0 1 1.236.646l.7 2.19a1 1 0 0 1-.399 1.128l-1.551 1.088a5.5 5.5 0 0 1 0 2.197l1.55 1.088a1 1 0 0 1 .4 1.128l-.701 2.19a1 1 0 0 1-1.236.646l-1.828-.55a5.5 5.5 0 0 1-1.899 1.098l-.347 1.81a1 1 0 0 1-.983.805h-2.35a1 1 0 0 1-.983-.804l-.347-1.811a5.5 5.5 0 0 1-1.899-1.098l-1.828.55a1 1 0 0 1-1.236-.646l-.7-2.19a1 1 0 0 1 .399-1.128l1.551-1.088a5.5 5.5 0 0 1 0-2.197l-1.55-1.088a1 1 0 0 1-.4-1.128l.701-2.19a1 1 0 0 1 1.236-.646l1.828.55a5.5 5.5 0 0 1 1.899-1.098l.347-1.81a1 1 0 0 1 .983-.805zm1.242 7.5a1.5 1.5 0 1 0-2.45 1.153 1.5 1.5 0 0 0 2.45-1.153z" />
              </svg>
            </button>

            <SettingsPanel
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              providerKey={providerKey}
              setProviderKey={setProviderKey}
              apiKey={apiKey}
              setApiKey={setApiKey}
              model={model}
              setModel={setModel}
              baseUrl={baseUrl}
              setBaseUrl={setBaseUrl}
              selectedProvider={selectedProvider}
              providerOptions={providerOptions}
            />
          </>
        )}
      </div>
    </>
  )
}
