import { serve } from '../../fetch_handler.js';

const handler = async (req) => {
  const body = await req.text();
  return new Response(body);
}

serve({ handler, port: 3000 });
