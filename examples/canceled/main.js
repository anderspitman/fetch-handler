import { serve } from '../../fetch_handler.js';

const handler = async (req) => {

  const abortedPromise = new Promise((resolve, reject) => {
    req.signal.addEventListener('abort', (evt) => {
      reject("canceled");
    });
  });

  const { resPromise, cancelJob } = longrunningJob();

  try {
    const res = await Promise.race([ resPromise, abortedPromise ]);
    return res;
  }
  catch (e) {
    cancelJob();
    console.warn(e);
  }
}

function longrunningJob() {

  let timeoutId;

  const resPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      resolve(new Response("Hi there"));
    }, 3000);
  });

  function cancelJob() {
    clearTimeout(timeoutId);
  }

  return {
    resPromise,
    cancelJob,
  };
}

serve({ handler, port: 3000 });
