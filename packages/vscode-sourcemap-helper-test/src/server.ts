// quick and dirty http server based on https://stackoverflow.com/a/29046869
import * as fs from 'fs/promises';
import * as http from 'http';
import * as path from 'path';

async function serveStaticFile(request: http.IncomingMessage, response: http.ServerResponse, rootPath: string) {
  const filePath = path.join(rootPath, request.url)

  console.log('HTTP server: ' + request.url + ", " + filePath);

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
    case '.map':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.wav':
      contentType = 'audio/wav';
      break;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content, 'utf-8');
  } catch (error) {
    response.writeHead(500);
    response.end('HTTP 500 Server error: ' + error.code + '\n');
    response.end(); 
  }
};

export async function createServer(host, port, rootPath): Promise<http.Server> {

  const requestListener = (request: http.IncomingMessage, response: http.ServerResponse) => {
    serveStaticFile(request, response, rootPath);
  };

  const server = http.createServer(requestListener);

  return new Promise<http.Server>((resolve, reject) => {
    const error = () => {
      server.off("listening", listening);
      server.off("error", error);
      reject();
    };

    const listening = () => {
      console.log(`HTTP server is running on http://${host}:${port}`);
      server.off("listening", listening);
      server.off("error", error);
      resolve(server);
    };

    server.on("error", error);
    server.on("listening", listening);

    server.listen(port, host);
  });
}

export async function stopServer (server: http.Server) {
  return new Promise<void>((resolve, reject) => {
    const close = (err: any) => {
      server.off("close", close);

      if (err) {
        console.log(`HTTP server failed to stop ` + err.message);
        reject(err);
        return;
      }

      console.log(`HTTP server stopped`);
      resolve();
    };

    server.on("close", close);

    server.close();
    server.closeAllConnections();
  });
}
