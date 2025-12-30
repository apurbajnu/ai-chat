<?php

namespace App\Http\Controllers;

use App\Models\SubThread;
use App\Models\Thread;
use Illuminate\Http\Request;

class SubThreadController extends Controller
{
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

        return response()->json($subThread, 201);
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
