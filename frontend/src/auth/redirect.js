export function getSafeReturnPath(search) {
  const requestedPath = new URLSearchParams(search).get("next");
  if (
    requestedPath &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//")
  ) {
    return requestedPath;
  }
  return "/profile";
}
