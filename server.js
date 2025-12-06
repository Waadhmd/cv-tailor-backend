// Load environment variables from .env file immediately
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Import the AI SDKs. FIX 1: Corrected casing for GoogleGenAI
const { GoogleGenAI } = require("@google/genai");
const OpenAI = require("openai");

// Initialization
const app = express();
// Note: Changed port to 3001, as React often runs on 3000
const PORT = process.env.PORT || 3001;

// Initialize the AI clients using environment variables
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
// 1. CORS: Allows your React frontend (e.g., on localhost:3000) to talk to the backend.
// Note: Frontend will be on HTTP, not HTTPS, when running locally.
const allowedOrigins = ["http://localhost:3000"];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  // FIX: 'method' should be 'methods' for CORS options
  methods: "POST",
};
app.use(cors(corsOptions));

// 2. Body Parser: allows express to read json data sent in the request body
app.use(express.json());

// API Logic
app.post("/api/tailor", async (req, res) => {
  // FIX 2: Destructure from the request object (req), not res
  const { cv_text, job_description, selected_model } = req.body;

  // simple validation
  if (!cv_text || !job_description || !selected_model) {
    // Provide clear error message for debugging
    return res.status(400).json({
      error:
        "Missing required field: cv_text, job_description, or selected_model.",
    });
  }

  try {
    let tailoredCV;
    // FIX: Corrected typo 'gemeni' to 'gemini' and added 'await'
    if (selected_model === "gemini") {
      console.log("Routing request to Gemini Model");
      tailoredCV = await generateTailorCV_Gemini(cv_text, job_description);
    } else if (selected_model === "openai") {
      console.log("Routing request to OpenAI Model");
      tailoredCV = await generateTailorCV_OpenAI(cv_text, job_description); // FIX: Added await
    } else {
      return res
        .status(400)
        .json({ error: "Invalid model selected: Choose openai or gemini" });
    }

    // Ensure you are sending the result back
    return res.json({ success: true, tailoredCV });
  } catch (error) {
    console.error(`API ERROR: ${error.message}`); // Use console.error for visibility
    res.status(500).json({
      error: "An internal API error occurred while generating the CV",
    });
  }
});

// LLM Specific functions (Remaining code is mostly correct, adjusting a few keys)

async function generateTailorCV_Gemini(cvText, jobDescription) {
  const prompt = `
    You are an expert career consultant. Tailor the following CV to strictly match the provided job description.
    Focus on rephrasing relevant bullet points and ensuring keywords are present, but **do not invent experience**
    
    Job Description:
    ---
    ${jobDescription}
    ---

    Original CV:
    ---
    ${cvText}
    ---
Output the tailored CV in a single, clean markdown block ready for display
    `;
  const response = await geminiClient.models.generateContent({
    model: "gemini-2.5-flash-preview-09-2025",
    // FIX: The key should be 'contents', not 'Contents' (lowercase 'c')
    contents: prompt,
  });
  return response.text;
}

async function generateTailorCV_OpenAI(cv_text, job_description) {
  const response = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    // FIX: The key should be 'messages', not 'message' (plural)
    messages: [
      {
        role: "system",
        content:
          "You are an expert career consultant. Tailor the user's CV to the provided job description. Focus on rephrasing relevant bullet points and ensuring keywords are present, but **do not invent experience**. Output the tailored CV in a single, clean markdown block ready for display. ",
      },
      {
        role: "user",
        content: `Job Description:\n---\n ${job_description}\n--\nOriginal CV:\n---\n${cv_text} `,
      },
    ],
  });
  return response.choices[0].message.content;
}

// Server Startup
app.listen(PORT, () => {
  console.log(`\n🚀 Express server running on http://localhost:${PORT} `);
  console.log(`Backend API endpoint: http://localhost:${PORT}/api/tailor`);
});
