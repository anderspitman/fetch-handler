import { serve } from '../../fetch_handler.js';

const handler = (req) => {
  return new Response("Hi there");
}

serve({
  handler,
  keyPath: process.argv[2],
  certPath: process.argv[3],
});
