/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
  // completeNews.splice(0, completeNews.length);
  if (process.env.ENV === 'production') {
    res.sendFile(path.join(__dirname, '../public_build/index.html'));
  }

  res.sendFile(path.join(__dirname, '../views/index.html'));
});

module.exports = router;
