// api.js — One place for every request the frontend sends to the Flask API.
//
// Every page calls apiFetch() instead of fetch() directly, so the API address,
// JSON headers, and error handling are written once and work the same everywhere.

// The Flask server's address. Can be overridden with a VITE_API_URL
// environment variable later (for example, when the app is deployed).
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

export async function apiFetch(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    // fetch() itself only fails when the server can't be reached at all
    // (Flask not running, wrong address, network down).
    throw new Error("Can't reach the Glutenote server. Is the backend running?");
  }

  // 204 No Content (successful DELETE) has no body to read.
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  // Our backend always sends errors as {"error": "message"},
  // so we can show that message directly to the user.
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
}