export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = 'https://api.telegram.org' + url.pathname + url.search;
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    return fetch(modifiedRequest);
  }
};
