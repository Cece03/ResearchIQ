import { useState } from "react";
import { useLocation } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000/api/opencitations";

function ResearchPaperQA() {
  const location = useLocation();

  const incomingPaper =
    location.state?.selectedPaper ||
    location.state?.paper ||
    null;

  const [paper, setPaper] = useState(incomingPaper);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);

  const [loading, setLoading] = useState(false);
  const [paperLoading, setPaperLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  // ==========================================================
  // LOAD SAVED PAPER
  // ==========================================================

  const loadSavedPaper = async () => {
    setPaperLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/saved-paper`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load saved paper."
        );
      }

      setPaper(data.paper);
    } catch (err) {
      console.error("LOAD PAPER ERROR:", err);

      setError(
        err.message ||
          "Could not load the selected research paper."
      );
    } finally {
      setPaperLoading(false);
    }
  };

  // ==========================================================
  // UPLOAD PAPER
  // ==========================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setError("");
  };

  const uploadPaper = async () => {
    if (!selectedFile) {
      setError("Please select a research document first.");
      return;
    }

    setPaperLoading(true);
    setError("");
    setAnswer(null);

    try {
      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response = await fetch(
        `${API_BASE}/upload-paper`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to process the research document."
        );
      }

      setPaper(data.paper);
    } catch (err) {
      console.error("UPLOAD PAPER ERROR:", err);

      setError(
        err.message ||
          "Could not process the uploaded document."
      );
    } finally {
      setPaperLoading(false);
    }
  };

  // ==========================================================
  // ASK QUESTION
  // ==========================================================

  const askQuestion = async () => {
    const finalQuestion = question.trim();

    if (!finalQuestion) {
      setError("Please enter a question.");
      return;
    }

    if (!paper) {
      setError(
        "Please select or upload a research paper first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setAnswer(null);

    try {
      const response = await fetch(
        `${API_BASE}/ask`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            question: finalQuestion,

            paper: {
              title: paper.title,
              authors: paper.authors,
              publication_date:
                paper.publication_date,
              publication_name:
                paper.publication_name,
              doi: paper.doi,
              abstract: paper.abstract,
              core_id: paper.core_id,
              eid: paper.eid,
            },

            identifier:
              paper.doi
                ? `doi:${paper.doi.replace(
                    "https://doi.org/",
                    ""
                  )}`
                : paper.identifier || "",

            document_id:
              paper.document_id || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to answer the question."
        );
      }

      setAnswer(data);
      setQuestion("");
    } catch (err) {
      console.error("PAPER QUESTION ERROR:", err);

      setError(
        err.message ||
          "Could not generate an answer."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

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

          <div style={{ flex: 1 }} />

          <button
            style={styles.navLink}
            onClick={() =>
              window.history.back()
            }
          >
            ← Back
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() =>
              alert("My Research will be connected here.")
            }
          >
            My Research
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() =>
              alert("Login page will open here.")
            }
          >
            Login
          </button>

        </div>
      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* ===================================================
            HERO
        =================================================== */}

        <section style={styles.heroSection}>

          <div style={styles.heroContainer}>

            <div style={styles.badge}>
              <span>✦</span>
              RESEARCH QUESTION EXPLORER
            </div>

            <h1 style={styles.heroTitle}>
              Ask questions.
              <br />

              <span style={styles.gradientText}>
                Understand research.
              </span>
            </h1>

            <p style={styles.heroDescription}>
              Explore research papers through intelligent
              question answering. Upload your research
              document, process it, and ask questions
              directly about its contents.
            </p>

          </div>

        </section>


        {/* ===================================================
            DOCUMENT SELECTOR
        =================================================== */}

        <section style={styles.selectorSection}>

          <div style={styles.contentContainer}>

            <div style={styles.selectorCard}>

              <div style={styles.selectorHeader}>

                <div>
                  <div style={styles.sectionEyebrow}>
                    RESEARCH DOCUMENT
                  </div>

                  <h2 style={styles.sectionTitle}>
                    Upload a document to explore
                  </h2>

                  <p style={styles.sectionDescriptionLeft}>
                    Select a saved research paper or upload
                    your own document. ResearchIQ will process
                    it as the source for your questions.
                  </p>
                </div>

                <button
                  style={{
                    ...styles.loadButton,
                    opacity: paperLoading ? 0.65 : 1,
                    cursor: paperLoading
                      ? "not-allowed"
                      : "pointer",
                  }}
                  onClick={loadSavedPaper}
                  disabled={paperLoading}
                >
                  {paperLoading
                    ? "Loading..."
                    : "Load Saved Paper"}
                </button>

              </div>


              {/* UPLOAD */}

              <div style={styles.uploadArea}>

                <div style={styles.uploadIcon}>
                  ↑
                </div>

                <div style={styles.uploadContent}>

                  <h3 style={styles.uploadTitle}>
                    Upload your research document
                  </h3>

                  <p style={styles.uploadText}>
                    Upload a PDF or Word document and
                    ResearchIQ will process it as the
                    source for your questions.
                  </p>

                  <div style={styles.fileTypes}>
                    PDF · DOC · DOCX
                  </div>

                  {selectedFile && (
                    <div style={styles.selectedFile}>
                      <span style={styles.selectedFileIcon}>
                        ✓
                      </span>

                      <span>
                        {selectedFile.name}
                      </span>
                    </div>
                  )}

                </div>


                <div style={styles.uploadActions}>

                  <label style={styles.chooseFileButton}>
                    Choose File

                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      hidden
                    />
                  </label>

                  {selectedFile && (
                    <button
                      style={{
                        ...styles.processButton,
                        opacity: paperLoading
                          ? 0.65
                          : 1,
                        cursor: paperLoading
                          ? "not-allowed"
                          : "pointer",
                      }}
                      onClick={uploadPaper}
                      disabled={paperLoading}
                    >
                      {paperLoading
                        ? "Processing..."
                        : "Process Document →"}
                    </button>
                  )}

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <section style={styles.errorSection}>
            <div style={styles.contentContainer}>
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>
                  !
                </span>

                <span>{error}</span>
              </div>
            </div>
          </section>
        )}


        {/* ===================================================
            PROCESSED RESEARCH PAPER
        =================================================== */}

        {paper && (

          <section style={styles.paperSection}>

            <div style={styles.contentContainer}>

              <div style={styles.paperCard}>

                <div style={styles.paperTop}>

                  <div style={styles.paperTypeBadge}>
                    RESEARCH PAPER
                  </div>

                  {paper.document_id && (
                    <div style={styles.documentId}>
                      ID: {paper.document_id}
                    </div>
                  )}

                </div>


                <h2 style={styles.paperTitle}>
                  {paper.title ||
                    "Untitled Research Paper"}
                </h2>


                <div style={styles.paperSourceRow}>

                  <div style={styles.sourceAttribute}>

                    <div style={styles.metadataLabel}>
                      SOURCE
                    </div>

                    <div style={styles.sourceValue}>
                      {paper.source ||
                        paper.source_name ||
                        "OpenCitations"}
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

        )}


        {/* ===================================================
            QUESTION AREA
        =================================================== */}

        {paper && (

          <section style={styles.questionSection}>

            <div style={styles.contentContainer}>

              <div style={styles.questionHeading}>

                <div style={styles.sectionEyebrow}>
                  PAPER Q&A
                </div>

                <h2 style={styles.sectionTitle}>
                  Ask questions about this paper
                </h2>

                <p style={styles.sectionDescriptionLeft}>
                  Ask anything about the selected research
                  document. Your answer will be grounded
                  in the available paper content.
                </p>

              </div>


              {/* QUESTION INPUT */}

              <div style={styles.questionCard}>

                <textarea
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  placeholder="Ask a question about this research paper..."
                  rows={5}
                  style={styles.questionTextarea}
                />

                <div style={styles.questionFooter}>

                  <span style={styles.groundedText}>
                    ✓ Answers are grounded in the
                    selected research document.
                  </span>

                  <button
                    onClick={askQuestion}
                    disabled={
                      loading ||
                      !question.trim()
                    }
                    style={{
                      ...styles.askButton,
                      opacity:
                        loading ||
                        !question.trim()
                          ? 0.5
                          : 1,
                      cursor:
                        loading ||
                        !question.trim()
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {loading
                      ? "Analyzing..."
                      : "Ask Question →"}
                  </button>

                </div>

              </div>


              {/* =================================================
                  ANSWER
              ================================================= */}

              {answer && (

                <section style={styles.answerSection}>

                  <div style={styles.answerHeader}>

                    <div>

                      <div style={styles.sectionEyebrow}>
                        AI RESEARCH EXPLANATION
                      </div>

                      <h2 style={styles.answerTitle}>
                        Answer
                      </h2>

                    </div>

                    <div style={styles.groundedBadge}>
                      ✓ Paper Grounded
                    </div>

                  </div>


                  {/* ANSWER */}

                  <div style={styles.answerCard}>

                    <div style={styles.metadataLabel}>
                      ANSWER
                    </div>

                    <p style={styles.answerText}>
                      {answer.answer ||
                        "No answer was returned."}
                    </p>

                  </div>

                </section>

              )}

            </div>

          </section>

        )}


        {/* ===================================================
            INITIAL INFORMATION
        =================================================== */}

        {!paper && (

          <section style={styles.infoSection}>

            <div style={styles.contentContainer}>

              <div style={styles.sectionHeader}>

                <div style={styles.sectionEyebrow}>
                  RESEARCH EXPLORATION
                </div>

                <h2 style={styles.sectionTitle}>
                  Upload a paper and start exploring
                </h2>

                <p style={styles.sectionDescription}>
                  Upload a research document and use
                  ResearchIQ to ask questions directly
                  about its contents.
                </p>

              </div>


              <div style={styles.featureGrid}>

                <FeatureCard
                  icon="↑"
                  title="Upload Documents"
                  text="Upload research PDFs or Word documents and process them as the foundation for your questions."
                />

                <FeatureCard
                  icon="⌕"
                  title="Ask Research Questions"
                  text="Ask natural-language questions about methodology, findings, conclusions and evidence."
                />

                <FeatureCard
                  icon="◎"
                  title="Explore Research"
                  text="Investigate important ideas, research gaps, limitations and findings from the selected paper."
                />

                <FeatureCard
                  icon="⇄"
                  title="Understand Faster"
                  text="Turn dense research papers into concise, understandable answers and insights."
                />

              </div>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}


// ============================================================
// FEATURE CARD
// ============================================================

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


// ============================================================
// STYLES
// ============================================================

const styles = {

  // ==========================================================
  // PAGE
  // ==========================================================

  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 50% 0%, rgba(96,165,250,0.06), transparent 32%), #05070D",
    color: "#E2E8F0",
    fontFamily:
      "'Inter', 'Segoe UI', sans-serif",
  },


  // ==========================================================
  // NAVBAR
  // ==========================================================

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


  // ==========================================================
  // HERO
  // ==========================================================

  heroSection: {
    padding: "82px 20px 50px",
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
    maxWidth: "680px",
    margin: "0 auto",
    color: "#94A3B8",
    fontSize: "15px",
    lineHeight: 1.8,
  },


  // ==========================================================
  // COMMON
  // ==========================================================

  contentContainer: {
    maxWidth: "1120px",
    margin: "0 auto",
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

  sectionDescriptionLeft: {
    maxWidth: "680px",
    color: "#64748B",
    fontSize: "12px",
    lineHeight: 1.7,
    margin: 0,
  },


  // ==========================================================
  // SELECTOR
  // ==========================================================

  selectorSection: {
    padding: "10px 20px 30px",
  },

  selectorCard: {
    padding: "24px",
    borderRadius: "13px",
    border:
      "1px solid rgba(148,163,184,0.08)",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.7), rgba(7,11,20,0.82))",
  },

  selectorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "22px",
  },

  loadButton: {
    flexShrink: 0,
    padding: "10px 14px",
    borderRadius: "7px",
    border:
      "1px solid rgba(96,165,250,0.15)",
    background:
      "rgba(96,165,250,0.06)",
    color: "#93C5FD",
    fontSize: "10px",
    fontWeight: 700,
  },

  uploadArea: {
    display: "flex",
    alignItems: "center",
    gap: "17px",
    padding: "19px",
    borderRadius: "10px",
    border:
      "1px dashed rgba(96,165,250,0.17)",
    background:
      "rgba(96,165,250,0.025)",
  },

  uploadIcon: {
    width: "43px",
    height: "43px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background:
      "rgba(96,165,250,0.07)",
    border:
      "1px solid rgba(96,165,250,0.13)",
    color: "#60A5FA",
    fontSize: "20px",
  },

  uploadContent: {
    flex: 1,
    minWidth: 0,
  },

  uploadTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "15px",
    margin: "0 0 6px",
  },

  uploadText: {
    color: "#64748B",
    fontSize: "11px",
    lineHeight: 1.6,
    margin: 0,
  },

  fileTypes: {
    marginTop: "7px",
    color: "#475569",
    fontSize: "9px",
    letterSpacing: "1px",
    fontWeight: 700,
  },

  selectedFile: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginTop: "9px",
    color: "#93C5FD",
    fontSize: "10px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  selectedFileIcon: {
    width: "17px",
    height: "17px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background:
      "rgba(96,165,250,0.1)",
    color: "#60A5FA",
    fontSize: "9px",
  },

  uploadActions: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    flexShrink: 0,
  },

  chooseFileButton: {
    padding: "9px 13px",
    borderRadius: "7px",
    border:
      "1px solid rgba(148,163,184,0.1)",
    background:
      "rgba(148,163,184,0.035)",
    color: "#94A3B8",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  },

  processButton: {
    padding: "9px 13px",
    borderRadius: "7px",
    border:
      "1px solid rgba(96,165,250,0.15)",
    background:
      "rgba(96,165,250,0.07)",
    color: "#93C5FD",
    fontSize: "10px",
    fontWeight: 700,
  },


  // ==========================================================
  // ERROR
  // ==========================================================

  errorSection: {
    padding: "0 20px 25px",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "13px 16px",
    borderRadius: "9px",
    border:
      "1px solid rgba(248,113,113,0.18)",
    background:
      "rgba(248,113,113,0.045)",
    color: "#FCA5A5",
    fontSize: "12px",
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
      "1px solid rgba(248,113,113,0.2)",
    fontSize: "10px",
    fontWeight: 700,
  },


  // ==========================================================
  // PAPER
  // ==========================================================

  paperSection: {
    padding: "10px 20px 35px",
  },

  paperCard: {
    padding: "23px",
    borderRadius: "12px",
    border:
      "1px solid rgba(148,163,184,0.08)",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.7), rgba(7,11,20,0.8))",
  },

  paperTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "13px",
  },

  paperTypeBadge: {
    display: "inline-flex",
    padding: "6px 9px",
    borderRadius: "999px",
    border:
      "1px solid rgba(96,165,250,0.14)",
    background:
      "rgba(96,165,250,0.05)",
    color: "#60A5FA",
    fontSize: "8px",
    letterSpacing: "1.1px",
    fontWeight: 700,
  },

  documentId: {
    color: "#475569",
    fontSize: "9px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  paperTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "23px",
    lineHeight: 1.4,
    margin: "0 0 18px",
  },

  paperSourceRow: {
    display: "flex",
    gap: "10px",
  },

  sourceAttribute: {
    flex: 1,
    padding: "11px",
    borderRadius: "7px",
    background:
      "rgba(96,165,250,0.035)",
    border:
      "1px solid rgba(96,165,250,0.06)",
  },

  sourceValue: {
    color: "#93C5FD",
    fontSize: "11px",
    fontWeight: 600,
    lineHeight: 1.4,
  },

  metadataLabel: {
    color: "#475569",
    fontSize: "8px",
    letterSpacing: "1px",
    fontWeight: 700,
    marginBottom: "5px",
  },


  // ==========================================================
  // QUESTION
  // ==========================================================

  questionSection: {
    padding: "15px 20px 80px",
  },

  questionHeading: {
    marginBottom: "20px",
  },

  questionCard: {
    padding: "8px",
    borderRadius: "13px",
    background:
      "rgba(15,23,42,0.72)",
    border:
      "1px solid rgba(96,165,250,0.16)",
    boxShadow:
      "0 0 40px rgba(59,130,246,0.04)",
  },

  questionTextarea: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: "120px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#E2E8F0",
    fontFamily:
      "'Inter', 'Segoe UI', sans-serif",
    fontSize: "13px",
    lineHeight: 1.7,
    padding: "13px",
  },

  questionFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "8px",
  },

  groundedText: {
    color: "#475569",
    fontSize: "10px",
  },

  askButton: {
    border:
      "1px solid rgba(96,165,250,0.2)",
    borderRadius: "8px",
    padding: "11px 17px",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.17), rgba(167,139,250,0.14))",
    color: "#BFDBFE",
    fontSize: "10px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },


  // ==========================================================
  // ANSWER
  // ==========================================================

  answerSection: {
    marginTop: "45px",
  },

  answerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "18px",
  },

  answerTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#F8FAFC",
    fontSize: "28px",
    margin: 0,
  },

  groundedBadge: {
    padding: "7px 10px",
    borderRadius: "7px",
    background:
      "rgba(96,165,250,0.06)",
    border:
      "1px solid rgba(96,165,250,0.11)",
    color: "#93C5FD",
    fontSize: "9px",
    whiteSpace: "nowrap",
  },

  answerCard: {
    padding: "21px",
    borderRadius: "12px",
    border:
      "1px solid rgba(96,165,250,0.1)",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.7), rgba(7,11,20,0.8))",
  },

  answerText: {
    color: "#CBD5E1",
    fontSize: "13px",
    lineHeight: 1.8,
    margin: 0,
    whiteSpace: "pre-wrap",
  },


  // ==========================================================
  // INITIAL INFORMATION
  // ==========================================================

  infoSection: {
    padding: "15px 20px 80px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },

  sectionDescription: {
    maxWidth: "650px",
    margin: "0 auto",
    color: "#64748B",
    fontSize: "13px",
    lineHeight: 1.7,
  },

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

};

export default ResearchPaperQA;