interface ErrorRequest {
  error: string;
  errorInfo?: string;
}

// This API route is used to log errors from the client side
export async function POST(req: Request): Promise<Response> {
  try {
    const { error, errorInfo }: ErrorRequest = await req.json();
    console.error({ error, errorInfo });
    // Respond back to the client that error has been logged
    return new Response(JSON.stringify({ status: "Error logged successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error processing log request:", { err });
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
