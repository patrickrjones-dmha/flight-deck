const STORAGE_KEYS = {
  savedFlights: "wfd.savedFlights.v1",
  myShelf: "wfd.myShelf.v1",
  bottleTags: "wfd.bottleTags.v1",
};

export const BOTTLE_TAGS = {
  shelf: "shelf",
  want: "want",
  favorite: "favorite",
  revisit: "revisit",
  avoid: "avoid",
  finished: "finished",
};

const DEFAULT_BOTTLE_TAG_STATE = {
  shelf: false,
  want: false,
  favorite: false,
  revisit: false,
  avoid: false,
  finished: false,
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

export function getBottleKey(bottle) {
  return normalizeBottleName(bottle);
}

function getFlightBottleSignature(flight) {
  const bottles = flight?.bottles || flight?.flight || flight?.selectedFlight || [];

  return bottles
    .map(normalizeBottleName)
    .filter(Boolean)
    .sort()
    .join("|");
}

/* -----------------------------
   Saved Flights
----------------------------- */

export function getSavedFlights() {
  const savedFlights = safeParseJson(
    localStorage.getItem(STORAGE_KEYS.savedFlights),
    []
  );

  if (!Array.isArray(savedFlights)) {
    return [];
  }

  let changed = false;

  const normalizedFlights = savedFlights.map((flight) => {
    if (flight?.id) {
      return flight;
    }

    changed = true;

    return {
      ...flight,
      id: createId(),
      savedAt: flight?.savedAt || new Date().toISOString(),
    };
  });

  if (changed) {
    localStorage.setItem(
      STORAGE_KEYS.savedFlights,
      JSON.stringify(normalizedFlights)
    );
  }

  return normalizedFlights;
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
  if (!flightId) {
    return getSavedFlights();
  }

  const savedFlights = getSavedFlights();
  const updatedFlights = savedFlights.filter((flight) => flight.id !== flightId);

  localStorage.setItem(
    STORAGE_KEYS.savedFlights,
    JSON.stringify(updatedFlights)
  );

  return updatedFlights;
}

export function updateSavedFlight(flightId, updates) {
  if (!flightId) {
    return getSavedFlights();
  }

  const savedFlights = getSavedFlights();

  const updatedFlights = savedFlights.map((flight) =>
    flight.id === flightId
      ? {
          ...flight,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : flight
  );

  localStorage.setItem(
    STORAGE_KEYS.savedFlights,
    JSON.stringify(updatedFlights)
  );

  return updatedFlights;
}

export function clearSavedFlights() {
  localStorage.removeItem(STORAGE_KEYS.savedFlights);
}

/* -----------------------------
   Bottle Tags
----------------------------- */

function normalizeBottleTags(rawTags) {
  if (!rawTags || typeof rawTags !== "object" || Array.isArray(rawTags)) {
    return {};
  }

  return Object.entries(rawTags).reduce((normalized, [bottleKey, tagState]) => {
    if (!bottleKey || !tagState || typeof tagState !== "object") {
      return normalized;
    }

    normalized[bottleKey] = {
      ...DEFAULT_BOTTLE_TAG_STATE,
      ...tagState,
    };

    return normalized;
  }, {});
}

function migrateMyShelfToBottleTags(existingTags) {
  const legacyShelf = safeParseJson(
    localStorage.getItem(STORAGE_KEYS.myShelf),
    []
  );

  if (!Array.isArray(legacyShelf) || legacyShelf.length === 0) {
    return existingTags;
  }

  const migratedTags = { ...existingTags };
  let changed = false;

  legacyShelf.filter(Boolean).forEach((bottleKey) => {
    const normalizedKey = String(bottleKey).trim().toLowerCase();

    if (!normalizedKey) {
      return;
    }

    migratedTags[normalizedKey] = {
      ...DEFAULT_BOTTLE_TAG_STATE,
      ...(migratedTags[normalizedKey] || {}),
      shelf: true,
      want: false,
    };

    changed = true;
  });

  if (changed) {
    localStorage.setItem(
      STORAGE_KEYS.bottleTags,
      JSON.stringify(migratedTags)
    );
  }

  return migratedTags;
}

export function getBottleTags() {
  const rawTags = safeParseJson(
    localStorage.getItem(STORAGE_KEYS.bottleTags),
    {}
  );

  const normalizedTags = normalizeBottleTags(rawTags);
  const migratedTags = migrateMyShelfToBottleTags(normalizedTags);

  return migratedTags;
}

export function getBottleTagsMap() {
  return getBottleTags();
}

export function getBottleTagState(bottle) {
  const bottleKey = normalizeBottleName(bottle);

  if (!bottleKey) {
    return { ...DEFAULT_BOTTLE_TAG_STATE };
  }

  const bottleTags = getBottleTags();

  return {
    ...DEFAULT_BOTTLE_TAG_STATE,
    ...(bottleTags[bottleKey] || {}),
  };
}

export function isBottleTagged(bottle, tagName) {
  if (!Object.values(BOTTLE_TAGS).includes(tagName)) {
    return false;
  }

  return getBottleTagState(bottle)[tagName] === true;
}

export function setBottleTag(bottle, tagName, value) {
  const bottleKey = normalizeBottleName(bottle);

  if (!bottleKey || !Object.values(BOTTLE_TAGS).includes(tagName)) {
    return getBottleTags();
  }

  const bottleTags = getBottleTags();

  const currentTagState = {
    ...DEFAULT_BOTTLE_TAG_STATE,
    ...(bottleTags[bottleKey] || {}),
  };

  const nextTagState = {
    ...currentTagState,
    [tagName]: Boolean(value),
  };

  // Product rules:
  // If I own it, I no longer need it on the shopping list.
  if (tagName === BOTTLE_TAGS.shelf && value === true) {
    nextTagState.want = false;
    nextTagState.finished = false;
  }

  // If it is finished, it is no longer currently on the shelf.
  if (tagName === BOTTLE_TAGS.finished && value === true) {
    nextTagState.shelf = false;
  }

  // If I want it, it should not be marked finished.
  if (tagName === BOTTLE_TAGS.want && value === true) {
    nextTagState.finished = false;
  }

  const updatedTags = {
    ...bottleTags,
    [bottleKey]: nextTagState,
  };

  localStorage.setItem(STORAGE_KEYS.bottleTags, JSON.stringify(updatedTags));

  return updatedTags;
}

export function toggleBottleTag(bottle, tagName) {
  const currentlyTagged = isBottleTagged(bottle, tagName);
  const bottleTagsMap = setBottleTag(bottle, tagName, !currentlyTagged);

  return {
    isTagged: !currentlyTagged,
    tagName,
    bottleTags: bottleTagsMap,
    bottleTagsMap,
  };
}

export function getTagCount(tagName) {
  if (!Object.values(BOTTLE_TAGS).includes(tagName)) {
    return 0;
  }

  const bottleTags = getBottleTags();

  return Object.values(bottleTags).filter(
    (tagState) => tagState?.[tagName] === true
  ).length;
}

export function getBottleKeysByTag(tagName) {
  if (!Object.values(BOTTLE_TAGS).includes(tagName)) {
    return [];
  }

  const bottleTags = getBottleTags();

  return Object.entries(bottleTags)
    .filter(([, tagState]) => tagState?.[tagName] === true)
    .map(([bottleKey]) => bottleKey);
}

export function clearBottleTags() {
  localStorage.removeItem(STORAGE_KEYS.bottleTags);
}

/* -----------------------------
   Backward-compatible My Shelf helpers
   These keep the existing App.jsx shelf code working.
----------------------------- */

export function getMyShelf() {
  return getBottleKeysByTag(BOTTLE_TAGS.shelf);
}

export function isBottleOnShelf(bottle) {
  return isBottleTagged(bottle, BOTTLE_TAGS.shelf);
}

export function addBottleToShelf(bottle) {
  setBottleTag(bottle, BOTTLE_TAGS.shelf, true);
  return getMyShelf();
}

export function removeBottleFromShelf(bottle) {
  setBottleTag(bottle, BOTTLE_TAGS.shelf, false);
  return getMyShelf();
}

export function toggleBottleOnShelf(bottle) {
  const result = toggleBottleTag(bottle, BOTTLE_TAGS.shelf);

  return {
    isOnShelf: result.isTagged,
    myShelf: getMyShelf(),
    bottleTags: result.bottleTags,
  };
}

export function clearMyShelf() {
  const bottleTags = getBottleTags();

  const updatedTags = Object.entries(bottleTags).reduce(
    (updated, [bottleKey, tagState]) => {
      updated[bottleKey] = {
        ...DEFAULT_BOTTLE_TAG_STATE,
        ...tagState,
        shelf: false,
      };

      return updated;
    },
    {}
  );

  localStorage.setItem(STORAGE_KEYS.bottleTags, JSON.stringify(updatedTags));
  localStorage.removeItem(STORAGE_KEYS.myShelf);
}