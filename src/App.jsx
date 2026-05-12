import { useState } from "react";
import { whiskeys } from "./data/whiskeys/whiskeys";

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

  function buildFlight(selectedVibe) {
    const matches = whiskeys.filter((whiskey) => hasVibe(whiskey, selectedVibe));
    const fallback = whiskeys.filter(
      (whiskey) => !hasVibe(whiskey, selectedVibe)
    );

    const selectedWhiskeys = uniqueByName([
      ...shuffle(matches),
      ...shuffle(fallback),
    ]).slice(0, 3);

    return sortByProof(selectedWhiskeys);
  }

  function buildWildcard(selectedVibe, selectedFlight) {
    const flightNames = new Set(
      selectedFlight.map((whiskey) => whiskey.name.trim().toLowerCase())
    );

    const outsideCurrentFlight = uniqueByName(whiskeys).filter(
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

  function chooseVibe(vibe) {
    const newFlight = buildFlight(vibe);

    setChoice(vibe);
    setFlight(newFlight);
    setWildcard(buildWildcard(vibe, newFlight));
    setStep("result");
  }

  function useWildcard() {
    if (!wildcard) {
      return;
    }

    const newFlight = sortByProof([...flight.slice(0, 2), wildcard]);

    setFlight(newFlight);
    setWildcard(buildWildcard(choice, newFlight));
  }

  function reset() {
    setChoice("");
    setFlight([]);
    setWildcard(null);
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
            <h1 style={styles.title}>🥃 Flight Deck</h1>
            <p style={styles.text}>
              Pick a vibe and get a simple three-whiskey tasting flight.
            </p>

            <button style={styles.primaryButton} onClick={() => setStep("mood")}>
              Build My Flight
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

            <button style={styles.primaryButton} onClick={reset}>
              Build Another Flight
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
  },
  secondaryButton: {
    width: "100%",
    padding: "14px",
    marginTop: "16px",
    border: "1px solid rgba(255, 248, 239, 0.28)",
    borderRadius: "16px",
    background: "rgba(255, 248, 239, 0.14)",
    color: "#fff8ef",
    fontSize: "16px",
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
