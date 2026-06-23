import app from './app.js';

const PORT = process.env.PORT_BE;

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
})