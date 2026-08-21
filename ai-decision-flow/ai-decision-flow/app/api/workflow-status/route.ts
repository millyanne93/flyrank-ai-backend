import { NextRequest, NextResponse } from "next/server";

// The Inngest Dev Server exposes a small REST API (default: localhost:8288)
// that lets you look up runs triggered by a given event id. This is handy
// for local polling during development.
//
// In production you'd swap this for Inngest Realtime (step.sendEvent +
// a subscribe hook on the client) or just persist status to your own DB
// from inside the function (e.g. a step.run that writes to Postgres/Redis).

const DEV_SERVER_URL = process.env.INNGEST_DEV_SERVER_URL ?? "http://localhost:8288";

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${DEV_SERVER_URL}/v1/events/${eventId}/runs`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not reach Inngest dev server" },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Inngest dev server not running (npm run inngest:dev)" },
      { status: 502 }
    );
  }
}
