<?php

namespace App\Services;

use App\Models\Memory;
use App\Models\Thread;
use App\Models\SubThread;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MemoryService
{
    /**
     * Extract important information from a conversation to create a memory
     */
    public function extractMemoryFromConversation(string $content, int $userId, ?int $threadId = null): ?array
    {
        // Simple heuristic to identify if content contains memorable information
        // In a real implementation, you might use an LLM to determine importance
        $memoryKeywords = [
            'my name is', 'I am ', 'I live in', 'I like', 'I enjoy', 'I prefer', 
            'my birthday', 'my age', 'my job', 'my work', 'I work at', 'I studied',
            'my hobby', 'my interest', 'I remember', 'I want', 'I need', 'I prefer',
            'important', 'remember', 'note', 'keep in mind', 'recall', 'remind me'
        ];
        
        $lowerContent = strtolower($content);
        $containsKeyword = false;
        
        foreach ($memoryKeywords as $keyword) {
            if (strpos($lowerContent, $keyword) !== false) {
                $containsKeyword = true;
                break;
            }
        }
        
        // Also check for personal information patterns
        $personalPatterns = [
            '/my name is ([^.!?]+)/i',
            '/i am ([^.!?]+)/i',
            '/i\'?m ([^.!?]+)/i',
            '/i live in ([^.!?]+)/i',
            '/i like ([^.!?]+)/i',
            '/i enjoy ([^.!?]+)/i',
            '/i prefer ([^.!?]+)/i',
            '/my (?:birthday|birth date) is ([^.!?]+)/i',
            '/i (?:was born|born) ([^.!?]+)/i',
            '/i work at ([^.!?]+)/i',
            '/i studied ([^.!?]+)/i',
            '/my hobby is ([^.!?]+)/i',
            '/my interests? include ([^.!?]+)/i',
        ];
        
        $matches = [];
        foreach ($personalPatterns as $pattern) {
            if (preg_match($pattern, $content, $match)) {
                $containsKeyword = true;
                $matches[] = trim($match[1]);
            }
        }
        
        if (!$containsKeyword) {
            return null;
        }
        
        // Create a meaningful title for the memory
        $title = $this->generateMemoryTitle($content, $matches);
        
        // Extract the most relevant part of the content for the memory
        $memoryContent = $this->extractRelevantContent($content, $matches);
        
        return [
            'title' => $title,
            'content' => $memoryContent,
            'category' => $this->categorizeMemory($content, $matches)
        ];
    }
    
    /**
     * Generate a title for the memory based on its content
     */
    private function generateMemoryTitle(string $content, array $matches): string
    {
        if (!empty($matches)) {
            $firstMatch = $matches[0];
            // Clean up the match to make a good title
            $cleanMatch = preg_replace('/^is |^are |^was |^were /i', '', $firstMatch);
            $cleanMatch = trim($cleanMatch);
            
            if (strlen($cleanMatch) > 50) {
                $cleanMatch = substr($cleanMatch, 0, 47) . '...';
            }
            
            return ucfirst($cleanMatch);
        }
        
        // Fallback: use first 50 chars of content
        $words = explode(' ', $content);
        $title = implode(' ', array_slice($words, 0, 8));
        
        if (strlen($title) > 50) {
            $title = substr($title, 0, 47) . '...';
        }
        
        return ucfirst(trim($title));
    }
    
    /**
     * Extract the most relevant part of the content for the memory
     */
    private function extractRelevantContent(string $content, array $matches): string
    {
        if (!empty($matches)) {
            // Return the sentence containing the first match
            foreach ($matches as $match) {
                $pos = stripos($content, $match);
                if ($pos !== false) {
                    // Find the sentence containing this match
                    $start = strrpos(substr($content, 0, $pos), '.') ?: 0;
                    $end = strpos($content, '.', $pos) ?: strlen($content);
                    
                    if ($start > 0) $start += 1; // Skip the period
                    
                    $sentence = trim(substr($content, $start, $end - $start));
                    return $sentence ?: $match;
                }
            }
        }
        
        return $content;
    }
    
    /**
     * Categorize the memory based on its content
     */
    private function categorizeMemory(string $content, array $matches): string
    {
        $lowerContent = strtolower($content);
        
        if (strpos($lowerContent, 'name') !== false) return 'personal';
        if (strpos($lowerContent, 'live') !== false || strpos($lowerContent, 'location') !== false) return 'location';
        if (strpos($lowerContent, 'job') !== false || strpos($lowerContent, 'work') !== false || strpos($lowerContent, 'career') !== false) return 'professional';
        if (strpos($lowerContent, 'like') !== false || strpos($lowerContent, 'enjoy') !== false || strpos($lowerContent, 'hobby') !== false) return 'interests';
        if (strpos($lowerContent, 'birthday') !== false || strpos($lowerContent, 'age') !== false) return 'personal';
        if (strpos($lowerContent, 'study') !== false || strpos($lowerContent, 'education') !== false) return 'education';
        if (strpos($lowerContent, 'preference') !== false || strpos($lowerContent, 'prefer') !== false) return 'preferences';
        
        return 'general';
    }
    
    /**
     * Create a memory from extracted information
     */
    public function createMemory(array $memoryData, int $userId, ?int $threadId = null, ?int $subThreadId = null): ?Memory
    {
        $memory = Memory::create([
            'user_id' => $userId,
            'title' => $memoryData['title'],
            'content' => $memoryData['content'],
            'category' => $memoryData['category'],
            'metadata' => [
                'created_from_thread' => $threadId,
                'created_from_sub_thread' => $subThreadId,
                'importance_score' => 0.5, // Default medium importance
            ],
            'is_active' => true,
        ]);
        
        // Link to thread if provided
        if ($threadId) {
            $thread = Thread::find($threadId);
            if ($thread) {
                $memory->threads()->attach($thread, [
                    'sub_thread_id' => $subThreadId
                ]);
            }
        }
        
        return $memory;
    }
    
    /**
     * Retrieve relevant memories for a conversation
     */
    public function getRelevantMemories(int $userId, string $query, int $limit = 5): array
    {
        // First, try to find memories that match the query
        $memories = Memory::where('user_id', $userId)
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('content', 'LIKE', "%{$query}%");
            })
            ->orderByDesc('access_count') // Prioritize frequently accessed memories
            ->orderByDesc('updated_at')   // Then by recency
            ->limit($limit)
            ->get();
        
        return $memories->toArray();
    }
    
    /**
     * Get recent memories for a user
     */
    public function getRecentMemories(int $userId, int $limit = 5): array
    {
        $memories = Memory::where('user_id', $userId)
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get();
        
        return $memories->toArray();
    }
    
    /**
     * Format memories for inclusion in AI context
     */
    public function formatMemoriesForContext(array $memories): string
    {
        if (empty($memories)) {
            return '';
        }
        
        $formatted = "RELEVANT USER MEMORIES:\n";
        $formatted .= "------------------------\n\n";
        
        foreach ($memories as $memory) {
            $formatted .= "Category: {$memory['category']}\n";
            $formatted .= "Title: {$memory['title']}\n";
            $formatted .= "Content: {$memory['content']}\n";
            $formatted .= "Last Updated: " . (isset($memory['updated_at']) ? date('Y-m-d H:i:s', strtotime($memory['updated_at'])) : 'Unknown') . "\n";
            $formatted .= "Access Count: {$memory['access_count']}\n";
            $formatted .= "---\n";
        }
        
        return $formatted;
    }
}