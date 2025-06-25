import { authLocal } from "@lib/auth-local";

const handler = authLocal.handler;

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as OPTIONS }; 