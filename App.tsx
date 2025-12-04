function App() {
  const handleOpenApp = () => {
    // TODO: replace this with your real Google AI Studio app link
    window.open(https://aistudio.google.com/apps/drive/1ijoBwByMGfG5_gUI6uFTN26iLl-cmEIt?showAssistant=true&showPreview=true);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
        padding: "64px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f7f7f7",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          width: "100%",
          background: "#ffffff",
          padding: 40,
          borderRadius: 24,
          boxShadow: "0 18px 45px rgba(0,0,0,0.04)",
        }}
      >
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>
          LightScape Pro
        </h1>
        <p style={{ fontSize: 18, marginBottom: 24, color: "#444" }}>
          AI-powered mockups for landscape lighting pros.
          Upload your client&apos;s home, place your fixtures,
          and generate a realistic night-time design in seconds.
        </p>

        <button
          onClick={handleOpenApp}
          style={{
            padding: "14px 28px",
            borderRadius: 999,
            border: "none",
            background: "#000",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Launch Mockup App
        </button>

        <p style={{ fontSize: 12, marginTop: 12, color: "#888" }}>
          Opens the app in a new tab. No install required.
        </p>
      </div>
    </main>
  );
}

export default App;
