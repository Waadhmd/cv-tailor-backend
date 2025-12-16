// Load environment variables from .env file immediately
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Import the AI SDKs.
const { GoogleGenAI } = require("@google/genai");
const OpenAI = require("openai");

// Initialization
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize the AI clients using environment variables
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
// 1. CORS: Allows React frontend to talk to the backend.
// Note: Frontend will be on HTTP, not HTTPS, when running locally.
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173/",
  "http://localhost:5173",
  "https://cv-tailor-frontend.onrender.com",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },

  methods: "POST",
};
app.use(cors(corsOptions));

// 2. Body Parser: allows express to read json data sent in the request body
app.use(express.json());

// API Logic
app.post("/api/tailor", async (req, res) => {
  const { cv_text, job_description, selected_model } = req.body;

  // simple validation
  if (!cv_text || !job_description || !selected_model) {
    return res.status(400).json({
      error:
        "Missing required field: cv_text, job_description, or selected_model.",
    });
  }

  try {
    let tailoredCV_json_string;

    if (selected_model === "gemini") {
      console.log("Routing request to Gemini Model");
      tailoredCV_json_string = await generateTailorCV_Gemini(
        cv_text,
        job_description
      );
    } else if (selected_model === "openai") {
      console.log("Routing request to OpenAI Model");
      tailoredCV_json_string = await generateTailorCV_OpenAI(
        cv_text,
        job_description
      );
    } else {
      return res
        .status(400)
        .json({ error: "Invalid model selected: Choose openai or gemini" });
    }
    let tailored_cv_object;
    try {
      const cleaned_string = tailoredCV_json_string.trim();
      tailored_cv_object = JSON.parse(tailoredCV_json_string);
    } catch (e) {
      console.error(
        "Failed to parse AI output as json",
        e.message,
        "Raw output:",
        tailoredCV_json_string
      );
      return res.status(500).json({
        error:
          "AI output was not a valid JSON, please try again with a simpler prompt!",
      });
    }

    return res.json({ success: true, tailored_cv_object });
  } catch (error) {
    console.error(`API ERROR: ${error.message}`); // console.error for visibility
    res.status(500).json({
      error: "An internal API error occurred while generating the CV",
    });
  }
});

// LLM Specific functions (Remaining code is mostly correct, adjusting a few keys)

async function generateTailorCV_Gemini(cvText, jobDescription) {
  const prompt1 = `
    You are an expert career consultant. Your task is to analyze the user's master CV and the job description (JD) and generate a **tailored CV in a strict JSON format**.

    **CRITICAL INSTRUCTION:**
    1. The output MUST be a single, valid JSON object, and NOTHING ELSE. Do not include any conversational text, notes, or markdown fences (like \`\`\`).
    2. All descriptive fields (summary, experience descriptions, education descriptions) must be formatted using **Markdown** *within* the JSON string values.

    ---
    **JSON Schema to Follow:**
    {
      "personalInfo": {
        "name": "Full Name",
        "title": "Tailored Job Title",
        "email": "email@example.com",
        "phone": "+X (XXX) XXX-XXXX",
        "linkedin": "linkedin.com/in/profile",
        "location": "City, Country"
      },
      "summary": "A tailored professional summary (MUST be in Markdown format).",
      "education": [
        { 
          "degree": "Degree/Program Name", 
          "university": "Institution Name", 
          "years": "Start - End", 
          "description": "Relevant details as a bulleted list (MUST be in Markdown format)." 
        }
      ],
      "experience": [
        { 
          "title": "Job Title", 
          "company": "Company Name", 
          "years": "Start - End", 
          "description": "Tailored achievement bullet points (MUST be in Markdown format)." 
        }
      ],
      "skills": { 
         "Frontend": ["JavaScript (ES6+)", "React", "Next.js"],
         "Backend": ["Node.js", "Python"],
         "Tools & Dev Ops": ["Git", "Jira", "Postman"],
         "Tools & Dev Ops": ["Git", "Jira", "Postman"],
         "Soft Skills": ["Problem Solving", "Collaboration"]
    },
      "languages": ["Language 1", "Language 2"]
    }
    ---

    Job Description:
    ---
    ${jobDescription}
    ---

    Original CV Content:
    ---
    ${cvText}
    ---
    
    **Generate the JSON object now.**
    `;
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

    contents: prompt1,
  });
  return response.text;
}

async function generateTailorCV_OpenAI(cv_text, job_description) {
  const response = await openaiClient.responses.create({
    //model: "gpt-3.5-turbo",  openaiClient.chat.completions.create
    model: "gpt-5-nano",
    input: `
    You are an expert career consultant. Your task is to analyze the user's master CV and the job description (JD) and generate a **tailored CV in a strict JSON format**.

    **CRITICAL INSTRUCTION:**
    1. The output MUST be a single, valid JSON object, and NOTHING ELSE. Do not include any conversational text, notes, or markdown fences (like \`\`\`).
    2. All descriptive fields (summary, experience descriptions, education descriptions) must be formatted using **Markdown** *within* the JSON string values.

    ---
    **JSON Schema to Follow:**
    {
      "personalInfo": {
        "name": "Full Name",
        "title": "Tailored Job Title",
        "email": "email@example.com",
        "phone": "+X (XXX) XXX-XXXX",
        "linkedin": "linkedin.com/in/profile",
        "location": "City, Country"
      },
      "summary": "A tailored professional summary (MUST be in Markdown format).",
      "education": [
        { 
          "degree": "Degree/Program Name", 
          "university": "Institution Name", 
          "years": "Start - End", 
          "description": "Relevant details as a bulleted list (MUST be in Markdown format)." 
        }
      ],
      "experience": [
        { 
          "title": "Job Title", 
          "company": "Company Name", 
          "years": "Start - End", 
          "description": "Tailored achievement bullet points (MUST be in Markdown format)." 
        }
      ],
      "skills": { 
         "Frontend": ["JavaScript (ES6+)", "React", "Next.js"],
         "Backend": ["Node.js", "Python"],
         "Tools & Dev Ops": ["Git", "Jira", "Postman"],
         "Tools & Dev Ops": ["Git", "Jira", "Postman"],
         "Soft Skills": ["Problem Solving", "Collaboration"]
    },
      "languages": ["Language 1", "Language 2"]
    }
    ---

    Job Description:
    ---
    ${job_description}
    ---

    Original CV Content:
    ---
    ${cv_text}
    ---
    
    **Generate the JSON object now.**
    `,
    /*messages: [
      {
        role: "system",
        content:
          "You are an expert career consultant. Tailor the user's CV to the provided job description. Focus on rephrasing relevant bullet points and ensuring keywords are present, but **do not invent experience**. Output the tailored CV in a single, clean markdown block ready for display. ",
      },
      {
        role: "user",
        content: `Job Description:\n---\n ${job_description}\n--\nOriginal CV:\n---\n${cv_text} `,
      },
    ],*/
  });
  return response.choices[0].message.content;
}

// Server Startup
app.listen(PORT, () => {
  console.log(`\n🚀 Express server running on http://localhost:${PORT} `);
  console.log(`Backend API endpoint: http://localhost:${PORT}/api/tailor`);
});
