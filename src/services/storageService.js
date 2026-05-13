const STORAGE_KEYS = {
  savedFlights: "wfd.savedFlights.v1",
};

function safeParseJson(value, fallback) {
  try {
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `flight-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeBottleName(bottle) {
  return (bottle?.name || bottle?.whiskeyName || "").trim().toLowerCase();
}

function getFlightBottleSignature(flight) {
  const bottles = flight?.bottles || flight?.flight || flight?.selectedFlight || [];

  return bottles
    .map(normalizeBottleName)
    .filter(Boolean)
    .sort()
    .join("|");
}

export function getSavedFlights() {
  const savedFlights = safeParseJson(
    localStorage.getItem(STORAGE_KEYS.savedFlights),
    []
  );

  return Array.isArray(savedFlights) ? savedFlights : [];
}

export function saveFlight(flight) {
  if (!flight) {
    return {
      success: false,
      reason: "No flight was provided.",
    };
  }

  const savedFlights = getSavedFlights();
  const newSignature = getFlightBottleSignature(flight);

  const alreadySaved = savedFlights.some(
    (savedFlight) => getFlightBottleSignature(savedFlight) === newSignature
  );

  if (alreadySaved) {
    return {
      success: false,
      reason: "This flight is already saved.",
      savedFlights,
    };
  }

  const savedFlight = {
    ...flight,
    id: flight.id || createId(),
    savedAt: flight.savedAt || new Date().toISOString(),
  };

  const updatedFlights = [savedFlight, ...savedFlights];

  localStorage.setItem(
    STORAGE_KEYS.savedFlights,
    JSON.stringify(updatedFlights)
  );

  return {
    success: true,
    savedFlight,
    savedFlights: updatedFlights,
  };
}

export function deleteSavedFlight(flightId) {
  const savedFlights = getSavedFlights();
  const updatedFlights = savedFlights.filter((flight) => flight.id !== flightId);

  localStorage.setItem(
    STORAGE_KEYS.savedFlights,
    JSON.stringify(updatedFlights)
  );

  return updatedFlights;
}

export function clearSavedFlights() {
  localStorage.removeItem(STORAGE_KEYS.savedFlights);
}