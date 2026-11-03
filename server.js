const express = require("express");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "50kb" }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Server status
app.get("/api/status", (req, res) => {
    res.json({
        status: "ONLINE",
        system: "JARVIS",
        message: "All systems operational"
    });
});

// AI chat
app.post("/api/chat", async (req, res) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                error: "OpenAI API key is missing."
            });
        }

        const messages = req.body.messages;

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

        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-6-luna",
            instructions:
                "You are J.A.R.V.I.S., an intelligent and helpful AI assistant. " +
                "Respond naturally, clearly and professionally.",
            input: validMessages,
            max_output_tokens: 1000
        });

        res.json({
            reply: response.output_text || "No response generated."
        });

    } catch (error) {
        console.error("OPENAI ERROR:", error.message);

        res.status(500).json({
            error: "AI request failed. Check your API settings and server logs."
        });
    }
});

// Unknown API route
app.use("/api", (req, res) => {
    res.status(404).json({
        error: "API route not found."
    });
});

// Unknown page
app.use((req, res) => {
    res.status(404).send("Page not found.");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("JARVIS running on port " + PORT);
});