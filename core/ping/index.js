const express = require('express');
const app = express();

app.get('/text', (req, res) => {
  res.send('ok');
});

app.get('/json', (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Ping flavor listening on port ${PORT}`);

  if (process.env.ON_READY) {
    console.log(process.env.ON_READY);
  }
});
