import 'dotenv/config';
import server from './src';
const port = Number(process.env.PORT || 80);

server.on("error", (error: any) => {
    if (error?.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Stop the running process on this port or update PORT in .env`);
        process.exit(1);
    }

    throw error;
});

server.listen(port, () => {
    console.log(`server started on port ${port}`);
});
