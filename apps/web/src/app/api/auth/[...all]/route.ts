import { createAuthServer } from "@repo/auth";
import { connect } from "@repo/database";

export async function GET(request: Request): Promise<Response> {
  await connect();
  const auth = createAuthServer();
  return auth.handler(request);
}

export async function POST(request: Request): Promise<Response> {
  await connect();
  const auth = createAuthServer();
  return auth.handler(request);
}

export async function PUT(request: Request): Promise<Response> {
  await connect();
  const auth = createAuthServer();
  return auth.handler(request);
}

export async function DELETE(request: Request): Promise<Response> {
  await connect();
  const auth = createAuthServer();
  return auth.handler(request);
}

export async function PATCH(request: Request): Promise<Response> {
  await connect();
  const auth = createAuthServer();
  return auth.handler(request);
}
