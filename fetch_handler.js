async function serve(opt) {

  switch (detectRuntime()) {
    case 'deno': {
      Deno.serve({ handler: opt.handler, port: opt?.port });
      break;
    }
    case 'bun': {
      Bun.serve({ fetch: opt.handler, port: opt?.port })
      break;
    }
    default: {
      const { Readable, pipeline } = await import('node:stream');

      function incomingToRequest(nodeReq, nodeRes) {
        const protocol = nodeReq.socket.encrypted ? "https" : "http";
        const url = `${protocol}://${nodeReq.headers.host}${nodeReq.url}`;

        const hasBody = nodeReq.method !== "GET" && nodeReq.method !== "HEAD";

        // TODO: might need to make sure this gets cleaned up after normal
        // responses.
        const abortController = new AbortController();

        nodeRes.on('close', () => {
          abortController.abort();
        });

        const req = new Request(url, {
          method: nodeReq.method,
          headers: nodeReq.headers,
          body: hasBody ? Readable.toWeb(nodeReq) : undefined,
          duplex: hasBody ? "half" : undefined,
          signal: abortController.signal,
        });

        return {
          req,
          abortSignal: abortController.signal,
        };
      }

      function sendResponse(nodeRes, res) {
        nodeRes.statusCode = res.status;
        nodeRes.statusMessage = res.statusText;

        for (const [key, value] of res.headers) {
          nodeRes.setHeader(key, value);
        }

        if (!res.body) {
          nodeRes.end();
          return;
        }

        pipeline(Readable.fromWeb(res.body), nodeRes, (err) => {
          if (err) {
            nodeRes.destroy(err);
          }
        });
      }


      if (opt.key && opt.cert) {
        const https = await import('node:https');

        const options = {
          key: opt.key,
          cert: opt.cert,
        };

        https.createServer(options, async (nodeReq, nodeRes) => {

          const { req, abortSignal } = incomingToRequest(nodeReq, nodeRes);

          const res = await opt.handler(req, nodeReq, nodeRes);

          if (res && !abortSignal.aborted) {
            sendResponse(nodeRes, res);
          }

        }).listen(opt.port ? opt.port : 443);
      }
      else {
        const http = await import('node:http');

        http.createServer(async (nodeReq, nodeRes) => {

          const { req, abortSignal } = incomingToRequest(nodeReq, nodeRes);

          const res = await opt.handler(req, nodeReq, nodeRes);

          if (res && !abortSignal.aborted) {
            sendResponse(nodeRes, res);
          }

        }).listen(opt.port ? opt.port : 3000);
      }
      

      break;
    }
  }
}

function detectRuntime() {
  if (typeof Deno !== "undefined" && typeof Deno.version !== "undefined") {
    return "deno";
  }

  if (typeof Bun !== "undefined" && typeof Bun.version !== "undefined") {
    return "bun";
  }

  if (typeof process !== "undefined" && process.versions != null && process.versions.node != null) {
    return "node";
  }

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return "browser";
  }

  return "unknown";
}

export {
  serve,
};
