export default async (request, context) => {
  const url = new URL(request.url);
  const targetUrlStr = url.searchParams.get("url");
  if (!targetUrlStr) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // Security guard: Validate input URL to prevent arbitrary SSRF
  try {
    const parsedTarget = new URL(targetUrlStr);
    
    // Enforce HTTPS
    if (parsedTarget.protocol !== "https:") {
      return new Response("Invalid protocol. Only HTTPS is allowed.", { status: 400 });
    }
    
    // Strict domain allow-list for YouTube media streams
    const isGoogleVideo = parsedTarget.hostname === "googlevideo.com" || parsedTarget.hostname.endsWith(".googlevideo.com");
    if (!isGoogleVideo) {
      return new Response("Unauthorized streaming target. Only Google Video domains are allowed.", { status: 403 });
    }
  } catch (e) {
    return new Response("Invalid target URL.", { status: 400 });
  }

  const headers = new Headers();
  
  // Forward Range header from client to support resume and chunking
  const range = request.headers.get("range");
  if (range) {
    headers.set("Range", range);
  }
  
  // Set User-Agent to avoid YouTube blocking generic requests
  headers.set("User-Agent", request.headers.get("user-agent") || "Mozilla/5.0");
  
  try {
    const res = await fetch(targetUrlStr, {
      method: "GET",
      headers,
    });
    
    const responseHeaders = new Headers();
    
    // Forward relevant headers from YouTube response to client
    const copyHeaders = ["content-type", "content-length", "content-range", "accept-ranges"];
    for (const h of copyHeaders) {
      const val = res.headers.get(h);
      if (val) {
        responseHeaders.set(h, val);
      }
    }
    
    // Add CORS headers so browser-based fetch can read the chunks
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "Range, Content-Range, Content-Length, Content-Type");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range");
    
    const download = url.searchParams.get("download");
    const filename = url.searchParams.get("filename") || "download.mp4";
    if (download === "1") {
      // Prevent header injection by encoding filename
      const safeFilename = encodeURIComponent(filename);
      responseHeaders.set("Content-Disposition", `attachment; filename="${safeFilename}"`);
      responseHeaders.set("Content-Type", "application/octet-stream");
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response("Streaming error: " + err.message, { status: 500 });
  }
};
