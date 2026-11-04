const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files from repository root
app.use(express.static(__dirname));

// Initialize OpenAI client if key exists
let openai = null;
const apiKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.trim() : null;

if (apiKey) {
    openai = new OpenAI({ apiKey: apiKey });
}

// Fallback / default model setup (uses gpt-4o-mini by default)
const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * GET /api/status
 * Check system connection and OpenAI API configuration status
 */
app.get('/api/status', (req, res) => {
    const isConfigured = Boolean(apiKey);
    return res.status(200).json({
        status: 'ONLINE',
        system: 'JARVIS',
        aiConfigured: isConfigured,
        model: isConfigured ? MODEL_NAME : null,
        message: isConfigured 
            ? 'J.A.R.V.I.S. system core online and ready.' 
            : 'OpenAI API key is missing. Set OPENAI_API_KEY in environment variables.'
    });
});

/**
 * POST /api/chat
 * Handle chat requests and generate responses using OpenAI SDK
 */
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;

    // 1. Input Validation
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
            error: 'INVALID_INPUT',
            message: 'A non-empty message parameter is required.'
        });
    }

    // 2. API Key Check
    if (!openai || !apiKey) {
        return res.status(503).json({
            error: 'API_KEY_MISSING',
            message: 'OpenAI API key is missing. Configure OPENAI_API_KEY on the server.'
        });
    }

    try {
        // Construct conversation array for OpenAI Chat Completions API
        const systemPrompt = {
            role: 'system',
            content: 'You are J.A.R.V.I.S., a highly intelligent, polite, futuristic AI assistant inspired by Iron Man. You provide concise, direct, helpful, and sophisticated answers. Address the user respectfully.'
        };

        const formattedHistory = Array.isArray(history) 
            ? history.map(item => ({
                role: item.role === 'user' ? 'user' : 'assistant',
                content: String(item.content || '')
              }))
            : [];

        const messages = [
            systemPrompt,
            ...formattedHistory,
            { role: 'user', content: message.trim() }
        ];

        // Request completion from OpenAI SDK
        const response = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        });

        const reply = response.choices[0]?.message?.content || 'No response generated.';

        return res.status(200).json({
            reply: reply,
            model: MODEL_NAME,
            usage: response.usage || null
        });

    } catch (error) {
        console.error('OpenAI API Error:', error);

        // Standardized Error Response Handling
        const statusCode = error.status || 500;
        let errorMessage = 'An unexpected error occurred while processing your request.';

        if (error.status === 401) {
            errorMessage = 'Invalid OpenAI API key provided. Please check server environment configuration.';
        } else if (error.status === 429) {
            errorMessage = 'OpenAI rate limit exceeded or insufficient API quota/credits.';
        } else if (error.status === 404) {
            errorMessage = `The requested model (${MODEL_NAME}) was not found or is unsupported for your account key.`;
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
            errorMessage = 'Network error reaching OpenAI servers. Please try again.';
        }

        return res.status(statusCode).json({
            error: error.code || 'OPENAI_ERROR',
            message: errorMessage
        });
    }
});

// Fallback route: serve index.html for root route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Bind to 0.0.0.0 and dynamic environment PORT for Render compatibility
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JARVIS SYSTEM] Server running on http://0.0.0.0:${PORT}`);
});
