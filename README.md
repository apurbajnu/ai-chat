<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## AI Chat with Memory System

This is an AI chat application built with Laravel and React that includes an advanced memory system allowing the AI to remember important information across conversations.

### Features

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

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## AI Memory System

This application includes an advanced memory system that allows the AI to remember important information across conversations:

- **Automatic Memory Extraction**: The system intelligently identifies and saves important user information
- **Contextual Recall**: Memories are retrieved and provided to the AI during relevant conversations
- **Memory Management**: Users can view, search, and manage their stored memories
- **Thread Association**: Memories are linked to specific conversation threads for better context
- **Memory Categories**: Organizes memories by type (personal, preferences, facts, etc.)

## Setup Instructions

1. Clone the repository
2. Run `composer install` and `npm install`
3. Set up your database and run migrations
4. Configure your AI provider API keys in the .env file
5. Run the application with `php artisan serve` and `npm run dev`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

This AI Chat application with memory system is also licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
