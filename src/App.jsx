import { useState } from "react";

function App() {
  const [step, setStep] = useState("start");
  const [mood, setMood] = useState("");

  const start = () => setStep("question");

  const selectMood = (value) => {
    setMood(value);
    setStep("result");
  };

  const reset = () => {
    setMood("");
    setStep("start");
  };

  return (
    <div style={styles.container}>
      {step === "start" && (
        <>
          <h1 style={styles.title}>🥃 Flight Deck</h1>
          <p style={styles.text}>Build your perfect whiskey flight</p>
          <button style={styles.button} onClick={start}>
            Start
          </button>
        </>
      )}

      {step === "question" && (
        <>
          <h2 style={styles.title}>What’s your mood?</h2>

          <button style={styles.button} onClick={() => selectMood("bold")}>
            Bold & Smoky
          </button>

          <button style={styles.button} onClick={() => selectMood("easy")}>
            Easy & Smooth
          </button>
        </>
      )}

      {step === "result" && (
        <>
          <h2 style={styles.title}>Your Flight</h2>

          <p style={styles.text}>
            Mood: <strong>{mood}</strong>
          </p>

          <ul style={styles.list}>
            <li>🥃 Whiskey 1</li>
            <li>🥃 Whiskey 2</li>
            <li>🥃 Whiskey 3</li>
          </ul>

          <button style={styles.button} onClick={reset}>
            Try Again
          </button>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "sans-serif",
    maxWidth: "480px",
    margin: "0 auto",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
  },
  text: {
    marginBottom: "20px",
  },
  button: {
    display: "block",
    width: "100%",
    padding: "15px",
    marginBottom: "10px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#333",
    color: "white",
  },
  list: {
    listStyle: "none",
    padding: 0,
    marginBottom: "20px",
  },
};

export default App;