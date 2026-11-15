import { useState } from "react";

function ResearchProjectAdvisor() {
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState("");

  const [field, setField] = useState("");
  const [domain, setDomain] = useState("");
  const [interests, setInterests] = useState("");
  const [methodology, setMethodology] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [supportingWorks, setSupportingWorks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedTopic, setSelectedTopic] = useState("");

  // ============================================================
  // ADD LANGUAGE
  // ============================================================

  const addLanguage = () => {
    const language = languageInput.trim();

    if (!language) return;

    if (!languages.includes(language)) {
      setLanguages([...languages, language]);
    }

    setLanguageInput("");
  };

  // ============================================================
  // REMOVE LANGUAGE
  // ============================================================

  const removeLanguage = (language) => {
    setLanguages(
      languages.filter((item) => item !== language)
    );
  };

  // ============================================================
  // GENERATE RESEARCH TOPICS
  // ============================================================

  const handleGenerate = async (event) => {
    event.preventDefault();

    setError("");
    setSuggestions([]);
    setSupportingWorks([]);
    setSelectedTopic("");

    if (languages.length === 0) {
      setError(
        "Please select at least one programming language."
      );
      return;
    }

    if (!field.trim()) {
      setError("Please enter your research field.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/openalex/advisor",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            languages,
            field: field.trim(),
            domain: domain.trim() || null,
            interests: interests.trim() || null,
            methodology: methodology.trim() || null,
            experience_level:
              experienceLevel || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to generate research topics."
        );
      }

      setSuggestions(data.suggestions || []);
      setSupportingWorks(data.supporting_works || []);
    } catch (err) {
      console.error(
        "OPENALEX ADVISOR ERROR:",
        err
      );

      setError(
        err.message ||
          "Could not connect to the Research Project Advisor."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SELECT TOPIC
  // ============================================================

  const handleSelectTopic = async (topic) => {
    setSelectedTopic(topic);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/openalex/advisor",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            languages,
            field: field.trim(),
            domain: domain.trim() || null,
            interests: interests.trim() || null,
            methodology: methodology.trim() || null,
            experience_level:
              experienceLevel || null,
            selected_topic:
              getTopicTitle(topic),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to save selected research topic."
        );
      }

    } catch (err) {
      console.error(
        "SAVE SELECTED TOPIC ERROR:",
        err
      );

      setError(
        err.message ||
          "Could not save the selected research topic."
      );
    }
  };

  // ============================================================
  // SEND SELECTED TOPIC TO PAPER GENERATOR
  // ============================================================

  const handleGeneratePaper = () => {
    if (!selectedTopic) {
      setError(
        "Please select a research topic first."
      );
      return;
    }

    localStorage.setItem(
      "researchIQ_selected_topic",
      selectedTopic
    );

    window.location.href =
      "/research-paper-generator";
  };

  // ============================================================
  // QUICK INTEREST
  // ============================================================

  const handleSuggestion = (value) => {
    setInterests(value);
    setError("");
  };

  // ============================================================
  // NORMALIZE TOPIC DATA
  // Supports both strings and richer backend objects.
  // ============================================================

  const getTopicTitle = (topic) => {
    if (typeof topic === "string") {
      return topic;
    }

    return (
      topic?.title ||
      topic?.topic ||
      topic?.research_topic ||
      topic?.name ||
      "Untitled Research Direction"
    );
  };

  const getTopicDescription = (topic) => {
    if (typeof topic === "string") {
      return "";
    }

    return (
      topic?.description ||
      topic?.research_direction ||
      topic?.summary ||
      topic?.reason ||
      ""
    );
  };

  const getTopicLanguages = (topic) => {
    if (typeof topic === "string") {
      return languages.length > 0
        ? languages.join(", ")
        : "Recommended by ResearchIQ";
    }

    const value =
      topic?.languages ||
      topic?.programming_languages ||
      topic?.language;

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    return (
      value ||
      (languages.length > 0
        ? languages.join(", ")
        : "Recommended by ResearchIQ")
    );
  };

  const getTopicMethodology = (topic) => {
    if (typeof topic === "string") {
      return methodology || "Research-based evaluation";
    }

    return (
      topic?.methodology ||
      topic?.preferred_methodology ||
      methodology ||
      "Research-based evaluation"
    );
  };

  const getTopicAlgorithm = (topic) => {
    if (typeof topic === "string") {
      return (
        topic?.algorithm ||
        "To be determined from the research problem"
      );
    }

    return (
      topic?.algorithm ||
      topic?.recommended_algorithm ||
      topic?.algorithms ||
      "To be determined from the research problem"
    );
  };

  const getTopicModel = (topic) => {
    if (typeof topic === "string") {
      return (
        "Model selection based on the proposed research direction"
      );
    }

    return (
      topic?.model ||
      topic?.recommended_model ||
      topic?.model_architecture ||
      "Model selection based on the proposed research direction"
    );
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
              Research<span style={styles.brandAccent}>IQ</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <button
            style={styles.navLink}
            onClick={() => window.history.back()}
          >
            ← Back
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() =>
              window.location.href =
                "/research-paper-generator"
            }
          >
            Research Paper Generator
          </button>
        </div>
      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* ===================================================
            HERO / ADVISOR FORM
        =================================================== */}

        <section style={styles.heroSection}>

          <div style={styles.heroContainer}>

            <div style={styles.badge}>
              <span>↗</span>
              RESEARCH PROJECT ADVISOR
            </div>

            <h1 style={styles.heroTitle}>
              Find your next
              <br />
              <span style={styles.gradientText}>
                research direction.
              </span>
            </h1>

            <p style={styles.heroDescription}>
              Tell ResearchIQ about your field, interests,
              technologies and research experience. We'll
              use your research profile and scholarly evidence
              to suggest focused project ideas tailored to you.
            </p>


            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleGenerate}
              style={styles.formCard}
            >

              <div style={styles.formHeader}>
                <div>
                  <div style={styles.sectionEyebrow}>
                    RESEARCH PROFILE
                  </div>

                  <h2 style={styles.formTitle}>
                    Tell us what you want to research.
                  </h2>

                  <p style={styles.formDescription}>
                    Your selections are used together to
                    build personalized research directions.
                  </p>
                </div>
              </div>


              {/* =================================================
                  LANGUAGES
              ================================================= */}

              <div style={styles.field}>

                <label style={styles.label}>
                  PROGRAMMING LANGUAGES
                </label>

                <div style={styles.languageInput}>

                  <input
                    type="text"
                    value={languageInput}
                    onChange={(event) =>
                      setLanguageInput(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addLanguage();
                      }
                    }}
                    placeholder="e.g. Python"
                    style={styles.input}
                  />

                  <button
                    type="button"
                    onClick={addLanguage}
                    style={styles.addButton}
                  >
                    Add
                  </button>

                </div>

                {languages.length > 0 && (
                  <div style={styles.languageTags}>
                    {languages.map((language) => (
                      <div
                        key={language}
                        style={styles.languageTag}
                      >
                        <span>{language}</span>

                        <button
                          type="button"
                          onClick={() =>
                            removeLanguage(language)
                          }
                          style={styles.removeLanguage}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>


              {/* =================================================
                  FIELD + DOMAIN
              ================================================= */}

              <div style={styles.twoColumn}>

                <div style={styles.field}>

                  <label style={styles.label}>
                    RESEARCH FIELD
                  </label>

                  <input
                    type="text"
                    value={field}
                    onChange={(event) =>
                      setField(event.target.value)
                    }
                    placeholder="e.g. Artificial Intelligence"
                    style={styles.input}
                  />

                </div>


                <div style={styles.field}>

                  <label style={styles.label}>
                    DOMAIN
                  </label>

                  <input
                    type="text"
                    value={domain}
                    onChange={(event) =>
                      setDomain(event.target.value)
                    }
                    placeholder="e.g. Healthcare"
                    style={styles.input}
                  />

                </div>

              </div>


              {/* =================================================
                  INTERESTS
              ================================================= */}

              <div style={styles.field}>

                <label style={styles.label}>
                  RESEARCH INTERESTS
                </label>

                <textarea
                  value={interests}
                  onChange={(event) =>
                    setInterests(event.target.value)
                  }
                  placeholder="What would you like to research? e.g. Generative AI, medical diagnosis, cybersecurity..."
                  rows={4}
                  style={{
                    ...styles.input,
                    ...styles.textarea,
                  }}
                />

              </div>


              {/* =================================================
                  QUICK INTERESTS
              ================================================= */}

              <div style={styles.suggestionArea}>

                <span style={styles.tryText}>
                  Explore:
                </span>

                {[
                  "Generative AI",
                  "Machine Learning",
                  "LLM Security",
                  "Computer Vision",
                  "Healthcare AI",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      handleSuggestion(item)
                    }
                    style={styles.suggestion}
                  >
                    {item}
                  </button>
                ))}

              </div>


              {/* =================================================
                  METHODOLOGY + EXPERIENCE
              ================================================= */}

              <div style={styles.twoColumn}>

                <div style={styles.field}>

                  <label style={styles.label}>
                    PREFERRED METHODOLOGY
                  </label>

                  <select
                    value={methodology}
                    onChange={(event) =>
                      setMethodology(
                        event.target.value
                      )
                    }
                    style={styles.select}
                  >
                    <option value="">
                      Select methodology
                    </option>

                    <option value="Experimental evaluation">
                      Experimental Evaluation
                    </option>

                    <option value="Comparative analysis">
                      Comparative Analysis
                    </option>

                    <option value="Survey based research">
                      Survey-Based Research
                    </option>

                    <option value="Machine learning model development">
                      ML Model Development
                    </option>

                    <option value="System development and evaluation">
                      System Development
                    </option>

                    <option value="Literature review">
                      Literature Review
                    </option>
                  </select>

                </div>


                <div style={styles.field}>

                  <label style={styles.label}>
                    EXPERIENCE LEVEL
                  </label>

                  <select
                    value={experienceLevel}
                    onChange={(event) =>
                      setExperienceLevel(
                        event.target.value
                      )
                    }
                    style={styles.select}
                  >
                    <option value="">
                      Select level
                    </option>

                    <option value="Beginner">
                      Beginner
                    </option>

                    <option value="Intermediate">
                      Intermediate
                    </option>

                    <option value="Advanced">
                      Advanced
                    </option>
                  </select>

                </div>

              </div>


              {/* =================================================
                  GENERATE BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.generateButton,
                  opacity: loading ? 0.65 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Analyzing Research..."
                  : "Generate Research Topics →"}
              </button>

            </form>


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
            RESULTS
        ===================================================== */}

        {suggestions.length > 0 && (

          <section style={styles.resultsSection}>

            <div style={styles.contentContainer}>

              {/* =================================================
                  RESULTS HEADER
              ================================================= */}

              <div style={styles.resultsHeader}>

                <div>

                  <div style={styles.sectionEyebrow}>
                    AI RESEARCH DIRECTIONS
                  </div>

                  <h2 style={styles.resultsTitle}>
                    Research topics{" "}
                    <span>
                      tailored for you.
                    </span>
                  </h2>

                  <p style={styles.resultsSubtitle}>
                    Generated from your field,
                    technologies, interests,
                    methodology and experience level.
                  </p>

                </div>

                <div style={styles.resultCount}>
                  {suggestions.length} directions
                </div>

              </div>


              {/* =================================================
                  TOPIC CARDS
              ================================================= */}

              <div style={styles.topicGrid}>

                {suggestions
                  .slice(0, 5)
                  .map((topic, index) => {

                    const topicTitle =
                      getTopicTitle(topic);

                    const isSelected =
                      selectedTopic === topic;

                    return (
                      <article
                        key={index}
                        style={{
                          ...styles.topicCard,
                          ...(isSelected
                            ? styles.topicCardSelected
                            : {}),
                        }}
                      >

                        <div style={styles.topicTopRow}>

                          <div style={styles.topicNumber}>
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </div>

                          <div style={styles.topicSource}>
                            RESEARCH DIRECTION
                          </div>

                        </div>


                        <h3 style={styles.topicTitle}>
                          {topicTitle}
                        </h3>


                        {getTopicDescription(topic) && (
                          <p style={styles.topicDescription}>
                            {getTopicDescription(topic)}
                          </p>
                        )}


                        {/* =================================================
                            RECOMMENDATIONS
                        ================================================= */}

                        <div style={styles.recommendationGrid}>

                          <div style={styles.recommendationItem}>
                            <span>
                              LANGUAGE
                            </span>

                            <strong>
                              {getTopicLanguages(topic)}
                            </strong>
                          </div>


                          <div style={styles.recommendationItem}>
                            <span>
                              METHODOLOGY
                            </span>

                            <strong>
                              {getTopicMethodology(topic)}
                            </strong>
                          </div>


                          <div style={styles.recommendationItem}>
                            <span>
                              ALGORITHM
                            </span>

                            <strong>
                              {getTopicAlgorithm(topic)}
                            </strong>
                          </div>


                          <div style={styles.recommendationItem}>
                            <span>
                              MODEL
                            </span>

                            <strong>
                              {getTopicModel(topic)}
                            </strong>
                          </div>

                        </div>


                        {/* =================================================
                            SELECT TOPIC
                        ================================================= */}

                        <button
                          type="button"
                          onClick={() =>
                            handleSelectTopic(topic)
                          }
                          style={{
                            ...styles.selectTopicButton,
                            ...(isSelected
                              ? styles.selectTopicButtonSelected
                              : {}),
                          }}
                        >
                          {isSelected
                            ? "✓ Topic Selected"
                            : "Select This Topic →"}
                        </button>

                      </article>
                    );
                  })}

              </div>


              {/* =================================================
                  SELECTED TOPIC ACTION
              ================================================= */}

              {selectedTopic && (

                <div style={styles.selectedCard}>

                  <div style={styles.selectedContent}>

                    <div style={styles.sectionEyebrow}>
                      SELECTED RESEARCH TOPIC
                    </div>

                    <h3 style={styles.selectedTitle}>
                      {getTopicTitle(selectedTopic)}
                    </h3>

                    <p style={styles.selectedText}>
                      This topic will be passed to the
                      Research Paper Generator as the
                      starting research direction.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePaper}
                    style={styles.paperButton}
                  >
                    Generate Research Paper →
                  </button>

                </div>

              )}


              {/* =================================================
                  SUPPORTING RESEARCH
              ================================================= */}

              {supportingWorks.length > 0 && (

                <div style={styles.supportingSection}>

                  <div style={styles.sectionEyebrow}>
                    OPENALEX EVIDENCE
                  </div>

                  <h2 style={styles.supportingTitle}>
                    Research supporting
                    these directions.
                  </h2>

                  <p style={styles.supportingDescription}>
                    Scholarly works retrieved from OpenAlex
                    that provide context for the recommended
                    research directions.
                  </p>


                  <div style={styles.workList}>

                    {supportingWorks
                      .slice(0, 5)
                      .map((work, index) => (

                        <article
                          key={
                            work.openalex_id ||
                            index
                          }
                          style={styles.workCard}
                        >

                          <div style={styles.workNumber}>
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </div>

                          <div style={styles.workContent}>

                            <h3 style={styles.workTitle}>
                              {work.title ||
                                "Untitled research work"}
                            </h3>

                            <div style={styles.workMeta}>

                              {work.publication_year && (
                                <span>
                                  {work.publication_year}
                                </span>
                              )}

                              {work.cited_by_count !==
                                undefined && (
                                <span>
                                  {work.cited_by_count} citations
                                </span>
                              )}

                              {work.primary_topic && (
                                <span>
                                  {work.primary_topic}
                                </span>
                              )}

                            </div>

                            {work.authors &&
                              work.authors.length > 0 && (
                                <p style={styles.workAuthors}>
                                  {work.authors
                                    .slice(0, 4)
                                    .join(", ")}
                                </p>
                              )}

                            {work.landing_page_url && (
                              <a
                                href={
                                  work.landing_page_url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.workLink}
                              >
                                View Research ↗
                              </a>
                            )}

                          </div>

                        </article>

                      ))}

                  </div>

                </div>

              )}

            </div>

          </section>

        )}


        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (

          <section style={styles.loadingSection}>

            <div style={styles.loadingCard}>

              <div style={styles.loadingIcon}>
                ◎
              </div>

              <h2 style={styles.loadingTitle}>
                Analyzing your research profile
              </h2>

              <p style={styles.loadingText}>
                Finding scholarly evidence and generating
                research directions tailored to your inputs...
              </p>

            </div>

          </section>

        )}


        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {!loading &&
          suggestions.length === 0 &&
          !error && (

            <section style={styles.emptySection}>

              <div style={styles.contentContainer}>

                <div style={styles.emptyCard}>

                  <div style={styles.emptyIcon}>
                    ↗
                  </div>

                  <div>

                    <div style={styles.sectionEyebrow}>
                      RESEARCHIQ ADVISOR
                    </div>

                    <h2 style={styles.emptyTitle}>
                      Your research starts here.
                    </h2>

                    <p style={styles.emptyText}>
                      Enter your research profile above
                      and ResearchIQ will help you discover
                      promising project directions, technologies,
                      algorithms and models to explore.
                    </p>

                  </div>

                </div>

              </div>

            </section>

          )}

      </main>

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

  heroSection: {
    padding: "82px 20px 55px",
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
      "clamp(40px, 6vw, 66px)",
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
    margin: "0 auto 34px",
    color: "#94A3B8",
    fontSize: "15px",
    lineHeight: 1.8,
  },

  formCard: {
    textAlign: "left",
    padding: "24px",
    borderRadius: "14px",
    border:
      "1px solid rgba(148,163,184,0.08)",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.72), rgba(7,11,20,0.82))",
    boxShadow:
      "0 0 45px rgba(59,130,246,0.035)",
  },

  formHeader: {
    paddingBottom: "20px",
    marginBottom: "21px",
    borderBottom:
      "1px solid rgba(148,163,184,0.07)",
  },

  formTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#F8FAFC",
    fontSize: "21px",
    margin: "0 0 7px",
  },

  formDescription: {
    color: "#64748B",
    fontSize: "12px",
    margin: 0,
  },

  field: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    color: "#475569",
    fontSize: "9px",
    letterSpacing: "1.2px",
    fontWeight: 700,
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 12px",
    borderRadius: "8px",
    border:
      "1px solid rgba(148,163,184,0.1)",
    background: "#0B1020",
    color: "#E2E8F0",
    outline: "none",
    fontSize: "12px",
    fontFamily:
      "'Inter', 'Segoe UI', sans-serif",
  },

  textarea: {
    resize: "vertical",
    minHeight: "95px",
    lineHeight: 1.6,
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "8px",
    border:
      "1px solid rgba(148,163,184,0.1)",
    background: "#0B1020",
    color: "#94A3B8",
    outline: "none",
    fontSize: "12px",
  },

  languageInput: {
    display: "flex",
    gap: "8px",
  },

  addButton: {
    flexShrink: 0,
    padding: "0 18px",
    borderRadius: "8px",
    border:
      "1px solid rgba(96,165,250,0.16)",
    background:
      "rgba(96,165,250,0.07)",
    color: "#93C5FD",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  languageTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "9px",
  },

  languageTag: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "5px 8px 5px 10px",
    borderRadius: "999px",
    background:
      "rgba(96,165,250,0.055)",
    border:
      "1px solid rgba(96,165,250,0.13)",
    color: "#93C5FD",
    fontSize: "10px",
  },

  removeLanguage: {
    border: "none",
    background: "transparent",
    color: "#64748B",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: 1,
    padding: 0,
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  suggestionArea: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "-6px",
    marginBottom: "18px",
  },

  tryText: {
    color: "#475569",
    fontSize: "10px",
  },

  suggestion: {
    padding: "5px 9px",
    borderRadius: "999px",
    border:
      "1px solid rgba(148,163,184,0.1)",
    background:
      "rgba(148,163,184,0.035)",
    color: "#64748B",
    fontSize: "10px",
    cursor: "pointer",
  },

  generateButton: {
    width: "100%",
    padding: "13px 18px",
    borderRadius: "8px",
    border:
      "1px solid rgba(96,165,250,0.2)",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.17), rgba(167,139,250,0.14))",
    color: "#BFDBFE",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "3px",
  },

  errorBox: {
    marginTop: "18px",
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
    textAlign: "left",
  },

  errorIcon: {
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background:
      "rgba(248,113,113,0.1)",
    flexShrink: 0,
  },

  resultsSection: {
    padding: "20px 20px 80px",
  },

  contentContainer: {
    maxWidth: "1120px",
    margin: "0 auto",
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "22px",
  },

  sectionEyebrow: {
    color: "#60A5FA",
    fontSize: "10px",
    letterSpacing: "1.5px",
    fontWeight: 700,
    marginBottom: "9px",
  },

  resultsTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#F8FAFC",
    fontSize: "29px",
    margin: "0 0 6px",
  },

  resultsTitleSpan: {
    color: "#60A5FA",
  },

  resultsSubtitle: {
    color: "#64748B",
    fontSize: "12px",
    margin: 0,
    lineHeight: 1.6,
  },

  resultCount: {
    padding: "7px 10px",
    borderRadius: "7px",
    background:
      "rgba(96,165,250,0.06)",
    border:
      "1px solid rgba(96,165,250,0.11)",
    color: "#93C5FD",
    fontSize: "10px",
    whiteSpace: "nowrap",
  },

  topicGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },

  topicCard: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    padding: "21px",
    borderRadius: "12px",
    border:
      "1px solid rgba(148,163,184,0.08)",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.7), rgba(7,11,20,0.8))",
    transition:
      "border-color 0.2s ease, box-shadow 0.2s ease",
  },

  topicCardSelected: {
    border:
      "1px solid rgba(96,165,250,0.35)",
    boxShadow:
      "0 0 28px rgba(96,165,250,0.07)",
  },

  topicTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "15px",
  },

  topicNumber: {
    width: "29px",
    height: "29px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background:
      "rgba(167,139,250,0.07)",
    border:
      "1px solid rgba(167,139,250,0.12)",
    color: "#A78BFA",
    fontSize: "10px",
    fontWeight: 700,
  },

  topicSource: {
    color: "#60A5FA",
    fontSize: "8px",
    letterSpacing: "1.1px",
    fontWeight: 700,
  },

  topicTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "17px",
    lineHeight: 1.4,
    margin: "0 0 12px",
  },

  topicDescription: {
    color: "#64748B",
    fontSize: "11px",
    lineHeight: 1.65,
    margin: "0 0 16px",
  },

  recommendationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    marginTop: "auto",
  },

  recommendationItem: {
    minWidth: 0,
    padding: "10px",
    borderRadius: "7px",
    background:
      "rgba(148,163,184,0.025)",
    border:
      "1px solid rgba(148,163,184,0.045)",
  },

  recommendationItemSpan: {
    display: "block",
    color: "#475569",
    fontSize: "7px",
    letterSpacing: "1px",
    fontWeight: 700,
    marginBottom: "5px",
  },

  recommendationItemStrong: {
    display: "block",
    color: "#94A3B8",
    fontSize: "9px",
    lineHeight: 1.4,
    overflowWrap: "anywhere",
  },

  selectTopicButton: {
    width: "100%",
    marginTop: "15px",
    padding: "10px 12px",
    borderRadius: "7px",
    border:
      "1px solid rgba(96,165,250,0.14)",
    background:
      "rgba(96,165,250,0.055)",
    color: "#93C5FD",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  selectTopicButtonSelected: {
    background:
      "rgba(96,165,250,0.11)",
    border:
      "1px solid rgba(96,165,250,0.28)",
    color: "#BFDBFE",
  },

  selectedCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    marginTop: "18px",
    padding: "21px 23px",
    borderRadius: "12px",
    border:
      "1px solid rgba(96,165,250,0.17)",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.055), rgba(167,139,250,0.04))",
  },

  selectedContent: {
    minWidth: 0,
  },

  selectedTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "19px",
    lineHeight: 1.4,
    margin: "0 0 6px",
  },

  selectedText: {
    color: "#64748B",
    fontSize: "11px",
    margin: 0,
    lineHeight: 1.6,
  },

  paperButton: {
    flexShrink: 0,
    padding: "11px 16px",
    borderRadius: "8px",
    border:
      "1px solid rgba(96,165,250,0.22)",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.16), rgba(167,139,250,0.13))",
    color: "#BFDBFE",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  supportingSection: {
    marginTop: "58px",
  },

  supportingTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#F8FAFC",
    fontSize: "25px",
    margin: "0 0 7px",
  },

  supportingDescription: {
    color: "#64748B",
    fontSize: "12px",
    margin: "0 0 20px",
  },

  workList: {
    display: "grid",
    gap: "10px",
  },

  workCard: {
    display: "flex",
    gap: "14px",
    padding: "17px",
    borderRadius: "10px",
    border:
      "1px solid rgba(148,163,184,0.07)",
    background:
      "rgba(15,23,42,0.45)",
  },

  workNumber: {
    width: "32px",
    height: "32px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background:
      "rgba(96,165,250,0.05)",
    color: "#60A5FA",
    fontSize: "9px",
    fontWeight: 700,
  },

  workContent: {
    minWidth: 0,
  },

  workTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#CBD5E1",
    fontSize: "14px",
    lineHeight: 1.45,
    margin: "0 0 8px",
  },

  workMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },

  workMetaSpan: {
    padding: "4px 7px",
    borderRadius: "5px",
    background:
      "rgba(148,163,184,0.035)",
    color: "#64748B",
    fontSize: "9px",
  },

  workAuthors: {
    color: "#475569",
    fontSize: "10px",
    margin: "9px 0 0",
  },

  workLink: {
    display: "inline-block",
    marginTop: "9px",
    color: "#60A5FA",
    fontSize: "10px",
    textDecoration: "none",
  },

  loadingSection: {
    padding: "20px 20px 80px",
  },

  loadingCard: {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "65px 20px",
    textAlign: "center",
    borderRadius: "12px",
    border:
      "1px solid rgba(148,163,184,0.07)",
    background:
      "rgba(15,23,42,0.35)",
  },

  loadingIcon: {
    fontSize: "30px",
    color: "#60A5FA",
    marginBottom: "12px",
  },

  loadingTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#CBD5E1",
    fontSize: "18px",
    margin: "0 0 7px",
  },

  loadingText: {
    color: "#64748B",
    fontSize: "12px",
    margin: 0,
  },

  emptySection: {
    padding: "10px 20px 80px",
  },

  emptyCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "18px",
    padding: "25px",
    borderRadius: "13px",
    border:
      "1px solid rgba(96,165,250,0.1)",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.045), rgba(167,139,250,0.035))",
  },

  emptyIcon: {
    width: "43px",
    height: "43px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background:
      "rgba(96,165,250,0.08)",
    border:
      "1px solid rgba(96,165,250,0.13)",
    color: "#60A5FA",
    fontSize: "19px",
  },

  emptyTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "19px",
    margin: "0 0 8px",
  },

  emptyText: {
    color: "#64748B",
    fontSize: "12px",
    lineHeight: 1.7,
    maxWidth: "800px",
    margin: 0,
  },
};


/* ============================================================
   INLINE STYLE FIXES FOR NESTED ELEMENTS
============================================================ */

styles.recommendationItem = {
  ...styles.recommendationItem,
};

styles.workMeta = {
  ...styles.workMeta,
};

export default ResearchProjectAdvisor;