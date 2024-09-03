const express = require('express');
const fs = require('fs');
const https = require('https');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors({
  origin: '*'
}));

app.use(express.json());

let dictionaries = [];

// Rarka abwaannada
try {
  const data = fs.readFileSync('dictionaries.json', 'utf8');
  dictionaries = JSON.parse(data).dictionaries;
  console.log('Dictionaries loaded successfully');
} catch (error) {
  console.error('Error loading dictionaries:', error);
}


// Abwaannada aan hayno
app.get('/api/dictionaries', (req, res) => {
  const dictionaryNames = dictionaries.map(dictionary => dictionary.name);
  res.json(dictionaryNames);
});

// Eray raadi
app.get('/api/search/:word', (req, res) => {
  const word = req.params.word.toLowerCase();
  const results = [];

  dictionaries.forEach(dictionary => {
    const lowerCaseDict = {};
    Object.keys(dictionary.data).forEach(key => {
      lowerCaseDict[key.toLowerCase()] = dictionary.data[key];
    });

    if (lowerCaseDict[word]) {
      results.push({
        dictionary: dictionary.name,
        word: word,
        definitions: lowerCaseDict[word]
      });
    }
  });

  if (results.length > 0) {
    res.json(results);
  } else {
    res.status(404).json({ message: `Word "${word}" not found in any dictionary.` });
  }
});


// Load SSL certificate and key
const privateKey = fs.readFileSync('/etc/letsencrypt/live/api.erey.ga/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/api.erey.ga/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/api.erey.ga/chain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`Dictionary API running on https://localhost:${port}`);
});

