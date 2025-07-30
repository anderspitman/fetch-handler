import { serve } from '../../fetch_handler.js';

const handler = (req) => {
  return new Response("Hi there");
}

//serve(handler, { port: 4000 });
serve(handler, { port: 3000 });
