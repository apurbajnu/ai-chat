import { useState, useEffect } from 'react'
import axios from 'axios'

export default function MemoryManager({ userId, threadId }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMemory, setNewMemory] = useState({ title: '', content: '', category: 'general' })
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({ category: '', active: true })

  useEffect(() => {
    fetchMemories()
  }, [userId, filters])

  const fetchMemories = async () => {
    try {
      setLoading(true)
      const params = { ...filters }
      if (params.active === '') delete params.active
      
      const response = await axios.get('/api/memories', { params })
      setMemories(response.data.memories.data || response.data.memories)
    } catch (err) {
      setError('Failed to fetch memories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMemory = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/memories', {
        ...newMemory,
        thread_id: threadId
      })
      
      setMemories([response.data.memory, ...memories])
      setNewMemory({ title: '', content: '', category: 'general' })
      setShowForm(false)
    } catch (err) {
      setError('Failed to create memory')
      console.error(err)
    }
  }

  const handleDeleteMemory = async (id) => {
    try {
      await axios.delete(`/api/memories/${id}`)
      setMemories(memories.filter(memory => memory.id !== id))
    } catch (err) {
      setError('Failed to delete memory')
      console.error(err)
    }
  }

  const handleToggleActive = async (id, isActive) => {
    try {
      const response = await axios.put(`/api/memories/${id}`, { is_active: !isActive })
      setMemories(memories.map(memory => 
        memory.id === id ? { ...memory, is_active: !isActive } : memory
      ))
    } catch (err) {
      setError('Failed to update memory')
      console.error(err)
    }
  }

  if (loading) return <div className="p-4">Loading memories...</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Memories</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-indigo-500 text-white rounded-md text-sm"
        >
          {showForm ? 'Cancel' : '+ Add Memory'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateMemory} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={newMemory.title}
                onChange={(e) => setNewMemory({...newMemory, title: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={newMemory.category}
                onChange={(e) => setNewMemory({...newMemory, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="general">General</option>
                <option value="personal">Personal</option>
                <option value="preferences">Preferences</option>
                <option value="facts">Facts</option>
                <option value="context">Context</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={newMemory.content}
              onChange={(e) => setNewMemory({...newMemory, content: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
              rows="3"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Save Memory
          </button>
        </form>
      )}

      <div className="mb-4 flex gap-2">
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="personal">Personal</option>
          <option value="preferences">Preferences</option>
          <option value="facts">Facts</option>
          <option value="context">Context</option>
        </select>
        <select
          value={filters.active}
          onChange={(e) => setFilters({...filters, active: e.target.value === '' ? '' : e.target.value === 'true'})}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          onClick={fetchMemories}
          className="px-3 py-1 bg-gray-200 rounded-md text-sm"
        >
          Refresh
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {memories.length === 0 ? (
          <p className="text-gray-500 text-sm">No memories found</p>
        ) : (
          memories.map(memory => (
            <div key={memory.id} className="p-3 border rounded-md bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{memory.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      memory.category === 'personal' ? 'bg-blue-100 text-blue-800' :
                      memory.category === 'preferences' ? 'bg-green-100 text-green-800' :
                      memory.category === 'facts' ? 'bg-yellow-100 text-yellow-800' :
                      memory.category === 'context' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {memory.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{memory.content}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Created: {new Date(memory.created_at).toLocaleDateString()} | 
                    Accessed: {memory.access_count} times
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => handleToggleActive(memory.id, memory.is_active)}
                    className={`px-2 py-1 rounded text-xs ${
                      memory.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {memory.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDeleteMemory(memory.id)}
                    className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}