import type { ConfirmedComment } from "../../../src/types";

// Mocks server code
export async function sendCommentsToDataBase(
  comments: ConfirmedComment[],
  projectId?: string,
) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.info("Project ID:", projectId);
  console.info("Adding comments:", comments);
}

export async function resolveCommentsInDataBase(comments: ConfirmedComment[]) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.info("Resolving comments:", comments);
}
