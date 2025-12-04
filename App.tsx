function App() {
  const openApp = () => {
    // ⬅️ Replace this with your real Google AI Studio app URL
    window.open("https://omnia-s-lightscape-pro-985622273280.us-west1.run.app", "_blank", "noopener");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        backgroundColor: "#050509",
        color: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          width: "100%",
          backgroundColor: "#0b0b12",
          borderRadius: 24,
          padding: "2.5rem 2rem",
          boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            lineHeight: 1.1,
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          LightScape Pro
        </h1>

        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.6,
            color: "#9ca3af",
            marginBottom: "1.75rem",
          }}
        >
          AI mockups for landscape lighting companies. Upload a photo of your
          client&apos;s home, tap where you want fixtures, and generate a
          photorealistic night-time design in seconds.
        </p>

        <button
          onClick={openApp}
          style={{
            padding: "0.9rem 2.4rem",
            borderRadius: 999,
            border: "none",
            backgroundColor: "#ffffff",
            color: "#000000",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 18px 45px rgba(0,0,0,0.4)",
          }}
        >
          Open the Mockup App
        </button>

        <p
          style={{
            fontSize: "0.8rem",
            color: "#6b7280",
            marginTop: "0.9rem",
          }}
        >
          Opens in a new tab. No install, built for landscape lighting pros.
        </p>
      </div>
    </main>
  );
}

export default App;
