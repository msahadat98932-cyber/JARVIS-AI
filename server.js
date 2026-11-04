const express = require("express");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// OpenAI configuration
const client = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    : null;

const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

// Middleware
app.use(express.json({ limit: "50kb" }));

// Homepage: index.html is in the root folder
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Also support /index.html
app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Backend status
app.get("/api/status", (req, res) => {
    res.status(200).json({
        status: "ONLINE",
        system: "JARVIS",
        aiConfigured: Boolean(client),
        message: "JARVIS server is running"
    });
});

// AI chat
app.post("/api/chat", async (req, res) => {
    try {
        if (!client) {
            return res.status(503).json({
                error: "OpenAI API key is not configured."
            });
        }

        const messages = req.body?.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Invalid messages."
            });
        }

        const validMessages = messages
            .slice(-12)
            .filter(message =>
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string" &&
                message.content.length > 0 &&
                message.content.length <= 5000
            );

        if (
            validMessages.length === 0 ||
            validMessages[validMessages.length - 1].role !== "user"
        ) {
            return res.status(400).json({
                error: "A valid user message is required."
            });
        }

        const response = await client.responses.create({
            model: MODEL,
            instructions:
                "You are J.A.R.V.I.S., an intelligent and helpful AI assistant. " +
                "Respond naturally, clearly and professionally.",
            input: validMessages,
            max_output_tokens: 1000
        });

        res.status(200).json({
            reply: response.output_text || "No response generated."
        });

    } catch (error) {
        console.error("OPENAI ERROR:", error.message);

        res.status(500).json({
            error: "AI request failed. Check your API settings and server logs."
        });
    }
});

// Unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({
        error: "API route not found."
    });
});

// Unknown pages
app.use((req, res) => {
    res.status(404).send("Page not found.");
});

// Handle JSON parsing and other errors
app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.message);

    res.status(err.status || 500).json({
        error: "Server error. Check the server logs."
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log("================================");
    console.log("J.A.R.V.I.S. SERVER ONLINE");
    console.log("Port:", PORT);
    console.log("AI configured:", Boolean(client));
    console.log("================================");
});