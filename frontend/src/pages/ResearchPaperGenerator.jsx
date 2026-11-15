import { useEffect, useState } from "react";

function ResearchQuestionExplorer() {
  const [generatingPaper, setGeneratingPaper] = useState(false);
  const [error, setError] = useState("");
  const [paperError, setPaperError] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const [advisorTopic, setAdvisorTopic] = useState("");
  const [generatedPaperUrl, setGeneratedPaperUrl] = useState("");
  const [generatedPaperType, setGeneratedPaperType] = useState("");

  // ==========================================================
  // RESEARCH PAPER MODULES
  // ==========================================================

  const paperModules = [
    {
      id: "abstract",
      title: "Abstract & Executive Summary",
      description:
        "Summarize the research problem, approach, key findings and significance.",
    },
    {
      id: "introduction",
      title: "Introduction",
      description:
        "Introduce the research area, background, problem and motivation.",
    },
    {
      id: "objectives",
      title: "Research Objectives",
      description:
        "Define the major objectives and goals of the proposed research.",
    },
    {
      id: "literature_review",
      title: "Literature Review",
      description:
        "Analyze existing research, approaches, findings and research gaps.",
    },
    {
      id: "methodology",
      title: "Methodology",
      description:
        "Describe the proposed research methodology, techniques and workflow.",
    },
    {
      id: "architecture",
      title: "System Architecture",
      description:
        "Explain the system design, components, data flow and architecture.",
    },
    {
      id: "results_discussion",
      title: "Results & Discussion",
      description:
        "Present expected or available results and discuss their significance.",
    },
    {
      id: "challenges",
      title: "Challenges & Limitations",
      description:
        "Discuss technical challenges, limitations and research constraints.",
    },
    {
      id: "future_scope",
      title: "Future Scope",
      description:
        "Explain possible improvements, extensions and future research directions.",
    },
    {
      id: "conclusion_references",
      title: "Conclusion & References",
      description:
        "Conclude the research and provide properly structured references.",
    },
  ];

  // ==========================================================
  // RECEIVE ADVISOR SELECTED TOPIC
  // ==========================================================

  useEffect(() => {
    const selectedTopic = localStorage.getItem(
      "researchIQ_selected_topic"
    );

    if (selectedTopic && selectedTopic.trim()) {
      const cleanTopic = selectedTopic.trim();

      setAdvisorTopic(cleanTopic);
      setError("");
    }
  }, []);

  // ==========================================================
  // SELECT / DESELECT PAPER MODULE
  // ==========================================================

  const toggleModule = (moduleId) => {
    setPaperError("");

    setSelectedModules((previous) => {
      const alreadySelected = previous.includes(moduleId);

      if (alreadySelected) {
        return previous.filter((id) => id !== moduleId);
      }

      return [...previous, moduleId];
    });
  };

  // ==========================================================
  // GENERATE RESEARCH PAPER
  // ==========================================================

  const handleGeneratePaper = async () => {
    const selectedTopic =
      advisorTopic.trim() ||
      localStorage.getItem("researchIQ_selected_topic")?.trim();

    if (!selectedTopic) {
      setPaperError(
        "No research topic was received from the Research Project Advisor."
      );
      return;
    }

    if (selectedModules.length === 0) {
      setPaperError(
        "Please select at least one research paper module."
      );
      return;
    }

    setGeneratingPaper(true);
    setPaperError("");

    if (generatedPaperUrl && generatedPaperType === "blob") {
      window.URL.revokeObjectURL(generatedPaperUrl);
    }

    setGeneratedPaperUrl("");
    setGeneratedPaperType("");

    try {
      const selectedModuleDetails = paperModules.filter((module) =>
        selectedModules.includes(module.id)
      );

      console.log("🚀 Generating research paper...");

      const response = await fetch(
        "http://127.0.0.1:5000/api/core/generate-paper",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: selectedTopic,

            modules: selectedModuleDetails.map((module) => ({
              id: module.id,
              title: module.title,
              description: module.description,
            })),

            supporting_papers: [],
            output_format: "pdf",
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!response.ok) {
        let message = "Research paper generation failed.";

        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // Response was not JSON.
        }

        throw new Error(message);
      }

      // ==============================================
      // JSON RESPONSE FROM BACKEND
      // ==============================================

      if (contentType.includes("application/json")) {
        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || "Research paper generation failed."
          );
        }

        const pdfPath = data.pdf_path;

        if (!pdfPath) {
          throw new Error(
            "Paper generated, but no PDF path was returned."
          );
        }

        const filename = pdfPath.split(/[\\/]/).pop();

        if (!filename) {
          throw new Error(
            "Could not determine the generated PDF filename."
          );
        }

        const paperUrl =
          `http://127.0.0.1:5000/api/core/download/${encodeURIComponent(
            filename
          )}`;

        setGeneratedPaperUrl(paperUrl);
        setGeneratedPaperType("url");

        console.log("✅ PDF ready:", paperUrl);

        return;
      }

      // ==============================================
      // DIRECT PDF RESPONSE
      // ==============================================

      if (contentType.includes("application/pdf")) {
        const blob = await response.blob();

        if (!blob || blob.size === 0) {
          throw new Error(
            "The generated PDF is empty."
          );
        }

        const url = window.URL.createObjectURL(blob);

        setGeneratedPaperUrl(url);
        setGeneratedPaperType("blob");

        console.log("✅ PDF received directly.");

        return;
      }

      throw new Error(
        "The server returned an unsupported response."
      );
    } catch (err) {
      console.error(
        "❌ RESEARCH PAPER GENERATION ERROR:",
        err
      );

      setPaperError(
        err.message ||
          "Could not generate the research paper."
      );
    } finally {
      setGeneratingPaper(false);
    }
  };

  // ==========================================================
  // DOWNLOAD GENERATED PAPER
  // ==========================================================

  const handleDownloadPaper = async () => {
    if (!generatedPaperUrl) {
      return;
    }

    try {
      // Direct Blob PDF
      if (generatedPaperType === "blob") {
        const link = document.createElement("a");

        link.href = generatedPaperUrl;
        link.download = "ResearchIQ_Research_Paper.pdf";

        document.body.appendChild(link);
        link.click();
        link.remove();

        return;
      }

      // Backend PDF URL
      const response = await fetch(
        generatedPaperUrl
      );

      if (!response.ok) {
        throw new Error(
          "Could not download the generated research paper."
        );
      }

      const blob = await response.blob();

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "ResearchIQ_Research_Paper.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(
        "❌ PAPER DOWNLOAD ERROR:",
        err
      );

      setPaperError(
        "Could not download the generated research paper."
      );
    }
  };

  // ==========================================================
  // OPEN GENERATED PAPER
  // ==========================================================

  const handleOpenPaper = async () => {
    if (!generatedPaperUrl) {
      return;
    }

    // If the PDF is already a browser-created blob,
    // open it directly in a new tab.

    if (generatedPaperType === "blob") {
      window.open(
        generatedPaperUrl,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    try {
      // Open the tab immediately so the browser does not
      // block it as a popup after the async fetch.

      const newTab = window.open(
        "",
        "_blank",
        "noopener,noreferrer"
      );

      if (!newTab) {
        setPaperError(
          "Please allow pop-ups in your browser to open the PDF in a new tab."
        );

        return;
      }

      const response = await fetch(
        generatedPaperUrl
      );

      if (!response.ok) {
        newTab.close();

        throw new Error(
          "Could not open the generated research paper."
        );
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        newTab.close();

        throw new Error(
          "The generated PDF is empty."
        );
      }

      const pdfUrl =
        window.URL.createObjectURL(blob);

      newTab.location.href = pdfUrl;

      // Give the browser enough time to load the PDF
      // before releasing the object URL.

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (err) {
      console.error(
        "❌ PAPER OPEN ERROR:",
        err
      );

      setPaperError(
        "Could not open the generated research paper."
      );
    }
  };

  return (
    <div style={styles.page}>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header style={styles.navbar}>
        <div style={styles.navbarInner}>

          <div
            style={styles.brand}
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            <div style={styles.brandMark}>
              R
            </div>

            <div style={styles.brandName}>
              Research
              <span style={styles.brandAccent}>
                IQ
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <main>

        <section style={styles.heroSection}>
          <div style={styles.heroContainer}>

            <div style={styles.badge}>
              <span>⌕</span>
              RESEARCH PAPER GENERATOR
            </div>

            <h1 style={styles.heroTitle}>
              Turn your research idea into
              <br />

              <span style={styles.gradientText}>
                a structured paper.
              </span>
            </h1>

            <p style={styles.heroDescription}>
              Use your selected research topic and
              choose the sections you want ResearchIQ
              to generate into an academic research paper.
            </p>

            {/* =================================================
                ADVISOR TOPIC
            ================================================= */}

            {advisorTopic && (
              <div style={styles.advisorTopicCard}>

                <div style={styles.advisorTopicLabel}>
                  ADVISOR SELECTED TOPIC
                </div>

                <div style={styles.advisorTopic}>
                  {advisorTopic}
                </div>

                <div style={styles.advisorTopicNote}>
                  This topic was selected from the
                  Research Project Advisor and will be
                  used for your research paper.
                </div>

              </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div style={styles.errorBox}>

                <span style={styles.errorIcon}>
                  !
                </span>

                {error}

              </div>
            )}

          </div>
        </section>

        {/* =====================================================
            RESEARCH PAPER GENERATOR
        ===================================================== */}

        <section style={styles.resultsSection}>

          <div style={styles.contentContainer}>

            <section style={styles.generatorCard}>

              <div style={styles.generatorIcon}>
                ✦
              </div>

              <div style={styles.generatorContent}>

                <div style={styles.sectionEyebrow}>
                  AI RESEARCH WRITING
                </div>

                <h2 style={styles.generatorTitle}>
                  Build your
                  <span style={styles.generatorHighlight}>
                    {" "}
                    research paper.
                  </span>
                </h2>

                <p style={styles.generatorText}>
                  Choose the sections you want for
                  your research paper. ResearchIQ will
                  use your Advisor-selected topic to
                  generate those sections into a
                  structured academic document.
                </p>

                {/* =================================================
                    MODULE COUNTER
                ================================================= */}

                <div style={styles.moduleHeader}>

                  <div>

                    <div style={styles.inputLabel}>
                      PAPER MODULES
                    </div>

                    <p style={styles.moduleInstruction}>
                      Select the modules you want to include.
                    </p>

                  </div>

                  <div
                    style={{
                      ...styles.moduleCounter,

                      ...(selectedModules.length > 0
                        ? styles.moduleCounterComplete
                        : {}),
                    }}
                  >
                    {selectedModules.length} selected
                  </div>

                </div>

                {/* =================================================
                    MODULE GRID
                ================================================= */}

                <div style={styles.moduleGrid}>

                  {paperModules.map((module) => {

                    const selected =
                      selectedModules.includes(
                        module.id
                      );

                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() =>
                          toggleModule(
                            module.id
                          )
                        }
                        style={{
                          ...styles.moduleCard,

                          ...(selected
                            ? styles.moduleCardSelected
                            : {}),
                        }}
                      >

                        <div style={styles.moduleTop}>

                          <div
                            style={{
                              ...styles.moduleCheckbox,

                              ...(selected
                                ? styles.moduleCheckboxSelected
                                : {}),
                            }}
                          >
                            {selected
                              ? "✓"
                              : ""}
                          </div>

                          <span
                            style={
                              styles.moduleNumber
                            }
                          >
                            {String(
                              paperModules.indexOf(
                                module
                              ) + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                        </div>

                        <h3
                          style={
                            styles.moduleTitle
                          }
                        >
                          {module.title}
                        </h3>

                        <p
                          style={
                            styles.moduleDescription
                          }
                        >
                          {module.description}
                        </p>

                      </button>
                    );
                  })}

                </div>

                {/* =================================================
                    PAPER ERROR
                ================================================= */}

                {paperError && (
                  <div style={styles.errorBox}>

                    <span style={styles.errorIcon}>
                      !
                    </span>

                    {paperError}

                  </div>
                )}

                {/* =================================================
                    GENERATE
                ================================================= */}

                <button
                  type="button"
                  style={{
                    ...styles.generateButton,

                    opacity:
                      generatingPaper
                        ? 0.65
                        : 1,

                    cursor:
                      generatingPaper
                        ? "not-allowed"
                        : "pointer",
                  }}
                  onClick={
                    handleGeneratePaper
                  }
                  disabled={
                    generatingPaper
                  }
                >
                  {generatingPaper
                    ? "Generating Research Paper..."
                    : "Generate Research Paper →"}
                </button>

              </div>

            </section>

            {/* =====================================================
                GENERATED PAPER
            ===================================================== */}

            {generatedPaperUrl && (
              <section
                style={
                  styles.generatedPaperSection
                }
              >

                <div
                  style={
                    styles.generatedPaperHeader
                  }
                >

                  <div>

                    <div
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      GENERATED DOCUMENT
                    </div>

                    <h2
                      style={
                        styles.generatedPaperTitle
                      }
                    >
                      Your research paper is ready.
                    </h2>

                    <p
                      style={
                        styles.generatedPaperSubtitle
                      }
                    >
                      The generated PDF is available below.
                      You can read it here or download it
                      to your device.
                    </p>

                  </div>

                  <div
                    style={
                      styles.generatedPaperActions
                    }
                  >

                    <button
                      type="button"
                      onClick={
                        handleOpenPaper
                      }
                      style={
                        styles.paperViewButton
                      }
                    >
                      Open in New Tab ↗
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleDownloadPaper
                      }
                      style={
                        styles.paperDownloadButton
                      }
                    >
                      Download PDF ↓
                    </button>

                  </div>

                </div>

                <div
                  style={styles.pdfViewer}
                >
                  <iframe
                    src={
                      generatedPaperUrl
                    }
                    title="Generated Research Paper"
                    style={
                      styles.pdfFrame
                    }
                  />
                </div>

              </section>
            )}

          </div>

        </section>

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {!advisorTopic &&
          !generatedPaperUrl && (
            <section
              style={styles.infoSection}
            >

              <div
                style={
                  styles.contentContainer
                }
              >

                <div
                  style={styles.sectionHeader}
                >

                  <div
                    style={
                      styles.sectionEyebrow
                    }
                  >
                    RESEARCH PAPER GENERATION
                  </div>

                  <h2
                    style={styles.sectionTitle}
                  >
                    Start with your selected research idea.
                  </h2>

                  <p
                    style={
                      styles.sectionDescription
                    }
                  >
                    Select a topic from the Research
                    Project Advisor first. Your selected
                    topic will automatically appear here
                    and can then be turned into a structured
                    research paper.
                  </p>

                </div>

                <div
                  style={styles.featureGrid}
                >

                  <FeatureCard
                    icon="◎"
                    title="Advisor Topic"
                    text="Use the research topic selected through the Research Project Advisor."
                  />

                  <FeatureCard
                    icon="⌕"
                    title="Focused Research"
                    text="Keep the generated paper centered on your selected research direction."
                  />

                  <FeatureCard
                    icon="↗"
                    title="Paper Modules"
                    text="Choose exactly which research paper sections you want to generate."
                  />

                  <FeatureCard
                    icon="✦"
                    title="Generated PDF"
                    text="View the generated research paper directly on this page and download it as a PDF."
                  />

                </div>

              </div>

            </section>
          )}

      </main>

    </div>
  );
}

/* ============================================================
   FEATURE CARD
============================================================ */

function FeatureCard({
  icon,
  title,
  text,
}) {
  return (
    <div style={styles.featureCard}>

      <div style={styles.featureIcon}>
        {icon}
      </div>

      <h3 style={styles.featureTitle}>
        {title}
      </h3>

      <p style={styles.featureText}>
        {text}
      </p>

    </div>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 50% 0%, rgba(96,165,250,0.06), transparent 32%), #05070D",
    color: "#E2E8F0",
    fontFamily:
      "'Inter', 'Segoe UI', sans-serif",
  },

  /* ==========================================================
     NAVBAR
  ========================================================== */

  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderBottom:
      "1px solid rgba(148,163,184,0.07)",
    background:
      "rgba(5,7,13,0.88)",
    backdropFilter: "blur(16px)",
  },

  navbarInner: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },

  brandMark: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.15))",
    border:
      "1px solid rgba(96,165,250,0.2)",
    color: "#93C5FD",
    fontWeight: 800,
    fontSize: "14px",
  },

  brandName: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    color: "#F8FAFC",
  },

  brandAccent: {
    color: "#60A5FA",
  },

  navLink: {
    background: "transparent",
    border: "none",
    color: "#94A3B8",
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: "12px",
  },

  secondaryButton: {
    padding: "8px 13px",
    borderRadius: "7px",
    background:
      "rgba(148,163,184,0.035)",
    border:
      "1px solid rgba(148,163,184,0.11)",
    color: "#94A3B8",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
  },

  /* ==========================================================
     HERO
  ========================================================== */

  heroSection: {
    padding: "90px 20px 60px",
  },

  heroContainer: {
    maxWidth: "920px",
    margin: "0 auto",
    textAlign: "center",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 12px",
    borderRadius: "999px",
    border:
      "1px solid rgba(96,165,250,0.18)",
    background:
      "rgba(96,165,250,0.055)",
    color: "#93C5FD",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.1px",
    marginBottom: "22px",
  },

  heroTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    fontSize:
      "clamp(40px, 6vw, 68px)",
    lineHeight: 1.05,
    letterSpacing: "-2.5px",
    margin: "0 0 22px",
    color: "#F8FAFC",
  },

  gradientText: {
    background:
      "linear-gradient(90deg, #60A5FA, #22D3EE, #A78BFA)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  heroDescription: {
    maxWidth: "650px",
    margin: "0 auto 28px",
    color: "#94A3B8",
    fontSize: "15px",
    lineHeight: 1.8,
  },

  /* ==========================================================
     ADVISOR TOPIC
  ========================================================== */

  advisorTopicCard: {
    margin: "0 auto 20px",
    maxWidth: "780px",
    padding: "15px 18px",
    borderRadius: "10px",
    border:
      "1px solid rgba(96,165,250,0.16)",
    background:
      "rgba(96,165,250,0.045)",
    textAlign: "left",
  },

  advisorTopicLabel: {
    color: "#60A5FA",
    fontSize: "8px",
    letterSpacing: "1.4px",
    fontWeight: 700,
    marginBottom: "7px",
  },

  advisorTopic: {
    color: "#E2E8F0",
    fontFamily:
      "'Space Grotesk', sans-serif",
    fontSize: "15px",
    fontWeight: 600,
  },

  advisorTopicNote: {
    marginTop: "6px",
    color: "#64748B",
    fontSize: "10px",
  },

  /* ==========================================================
     ERRORS
  ========================================================== */

  errorBox: {
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "13px 16px",
    borderRadius: "9px",
    border:
      "1px solid rgba(248,113,113,0.18)",
    background:
      "rgba(248,113,113,0.045)",
    color: "#FCA5A5",
    fontSize: "12px",
    textAlign: "left",
  },

  errorIcon: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border:
      "1px solid rgba(248,113,113,0.25)",
    fontSize: "10px",
    fontWeight: 700,
  },

  /* ==========================================================
     GENERAL
  ========================================================== */

  contentContainer: {
    maxWidth: "1120px",
    margin: "0 auto",
  },

  infoSection: {
    padding: "20px 20px 80px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },

  sectionEyebrow: {
    color: "#60A5FA",
    fontSize: "10px",
    letterSpacing: "1.5px",
    fontWeight: 700,
    marginBottom: "9px",
  },

  sectionTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    fontSize: "28px",
    color: "#F8FAFC",
    margin: "0 0 9px",
  },

  sectionDescription: {
    maxWidth: "650px",
    margin: "0 auto",
    color: "#64748B",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  /* ==========================================================
     FEATURE CARDS
  ========================================================== */

  featureGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "13px",
  },

  featureCard: {
    padding: "21px",
    borderRadius: "12px",
    border:
      "1px solid rgba(148,163,184,0.08)",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.68), rgba(8,12,22,0.75))",
  },

  featureIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    marginBottom: "16px",
    background:
      "rgba(96,165,250,0.07)",
    border:
      "1px solid rgba(96,165,250,0.12)",
    color: "#60A5FA",
    fontSize: "17px",
  },

  featureTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "15px",
    margin: "0 0 8px",
  },

  featureText: {
    color: "#64748B",
    fontSize: "12px",
    lineHeight: 1.65,
    margin: 0,
  },

  /* ==========================================================
     RESULTS / GENERATOR
  ========================================================== */

  resultsSection: {
    padding: "25px 20px 80px",
  },

  generatorCard: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
    marginTop: "0",
    padding: "25px",
    borderRadius: "13px",
    border:
      "1px solid rgba(96,165,250,0.1)",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.045), rgba(167,139,250,0.035))",
  },

  generatorIcon: {
    width: "43px",
    height: "43px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background:
      "rgba(167,139,250,0.08)",
    border:
      "1px solid rgba(167,139,250,0.13)",
    color: "#A78BFA",
    fontSize: "19px",
  },

  generatorContent: {
    flex: 1,
    minWidth: 0,
  },

  generatorTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "23px",
    lineHeight: 1.35,
    margin: "0 0 8px",
  },

  generatorHighlight: {
    background:
      "linear-gradient(90deg, #60A5FA, #22D3EE, #A78BFA)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  generatorText: {
    color: "#64748B",
    fontSize: "12px",
    lineHeight: 1.7,
    maxWidth: "800px",
    margin: "0 0 20px",
  },

  /* ==========================================================
     MODULE SELECTION
  ========================================================== */

  moduleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "10px",
  },

  inputLabel: {
    color: "#475569",
    fontSize: "8px",
    letterSpacing: "1px",
    fontWeight: 700,
    marginBottom: "5px",
  },

  moduleInstruction: {
    margin: "-3px 0 0",
    color: "#64748B",
    fontSize: "11px",
  },

  moduleCounter: {
    minWidth: "80px",
    padding: "8px 11px",
    borderRadius: "8px",
    border:
      "1px solid rgba(148,163,184,0.1)",
    background:
      "rgba(148,163,184,0.035)",
    color: "#64748B",
    textAlign: "center",
    fontSize: "11px",
    fontWeight: 700,
  },

  moduleCounterComplete: {
    border:
      "1px solid rgba(96,165,250,0.25)",
    background:
      "rgba(96,165,250,0.09)",
    color: "#93C5FD",
  },

  moduleGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "9px",
  },

  moduleCard: {
    padding: "14px",
    borderRadius: "9px",
    border:
      "1px solid rgba(148,163,184,0.09)",
    background:
      "rgba(5,7,13,0.45)",
    color: "#E2E8F0",
    textAlign: "left",
    cursor: "pointer",
    transition:
      "border-color 0.2s ease, background 0.2s ease",
  },

  moduleCardSelected: {
    border:
      "1px solid rgba(96,165,250,0.3)",
    background:
      "rgba(96,165,250,0.065)",
  },

  moduleTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  moduleCheckbox: {
    width: "20px",
    height: "20px",
    borderRadius: "5px",
    border:
      "1px solid rgba(148,163,184,0.18)",
    background:
      "rgba(148,163,184,0.035)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#93C5FD",
    fontSize: "11px",
    fontWeight: 800,
  },

  moduleCheckboxSelected: {
    border:
      "1px solid rgba(96,165,250,0.35)",
    background:
      "rgba(96,165,250,0.12)",
  },

  moduleNumber: {
    color: "#334155",
    fontSize: "9px",
    letterSpacing: "1px",
    fontWeight: 700,
  },

  moduleTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#CBD5E1",
    fontSize: "13px",
    lineHeight: 1.4,
    margin: "0 0 6px",
  },

  moduleDescription: {
    color: "#64748B",
    fontSize: "10px",
    lineHeight: 1.55,
    margin: 0,
  },

  /* ==========================================================
     GENERATE BUTTON
  ========================================================== */

  generateButton: {
    width: "100%",
    marginTop: "15px",
    padding: "12px 18px",
    borderRadius: "8px",
    border:
      "1px solid rgba(96,165,250,0.2)",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.17), rgba(167,139,250,0.14))",
    color: "#BFDBFE",
    fontSize: "11px",
    fontWeight: 700,
  },

  /* ==========================================================
     GENERATED PAPER
  ========================================================== */

  generatedPaperSection: {
    marginTop: "28px",
    padding: "25px",
    borderRadius: "13px",
    border:
      "1px solid rgba(96,165,250,0.12)",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.72), rgba(7,11,20,0.82))",
  },

  generatedPaperHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "18px",
  },

  generatedPaperTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#F8FAFC",
    fontSize: "23px",
    lineHeight: 1.35,
    margin: "0 0 7px",
  },

  generatedPaperSubtitle: {
    color: "#64748B",
    fontSize: "12px",
    lineHeight: 1.65,
    margin: 0,
  },

  generatedPaperActions: {
    display: "flex",
    gap: "8px",
    flexShrink: 0,
    flexWrap: "wrap",
  },

  paperViewButton: {
    padding: "10px 13px",
    borderRadius: "7px",
    border:
      "1px solid rgba(148,163,184,0.12)",
    background:
      "rgba(148,163,184,0.035)",
    color: "#94A3B8",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  paperDownloadButton: {
    padding: "10px 13px",
    borderRadius: "7px",
    border:
      "1px solid rgba(96,165,250,0.2)",
    background:
      "rgba(96,165,250,0.09)",
    color: "#BFDBFE",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  pdfViewer: {
    width: "100%",
    height: "850px",
    overflow: "hidden",
    borderRadius: "10px",
    border:
      "1px solid rgba(148,163,184,0.09)",
    background: "#FFFFFF",
  },

  pdfFrame: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  },

  /* ==========================================================
     EMPTY / LOADING
  ========================================================== */

  emptyState: {
    textAlign: "center",
    padding: "65px 20px",
    borderRadius: "12px",
    border:
      "1px solid rgba(148,163,184,0.07)",
    background:
      "rgba(15,23,42,0.35)",
  },

  emptyIcon: {
    fontSize: "30px",
    color: "#475569",
    marginBottom: "12px",
  },

  emptyTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#CBD5E1",
    fontSize: "18px",
    margin: "0 0 7px",
  },

  emptyText: {
    color: "#64748B",
    fontSize: "12px",
    margin: 0,
  },
};

export default ResearchQuestionExplorer;