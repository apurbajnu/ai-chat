<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Chat Configuration
    |--------------------------------------------------------------------------
    |
    | Configure your AI provider settings here. These values can be set in
    | your .env file and will be used as defaults in the chat interface.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Default AI Provider
    |--------------------------------------------------------------------------
    |
    | The default AI provider to use. Options: 'openai', 'claude', 'custom'
    |
    */
    'default_provider' => env('AI_PROVIDER', 'openai'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI Configuration
    |--------------------------------------------------------------------------
    */
    'openai' => [
        'api_key' => env('OPENAI_API_KEY', ''),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'base_url' => env('OPENAI_BASE_URL', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Claude (Anthropic) Configuration
    |--------------------------------------------------------------------------
    */
    'claude' => [
        'api_key' => env('CLAUDE_API_KEY', ''),
        'model' => env('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
        'base_url' => env('CLAUDE_BASE_URL', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Provider Configuration
    |--------------------------------------------------------------------------
    |
    | For OpenAI-compatible APIs (e.g., Groq, Together AI, local models)
    |
    */
    'custom' => [
        'api_key' => env('CUSTOM_AI_API_KEY', ''),
        'model' => env('CUSTOM_AI_MODEL', 'your-model-id'),
        'base_url' => env('CUSTOM_AI_BASE_URL', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | System Prompt
    |--------------------------------------------------------------------------
    |
    | The system prompt that guides the AI's behavior
    |
    */
    'system_prompt' => env('AI_SYSTEM_PROMPT', 'You are a helpful AI assistant. Keep replies clear and friendly.'),

    /*
    |--------------------------------------------------------------------------
    | Allow User Override
    |--------------------------------------------------------------------------
    |
    | Allow users to override these settings in the UI. Set to false to
    | enforce server-side configuration only.
    |
    */
    'allow_user_override' => env('AI_ALLOW_USER_OVERRIDE', true),
];
