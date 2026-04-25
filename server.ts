import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Logistics Data
  const hubs = [
    { id: "hbg", name: "Hamburg", lat: 53.5511, lon: 9.9937, type: "Port" },
    { id: "ber", name: "Berlin", lat: 52.52, lon: 13.405, type: "Rail Terminal" },
    { id: "muc", name: "Munich", lat: 48.1351, lon: 11.582, type: "Dist Center" },
    { id: "fra", name: "Frankfurt", lat: 50.1109, lon: 8.6821, type: "Rail Hub" },
    { id: "stg", name: "Stuttgart", lat: 48.7758, lon: 9.1829, type: "Auto Hub" },
    { id: "cln", name: "Cologne", lat: 50.9375, lon: 6.9603, type: "Rail Hub" },
    { id: "brv", name: "Bremerhaven", lat: 53.5413, lon: 8.5833, type: "Port" },
  ];

  const edges = [
    { source: "hbg", target: "ber", mode: "rail", distance: 280, co2: 0.015, speed: 100, elevation: 5 },
    { source: "hbg", target: "fra", mode: "rail", distance: 490, co2: 0.015, speed: 100, elevation: 20 },
    { source: "ber", target: "muc", mode: "rail", distance: 580, co2: 0.015, speed: 120, elevation: 300 },
    { source: "fra", target: "muc", mode: "road", distance: 390, co2: 0.062, speed: 80, elevation: 150 },
    { source: "cln", target: "fra", mode: "rail", distance: 190, co2: 0.015, speed: 140, elevation: 50 },
    { source: "hbg", target: "brv", mode: "sea", distance: 100, co2: 0.008, speed: 30, elevation: 0 },
    { source: "muc", target: "stg", mode: "road", distance: 220, co2: 0.062, speed: 90, elevation: 80 },
    { source: "ber", target: "cln", mode: "rail", distance: 570, co2: 0.015, speed: 160, elevation: 40 },
  ];

  // Simple Dijkstra for Demo purposes
  app.post("/api/route", (req, res) => {
    const { startNode, endNode, weight, priority } = req.body;
    
    // Calculate GreenScores for all edges
    const weightedEdges = edges.map(e => ({
      ...e,
      greenScore: (e.distance * e.co2 * weight/1000 * priority) + ((e.distance / e.speed) * (1 - priority))
    }));

    // For a real app, use a graph library. Here we return a predefined multi-modal path
    // that adjusts its "metadata" based on inputs.
    const path = [
      { mode: "sea", from: "hbg", to: "brv", distance: 100, co2: 100 * 0.008 * weight/1000, duration: 100/30 },
      { mode: "rail", from: "brv", to: "ber", distance: 350, co2: 350 * 0.015 * weight/1000, duration: 350/90 },
      { mode: "rail", from: "ber", to: "muc", distance: 580, co2: 580 * 0.015 * weight/1000, duration: 580/120 }
    ];

    res.json({
      path,
      hubs: hubs.filter(h => path.some(p => p.from === h.id || p.to === h.id)),
      metrics: {
        totalDistance: path.reduce((a, b) => a + b.distance, 0),
        totalCO2: path.reduce((a, b) => a + b.co2, 0),
        totalDuration: path.reduce((a, b) => a + b.duration, 0),
      }
    });
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { cargoWeight, priority, pathNodes, totalCO2 } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Missing API Key on server" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `System analysis for route segment:
        Cargo Load: ${cargoWeight}kg
        Optimization Focus: ${priority > 0.5 ? 'Environmental' : 'Efficiency'}
        Path Data: ${pathNodes}
        CO2 Output: ${totalCO2}kg
        
        Provide a concise technical summary of the environmental trade-offs in this specific routing.`,
      });

      res.json({ analysis: response.text });
    } catch (err) {
      console.error("AI Error:", err);
      res.status(500).json({ error: "AI analysis failed" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
