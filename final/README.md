# 📍 Business Listing Lookup API
### Google Places • Bing Places • Yelp Fusion

---

## 📌 Overview

This project provides a unified **business lookup API** that checks whether a business exists across **Google**, **Bing**, and **Yelp** using their official APIs.
It is useful for:
- Verifying business presence
- Comparing listings across platforms
- Identifying missing listings for outreach or SEO services

---

## 🧱 Tech Stack

- **Node.js**
- **Express.js**
- **Axios** (API calls)
- **dotenv** (environment variables)

---

## 🌍 Supported Platforms

| Platform | API | Coverage |
|--------|-----|----------|
| Google | Places Text Search API | Excellent (India & global) |
| Bing | Bing Places / Local Search | Owner-based |
| Yelp | Yelp Fusion API | Limited in India |

---

## 📂 Project Structure

```
project-root/
│
├── index.js
├── .env
├── results/
│   └── google-results.json
├── package.json
└── README.md
```

---

## 🔐 Environment Setup

Create a `.env` file in the root directory:

```env
GOOGLE_API_KEY=your_google_api_key
BING_API_KEY=your_bing_maps_key
YELP_API_KEY=your_yelp_fusion_key
```

---

## ▶️ Running the Project

```bash
npm install
node index.js
```

Server will start at:
```
http://localhost:3000
```

---

## 🔗 API Endpoint

### `POST /check-business`

#### Request Body

```json
{
  "name": "Starbucks",
  "location": "Delhi"
}
```

---

## ☕ Google Places Integration

### API Used
- Google Places **Text Search API**

### Endpoint
```
https://maps.googleapis.com/maps/api/place/textsearch/json
```

### Sample cURL

```bash
curl "https://maps.googleapis.com/maps/api/place/textsearch/json?query=Starbucks+Delhi&key=GOOGLE_API_KEY"
```

### Notes
- Returns multiple branches
- Includes ratings and addresses
- Best data source for India

---

## 🟦 Bing Places Integration

### API Used
- Bing Maps Local Search

### Endpoint
```
https://dev.virtualearth.net/REST/v1/LocalSearch/
```

### Sample cURL

```bash
curl "https://dev.virtualearth.net/REST/v1/LocalSearch/?query=Starbucks&userLocation=Delhi&key=BING_API_KEY"
```

### ⚠ Important
- Bing Places is **mainly for business owners**
- Many businesses may not appear
- Empty results are expected in most cases

---

## 🟥 Yelp Fusion Integration

### API Used
- Yelp Fusion Business Search API

### Endpoint
```
https://api.yelp.com/v3/businesses/search
```

### Sample cURL

```bash
curl -X GET "https://api.yelp.com/v3/businesses/search?term=Starbucks&location=Delhi" \
  -H "Authorization: Bearer YELP_API_KEY"
```

### Notes
- Strong in US & Europe
- Limited listings in India

---

## 📦 Sample API Response

```json
{
  "found": true,
  "name": "Starbucks",
  "location": "Delhi",
  "google": [
    {
      "name": "Starbucks",
      "address": "Connaught Place, New Delhi",
      "rating": 4.3
    }
  ],
  "bing": [],
  "yelp": [],
  "checkedAt": "2025-12-23T06:34:28.378Z"
}
```

---

## 📊 Result Interpretation

| Scenario | Meaning |
|-------|--------|
| Google results present | Business exists publicly |
| Bing empty | Not owner-verified |
| Yelp empty | Not listed in region |
| found = true | Found on at least one platform |

---

## 🚧 Known Limitations

- Bing requires ownership verification
- Yelp has poor India coverage
- API rate limits apply

---

## 🚀 Use Cases

- Local SEO audits
- Business verification tools
- Lead generation platforms
- Market research

---

## 🔮 Future Enhancements

- Auto-listing submission
- Dashboard UI
- Country-based API optimization
- Duplicate listing detection

---

## ✅ Conclusion

This API provides a reliable way to check business presence across major platforms while handling real-world API limitations gracefully.

---

**Author:** Ashif Khan  
**Status:** Production-ready ✅

