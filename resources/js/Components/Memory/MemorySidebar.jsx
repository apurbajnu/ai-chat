import { useState, useEffect } from 'react'
import axios from 'axios'

export default function MemorySidebar({ threadId, onMemoriesChange }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (threadId) {
      fetchRelevantMemories()
    }
  }, [threadId])

  const fetchRelevantMemories = async () => {
    if (!threadId) return
    
    try {
      setLoading(true)
      const response = await axios.get(`/api/threads/${threadId}/memories`)
      setMemories(response.data.memories)
      onMemoriesChange?.(response.data.memories)
    } catch (err) {
      setError('Failed to fetch relevant memories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      fetchRelevantMemories()
      return
    }

    try {
      setLoading(true)
      const response = await axios.get('/api/memories/search', {
        params: { query: searchQuery }
      })
      setMemories(response.data.memories)
    } catch (err) {
      setError('Failed to search memories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchMemories()
    }
  }

  return (
    <div className="w-80 border-l border-slate-200 bg-slate-50/30 h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Memory</h3>
        
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            placeholder="Search memories..."
            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          />
          <button
            onClick={searchMemories}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm p-2">{error}</div>
        ) : memories.length === 0 ? (
          <div className="text-slate-500 text-sm p-2 text-center">
            {searchQuery ? 'No memories found' : 'No relevant memories for this conversation'}
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map(memory => (
              <div 
                key={memory.id} 
                className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-slate-800 text-sm truncate">{memory.title}</h4>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    memory.category === 'personal' ? 'bg-blue-100 text-blue-800' :
                    memory.category === 'preferences' ? 'bg-green-100 text-green-800' :
                    memory.category === 'facts' ? 'bg-yellow-100 text-yellow-800' :
                    memory.category === 'context' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {memory.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-2 line-clamp-2">{memory.content}</p>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Accessed: {memory.access_count}</span>
                  <span>{new Date(memory.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
        Memories help the AI remember important information
      </div>
    </div>
  )
}