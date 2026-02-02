import { useEffect, useState } from 'react'
import { threadAPI } from '../../lib/api'
import axios from 'axios'

export default function ThreadList({
  currentThreadId,
  onThreadSelect,
  onNewThread,
  onQuestionSelect,
}) {
  const [threads, setThreads] = useState([])
  const [expandedThreads, setExpandedThreads] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingSubThreads, setLoadingSubThreads] = useState({})
  const [threadsWithMemories, setThreadsWithMemories] = useState({})

  useEffect(() => {
    loadThreads()
  }, [])

  const loadThreads = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await threadAPI.getAll()
      setThreads(data.threads || [])

      // For each thread, check if it has associated memories
      const threadMemories = {}
      for (const thread of data.threads || []) {
        try {
          const response = await axios.get(`/api/threads/${thread.id}/memories`)
          if (response.data.memories && response.data.memories.length > 0) {
            threadMemories[thread.id] = response.data.memories.length
          }
        } catch (err) {
          // Ignore errors for individual thread memory checks
          console.error(`Failed to load memories for thread ${thread.id}:`, err)
        }
      }
      setThreadsWithMemories(threadMemories)
    } catch (err) {
      setError(err.message)
      console.error('Failed to load threads:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleThread = async (threadId, event) => {
    event.stopPropagation()

    const isExpanded = expandedThreads[threadId]?.isExpanded

    if (!isExpanded) {
      // Expand and load sub-threads (only questions)
      try {
        setLoadingSubThreads((prev) => ({ ...prev, [threadId]: true }))
        const thread = await threadAPI.getById(threadId)

        // Filter to show only user messages (questions), skip first one as it's the main thread
        const questions = thread.sub_threads
          .filter((st) => st.role === 'user')
          .slice(1) // Skip first question as it's the main thread

        setExpandedThreads((prev) => ({
          ...prev,
          [threadId]: {
            isExpanded: true,
            questions: questions,
            allSubThreads: thread.sub_threads,
          },
        }))
      } catch (err) {
        console.error('Failed to load sub-threads:', err)
        alert('Failed to load messages: ' + err.message)
      } finally {
        setLoadingSubThreads((prev) => ({ ...prev, [threadId]: false }))
      }
    } else {
      // Collapse
      setExpandedThreads((prev) => ({
        ...prev,
        [threadId]: {
          ...prev[threadId],
          isExpanded: false,
        },
      }))
    }
  }

  const handleQuestionClick = (threadId, questionId, event) => {
    event.stopPropagation()

    const threadData = expandedThreads[threadId]
    if (threadData?.allSubThreads) {
      // Find the question and its answer
      const allMessages = threadData.allSubThreads
      const questionIndex = allMessages.findIndex((st) => st.id === questionId)

      if (questionIndex !== -1) {
        const question = allMessages[questionIndex]
        // Find the next message (should be the answer)
        const answer = allMessages[questionIndex + 1]

        // Pass question and answer to parent
        onQuestionSelect(threadId, question, answer)
      }
    } else {
      // If not expanded, just load the thread
      onThreadSelect(threadId)
    }
  }

  const handleMainThreadClick = (threadId) => {
    // Load the entire thread
    onThreadSelect(threadId)
  }

  const handleDelete = async (threadId, event) => {
    event.stopPropagation()

    if (!confirm('Delete this conversation?')) {
      return
    }

    try {
      await threadAPI.delete(threadId)
      setThreads((prev) => prev.filter((t) => t.id !== threadId))

      // If deleting current thread, create new one
      if (threadId === currentThreadId) {
        onNewThread()
      }
    } catch (err) {
      alert('Failed to delete thread: ' + err.message)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const truncateMessage = (content, maxLength = 50) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="flex h-full flex-col bg-slate-50/80 backdrop-blur">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent Chats
          </h2>
          <button
            onClick={onNewThread}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700"
            title="New conversation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-sm text-slate-500">
            Loading...
          </div>
        )}

        {error && (
          <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && threads.length === 0 && (
          <div className="p-4 text-center text-sm text-slate-500">
            No conversations yet
          </div>
        )}

        {!loading && !error && threads.length > 0 && (
          <div className="space-y-1 p-2">
            {threads.map((thread) => {
              const isExpanded = expandedThreads[thread.id]?.isExpanded
              const questions = expandedThreads[thread.id]?.questions || []
              const isLoadingSubThreads = loadingSubThreads[thread.id]

              return (
                <div key={thread.id} className="space-y-1">
                  {/* Main Thread (First Question) */}
                  <div
                    className={`group relative rounded-lg border transition ${
                      currentThreadId === thread.id
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-transparent bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2 p-3">
                      {/* Expand/Collapse Arrow */}
                      <button
                        onClick={(e) => toggleThread(thread.id, e)}
                        className="flex-shrink-0 mt-0.5 text-slate-400 hover:text-slate-600 transition"
                        title={isExpanded ? 'Collapse' : 'Show all questions'}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={`h-4 w-4 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {/* Main Thread Content */}
                      <div
                        onClick={() => handleMainThreadClick(thread.id)}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <h3
                            className={`truncate text-sm font-medium ${
                              currentThreadId === thread.id
                                ? 'text-indigo-900'
                                : 'text-slate-900'
                            }`}
                          >
                            {thread.title}
                          </h3>
                          {threadsWithMemories[thread.id] > 0 && (
                            <span
                              className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-xs text-indigo-800"
                              title={`${threadsWithMemories[thread.id]} memories associated with this thread`}
                            >
                              {threadsWithMemories[thread.id]}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{Math.ceil((thread.message_count || 0) / 2)} questions</span>
                          <span>•</span>
                          <span>{formatDate(thread.updated_at)}</span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDelete(thread.id, e)}
                        className="flex-shrink-0 opacity-0 transition group-hover:opacity-100"
                        title="Delete conversation"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4 text-slate-400 hover:text-red-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Questions (Only User Messages) */}
                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {isLoadingSubThreads && (
                        <div className="p-2 text-xs text-slate-500">
                          Loading questions...
                        </div>
                      )}

                      {!isLoadingSubThreads && questions.length === 0 && (
                        <div className="p-2 text-xs text-slate-500">
                          No more questions
                        </div>
                      )}

                      {!isLoadingSubThreads && questions.map((question, index) => (
                        <div
                          key={question.id}
                          onClick={(e) => handleQuestionClick(thread.id, question.id, e)}
                          className="group cursor-pointer rounded-lg border border-transparent bg-white/50 p-2 text-xs transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 font-semibold text-emerald-600">
                              Q{index + 2}:
                            </span>
                            <span className="text-slate-600 flex-1 truncate">
                              {truncateMessage(question.content)}
                            </span>
                            <span className="flex-shrink-0 text-slate-400">
                              {formatDate(question.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
