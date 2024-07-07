const express = require('express');
const client = require('prom-client');
const responseTime = require('response-time');
const LokiTransport = require('winston-loki');
const { transports, createLogger } = require('winston');

const options = {
    transports: [
        new LokiTransport({        
            host: 'http://localhost:3100',})
    ]};

const log = createLogger(options);


const app = express();
app.use(express.json());

let data = []; // This will act as a mock database

// Metrics
const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics( {register : client.register });

const no_of_request = new client.Counter({
    name: 'no_of_request',
    help: 'Number of requests made',
    labelNames: ['method', 'route', 'code']
})

const requestTime = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10]
});

app.use(responseTime((req, res, time) => {
    no_of_request.inc({ method: req.method, route: req.route.path, code: res.statusCode });
    requestTime.labels(req.method,
         req.route.path,
         res.statusCode).observe(time);

}));

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});


// Health check
app.get('/health', (req, res) => {
    log.info('Health check');
    res.send('OK');
});

// Root
app.get('/', (req, res) => {
    res.send('Hello World! from ExpressJs !');
});

// Create
app.post('/data', (req, res) => {
    log.info('Data created');
    data.push(req.body);
    res.status(201).send(req.body);
});

// Read
app.get('/data', (req, res) => {
    log.info('Data read');
    res.send(data);
});

// Update
app.put('/data/:id', (req, res) => {
    log.info('Data updated');
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
    log.info('Data deleted');
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