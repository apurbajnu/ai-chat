<?php

namespace App\Http\Controllers;

use App\Models\Memory;
use App\Models\Thread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MemoryController extends Controller
{
    /**
     * Display a listing of the user's memories.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['category', 'tag', 'active']);
        
        $query = Memory::where('user_id', Auth::id());
        
        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        
        if (isset($filters['active'])) {
            $query->where('is_active', $filters['active']);
        }
        
        $memories = $query->with(['tags', 'threads'])->latest()->paginate(20);

        return response()->json(['memories' => $memories]);
    }

    /**
     * Store a newly created memory in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'thread_id' => 'nullable|exists:threads,id',
        ]);

        $memory = Memory::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'] ?? 'general',
            'metadata' => ['created_from_thread' => $validated['thread_id'] ?? null],
            'is_active' => true,
        ]);

        // Attach tags if provided
        if (isset($validated['tags']) && !empty($validated['tags'])) {
            foreach ($validated['tags'] as $tagName) {
                $tag = \App\Models\MemoryTag::firstOrCreate(
                    ['name' => strtolower($tagName)],
                    ['color' => '#3b82f6'] // Default blue color
                );
                
                $memory->tags()->attach($tag);
            }
        }

        // Link to thread if provided
        if (isset($validated['thread_id'])) {
            $thread = Thread::findOrFail($validated['thread_id']);
            $memory->threads()->attach($thread);
        }

        return response()->json(['memory' => $memory], 201);
    }

    /**
     * Display the specified memory.
     */
    public function show($id)
    {
        $memory = Memory::where('user_id', Auth::id())
            ->with(['tags', 'threads'])
            ->findOrFail($id);

        // Increment access count
        $memory->incrementAccessCount();

        return response()->json(['memory' => $memory]);
    }

    /**
     * Update the specified memory in storage.
     */
    public function update(Request $request, $id)
    {
        $memory = Memory::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'category' => 'sometimes|string|max:100',
            'is_active' => 'sometimes|boolean',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:50',
        ]);

        $memory->update($validated);

        // Update tags if provided
        if (isset($validated['tags'])) {
            $tagIds = [];
            foreach ($validated['tags'] as $tagName) {
                $tag = \App\Models\MemoryTag::firstOrCreate(
                    ['name' => strtolower($tagName)],
                    ['color' => '#3b82f6']
                );
                $tagIds[] = $tag->id;
            }
            
            $memory->tags()->sync($tagIds);
        }

        return response()->json(['memory' => $memory]);
    }

    /**
     * Remove the specified memory from storage.
     */
    public function destroy($id)
    {
        $memory = Memory::where('user_id', Auth::id())->findOrFail($id);
        $memory->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Search memories by content or title
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1',
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        $query = $request->input('query');
        $limit = $request->input('limit', 10);

        $memories = Memory::where('user_id', Auth::id())
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('content', 'LIKE', "%{$query}%");
            })
            ->with(['tags'])
            ->latest()
            ->limit($limit)
            ->get();

        // Increment access count for each retrieved memory
        foreach ($memories as $memory) {
            $memory->incrementAccessCount();
        }

        return response()->json(['memories' => $memories]);
    }

    /**
     * Get memories relevant to a specific thread
     */
    public function getRelevantToThread($threadId)
    {
        $relevantMemories = Memory::where('user_id', Auth::id())
            ->where('is_active', true)
            ->whereHas('threads', function ($q) use ($threadId) {
                $q->where('thread_id', $threadId);
            })
            ->with(['tags'])
            ->get();

        // Increment access count for each retrieved memory
        foreach ($relevantMemories as $memory) {
            $memory->incrementAccessCount();
        }

        return response()->json(['memories' => $relevantMemories]);
    }
}