import { useState } from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAuthPopup, setShowAuthPopup] = useState(false);

  /* ============================================================
     PAPER SELECTION
  ============================================================ */

  const [selectionMode, setSelectionMode] = useState(null);
  const [selectedPapers, setSelectedPapers] = useState([]);

  /* ============================================================
     CENTRAL NAVIGATION
  ============================================================ */

  const goTo = (path, state = undefined) => {
    console.log("ResearchIQ navigation:", path, state);

    if (state !== undefined) {
      navigate(path, {
        state,
      });
    } else {
      navigate(path);
    }
  };

  /* ============================================================
     SEARCH
  ============================================================ */

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    setSelectionMode(null);
    setSelectedPapers([]);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/research",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: query.trim(),
          }),
        }
      );

      const data = await response.json();

      console.log("===== RESEARCH API RESPONSE =====");
      console.log(data);
      console.log("=================================");

      if (!response.ok) {
        throw new Error(
          data.error || "Research request failed."
        );
      }

      if (typeof data === "string") {
        setResult({
          result: data,
          retrieved_documents: [],
        });
      } else {
        setResult(data);
      }

      setTimeout(() => {
        const resultElement =
          document.getElementById("research-result");

        if (resultElement) {
          resultElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not connect to the research backend."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     SUGGESTIONS
  ============================================================ */

  const handleSuggestion = (item) => {
    setQuery(item);
  };

  /* ============================================================
     AUTH / NAVIGATION
  ============================================================ */

  const handleLogin = () => {
    goTo("/login");
  };

  const handleRegister = () => {
    goTo("/signup");
  };

  const handleAboutUs = () => {
    goTo("/about-us");
  };

  const handleMyResearch = () => {
    goTo("/my-research");
  };

  /* ============================================================
     RESEARCH TOOL NAVIGATION
  ============================================================ */

  const handleDatasetDiscovery = () => {
    goTo("/kaggle-dataset");
  };

  const handleCompareStudies = () => {
    goTo("/compare-papers");
  };

  const handleResearchQuestions = () => {
    goTo("/research-questions");
  };

  const handleResearchPaperGenerator = () => {
    goTo("/research-paper-generator");
  };

  const handleResearchAdvisor = () => {
    goTo("/research-project-advisor");
  };

  /* ============================================================
     SAVE PAPER
  ============================================================ */

  const handleSavePaper = () => {
    setShowAuthPopup(true);
  };

  /* ============================================================
     PAPER QUESTION NAVIGATION
  ============================================================ */

  const handleAskPaper = (paper) => {
    if (!paper) {
      return;
    }

    /*
     * The correct route available in main.jsx for working
     * with research questions is:
     *
     * /research-questions
     *
     * There is no /research-paper-qa route in main.jsx.
     */

    goTo("/research-questions", {
      selectedPaper: paper,
      paper: paper,
      source: "research-search",
      searchTopic: query,
    });
  };

  /* ============================================================
     RECOMMENDED PAPER SELECTION
  ============================================================ */

  const handleStartCompare = () => {
    setSelectionMode("compare");
    setSelectedPapers([]);
  };

  const handleStartAskQuestions = () => {
    setSelectionMode("questions");
    setSelectedPapers([]);
  };

  const handleCancelSelection = () => {
    setSelectionMode(null);
    setSelectedPapers([]);
  };

  const getPaperId = (paper, fallback = null) => {
    return (
      paper?.id ||
      paper?.paper_id ||
      paper?.arxiv_id ||
      paper?.title ||
      fallback
    );
  };

  const handlePaperSelection = (paper) => {
    const paperId = getPaperId(paper);

    const alreadySelected = selectedPapers.some(
      (selected) =>
        getPaperId(selected) === paperId
    );

    /* ==========================================================
       COMPARE MODE
       Maximum 2 papers
    ========================================================== */

    if (selectionMode === "compare") {
      if (alreadySelected) {
        setSelectedPapers((previous) =>
          previous.filter(
            (selected) =>
              getPaperId(selected) !== paperId
          )
        );

        return;
      }

      if (selectedPapers.length >= 2) {
        return;
      }

      setSelectedPapers((previous) => [
        ...previous,
        paper,
      ]);

      return;
    }

    /* ==========================================================
       ASK QUESTIONS MODE
       Maximum 1 paper
    ========================================================== */

    if (selectionMode === "questions") {
      if (alreadySelected) {
        setSelectedPapers([]);
        return;
      }

      setSelectedPapers([paper]);
    }
  };

  /* ============================================================
     OPEN COMPARISON WITH SELECTED PAPERS
  ============================================================ */

  const handleCompareSelected = () => {
    if (selectedPapers.length !== 2) {
      return;
    }

    goTo("/compare-papers", {
      paper1: selectedPapers[0],
      paper2: selectedPapers[1],
      selectedPapers: selectedPapers,
      source: "recommended-research-papers",
      searchTopic: query,
    });
  };

  /* ============================================================
     OPEN RESEARCH QUESTIONS WITH SELECTED PAPER
  ============================================================ */

  const handleAskSelected = () => {
    if (selectedPapers.length !== 1) {
      return;
    }

    /*
     * Correct route from main.jsx:
     * /research-questions
     */

    goTo("/research-questions", {
      selectedPaper: selectedPapers[0],
      paper: selectedPapers[0],
      source: "recommended-research-papers",
      searchTopic: query,
    });
  };

  /* ============================================================
     PAPER URL HELPERS
  ============================================================ */

  const getPaperViewUrl = (paper) => {
    if (!paper) {
      return "";
    }

    return (
      paper.url ||
      paper.source_url ||
      paper.link ||
      paper.web_url ||
      paper.pdf_url ||
      paper.pdfUrl ||
      paper.pdf ||
      ""
    );
  };

  /* ============================================================
     DOWNLOAD URL
  ============================================================ */

  const getPaperDownloadUrl = (paper) => {
    if (!paper) {
      return "";
    }

    /*
     * Explicit PDF URL from backend
     */

    const explicitPdf =
      paper.pdf_url ||
      paper.pdfUrl ||
      paper.pdf ||
      paper.download_url ||
      paper.downloadUrl;

    if (explicitPdf) {
      return explicitPdf;
    }

    /*
     * arXiv backend currently returns:
     *
     * https://arxiv.org/abs/XXXX
     *
     * Convert it automatically to:
     *
     * https://arxiv.org/pdf/XXXX.pdf
     */

    const sourceUrl =
      paper.url ||
      paper.source_url ||
      paper.link ||
      paper.web_url ||
      "";

    if (
      typeof sourceUrl === "string" &&
      sourceUrl.includes("arxiv.org/abs/")
    ) {
      const arxivId =
        sourceUrl
          .split("arxiv.org/abs/")[1]
          ?.split(/[?#]/)[0];

      if (arxivId) {
        return `https://arxiv.org/pdf/${arxivId}.pdf`;
      }
    }

    /*
     * Some datasets may directly provide an arXiv ID.
     */

    const arxivId =
      paper.arxiv_id ||
      paper.arxivId ||
      paper.id;

    if (
      (paper.source || "").toLowerCase() ===
        "arxiv" &&
      arxivId
    ) {
      return `https://arxiv.org/pdf/${arxivId}.pdf`;
    }

    return "";
  };

  /* ============================================================
     VIEW PAPER / SOURCE
  ============================================================ */

  const handleViewPaper = (paper) => {
    const viewUrl = getPaperViewUrl(paper);

    if (!viewUrl) {
      alert(
        "A source link is not available for this paper."
      );
      return;
    }

    window.open(
      viewUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* ============================================================
     DOWNLOAD PAPER
  ============================================================ */

  const handleDownloadPaper = async (paper) => {
    const downloadUrl =
      getPaperDownloadUrl(paper);

    if (!downloadUrl) {
      alert(
        "A PDF download link is not available for this paper."
      );
      return;
    }

    const safeTitle = (
      paper.title || "research-paper"
    )
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_+/g, "_")
      .substring(0, 120);

    const fileName = `${safeTitle}.pdf`;

    try {
      const response = await fetch(
        downloadUrl
      );

      if (!response.ok) {
        throw new Error(
          "Unable to download the PDF."
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = blobUrl;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(
        blobUrl
      );
    } catch (error) {
      console.warn(
        "Direct PDF download failed. Opening PDF instead.",
        error
      );

      window.open(
        downloadUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  /* ============================================================
     NORMALIZE BACKEND RESPONSE
  ============================================================ */

  const getResearchText = () => {
    if (!result) {
      return "";
    }

    if (typeof result === "string") {
      return result;
    }

    return (
      result.result ||
      result.response ||
      result.analysis ||
      result.answer ||
      result.generated_text ||
      result.text ||
      ""
    );
  };

  const getRetrievedPapers = () => {
    if (
      !result ||
      typeof result !== "object"
    ) {
      return [];
    }

    return (
      result.retrieved_documents ||
      result.documents ||
      result.sources ||
      result.papers ||
      []
    );
  };

  /* ============================================================
     LIMIT RESEARCH SUMMARY
     Maximum 5 sentences.
     Can naturally contain fewer than 5.
  ============================================================ */

  const getFiveSentenceSummary = (text) => {
    if (!text) {
      return "";
    }

    const cleanedText = text
      .replace(/\r?\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedText) {
      return "";
    }

    /*
     * Extract complete sentences.
     *
     * This allows the summary to contain:
     * 1 sentence
     * 2 sentences
     * 3 sentences
     * 4 sentences
     * or 5 sentences
     *
     * It will never intentionally pad the summary
     * to reach 5 sentences.
     */

    const sentences =
      cleanedText.match(
        /[^.!?]+(?:[.!?]+|$)/g
      );

    if (
      sentences &&
      sentences.length > 0
    ) {
      return sentences
        .map((sentence) =>
          sentence.trim()
        )
        .filter(Boolean)
        .slice(0, 5)
        .join(" ");
    }

    /*
     * Fallback for text that does not contain
     * normal sentence punctuation.
     */

    return cleanedText;
  };

  const researchText =
    getResearchText();

  const researchSummary =
    getFiveSentenceSummary(
      researchText
    );

  const retrievedPapers =
    getRetrievedPapers();

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="app-shell">

      {/* =====================================================
          AUTHENTICATION POPUP
      ===================================================== */}

      {showAuthPopup && (
        <div
          onClick={() =>
            setShowAuthPopup(false)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background:
              "rgba(2, 6, 23, 0.72)",
            backdropFilter:
              "blur(8px)",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="card"
            style={{
              width: "100%",
              maxWidth: "390px",
              padding: "30px",
              position: "relative",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setShowAuthPopup(false)
              }
              style={{
                position: "absolute",
                top: "12px",
                right: "14px",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background:
                  "transparent",
                color: "#64748b",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <div
              style={{
                width: "48px",
                height: "48px",
                margin:
                  "0 auto 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                background:
                  "rgba(96,165,250,0.08)",
                border:
                  "1px solid rgba(96,165,250,0.14)",
                color: "#60a5fa",
                fontSize: "21px",
              }}
            >
              ✦
            </div>

            <h2
              style={{
                fontFamily:
                  "'Space Grotesk', sans-serif",
                fontSize: "22px",
                marginBottom: "10px",
                color: "#f8fafc",
              }}
            >
              Login required
            </h2>

            <p
              style={{
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.7,
                margin:
                  "0 auto 24px",
                maxWidth: "300px",
              }}
            >
              Create an account or log in
              to access your personalized
              research workspace and save
              research papers.
            </p>

            <div
              style={{
                display: "flex",
                gap: "9px",
                justifyContent:
                  "center",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  handleLogin
                }
                style={{
                  flex: 1,
                  cursor: "pointer",
                }}
              >
                Login
              </button>

              <button
                type="button"
                className="btn"
                onClick={
                  handleRegister
                }
                style={{
                  flex: 1,
                  border:
                    "1px solid rgba(96,165,250,0.25)",
                  background:
                    "linear-gradient(135deg, rgba(96,165,250,0.16), rgba(167,139,250,0.12))",
                  color: "#bfdbfe",
                  cursor: "pointer",
                }}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <header className="navbar">
        <div className="navbar-inner">

          <div
            className="brand"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            style={{
              cursor: "pointer",
            }}
          >
            <div className="brand-mark">
              <span>R</span>
            </div>

            <div className="brand-name">
              Research<span>IQ</span>
            </div>
          </div>

          <div
            style={{
              flex: 1,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent:
                "flex-end",
            }}
          >
            <button
              className="nav-link"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Discover
            </button>

            <button
              className="nav-link"
              onClick={() =>
                document
                  .getElementById("tools")
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Research Tools
            </button>

            <button
              className="nav-link"
              onClick={
                handleAboutUs
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              About Us
            </button>

            <button
              className="btn btn-secondary"
              onClick={
                handleMyResearch
              }
            >
              My Research
            </button>

            <button
              className="btn btn-secondary"
              onClick={
                handleLogin
              }
            >
              Login
            </button>

            <button
              className="btn"
              onClick={
                handleRegister
              }
              style={{
                border:
                  "1px solid rgba(96,165,250,0.25)",
                background:
                  "linear-gradient(135deg, rgba(96,165,250,0.16), rgba(167,139,250,0.12))",
                color: "#bfdbfe",
                cursor: "pointer",
              }}
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* ===================================================
            DISCOVER
        =================================================== */}

        <section
          id="discover"
          style={{
            padding:
              "105px 0 80px",
          }}
        >
          <div
            className="page-container"
            style={{
              maxWidth: "900px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                gap: "7px",
                padding:
                  "7px 12px",
                marginBottom:
                  "22px",
                border:
                  "1px solid rgba(96,165,250,0.18)",
                borderRadius:
                  "999px",
                background:
                  "rgba(96,165,250,0.06)",
                color:
                  "#93c5fd",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <span>✦</span>
              AI-Powered Research
              Intelligence
            </div>

            <h1
              style={{
                fontFamily:
                  "'Space Grotesk', sans-serif",
                fontSize:
                  "clamp(42px, 6vw, 70px)",
                lineHeight: 1.05,
                letterSpacing:
                  "-2.5px",
                marginBottom:
                  "22px",
                color:
                  "#f8fafc",
              }}
            >
              Research smarter.
              <br />

              <span
                style={{
                  background:
                    "linear-gradient(90deg, #60a5fa, #22d3ee, #a78bfa)",
                  WebkitBackgroundClip:
                    "text",
                  WebkitTextFillColor:
                    "transparent",
                }}
              >
                Discover what's next.
              </span>
            </h1>

            <p
              style={{
                maxWidth:
                  "650px",
                margin:
                  "0 auto 34px",
                color:
                  "#94a3b8",
                fontSize:
                  "16px",
                lineHeight:
                  1.75,
              }}
            >
              Discover research papers,
              explore datasets, compare
              studies, identify research
              gaps and generate new
              research directions — all
              from one intelligent
              workspace.
            </p>

            <form
              className="search-box"
              onSubmit={
                handleSearch
              }
            >
              <div className="search-icon">
                ⌕
              </div>

              <input
                className="search-input"
                type="text"
                value={query}
                onChange={(
                  event
                ) =>
                  setQuery(
                    event.target.value
                  )
                }
                placeholder="Search a research topic, technology, disease, method..."
              />

              <button
                type="submit"
                className="search-button"
                disabled={
                  loading
                }
              >
                {loading
                  ? "Researching..."
                  : "Search"}
              </button>
            </form>

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "center",
                flexWrap:
                  "wrap",
                gap: "8px",
                marginTop:
                  "18px",
              }}
            >
              <span
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "12px",
                }}
              >
                Try:
              </span>

              {[
                "AI in healthcare",
                "LLM security",
                "IoT agriculture",
                "computer vision",
              ].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      handleSuggestion(
                        item
                      )
                    }
                    style={{
                      border:
                        "1px solid rgba(148,163,184,0.12)",
                      borderRadius:
                        "999px",
                      padding:
                        "5px 10px",
                      background:
                        "rgba(148,163,184,0.035)",
                      color:
                        "#94a3b8",
                      fontSize:
                        "11px",
                      cursor:
                        "pointer",
                    }}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            {error && (
              <div
                style={{
                  marginTop:
                    "25px",
                  padding:
                    "14px 18px",
                  border:
                    "1px solid rgba(248,113,113,0.2)",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(248,113,113,0.05)",
                  color:
                    "#fca5a5",
                  fontSize:
                    "13px",
                  textAlign:
                    "left",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            RESEARCH RESULT
        =================================================== */}

        {result && (
          <section
            id="research-result"
            style={{
              padding:
                "20px 0 90px",
              scrollMarginTop:
                "90px",
            }}
          >
            <div className="page-container">

              {/* MAIN ANALYSIS CARD */}

              <div
                className="card"
                style={{
                  padding:
                    "30px",
                  marginBottom:
                    "20px",
                }}
              >
                <div
                  style={{
                    color:
                      "#60a5fa",
                    fontSize:
                      "11px",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "1.5px",
                    marginBottom:
                      "10px",
                  }}
                >
                  Research Analysis
                </div>

                <h2
                  style={{
                    fontFamily:
                      "'Space Grotesk', sans-serif",
                    fontSize:
                      "30px",
                    marginBottom:
                      "18px",
                    color:
                      "#f8fafc",
                  }}
                >
                  {query}
                </h2>

                {researchSummary ? (
                  <div
                    style={{
                      color:
                        "#94a3b8",
                      fontSize:
                        "15px",
                      lineHeight:
                        1.8,
                      whiteSpace:
                        "pre-line",
                      textAlign:
                        "left",
                    }}
                  >
                    {researchSummary}
                  </div>
                ) : (
                  <div
                    style={{
                      padding:
                        "18px",
                      borderRadius:
                        "10px",
                      background:
                        "rgba(248,113,113,0.05)",
                      border:
                        "1px solid rgba(248,113,113,0.15)",
                      color:
                        "#fca5a5",
                      fontSize:
                        "13px",
                      textAlign:
                        "left",
                    }}
                  >
                    The research request
                    succeeded, but no
                    generated research text
                    was found in the response.
                  </div>
                )}

                {researchText &&
                  researchText !==
                    researchSummary && (
                    <div
                      style={{
                        marginTop:
                          "14px",
                        color:
                          "#475569",
                        fontSize:
                          "11px",
                      }}
                    >
                      Summary limited to
                      a maximum of 5
                      sentences.
                    </div>
                  )}
              </div>

              {/* =================================================
                  RETRIEVED PAPERS
              ================================================= */}

              {retrievedPapers.length >
                0 && (
                <div
                  style={{
                    marginTop:
                      "30px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#60a5fa",
                      fontSize:
                        "11px",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "1.5px",
                      marginBottom:
                        "14px",
                    }}
                  >
                    RAG Sources
                  </div>

                  <h2
                    style={{
                      fontFamily:
                        "'Space Grotesk', sans-serif",
                      fontSize:
                        "24px",
                      marginBottom:
                        "16px",
                      color:
                        "#f8fafc",
                    }}
                  >
                    Retrieved Research
                    Papers
                  </h2>

                  {/* PAPER ACTION TOOLBAR */}

                  <div
                    className="card"
                    style={{
                      padding:
                        "16px 18px",
                      marginBottom:
                        "16px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: "15px",
                      flexWrap:
                        "wrap",
                      background:
                        "rgba(96,165,250,0.025)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color:
                            "#e2e8f0",
                          fontSize:
                            "13px",
                          fontWeight:
                            600,
                          marginBottom:
                            "5px",
                        }}
                      >
                        Work with recommended
                        papers
                      </div>

                      <div
                        style={{
                          color:
                            "#64748b",
                          fontSize:
                            "11px",
                          lineHeight:
                            1.5,
                        }}
                      >
                        Compare papers or open
                        a paper directly in the
                        Research Questions
                        workspace.
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        gap: "8px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      {selectionMode ===
                        null && (
                        <>
                          <button
                            type="button"
                            onClick={
                              handleStartCompare
                            }
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              padding:
                                "8px 13px",
                              borderRadius:
                                "7px",
                              background:
                                "rgba(96,165,250,0.08)",
                              border:
                                "1px solid rgba(96,165,250,0.18)",
                              color:
                                "#93c5fd",
                              fontSize:
                                "11px",
                              fontWeight:
                                600,
                              cursor:
                                "pointer",
                            }}
                          >
                            ⇄ Compare Papers
                          </button>

                          <button
                            type="button"
                            onClick={
                              handleStartAskQuestions
                            }
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              padding:
                                "8px 13px",
                              borderRadius:
                                "7px",
                              background:
                                "rgba(167,139,250,0.08)",
                              border:
                                "1px solid rgba(167,139,250,0.18)",
                              color:
                                "#c4b5fd",
                              fontSize:
                                "11px",
                              fontWeight:
                                600,
                              cursor:
                                "pointer",
                            }}
                          >
                            ⌕ Select Paper
                          </button>
                        </>
                      )}

                      {selectionMode ===
                        "compare" && (
                        <>
                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              padding:
                                "7px 10px",
                              borderRadius:
                                "6px",
                              background:
                                "rgba(96,165,250,0.06)",
                              color:
                                "#93c5fd",
                              fontSize:
                                "11px",
                            }}
                          >
                            Select 2 papers (
                            {
                              selectedPapers.length
                            }
                            /2)
                          </span>

                          <button
                            type="button"
                            onClick={
                              handleCompareSelected
                            }
                            disabled={
                              selectedPapers.length !==
                              2
                            }
                            style={{
                              padding:
                                "8px 13px",
                              borderRadius:
                                "7px",
                              border:
                                "1px solid rgba(96,165,250,0.18)",
                              background:
                                selectedPapers.length ===
                                2
                                  ? "rgba(96,165,250,0.13)"
                                  : "rgba(148,163,184,0.04)",
                              color:
                                selectedPapers.length ===
                                2
                                  ? "#93c5fd"
                                  : "#475569",
                              fontSize:
                                "11px",
                              fontWeight:
                                600,
                              cursor:
                                selectedPapers.length ===
                                2
                                  ? "pointer"
                                  : "not-allowed",
                            }}
                          >
                            Compare Selected →
                          </button>

                          <button
                            type="button"
                            onClick={
                              handleCancelSelection
                            }
                            style={{
                              padding:
                                "8px 11px",
                              borderRadius:
                                "7px",
                              border:
                                "1px solid rgba(148,163,184,0.12)",
                              background:
                                "rgba(148,163,184,0.04)",
                              color:
                                "#94a3b8",
                              fontSize:
                                "11px",
                              cursor:
                                "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {selectionMode ===
                        "questions" && (
                        <>
                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              padding:
                                "7px 10px",
                              borderRadius:
                                "6px",
                              background:
                                "rgba(167,139,250,0.06)",
                              color:
                                "#c4b5fd",
                              fontSize:
                                "11px",
                            }}
                          >
                            Select 1 paper (
                            {
                              selectedPapers.length
                            }
                            /1)
                          </span>

                          <button
                            type="button"
                            onClick={
                              handleAskSelected
                            }
                            disabled={
                              selectedPapers.length !==
                              1
                            }
                            style={{
                              padding:
                                "8px 13px",
                              borderRadius:
                                "7px",
                              border:
                                "1px solid rgba(167,139,250,0.18)",
                              background:
                                selectedPapers.length ===
                                1
                                  ? "rgba(167,139,250,0.13)"
                                  : "rgba(148,163,184,0.04)",
                              color:
                                selectedPapers.length ===
                                1
                                  ? "#c4b5fd"
                                  : "#475569",
                              fontSize:
                                "11px",
                              fontWeight:
                                600,
                              cursor:
                                selectedPapers.length ===
                                1
                                  ? "pointer"
                                  : "not-allowed",
                            }}
                          >
                            Ask About Selected →
                          </button>

                          <button
                            type="button"
                            onClick={
                              handleCancelSelection
                            }
                            style={{
                              padding:
                                "8px 11px",
                              borderRadius:
                                "7px",
                              border:
                                "1px solid rgba(148,163,184,0.12)",
                              background:
                                "rgba(148,163,184,0.04)",
                              color:
                                "#94a3b8",
                              fontSize:
                                "11px",
                              cursor:
                                "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* =================================================
                      PAPER LIST
                  ================================================= */}

                  <div
                    style={{
                      display:
                        "grid",
                      gap: "12px",
                    }}
                  >
                    {retrievedPapers.map(
                      (
                        paper,
                        index
                      ) => {
                        const paperId =
                          getPaperId(
                            paper,
                            index
                          );

                        const isSelected =
                          selectedPapers.some(
                            (
                              selected
                            ) =>
                              getPaperId(
                                selected
                              ) ===
                              paperId
                          );

                        const compareLimitReached =
                          selectionMode ===
                            "compare" &&
                          selectedPapers.length >=
                            2 &&
                          !isSelected;

                        const viewUrl =
                          getPaperViewUrl(
                            paper
                          );

                        const downloadUrl =
                          getPaperDownloadUrl(
                            paper
                          );

                        return (
                          <div
                            key={
                              paperId
                            }
                            className="card"
                            style={{
                              padding:
                                "18px 20px",
                              border:
                                isSelected
                                  ? "1px solid rgba(96,165,250,0.45)"
                                  : undefined,
                              boxShadow:
                                isSelected
                                  ? "0 0 0 1px rgba(96,165,250,0.08)"
                                  : undefined,
                              transition:
                                "all 0.2s ease",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                gap:
                                  "15px",
                                alignItems:
                                  "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap:
                                    "12px",
                                  minWidth:
                                    0,
                                  flex: 1,
                                }}
                              >
                                {selectionMode && (
                                  <div
                                    style={{
                                      paddingTop:
                                        "2px",
                                      flexShrink:
                                        0,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        isSelected
                                      }
                                      disabled={
                                        compareLimitReached
                                      }
                                      onChange={() =>
                                        handlePaperSelection(
                                          paper
                                        )
                                      }
                                      style={{
                                        width:
                                          "17px",
                                        height:
                                          "17px",
                                        accentColor:
                                          "#60a5fa",
                                        cursor:
                                          compareLimitReached
                                            ? "not-allowed"
                                            : "pointer",
                                      }}
                                    />
                                  </div>
                                )}

                                <div
                                  style={{
                                    minWidth:
                                      0,
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        "#60a5fa",
                                      fontSize:
                                        "10px",
                                      textTransform:
                                        "uppercase",
                                      letterSpacing:
                                        "1px",
                                      marginBottom:
                                        "7px",
                                    }}
                                  >
                                    {paper.source ||
                                      "Research Source"}
                                  </div>

                                  <h3
                                    style={{
                                      fontFamily:
                                        "'Space Grotesk', sans-serif",
                                      fontSize:
                                        "15px",
                                      lineHeight:
                                        1.5,
                                      color:
                                        "#e2e8f0",
                                      margin:
                                        0,
                                    }}
                                  >
                                    {paper.title ||
                                      "Untitled Research Paper"}
                                  </h3>
                                </div>
                              </div>

                              <div
                                style={{
                                  flexShrink:
                                    0,
                                  padding:
                                    "5px 8px",
                                  borderRadius:
                                    "6px",
                                  background:
                                    "rgba(96,165,250,0.08)",
                                  color:
                                    "#93c5fd",
                                  fontSize:
                                    "10px",
                                }}
                              >
                                Score{" "}
                                {paper.similarity_score ??
                                  paper.score ??
                                  "N/A"}
                              </div>
                            </div>

                            {/* =================================================
                                PAPER ACTIONS
                            ================================================= */}

                            <div
                              style={{
                                display:
                                  "flex",
                                gap:
                                  "8px",
                                marginTop:
                                  "13px",
                                flexWrap:
                                  "wrap",
                              }}
                            >

                              {/* VIEW */}

                              {viewUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewPaper(
                                      paper
                                    )
                                  }
                                  style={{
                                    display:
                                      "inline-flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    padding:
                                      "7px 12px",
                                    borderRadius:
                                      "6px",
                                    background:
                                      "rgba(96,165,250,0.08)",
                                    border:
                                      "1px solid rgba(96,165,250,0.15)",
                                    color:
                                      "#93c5fd",
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      600,
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  View Site ↗
                                </button>
                              )}

                              {/* DOWNLOAD */}

                              {downloadUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadPaper(
                                      paper
                                    )
                                  }
                                  style={{
                                    display:
                                      "inline-flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    padding:
                                      "7px 12px",
                                    borderRadius:
                                      "6px",
                                    background:
                                      "rgba(34,211,238,0.06)",
                                    border:
                                      "1px solid rgba(34,211,238,0.14)",
                                    color:
                                      "#67e8f9",
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      600,
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  ↓ Download PDF
                                </button>
                              )}

                              {/* PAPER QUESTIONS */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleAskPaper(
                                    paper
                                  )
                                }
                                style={{
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  padding:
                                    "7px 12px",
                                  borderRadius:
                                    "6px",
                                  background:
                                    "rgba(167,139,250,0.08)",
                                  border:
                                    "1px solid rgba(167,139,250,0.18)",
                                  color:
                                    "#c4b5fd",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    600,
                                  cursor:
                                    "pointer",
                                }}
                              >
                                ⌕ Ask About Paper
                              </button>

                              {/* SAVE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleSavePaper(
                                    paper
                                  )
                                }
                                style={{
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  padding:
                                    "7px 12px",
                                  borderRadius:
                                    "6px",
                                  background:
                                    "rgba(148,163,184,0.05)",
                                  border:
                                    "1px solid rgba(148,163,184,0.12)",
                                  color:
                                    "#94a3b8",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    600,
                                  cursor:
                                    "pointer",
                                }}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section
          style={{
            padding:
              "10px 0 70px",
          }}
        >
          <div className="page-container">

            <div
              style={{
                textAlign:
                  "center",
                marginBottom:
                  "28px",
              }}
            >
              <div
                style={{
                  color:
                    "#60a5fa",
                  fontSize:
                    "11px",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "1.5px",
                  marginBottom:
                    "10px",
                }}
              >
                HOW IT WORKS
              </div>

              <h2
                style={{
                  fontFamily:
                    "'Space Grotesk', sans-serif",
                  fontSize:
                    "28px",
                  marginBottom:
                    "10px",
                  color:
                    "#f8fafc",
                }}
              >
                From question to research
                intelligence.
              </h2>

              <p
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "14px",
                  maxWidth:
                    "620px",
                  margin:
                    "0 auto",
                  lineHeight:
                    1.7,
                }}
              >
                ResearchIQ helps you move
                from an initial research idea
                to evidence, analysis and
                actionable research direction.
              </p>
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "14px",
              }}
            >
              <InstructionCard
                number="01"
                icon="⌕"
                title="Enter your topic"
                text="Start with a research topic, technology, disease, method or question."
              />

              <InstructionCard
                number="02"
                icon="◎"
                title="Discover research"
                text="Retrieve relevant research papers and understand what has already been studied."
              />

              <InstructionCard
                number="03"
                icon="✦"
                title="Analyze evidence"
                text="Use AI-powered analysis to identify findings, methodologies and research gaps."
              />

              <InstructionCard
                number="04"
                icon="⇄"
                title="Explore further"
                text="Use specialized research tools to compare studies, find datasets and build new directions."
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            RESEARCH TOOLS
        =================================================== */}

        <section
          id="tools"
          style={{
            padding: "30px 0 90px",
            scrollMarginTop: "90px",
          }}
        >
          <div className="page-container">

            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  color:
                    "#60a5fa",
                  fontSize:
                    "11px",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "1.5px",
                  marginBottom:
                    "10px",
                }}
              >
                RESEARCH TOOLS
              </div>

              <h2
                style={{
                  fontFamily:
                    "'Space Grotesk', sans-serif",
                  fontSize:
                    "30px",
                  marginBottom:
                    "10px",
                  color:
                    "#f8fafc",
                }}
              >
                One workspace. Multiple research
                capabilities.
              </h2>

              <p
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "14px",
                  lineHeight:
                    1.7,
                }}
              >
                Choose a specialized tool depending
                on what you want to accomplish with
                your research.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "14px",
                width: "100%",
                overflowX: "auto",
                paddingBottom: "10px",
                scrollbarWidth: "thin",
              }}
            >

              {/* DATASET */}

              <ResearchToolCard
                icon="◎"
                eyebrow="DATASET INTELLIGENCE"
                title="Dataset Discovery"
                text="Discover datasets that can support your research topic, experiments and machine learning projects."
                buttonText="Search Datasets"
                onClick={() =>
                  navigate("/kaggle-dataset")
                }
              />

              {/* COMPARE */}

              <ResearchToolCard
                icon="⇄"
                eyebrow="STUDY COMPARISON"
                title="Compare Studies"
                text="Compare two research papers to understand their methodologies, findings, strengths, limitations and relevance."
                buttonText="Start Comparison"
                onClick={() =>
                  navigate("/compare-papers")
                }
              />

              {/* QUESTIONS */}

              <ResearchToolCard
                icon="⌕"
                eyebrow="RESEARCH QUESTIONS"
                title="Research Question Explorer"
                text="Turn research ideas into focused questions and retrieve scholarly evidence that can help guide your investigation."
                buttonText="Explore Questions"
                onClick={() =>
                  navigate("/research-questions")
                }
              />

              {/* GENERATOR */}

              <ResearchToolCard
                icon="✦"
                eyebrow="AI RESEARCH WRITING"
                title="AI Research Paper Generator"
                text="Generate a structured research paper from your topic and supporting research literature."
                buttonText="Generate Research Paper"
                onClick={() =>
                  navigate("/research-paper-generator")
                }
              />

              {/* ADVISOR */}

              <ResearchToolCard
                icon="↗"
                eyebrow="RESEARCH GUIDANCE"
                title="Research Project Advisor"
                text="Get guidance on research direction, methodology, citations, project structure and potential research gaps."
                buttonText="Open Research Advisor"
                onClick={() =>
                  navigate("/research-project-advisor")
                }
              />

            </div>
          </div>
        </section>

        {/* ===================================================
            DATA SOURCES
        =================================================== */}

        <section
          style={{
            padding:
              "70px 0",
            borderTop:
              "1px solid rgba(148,163,184,0.07)",
          }}
        >
          <div
            className="page-container"
            style={{
              textAlign:
                "center",
            }}
          >
            <p
              style={{
                color:
                  "#64748b",
                fontSize:
                  "12px",
                textTransform:
                  "uppercase",
                letterSpacing:
                  "1.5px",
                marginBottom:
                  "14px",
              }}
            >
              Research intelligence from
              multiple sources
            </p>

            <h2
              style={{
                fontFamily:
                  "'Space Grotesk', sans-serif",
                fontSize:
                  "28px",
                marginBottom:
                  "12px",
                color:
                  "#f8fafc",
              }}
            >
              One workspace. Multiple
              research sources.
            </h2>

            <p
              style={{
                color:
                  "#64748b",
                fontSize:
                  "14px",
              }}
            >
              CORE · Elsevier / Scopus · Kaggle ·
              OpenAlex · OpenCitations
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}

/* ============================================================
   INSTRUCTION CARD
============================================================ */

function InstructionCard({
  number,
  icon,
  title,
  text,
}) {
  return (
    <div
      className="card"
      style={{
        padding: "22px",
        position:
          "relative",
        overflow:
          "hidden",
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom:
            "17px",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            borderRadius:
              "10px",
            background:
              "rgba(96,165,250,0.08)",
            border:
              "1px solid rgba(96,165,250,0.12)",
            color:
              "#60a5fa",
            fontSize:
              "18px",
          }}
        >
          {icon}
        </div>

        <span
          style={{
            color:
              "#334155",
            fontSize:
              "11px",
            fontWeight:
              600,
            letterSpacing:
              "1px",
          }}
        >
          {number}
        </span>
      </div>

      <h3
        style={{
          fontFamily:
            "'Space Grotesk', sans-serif",
          fontSize:
            "16px",
          marginBottom:
            "8px",
          color:
            "#e2e8f0",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color:
            "#64748b",
          fontSize:
            "13px",
          lineHeight:
            1.65,
          margin:
            0,
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   RESEARCH TOOL CARD
============================================================ */

function ResearchToolCard({
  icon,
  eyebrow,
  title,
  text,
  buttonText,
  onClick,
}) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding:
          "20px",
        display:
          "flex",
        flexDirection:
          "column",
        minHeight:
          "250px",
        minWidth:
          "205px",
        flex:
          "1 1 0",
        boxSizing:
          "border-box",
        cursor:
          "pointer",
        transition:
          "all 0.2s ease",
      }}
    >
      <div
        style={{
          width:
            "40px",
          height:
            "40px",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          marginBottom:
            "17px",
          borderRadius:
            "10px",
          background:
            "rgba(96,165,250,0.08)",
          border:
            "1px solid rgba(96,165,250,0.12)",
          color:
            "#60a5fa",
          fontSize:
            "19px",
          flexShrink:
            0,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color:
            "#60a5fa",
          fontSize:
            "10px",
          textTransform:
            "uppercase",
          letterSpacing:
            "1.2px",
          marginBottom:
            "8px",
        }}
      >
        {eyebrow}
      </div>

      <h3
        style={{
          fontFamily:
            "'Space Grotesk', sans-serif",
          fontSize:
            "16px",
          lineHeight:
            1.35,
          marginBottom:
            "9px",
          color:
            "#e2e8f0",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color:
            "#64748b",
          fontSize:
            "12px",
          lineHeight:
            1.6,
          margin:
            "0 0 18px",
          flex:
            1,
        }}
      >
        {text}
      </p>

      <button
        type="button"
        onClick={(event) => {
          /*
           * Prevent the card click from firing twice.
           */
          event.stopPropagation();

          console.log(
            "Research Tool clicked:",
            title
          );

          onClick();
        }}
        style={{
          display:
            "inline-flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          width:
            "100%",
          boxSizing:
            "border-box",
          padding:
            "8px 10px",
          borderRadius:
            "7px",
          background:
            "rgba(96,165,250,0.07)",
          border:
            "1px solid rgba(96,165,250,0.14)",
          color:
            "#93c5fd",
          fontSize:
            "11px",
          fontWeight:
            600,
          cursor:
            "pointer",
          transition:
            "all 0.2s ease",
        }}
      >
        {buttonText} →
      </button>
    </div>
  );
}

export default App;