import { useState } from "react";
import { whiskeys } from "./data/whiskeys/whiskeys";
import {
  BOTTLE_TAGS,
  deleteSavedFlight,
  getBottleTagsMap,
  getMyShelf,
  getSavedFlights,
  saveFlight,
  toggleBottleTag,
  updateSavedFlight,
} from "./services/storageService";

const vibeLabels = {
  easy: "Easy & Smooth",
  sweet: "Sweet & Rich",
  bold: "Bold & Spicy",
  smoky: "Smoky & Serious",
};

const vibeSummaryIntros = {
  easy: "This flight keeps the runway friendly: approachable pours first, then a little more depth so the night still has some character.",
  sweet: "This flight leans into richer dessert-like notes, then builds toward more oak, spice, or proof so it does not become a sugar parade.",
  bold: "This flight is built to climb: spice, proof, and bigger flavors show up as you move through the pours.",
  smoky: "This flight goes darker and more serious, with the softer pour first so the bolder bottle does not bulldoze your palate right away.",
};

function App() {
  const [step, setStep] = useState("start");
  const [choice, setChoice] = useState("");
  const [flight, setFlight] = useState([]);
  const [wildcard, setWildcard] = useState(null);
  const [savedFlights, setSavedFlights] = useState(() => {
    const initialSavedFlights = getSavedFlights();
    return Array.isArray(initialSavedFlights) ? initialSavedFlights : [];
  });
  const [saveMessage, setSaveMessage] = useState("");

  const [myShelf, setMyShelf] = useState(() => {
    const initialShelf = getMyShelf();
    return Array.isArray(initialShelf) ? initialShelf : [];
  });
  const [shelfMessage, setShelfMessage] = useState("");
  const [flightSource, setFlightSource] = useState("all");
  const [bottleTagsMap, setBottleTagsMap] = useState(() => getBottleTagsMap());
  const [shelfSearch, setShelfSearch] = useState("");
  const [shelfStyleFilter, setShelfStyleFilter] = useState("all");
  const [bottleListFilter, setBottleListFilter] = useState("all");
  const [shelfSortMode, setShelfSortMode] = useState("taggedFirst");

  const allBottles = uniqueByName(whiskeys);

  const shelfBottles = allBottles.filter((whiskey) =>
    isBottleTagged(whiskey, BOTTLE_TAGS.shelf)
  );

  const bottleTagCounts = {
    shelf: allBottles.filter((whiskey) =>
      isBottleTagged(whiskey, BOTTLE_TAGS.shelf)
    ).length,
    want: allBottles.filter((whiskey) =>
      isBottleTagged(whiskey, BOTTLE_TAGS.want)
    ).length,
    favorite: allBottles.filter((whiskey) =>
      isBottleTagged(whiskey, BOTTLE_TAGS.favorite)
    ).length,
    revisit: allBottles.filter((whiskey) =>
      isBottleTagged(whiskey, BOTTLE_TAGS.revisit)
    ).length,
    avoid: allBottles.filter((whiskey) =>
      isBottleTagged(whiskey, BOTTLE_TAGS.avoid)
    ).length,
    finished: allBottles.filter((whiskey) =>
      isBottleTagged(whiskey, BOTTLE_TAGS.finished)
    ).length,
  };

  const displayedShelfBottles = allBottles
    .filter((whiskey) => {
      const tags = getBottleTagsFromMap(whiskey);
      const searchText = [
        whiskey.name,
        whiskey.style,
        whiskey.notes,
        whiskey.reason,
        ...(whiskey.vibe || []),
      ]
        .join(" ")
        .toLowerCase();

  const searchTerms = shelfSearch
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const matchesSearch =
    searchTerms.length === 0 ||
    searchTerms.every((term) => searchText.includes(term));

      const style = whiskey.style.toLowerCase();
      const matchesStyle =
        shelfStyleFilter === "all" ||
        (shelfStyleFilter === "bourbon" && style.includes("bourbon")) ||
        (shelfStyleFilter === "rye" && style.includes("rye")) ||
        (shelfStyleFilter === "scotch" && style.includes("scotch")) ||
        (shelfStyleFilter === "irish" && style.includes("irish"));

      const matchesListFilter =
        bottleListFilter === "all" || Boolean(tags[bottleListFilter]);

      return matchesSearch && matchesStyle && matchesListFilter;
    })
    .sort((a, b) => {
      if (shelfSortMode === "taggedFirst") {
        const aRank = getBottleTagSortRank(a);
        const bRank = getBottleTagSortRank(b);

        if (aRank !== bRank) {
          return aRank - bRank;
        }

        return a.name.localeCompare(b.name);
      }

      if (shelfSortMode === "az") {
        return a.name.localeCompare(b.name);
      }

      if (shelfSortMode === "proofLow") {
        return proofValue(a) - proofValue(b);
      }

      if (shelfSortMode === "proofHigh") {
        return proofValue(b) - proofValue(a);
      }

      return 0;
    });

  function shuffle(items) {
    const shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledItems[index], shuffledItems[randomIndex]] = [
        shuffledItems[randomIndex],
        shuffledItems[index],
      ];
    }

    return shuffledItems;
    }

    function getBottleKey(bottle) {
        return (bottle?.name || bottle?.whiskeyName || "").trim().toLowerCase();
    }

    function getBottleTagsFromMap(bottle) {
        const bottleKey = getBottleKey(bottle);

        return {
            shelf: false,
            want: false,
            favorite: false,
            revisit: false,
            avoid: false,
            finished: false,
            ...(bottleTagsMap[bottleKey] || {}),
        };
    }

    function isBottleTagged(bottle, tagName) {
        return Boolean(getBottleTagsFromMap(bottle)[tagName]);
    }

    function isBottleOnShelf(bottle) {
        return isBottleTagged(bottle, BOTTLE_TAGS.shelf);
    }

    function hasAnyBottleTag(bottle) {
        const tags = getBottleTagsFromMap(bottle);

        return (
            tags.shelf ||
            tags.want ||
            tags.favorite ||
            tags.revisit ||
            tags.avoid ||
            tags.finished
        );
    }

    function getBottleTagSortRank(bottle) {
        const tags = getBottleTagsFromMap(bottle);

        if (tags.shelf) return 0;
        if (tags.want) return 1;
        if (tags.favorite) return 2;
        if (tags.revisit) return 3;
        if (tags.avoid) return 4;
        if (tags.finished) return 5;

        return 99;
    }

    function getBottleTagButtonText(bottle, tagName) {
        const tags = getBottleTagsFromMap(bottle);

        const labels = {
            [BOTTLE_TAGS.shelf]: tags.shelf ? "Shelf ✓" : "+ Shelf",
            [BOTTLE_TAGS.want]: tags.want ? "Wanted ✓" : "+ Want",
            [BOTTLE_TAGS.favorite]: tags.favorite ? "Favorite ★" : "★ Favorite",
            [BOTTLE_TAGS.revisit]: tags.revisit ? "Revisit ✓" : "↻ Revisit",
            [BOTTLE_TAGS.avoid]: tags.avoid ? "Avoid ✓" : "Avoid",
            [BOTTLE_TAGS.finished]: tags.finished ? "Finished ✓" : "Finished",
        };

        return labels[tagName] || tagName;
    }

    function renderBottleTagButtons(whiskey) {
        const tagNames = [
            BOTTLE_TAGS.shelf,
            BOTTLE_TAGS.want,
            BOTTLE_TAGS.favorite,
            BOTTLE_TAGS.revisit,
            BOTTLE_TAGS.avoid,
            BOTTLE_TAGS.finished,
        ];

        return (
            <div style={styles.tagButtonGrid}>
                {tagNames.map((tagName) => {
                    const isActive = isBottleTagged(whiskey, tagName);

                    return (
                        <button
                            key={`${whiskey.name}-${tagName}`}
                            type="button"
                            style={isActive ? styles.activeTagButton : styles.tagButton}
                            onClick={() => handleToggleBottleTag(whiskey, tagName)}
                        >
                            {getBottleTagButtonText(whiskey, tagName)}
                        </button>
                    );
                })}
            </div>
        );
    }


  function proofValue(whiskey) {
    return Number(whiskey.proof) || 0;
  }

  function uniqueByName(items) {
    const seenNames = new Set();

    return items.filter((whiskey) => {
      const nameKey = whiskey.name.trim().toLowerCase();

      if (seenNames.has(nameKey)) {
        return false;
      }

      seenNames.add(nameKey);
      return true;
    });
  }

  function sortByProof(items) {
    return [...items].sort((a, b) => proofValue(a) - proofValue(b));
  }

  function hasVibe(whiskey, selectedVibe) {
    return whiskey.vibe.includes(selectedVibe);
  }

    function buildFlight(selectedVibe, sourceWhiskeys = whiskeys) {
        const matches = sourceWhiskeys.filter((whiskey) =>
            hasVibe(whiskey, selectedVibe)
        );
        const fallback = sourceWhiskeys.filter(
            (whiskey) => !hasVibe(whiskey, selectedVibe)
        );

        const selectedWhiskeys = uniqueByName([
            ...shuffle(matches),
            ...shuffle(fallback),
        ]).slice(0, 3);

        return sortByProof(selectedWhiskeys);
    }

  function buildWildcard(selectedVibe, selectedFlight, sourceWhiskeys = whiskeys) {
    const flightNames = new Set(
      selectedFlight.map((whiskey) => whiskey.name.trim().toLowerCase())
    );

      const outsideCurrentFlight = uniqueByName(sourceWhiskeys).filter(
      (whiskey) => !flightNames.has(whiskey.name.trim().toLowerCase())
    );

    const surprisePool = outsideCurrentFlight.filter(
      (whiskey) => !hasVibe(whiskey, selectedVibe)
    );

    return shuffle(surprisePool)[0] || shuffle(outsideCurrentFlight)[0] || null;
  }

  function buildFlightSummary(selectedVibe, selectedFlight) {
    if (selectedFlight.length === 0) {
      return "";
    }

    const firstPour = selectedFlight[0];
    const finalPour = selectedFlight[selectedFlight.length - 1];
    const intro =
      vibeSummaryIntros[selectedVibe] ||
      "This flight is built to move from the easiest first sip into the bigger finish.";

    return `${intro} Start with ${firstPour.name} at ${firstPour.proof} proof, then work toward ${finalPour.name} at ${finalPour.proof} proof. The order matters: low proof first, biggest personality last.`;
  }

  function createId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getFlightSignature(selectedVibe, selectedFlight) {
    const bottleSignature = selectedFlight
      .map((whiskey) => whiskey.name.trim().toLowerCase())
      .join("|");

    return `${selectedVibe}|${bottleSignature}`;
  }

  function formatSavedDate(savedAt) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(savedAt));
    } catch {
      return savedAt;
    }
  }

  function normalizeSavedFlightsResult(result) {
    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result?.savedFlights)) {
      return result.savedFlights;
    }

    const savedFlightsFromStorage = getSavedFlights();
    return Array.isArray(savedFlightsFromStorage) ? savedFlightsFromStorage : [];
  }

    function chooseVibe(vibe, options = {}) {
        const useShelf = options.useShelf === true;
        const sourceWhiskeys = (useShelf ? shelfBottles : whiskeys).filter(
            (whiskey) => !isBottleTagged(whiskey, BOTTLE_TAGS.avoid)
        );

        if (sourceWhiskeys.length < 3) {
            setShelfMessage("Add at least 3 bottles to My Shelf before building a shelf flight.");
            return;
        }

        const newFlight = buildFlight(vibe, sourceWhiskeys);

        setChoice(vibe);
        setFlight(newFlight);
        setFlightSource(useShelf ? "shelf" : "all");
        setWildcard(buildWildcard(vibe, newFlight, sourceWhiskeys));
        setSaveMessage("");
        setShelfMessage("");
        setStep("result");
    }

    function useWildcard() {
        if (!wildcard) {
            return;
        }

        const newFlight = sortByProof([...flight.slice(0, 2), wildcard]);
        const sourceWhiskeys = (flightSource === "shelf" ? shelfBottles : whiskeys).filter(
            (whiskey) => !isBottleTagged(whiskey, BOTTLE_TAGS.avoid)
        );

        setFlight(newFlight);
        setWildcard(buildWildcard(choice, newFlight, sourceWhiskeys));
        setSaveMessage("");
    }

  function handleSaveFlight() {
    if (flight.length === 0) {
      return;
    }

    const savedFlight = {
      id: createId(),
      savedAt: new Date().toISOString(),
      name: `${vibeLabels[choice] || "Whiskey"} Flight`,
      theme: vibeLabels[choice] || choice,
      vibe: choice,
      signature: getFlightSignature(choice, flight),
      bottles: flight.map((whiskey, index) => ({
        order: index + 1,
        name: whiskey.name,
        style: whiskey.style,
        proof: whiskey.proof,
        notes: whiskey.notes,
        reason: whiskey.reason,
      })),
      explanation: buildFlightSummary(choice, flight),
      wildcard: wildcard
        ? {
            name: wildcard.name,
            style: wildcard.style,
            proof: wildcard.proof,
            notes: wildcard.notes,
            reason: wildcard.reason,
          }
        : null,
    };

    const beforeCount = savedFlights.length;
    const result = saveFlight(savedFlight);
    const nextSavedFlights = normalizeSavedFlightsResult(result);

    setSavedFlights(nextSavedFlights);
    setSaveMessage(
      result?.reason ||
        (nextSavedFlights.length === beforeCount
          ? "This flight is already saved."
          : "Flight saved.")
    );
  }

  function handleDeleteSavedFlight(savedFlightId) {
  const result = deleteSavedFlight(savedFlightId);
  setSavedFlights(normalizeSavedFlightsResult(result));
}

  function handleUpdateSavedFlight(savedFlightId, updates) {
    const result = updateSavedFlight(savedFlightId, updates);
    setSavedFlights(normalizeSavedFlightsResult(result));
    }

    function handleToggleBottleTag(whiskey, tagName) {
        const result = toggleBottleTag(whiskey, tagName);

        setBottleTagsMap({ ...result.bottleTagsMap });
        setMyShelf(getMyShelf());

        const actionLabel = {
            [BOTTLE_TAGS.shelf]: "My Shelf",
            [BOTTLE_TAGS.want]: "Shopping List",
            [BOTTLE_TAGS.favorite]: "Favorites",
            [BOTTLE_TAGS.revisit]: "Revisit List",
            [BOTTLE_TAGS.avoid]: "Avoid List",
            [BOTTLE_TAGS.finished]: "Finished Bottles",
        }[tagName];

        setShelfMessage(
            result.isTagged
                ? `${whiskey.name} added to ${actionLabel}.`
                : `${whiskey.name} removed from ${actionLabel}.`
        );
    }

    function handleToggleShelfBottle(whiskey) {
        handleToggleBottleTag(whiskey, BOTTLE_TAGS.shelf);
    }

    function goToShelf() {
        setShelfMessage("");
        setShelfSearch("");
        setStep("shelf");
    }

  function goToHistory() {
    setSaveMessage("");
    setStep("history");
  }

  function goBackFromHistory() {
    setSaveMessage("");
    setStep(flight.length > 0 ? "result" : "start");
  }

  function reset() {
    setChoice("");
    setFlight([]);
    setWildcard(null);
    setSaveMessage("");
    setFlightSource("all");
    setStep("start");
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <p style={styles.companyName}>Distill My Heart Adventures</p>
        <p style={styles.companyTagline}>
          Whiskey flights, tasting fun, and good stories
        </p>
      </header>

      <section style={styles.card}>
        {step === "start" && (
          <>
            <p style={styles.eyebrow}>Welcome aboard</p>
            <h1 style={styles.title}>🥃 Whiskey Flight Deck</h1>
            <p style={styles.text}>
              Pick a vibe and get a simple three-whiskey tasting flight.
            </p>

            <button style={styles.primaryButton} onClick={() => setStep("mood")}>
              Build My Flight
            </button>

           <button style={styles.secondaryButton} onClick={goToShelf}>
             Bottle Lists ({bottleTagCounts.shelf} owned · {bottleTagCounts.want} wanted)
           </button>

            <button style={styles.secondaryButton} onClick={goToHistory}>
              Saved Flights ({savedFlights.length})
            </button>
          </>
        )}

        {step === "mood" && (
          <>
            <p style={styles.eyebrow}>Question 1 of 1</p>
            <h2 style={styles.title}>What sounds good tonight?</h2>

            <button style={styles.optionButton} onClick={() => chooseVibe("easy")}>
              Easy & Smooth
            </button>

            <button style={styles.optionButton} onClick={() => chooseVibe("sweet")}>
              Sweet & Rich
            </button>

            <button style={styles.optionButton} onClick={() => chooseVibe("bold")}>
              Bold & Spicy
            </button>

            <button style={styles.optionButton} onClick={() => chooseVibe("smoky")}>
              Smoky & Serious
            </button>

            {myShelf.length >= 3 && (
                <>
                    <p style={styles.label}>Build from My Shelf</p>

                    <button
                        style={styles.optionButton}
                        onClick={() => chooseVibe("easy", { useShelf: true })}
                    >
                        My Shelf: Easy & Smooth
                    </button>

                    <button
                        style={styles.optionButton}
                        onClick={() => chooseVibe("sweet", { useShelf: true })}
                    >
                        My Shelf: Sweet & Rich
                    </button>

                    <button
                        style={styles.optionButton}
                        onClick={() => chooseVibe("bold", { useShelf: true })}
                    >
                        My Shelf: Bold & Spicy
                    </button>

                    <button
                        style={styles.optionButton}
                        onClick={() => chooseVibe("smoky", { useShelf: true })}
                    >
                        My Shelf: Smoky & Serious
                    </button>
                </>
            )}

            {shelfMessage && <p style={styles.statusMessage}>{shelfMessage}</p>}

          </>
        )}

        {step === "result" && (
          <>
            <p style={styles.eyebrow}>Your vibe: {vibeLabels[choice] || choice}</p>
            <h2 style={styles.title}>Your Whiskey Flight</h2>

            <section style={styles.summaryBox}>
              <p style={styles.label}>Why this flight works</p>
              <p style={styles.notes}>{buildFlightSummary(choice, flight)}</p>
            </section>

            <div style={styles.flightList}>
              {flight.map((whiskey, index) => (
                <article key={whiskey.name} style={styles.whiskeyCard}>
                  <p style={styles.pourNumber}>Pour {index + 1}</p>

                  <h3 style={styles.whiskeyName}>{whiskey.name}</h3>

                  <p style={styles.type}>
                    {whiskey.style} · {whiskey.proof} proof
                  </p>

                  <p style={styles.label}>What to notice</p>
                  <p style={styles.notes}>{whiskey.notes}</p>

                  <p style={styles.label}>Why it fits</p>
                  <p style={styles.notes}>{whiskey.reason}</p>

                  {renderBottleTagButtons(whiskey)}
                </article>
              ))}
            </div>

            {wildcard && (
              <aside style={styles.wildcardCard}>
                <p style={styles.pourNumber}>Wildcard swap</p>
                <h3 style={styles.whiskeyName}>{wildcard.name}</h3>
                <p style={styles.type}>
                  {wildcard.style} · {wildcard.proof} proof
                </p>
                <p style={styles.notes}>
                  Want to make the flight a little less predictable? Swap this
                  into the lineup. It will replace one bottle and keep the final
                  flight duplicate-free.
                </p>
                <button style={styles.secondaryButton} onClick={useWildcard}>
                  Use Wildcard Swap
                </button>
              </aside>
            )}

            <button style={styles.primaryButton} onClick={handleSaveFlight}>
              Save This Flight
            </button>

            {saveMessage && <p style={styles.statusMessage}>{saveMessage}</p>}

            <button style={styles.secondaryButton} onClick={goToHistory}>
              View Saved Flights ({savedFlights.length})
            </button>

            <button style={styles.secondaryButton} onClick={reset}>
              Build Another Flight
            </button>
          </>
        )}

        {step === "history" && (
          <>
            <p style={styles.eyebrow}>Your saved flights</p>
            <h2 style={styles.title}>Flight History</h2>

            {savedFlights.length === 0 ? (
              <section style={styles.emptyState}>
                <p style={styles.text}>No saved flights yet.</p>
                <p style={styles.notes}>
                  Build a flight, save it, and it will show up here.
                </p>
              </section>
            ) : (
              <div style={styles.flightList}>
                {savedFlights.map((savedFlight) => (
                  <article key={savedFlight.id} style={styles.savedFlightCard}>
                    <p style={styles.pourNumber}>
                      {formatSavedDate(savedFlight.savedAt)}
                    </p>

                    <h3 style={styles.whiskeyName}>{savedFlight.name}</h3>
                    <p style={styles.type}>{savedFlight.theme}</p>

                    <ol style={styles.savedBottleList}>
                      {(savedFlight.bottles || []).map((bottle) => (
                        <li key={`${savedFlight.id}-${bottle.order}`}>
                          {bottle.name} · {bottle.proof} proof
                        </li>
                      ))}
                    </ol>

                    <p style={styles.label}>Why it worked</p>
                    <p style={styles.notes}>{savedFlight.explanation}</p>

                    <p style={styles.label}>Your rating</p>
                    <div style={styles.ratingButtonGroup}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          style={{
                            ...styles.ratingButton,
                            ...(rating <= (savedFlight.rating || 0)
                              ? styles.ratingButtonActive
                              : {}),
                          }}
                          onClick={() =>
                            handleUpdateSavedFlight(savedFlight.id, { rating })
                          }
                          aria-label={`Rate this flight ${rating} out of 5`}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <p style={styles.label}>Tasting notes</p>
                    <textarea
                      style={styles.tastingNotesInput}
                      value={savedFlight.tastingNotes || ""}
                      onChange={(event) =>
                        handleUpdateSavedFlight(savedFlight.id, {
                          tastingNotes: event.target.value,
                        })
                      }
                      placeholder="What did you notice? Nose, palate, finish, favorites, regrets..."
                    />

                    <button
                      style={styles.dangerButton}
                      onClick={() => handleDeleteSavedFlight(savedFlight.id)}
                    >
                      Delete Saved Flight
                    </button>
                  </article>
                ))}
              </div>
            )}

            <button style={styles.primaryButton} onClick={goBackFromHistory}>
              Back
            </button>
          </>
              )}

        {step === "shelf" && (
            <>
                <p style={styles.eyebrow}>Your bottles</p>
                <h2 style={styles.title}>Bottle Lists</h2>

                <p style={styles.text}>
                    Track what you own, want, love, want to revisit, want to avoid,
                    and bottles you finished.
                </p>

                {shelfMessage && <p style={styles.statusMessage}>{shelfMessage}</p>}

                <section style={styles.summaryBox}>
                    <p style={styles.label}>Counts</p>
                    <p style={styles.notes}>
                        Shelf: {bottleTagCounts.shelf} · Want: {bottleTagCounts.want} ·
                        Favorites: {bottleTagCounts.favorite} · Revisit:{" "}
                        {bottleTagCounts.revisit} · Avoid: {bottleTagCounts.avoid} ·
                        Finished: {bottleTagCounts.finished}
                    </p>
                    <p style={styles.notes}>
                        Showing {displayedShelfBottles.length} of {allBottles.length}.
                    </p>
                </section>

                <input
                    style={styles.searchInput}
                    value={shelfSearch}
                    onChange={(event) => setShelfSearch(event.target.value)}
                    placeholder="Search by name, style, notes, or vibe..."
                />

                <div style={styles.controlGrid}>
                    <select
                        style={styles.selectInput}
                        value={bottleListFilter}
                        onChange={(event) => setBottleListFilter(event.target.value)}
                    >
                        <option value="all">All bottles</option>
                        <option value={BOTTLE_TAGS.shelf}>My Shelf</option>
                        <option value={BOTTLE_TAGS.want}>Shopping List</option>
                        <option value={BOTTLE_TAGS.favorite}>Favorites</option>
                        <option value={BOTTLE_TAGS.revisit}>Revisit</option>
                        <option value={BOTTLE_TAGS.avoid}>Avoid</option>
                        <option value={BOTTLE_TAGS.finished}>Finished</option>
                    </select>

                    <select
                        style={styles.selectInput}
                        value={shelfStyleFilter}
                        onChange={(event) => setShelfStyleFilter(event.target.value)}
                    >
                        <option value="all">All styles</option>
                        <option value="bourbon">Bourbon</option>
                        <option value="rye">Rye</option>
                        <option value="scotch">Scotch</option>
                        <option value="irish">Irish</option>
                    </select>

                    <select
                        style={styles.selectInput}
                        value={shelfSortMode}
                        onChange={(event) => setShelfSortMode(event.target.value)}
                    >
                        <option value="taggedFirst">Tagged first</option>
                        <option value="az">A–Z</option>
                        <option value="proofLow">Proof low to high</option>
                        <option value="proofHigh">Proof high to low</option>
                    </select>
                </div>

                <div style={styles.quickFilterGrid}>
                    <button
                        style={
                            bottleListFilter === "all"
                                ? styles.activeTagButton
                                : styles.tagButton
                        }
                        onClick={() => setBottleListFilter("all")}
                    >
                        All
                    </button>
                    <button
                        style={
                            bottleListFilter === BOTTLE_TAGS.shelf
                                ? styles.activeTagButton
                                : styles.tagButton
                        }
                        onClick={() => setBottleListFilter(BOTTLE_TAGS.shelf)}
                    >
                        Shelf
                    </button>
                    <button
                        style={
                            bottleListFilter === BOTTLE_TAGS.want
                                ? styles.activeTagButton
                                : styles.tagButton
                        }
                        onClick={() => setBottleListFilter(BOTTLE_TAGS.want)}
                    >
                        Want
                    </button>
                    <button
                        style={
                            bottleListFilter === BOTTLE_TAGS.favorite
                                ? styles.activeTagButton
                                : styles.tagButton
                        }
                        onClick={() => setBottleListFilter(BOTTLE_TAGS.favorite)}
                    >
                        Favorites
                    </button>
                    <button
                        style={
                            bottleListFilter === BOTTLE_TAGS.revisit
                                ? styles.activeTagButton
                                : styles.tagButton
                        }
                        onClick={() => setBottleListFilter(BOTTLE_TAGS.revisit)}
                    >
                        Revisit
                    </button>
                    <button
                        style={
                            bottleListFilter === BOTTLE_TAGS.avoid
                                ? styles.activeTagButton
                                : styles.tagButton
                        }
                        onClick={() => setBottleListFilter(BOTTLE_TAGS.avoid)}
                    >
                        Avoid
                    </button>
                    <button
                        style={
                            bottleListFilter === BOTTLE_TAGS.finished
                                ? styles.activeTagButton
                                : styles.tagButton
                        }
                        onClick={() => setBottleListFilter(BOTTLE_TAGS.finished)}
                    >
                        Finished
                    </button>
                </div>

                {displayedShelfBottles.length === 0 && (
                    <section style={styles.emptyState}>
                        <p style={styles.notes}>
                            No bottles match that search. Try a broader search or clear the filters.
                        </p>
                    </section>
                )}

                <div style={styles.flightList}>
                    {displayedShelfBottles.map((whiskey) => {
                        const tags = getBottleTagsFromMap(whiskey);

                        return (
                            <article key={whiskey.name} style={styles.whiskeyCard}>
                                <h3 style={styles.whiskeyName}>{whiskey.name}</h3>

                                <p style={styles.type}>
                                    {whiskey.style} · {whiskey.proof} proof
                                </p>

                                <p style={styles.notes}>{whiskey.notes}</p>

                                {hasAnyBottleTag(whiskey) && (
                                    <p style={styles.tagSummary}>
                                        {tags.shelf ? "Shelf" : ""}
                                        {tags.want ? " · Want" : ""}
                                        {tags.favorite ? " · Favorite" : ""}
                                        {tags.revisit ? " · Revisit" : ""}
                                        {tags.avoid ? " · Avoid" : ""}
                                        {tags.finished ? " · Finished" : ""}
                                    </p>
                                )}

                                {renderBottleTagButtons(whiskey)}
                            </article>
                        );
                    })}
                </div>

                <button style={styles.primaryButton} onClick={() => setStep("mood")}>
                    Build a Flight
                </button>

                <button style={styles.secondaryButton} onClick={() => setStep("start")}>
                    Back Home
                </button>
            </>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #1a0d05 0%, #2d1608 45%, #120904 100%)",
    color: "#fff8ef",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  header: {
    maxWidth: "520px",
    margin: "0 auto 18px auto",
    padding: "14px 18px",
    borderRadius: "18px",
    background: "rgba(255, 248, 239, 0.08)",
    border: "1px solid rgba(255, 248, 239, 0.14)",
    textAlign: "center",
  },
  companyName: {
    margin: 0,
    color: "#fbbf24",
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "0.04em",
  },
  companyTagline: {
    margin: "6px 0 0 0",
    color: "#f5e7d4",
    fontSize: "14px",
  },
  card: {
    maxWidth: "520px",
    margin: "0 auto",
    padding: "30px 22px",
    borderRadius: "24px",
    background: "rgba(255, 248, 239, 0.10)",
    border: "1px solid rgba(255, 248, 239, 0.18)",
    boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#fbbf24",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: "800",
    textAlign: "center",
  },
  title: {
    margin: "0 0 16px",
    fontSize: "40px",
    lineHeight: "1.1",
    color: "#fff8ef",
    textAlign: "center",
  },
  text: {
    margin: "0 0 24px",
    fontSize: "20px",
    lineHeight: "1.5",
    color: "#f8ead8",
    textAlign: "center",
  },
  primaryButton: {
    width: "100%",
    padding: "16px",
    border: "0",
    borderRadius: "16px",
    background: "#f59e0b",
    color: "#1f1308",
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
    marginTop: "12px",
  },
  secondaryButton: {
    width: "100%",
    padding: "14px",
    marginTop: "12px",
    border: "1px solid rgba(255, 248, 239, 0.28)",
    borderRadius: "16px",
    background: "rgba(255, 248, 239, 0.14)",
    color: "#fff8ef",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
  },
  dangerButton: {
    width: "100%",
    padding: "12px",
    marginTop: "16px",
    border: "1px solid rgba(248, 113, 113, 0.36)",
    borderRadius: "14px",
    background: "rgba(127, 29, 29, 0.35)",
    color: "#fecaca",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
  },
  optionButton: {
    width: "100%",
    padding: "16px",
    marginBottom: "12px",
    border: "1px solid rgba(255, 248, 239, 0.22)",
    borderRadius: "16px",
    background: "rgba(255, 248, 239, 0.12)",
    color: "#fff8ef",
    fontSize: "17px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "left",
  },
  summaryBox: {
    padding: "16px",
    marginBottom: "18px",
    borderRadius: "18px",
    background: "rgba(251, 191, 36, 0.12)",
    border: "1px solid rgba(251, 191, 36, 0.24)",
  },
  flightList: {
    display: "grid",
    gap: "14px",
    marginBottom: "20px",
  },
  whiskeyCard: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 248, 239, 0.12)",
  },
  wildcardCard: {
    padding: "18px",
    marginBottom: "20px",
    borderRadius: "18px",
    background: "rgba(0, 0, 0, 0.35)",
    border: "1px solid rgba(251, 191, 36, 0.36)",
  },
  savedFlightCard: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(251, 191, 36, 0.22)",
  },
  emptyState: {
    padding: "22px",
    marginBottom: "18px",
    borderRadius: "18px",
    background: "rgba(0, 0, 0, 0.22)",
    border: "1px solid rgba(255, 248, 239, 0.12)",
    textAlign: "center",
  },
  statusMessage: {
    margin: "10px 0 0",
    color: "#bbf7d0",
    fontWeight: "800",
    textAlign: "center",
  },
  ratingButtonGroup: {
  display: "flex",
  gap: "8px",
  marginTop: "8px",
},

