import net from "node:net";

export function findAvailablePort(preferredPort, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let port = preferredPort;
    let attempts = 0;

    const probe = () => {
      if (attempts >= maxAttempts) {
        reject(new Error(`No free port found between ${preferredPort} and ${port - 1}.`));
        return;
      }
      attempts += 1;
      const server = net.createServer();
      server.once("error", () => {
        port += 1;
        probe();
      });
      server.once("listening", () => {
        server.close(() => resolve(port));
      });
      server.listen(port, "127.0.0.1");
    };

    probe();
  });
}
