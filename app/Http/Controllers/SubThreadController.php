<?php

namespace App\Http\Controllers;

use App\Models\SubThread;
use App\Models\Thread;
use App\Services\MemoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SubThreadController extends Controller
{
    protected $memoryService;

    public function __construct(MemoryService $memoryService)
    {
        $this->memoryService = $memoryService;
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'thread_id' => 'required|integer|exists:threads,id',
        ]);

        $subThreads = SubThread::where('thread_id', $validated['thread_id'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['sub_threads' => $subThreads]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'thread_id' => 'required|integer|exists:threads,id',
            'role' => 'required|in:user,assistant,system',
            'content' => 'required|string',
            'model' => 'nullable|string|max:100',
            'provider' => 'nullable|string|max:50',
            'tokens_used' => 'nullable|integer',
            'cost_usd' => 'nullable|numeric',
        ]);

        $subThread = SubThread::create($validated);

        // Update thread's updated_at timestamp
        Thread::where('id', $validated['thread_id'])->touch();

        // Extract and save memories if this is a user message
        if ($validated['role'] === 'user') {
            $this->processMemoryForMessage($subThread, $validated['thread_id']);
        }

        return response()->json($subThread, 201);
    }

    /**
     * Process memory extraction for a new message
     */
    private function processMemoryForMessage(SubThread $subThread, int $threadId): void
    {
        // Extract potential memory from the user's message
        $memoryData = $this->memoryService->extractMemoryFromConversation(
            $subThread->content,
            Auth::id(),
            $threadId
        );

        if ($memoryData) {
            // Create the memory
            $this->memoryService->createMemory(
                $memoryData,
                Auth::id(),
                $threadId,
                $subThread->id
            );
        }
    }

    public function destroy($id)
    {
        $subThread = SubThread::findOrFail($id);
        $subThread->delete();

        return response()->json([
            'success' => true,
            'deleted' => 1
        ]);
    }
}