ratingButton: {
  flex: 1,
  padding: "10px 0",
  border: "1px solid rgba(255, 248, 239, 0.22)",
  borderRadius: "12px",
  background: "rgba(255, 248, 239, 0.10)",
  color: "#fed7aa",
  fontSize: "22px",
  cursor: "pointer",
},

ratingButtonActive: {
  background: "rgba(251, 191, 36, 0.26)",
  border: "1px solid rgba(251, 191, 36, 0.54)",
  color: "#fbbf24",
},

tastingNotesInput: {
  width: "100%",
  minHeight: "90px",
  marginTop: "8px",
  padding: "12px",
  boxSizing: "border-box",
  borderRadius: "14px",
  border: "1px solid rgba(255, 248, 239, 0.22)",
  background: "rgba(0, 0, 0, 0.28)",
  color: "#fff8ef",
  fontSize: "16px",
  fontFamily: "inherit",
  lineHeight: "1.4",
  resize: "vertical",
},
  searchInput: {
    width: "100%",
    padding: "14px",
    marginBottom: "12px",
    boxSizing: "border-box",
    borderRadius: "14px",
    border: "1px solid rgba(255, 248, 239, 0.22)",
    background: "rgba(0, 0, 0, 0.28)",
    color: "#fff8ef",
    fontSize: "16px",
    fontFamily: "inherit",
  },
  controlGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginBottom: "12px",
  },
  selectInput: {
    width: "100%",
    padding: "14px",
    boxSizing: "border-box",
    borderRadius: "14px",
    border: "1px solid rgba(255, 248, 239, 0.22)",
    background: "rgba(0, 0, 0, 0.28)",
    color: "#fff8ef",
    fontSize: "16px",
    fontFamily: "inherit",
  },
  quickFilterGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "16px",
  },
  tagButtonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "14px",
  },
  tagButton: {
    padding: "10px",
    border: "1px solid rgba(255, 248, 239, 0.22)",
    borderRadius: "12px",
    background: "rgba(255, 248, 239, 0.10)",
    color: "#fff8ef",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  activeTagButton: {
    padding: "10px",
    border: "1px solid rgba(251, 191, 36, 0.54)",
    borderRadius: "12px",
    background: "rgba(251, 191, 36, 0.24)",
    color: "#fef3c7",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
  },
  tagSummary: {
    margin: "12px 0 0",
    color: "#bbf7d0",
    fontSize: "13px",
    fontWeight: "800",
    lineHeight: "1.45",
  },
  savedBottleList: {
    margin: "8px 0 0",
    paddingLeft: "22px",
    color: "#fff8ef",
    lineHeight: "1.55",
  },
  pourNumber: {
    margin: "0 0 6px",
    color: "#fbbf24",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  whiskeyName: {
    margin: "0",
    fontSize: "22px",
    color: "#fff8ef",
  },
  type: {
    margin: "6px 0 16px",
    color: "#fed7aa",
    fontWeight: "700",
  },
  label: {
    margin: "14px 0 4px",
    color: "#fbbf24",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  notes: {
    margin: 0,
    color: "#fff8ef",
    lineHeight: "1.45",
  },
};

export default App;
