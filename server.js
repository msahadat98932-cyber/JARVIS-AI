const express = require("express");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// OpenAI setup
const client = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    : null;

const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

// Middleware
app.use(express.json({ limit: "50kb" }));

// Serve homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Check server status
app.get("/api/status", (req, res) => {
    res.json({
        status: "ONLINE",
        system: "JARVIS",
        aiConfigured: Boolean(client),
        message: client
            ? "JARVIS AI is ready"
            : "OpenAI API key is missing"
    });
});

// AI chat endpoint
app.post("/api/chat", async (req, res) => {
    try {
        if (!client) {
            return res.status(503).json({
                error: "OpenAI API key is missing. Configure OPENAI_API_KEY in Render."
            });
        }

        const messages = req.body?.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Please provide a valid message."
            });
        }

        const validMessages = messages
            .slice(-12)
            .filter(message =>
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string" &&
                message.content.trim().length > 0 &&
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
                "You are J.A.R.V.I.S., an intelligent, helpful AI assistant. " +
                "Respond clearly, naturally and professionally.",
            input: validMessages,
            max_output_tokens: 1000
        });

        res.json({
            reply: response.output_text || "No response generated."
        });

    } catch (error) {
        console.error("OPENAI ERROR:", error.message);

        res.status(500).json({
            error: "AI request failed. Check your OpenAI API settings and Render logs."
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

// Error handler
app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.message);

    res.status(err.status || 500).json({
        error: "Server error."
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log("==============================");
    console.log("J.A.R.V.I.S. ONLINE");
    console.log("Port:", PORT);
    console.log("AI configured:", Boolean(client));
    console.log("==============================");
});