const express = require('express');
const multer = require('multer');
const ipfsClient = require('ipfs-http-client');

const app = express();
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

const upload = multer({ storage: multer.memoryStorage() });


app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { path } = await ipfs.add(req.file.buffer);
        res.json({ hash: path });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/sc', (req, res) => {
    const value = process.env["SMART_CONTRACT_ADDRESS"];
    return res.json({ "sc": value });
});

// change
app.use(express.static(path.join(__dirname, '../client')));

app.listen(3000, () => {
    console.log('Server started on port 3000');
});