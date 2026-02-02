# AI Chat with Memory System

An advanced AI chat application built with Laravel and React that includes an intelligent memory system allowing the AI to remember important information across conversations.

## Features

- **Multi-AI Provider Support**: Supports OpenAI, Claude, and custom OpenAI-compatible APIs
- **Conversation Threading**: Maintains chat history in threads with sub-messages
- **Usage Tracking**: Tracks token usage and estimated costs
- **Persistent Storage**: Saves conversations to the database
- **Advanced Memory System**:
  - Automatic memory extraction from user messages
  - Contextual recall during conversations
  - Memory management interface
  - Thread association for better context
  - Memory categorization (personal, preferences, facts, etc.)
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## AI Memory System

This application includes an advanced memory system that allows the AI to remember important information across conversations:

- **Automatic Memory Extraction**: The system intelligently identifies and saves important user information
- **Contextual Recall**: Memories are retrieved and provided to the AI during relevant conversations
- **Memory Management**: Users can view, search, and manage their stored memories
- **Thread Association**: Memories are linked to specific conversation threads for better context
- **Memory Categories**: Organizes memories by type (personal, preferences, facts, etc.)

## Tech Stack

- **Backend**: Laravel PHP Framework
- **Frontend**: React with Inertia.js
- **Database**: MySQL/PostgreSQL with Eloquent ORM
- **Styling**: Tailwind CSS
- **Authentication**: Laravel Breeze with Tyro-Login
- **Real-time**: Built-in session management

## Setup Instructions

1. Clone the repository
   ```bash
   git clone https://github.com/apurbajnu/ai-chat.git
   cd ai-chat
   ```

2. Install PHP dependencies
   ```bash
   composer install
   ```

3. Install Node.js dependencies
   ```bash
   npm install
   ```

4. Copy the environment file and set your configurations
   ```bash
   cp .env.example .env
   ```

5. Generate application key
   ```bash
   php artisan key:generate
   ```

6. Set up your database and run migrations
   ```bash
   php artisan migrate
   ```

7. Configure your AI provider API keys in the `.env` file:
   ```
   OPENAI_API_KEY=your-openai-api-key
   CLAUDE_API_KEY=your-claude-api-key
   CUSTOM_AI_API_KEY=your-custom-provider-api-key
   ```

8. Build frontend assets
   ```bash
   npm run build
   # or for development
   npm run dev
   ```

9. Start the development server
   ```bash
   php artisan serve
   ```

10. Access the application at `http://localhost:8000`

## Configuration

The application supports multiple AI providers through configuration:

- **OpenAI**: Set `AI_PROVIDER=openai` and provide `OPENAI_API_KEY`
- **Claude (Anthropic)**: Set `AI_PROVIDER=claude` and provide `CLAUDE_API_KEY`
- **Custom Provider**: Set `AI_PROVIDER=custom` and provide `CUSTOM_AI_API_KEY` along with `CUSTOM_AI_BASE_URL`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This AI Chat application with memory system is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with the Laravel PHP framework
- Frontend powered by React and Inertia.js
- Styled with Tailwind CSS
