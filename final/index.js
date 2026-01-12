require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const RESULTS_DIR = path.join(__dirname, "results");
const RESULTS_FILE = path.join(RESULTS_DIR, "all-results.json");

// Ensure results folder exists
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR);

// Helper: name match (case-insensitive)
function isNameMatch(searchName, resultName) {
  return resultName.toLowerCase().includes(searchName.toLowerCase());
}

// Helper: Save results safely

function saveResult(data) {
  let existing = [];
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      const content = fs.readFileSync(RESULTS_FILE, "utf8");
      existing = content ? JSON.parse(content) : [];
    }
  } catch (err) {
    console.warn("Existing file is corrupted, creating a new one.");
    existing = [];
  }

  existing.push(data);

  try {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error("Error writing results:", err.message);
  }
}

// Main POST route
app.post("/check-business", async (req, res) => {
  const { name, location } = req.body;

  const responseData = {
    checkedAt: new Date().toISOString(),
    query: { name, location },
    google: { found: false, businesses: [] },
    yelp: { found: false, businesses: [] },
    bing: { found: false, businesses: [] },
  };

  // --- Google Places ---
  try {
    if (process.env.GOOGLE_API_KEY) {
      const googleResp = await axios.get(
        "https://maps.googleapis.com/maps/api/place/textsearch/json",
        {
          params: {
            query: `${name} ${location}`,
            key: process.env.GOOGLE_API_KEY,
          },
        }
      );

      const results = googleResp.data.results || [];
      const matched = results.filter((b) => isNameMatch(name, b.name));

      responseData.google.businesses = matched.map((b) => ({
        name: b.name,
        address: b.formatted_address,
        rating: b.rating || null,
        place_id: b.place_id,
      }));
      if (matched.length) responseData.google.found = true;
    }
  } catch (err) {
    responseData.google.error = err.response?.data || err.message;
  }

  // --- Yelp ---
  try {
    if (process.env.YELP_API_KEY) {
      const yelpResp = await axios.get(
        "https://api.yelp.com/v3/businesses/search",
        {
          headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` },
          params: { term: name, location, limit: 10 },
        }
      );

      const businesses = yelpResp.data.businesses || [];
      responseData.yelp.businesses = businesses.map((b) => ({
        name: b.name,
        address: b.location.address1 + ", " + b.location.city,
        rating: b.rating,
        phone: b.display_phone,
      }));
      if (businesses.length) responseData.yelp.found = true;
    }
  } catch (err) {
    responseData.yelp.error = err.response?.data || err.message;
  }

  // --- Bing / Azure Maps ---
  try {
    if (process.env.AZURE_MAPS_KEY) {
      const bingResp = await axios.get(
        "https://atlas.microsoft.com/search/poi/json",
        {
          headers: { "subscription-key": process.env.AZURE_MAPS_KEY },
          params: {
            "api-version": "1.0",
            query: `${name} ${location}`,
            limit: 10,
          },
        }
      );

      const results = bingResp.data.results || [];
      const matched = results.filter(
        (b) => b.poi?.name && isNameMatch(name, b.poi.name)
      );

      responseData.bing.businesses = matched.map((b) => ({
        name: b.poi.name,
        address: b.address?.freeformAddress || null,
        phone: b.poi.phone || null,
        categories: b.poi.categories || [],
        position: b.position || null,
      }));
      if (matched.length) responseData.bing.found = true;
    }
  } catch (err) {
    responseData.bing.error = err.response?.data || err.message;
  }

  // --- Save result to JSON file ---
  //saveResult(responseData);

  res.json(responseData);
});

app.listen(PORT, () => {
  console.log(`Business checker running on http://localhost:${PORT}`);
});
