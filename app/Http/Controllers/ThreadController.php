<?php

namespace App\Http\Controllers;

use App\Models\Thread;
use Illuminate\Http\Request;

class ThreadController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->get('limit', 50);

        $threads = Thread::withCount('subThreads as message_count')
            ->with(['subThreads' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($thread) {
                $lastMessage = $thread->subThreads->first();
                $thread->last_message_at = $lastMessage ? $lastMessage->created_at : $thread->updated_at;
                unset($thread->sub_threads);
                return $thread;
            });

        return response()->json(['threads' => $threads]);
    }

    public function show($id)
    {
        $thread = Thread::with('subThreads')->findOrFail($id);

        return response()->json($thread);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'first_message' => 'required|string',
        ]);

        $thread = Thread::create($validated);

        return response()->json($thread, 201);
    }

    public function update(Request $request, $id)
    {
        $thread = Thread::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
        ]);

        $thread->update($validated);

        return response()->json([
            'success' => true,
            'updated' => 1
        ]);
    }

    public function destroy($id)
    {
        $thread = Thread::findOrFail($id);
        $thread->delete();

        return response()->json([
            'success' => true,
            'deleted' => 1
        ]);
    }
}
