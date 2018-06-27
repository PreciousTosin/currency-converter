module.exports = {
  "extends": ["airbnb-base"],
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    // Additional, per-project rules...
    "no-console": 0,
    //Silence LF <> CRLF error
    "linebreak-style": 0
  },
  "parserOptions": {
    "ecmaVersion": 8
  }
};