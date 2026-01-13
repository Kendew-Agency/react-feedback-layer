import type { ConfirmedComment } from "../../../src/types";

// Mocks server code
export async function sendCommentsToDataBase(comments: ConfirmedComment[]) {
  console.info("Adding comments:", comments);
}

export async function resolveCommentsInDataBase(comments: ConfirmedComment[]) {
  console.info("Resolving comments:", comments);
}
