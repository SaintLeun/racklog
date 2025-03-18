const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import the cors middleware
const app = express();

const BEARER_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImE0N2UxM2U5NWU0YWUxMWMwMGUwN2E0MmQwNzEwZmMyOGJkODhkOTgxZWFkM2YyYTYzNTgwNzc1NDZjODE0MmNjNDNkZWY0MjU0N2MyZTA4In0.eyJhdWQiOiIwNWQzMDEzMS1kN2FlLTQ2YzItOTRhZi1hYzY5NjEwNmQ1NWEiLCJqdGkiOiJhNDdlMTNlOTVlNGFlMTFjMDBlMDdhNDJkMDcxMGZjMjhiZDg4ZDk4MWVhZDNmMmE2MzU4MDc3NTQ2YzgxNDJjYzQzZGVmNDI1NDdjMmUwOCIsImlhdCI6MTc0MjI1NTg5MCwibmJmIjoxNzQyMjU1ODkwLCJleHAiOjE4MzYzNDU2MDAsInN1YiI6IjExOTAwNzM1IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMzNDQ1ODcxLCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiNWMzMGJkNmMtMjYzNi00OGU2LWFmZTUtODUxMTUzOWNkYzIzIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.czc24u711uQmHrH1C1r5wwstFbQlsMHoG1WFpWVO0egm2LNJJ9G9_GDF9mLPr47zaXMlJZG9AEf8Z0FNzKJ29ty80O5oxigABjg9BTyffD9EQKKsNVPuhuGnICxbzIPeQPpinFlW_XJApOLEg7FE9V3VTlG0agpIuL7sleJrHSWwMiFLYi5_IRDeV1tGd2fSnzenxlZAlFHsEAEch07PFXpO_QND1nvcjcH1IBozRdiG4TNHK0Rpbg5m5miAgycv2YZyEotTYkgNVtH8Go3SolQYyG4eoR2EvunwALmBtJqhuC9kVePc4YQ8n93chA5Zxb5tJ1pBZNinEh7YzWsUiw';
// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: ['GET', 'POST'], // Allow specific HTTP methods
  }));

// Define the /api/kommo-data route
app.get('/api/kommo-data', async (req, res) => {
  try {
    const response = await axios.get('https://comercialracklogcl.kommo.com/api/v4/catalogs', {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Kommo data:', error);
    res.status(500).send('Error fetching data');
  }
});

// Define the /api/angulo-ranurado-list route
app.get('/api/angulo-ranurado-list', async (req, res) => {
  try {
    const response = await axios.get('https://comercialracklogcl.kommo.com/api/v4/catalogs/31484/elements', {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Kommo data2:', error);
    res.status(500).send('Error fetching data2');
  }
});

// Default route to check if the server is running
app.get('/', (req, res) => {
  res.send('It works!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});