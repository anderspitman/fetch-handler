async function serve(handler, opt) {

  switch (detectRuntime()) {
    case 'deno': {
      Deno.serve({ handler, port: opt?.port });
      break;
    }
    case 'bun': {
      Bun.serve({ fetch: handler, port: opt?.port })
      break;
    }
    default: {
      // Default to assuming node/hono

      const { serve } = await import('@hono/node-server');
      const { Hono } = await import('hono');

      const app = new Hono();
      app.get('/*', handler);

      await serve({
        fetch: app.fetch,
        port: opt?.port,
      });

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
