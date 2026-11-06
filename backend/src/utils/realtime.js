const clients = new Set();

export const realtime = {
    subscribe(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders?.();

        clients.add(res);

        req.on('close', () => {
            clients.delete(res);
        });
    },

    emit(event, payload) {
        const data = JSON.stringify({ event, payload });
        for (const client of clients) {
            client.write(`data: ${data}\n\n`);
        }
    },
};