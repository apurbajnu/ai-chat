// Get CSRF token from meta tag
function getCsrfToken() {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  return token || ''
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = endpoint

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': getCsrfToken(),
      ...options.headers,
    },
    credentials: 'same-origin',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || 'API request failed')
  }

  return response.json()
}

// Thread API
export const threadAPI = {
  // Get all threads
  async getAll(limit = 50) {
    return apiRequest(`/api/threads?limit=${limit}`)
  },

  // Get single thread with sub-threads
  async getById(id) {
    return apiRequest(`/api/threads/${id}`)
  },

  // Create new thread
  async create(title, firstMessage) {
    return apiRequest('/api/threads', {
      method: 'POST',
      body: JSON.stringify({ title, first_message: firstMessage }),
    })
  },

  // Update thread
  async update(id, data) {
    return apiRequest(`/api/threads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete thread
  async delete(id) {
    return apiRequest(`/api/threads/${id}`, {
      method: 'DELETE',
    })
  },
}

// Sub-thread (Message) API
export const subThreadAPI = {
  // Get all messages for a thread
  async getByThreadId(threadId) {
    return apiRequest(`/api/sub-threads?thread_id=${threadId}`)
  },

  // Add message to thread
  async create(threadId, role, content, metadata = {}) {
    return apiRequest('/api/sub-threads', {
      method: 'POST',
      body: JSON.stringify({
        thread_id: threadId,
        role,
        content,
        model: metadata.model,
        provider: metadata.provider,
        tokens_used: metadata.tokensUsed,
        cost_usd: metadata.costUsd,
      }),
    })
  },

  // Delete message
  async delete(id) {
    return apiRequest(`/api/sub-threads/${id}`, {
      method: 'DELETE',
    })
  },
}

// Helper to generate thread title from first message
export function generateThreadTitle(message) {
  const maxLength = 50
  const cleaned = message.trim().replace(/\s+/g, ' ')
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  return cleaned.substring(0, maxLength) + '...'
}
