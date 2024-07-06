const express = require('express');
const client = require('prom-client');
const app = express();
app.use(express.json());

let data = []; // This will act as a mock database

// Metrics
const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics( {register : client.register });

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// Create
app.post('/data', (req, res) => {
    data.push(req.body);
    res.status(201).send(req.body);
});

// Read
app.get('/data', (req, res) => {
    res.send(data);
});

// Update
app.put('/data/:id', (req, res) => {
    const id = req.params.id;
    const item = data.find(i => i.id === id);
    if (!item) {
        return res.status(404).send('Item with given id not found');
    }
    Object.assign(item, req.body);
    res.send(item);
});

// Delete
app.delete('/data/:id', (req, res) => {
    const id = req.params.id;
    const index = data.findIndex(i => i.id === id);
    if (index === -1) {
        return res.status(404).send('Item with given id not found');
    }
    const item = data.splice(index, 1);
    res.send(item);
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server running on port ${port}`));