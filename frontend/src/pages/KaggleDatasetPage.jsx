import { useState } from "react";

const API_URL = "http://127.0.0.1:5000";

function KaggleDatasetPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("hottest");
  const [resultLimit, setResultLimit] = useState("10");

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searched, setSearched] = useState(false);

  const suggestions = [
    "machine learning",
    "artificial intelligence",
    "healthcare",
    "cybersecurity",
    "natural language processing",
    "computer vision",
    "climate change",
    "finance",
  ];

  const categories = [
    "All",
    "Computer Science",
    "Healthcare",
    "Finance",
    "Education",
    "Environment",
    "NLP",
    "Computer Vision",
    "Business",
    "Other",
  ];

  /* ============================================================
     CSV DATASET COLUMNS
  ============================================================ */

  const CSV_COLUMNS = [
    "query",
    "category",
    "sort_by",
    "limit",
    "title",
    "description",
    "owner",
    "dataset_id",
    "size",
    "file_count",
    "vote_count",
    "download_count",
    "usability",
    "created_date",
    "updated_date",
    "url",
  ];

  /* ============================================================
     CLEAN CSV VALUE
  ============================================================ */

  const cleanCSVValue = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/\r?\n|\r/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  /* ============================================================
     ESCAPE CSV VALUE
  ============================================================ */

  const escapeCSVValue = (value) => {
    const cleanedValue = cleanCSVValue(value);

    return `"${cleanedValue.replace(/"/g, '""')}"`;
  };

  /* ============================================================
     SAVE CLEAN, POPULATED DATASET TO BACKEND CSV
  ============================================================ */

  const saveDatasetsToCSV = async (
    datasetResults,
    searchQuery,
    selectedCategory,
    selectedSortBy,
    selectedLimit
  ) => {
    if (
      !Array.isArray(datasetResults) ||
      datasetResults.length === 0
    ) {
      return;
    }

    const validDatasets = datasetResults.filter(
      (dataset) =>
        dataset &&
        typeof dataset === "object"
    );

    if (validDatasets.length === 0) {
      return;
    }

    const rows = validDatasets.map((dataset) => ({
      query: searchQuery,
      category: selectedCategory,
      sort_by: selectedSortBy,
      limit: selectedLimit,

      title:
        dataset.title ||
        dataset.name ||
        "",

      description:
        dataset.description ||
        "",

      owner:
        dataset.owner ||
        dataset.creator ||
        "",

      dataset_id:
        dataset.dataset_id ||
        dataset.id ||
        "",

      size:
        dataset.size ||
        "",

      file_count:
        dataset.file_count ??
        "",

      vote_count:
        dataset.vote_count ??
        dataset.votes ??
        "",

      download_count:
        dataset.download_count ??
        dataset.downloads ??
        "",

      usability:
        dataset.usability ??
        "",

      created_date:
        dataset.created_date ||
        "",

      updated_date:
        dataset.updated_date ||
        "",

      url:
        dataset.url ||
        "",
    }));

    const response = await fetch(
      `${API_URL}/api/kaggle/save`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows,
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The Kaggle CSV backend returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "Could not save Kaggle records to CSV."
      );
    }

    return data;
  };

  const handleSearch = async (event) => {
    if (event) {
      event.preventDefault();
    }

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError("Please enter a topic or dataset keyword.");
      return;
    }

    setLoading(true);
    setError("");
    setDatasets([]);
    setSearched(true);

    try {
      const response = await fetch(
        `${API_URL}/api/kaggle/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: trimmedQuery,
            category,
            sort_by: sortBy,
            limit: Number(resultLimit),
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The Kaggle backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Kaggle dataset search failed."
        );
      }

      const datasetResults =
        Array.isArray(data?.datasets)
          ? data.datasets
          : [];

      setDatasets(datasetResults);

      /* ============================================================
         SAVE CLEAN, POPULATED DATASET TO BACKEND CSV
      ============================================================ */

      if (datasetResults.length > 0) {
        try {
          await saveDatasetsToCSV(
            datasetResults,
            trimmedQuery,
            category,
            sortBy,
            Number(resultLimit)
          );
        } catch (csvError) {
          console.error(
            "KAGGLE CSV SAVE ERROR:",
            csvError
          );

          setError(
            csvError.message ||
            "Datasets were found, but could not be saved to the CSV."
          );
        }
      }
    } catch (err) {
      console.error("KAGGLE SEARCH ERROR:", err);

      setDatasets([]);

      setError(
        err.message ||
          "Could not connect to the Kaggle backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (item) => {
    setQuery(item);
    setError("");
  };

  const handleDatasetOpen = (dataset) => {
    if (dataset?.url) {
      window.open(
        dataset.url,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleCopyLink = async (url) => {
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error("COPY LINK ERROR:", err);
    }
  };

  return (
    <div style={styles.page}>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header style={styles.navbar}>
        <div style={styles.navbarInner}>

          <div style={styles.brand}>
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
            onClick={() => {
              window.history.back();
            }}
          >
            ← Back
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => {
              alert("My Research will be connected here.");
            }}
          >
            My Research
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => {
              alert("Login page will open here.");
            }}
          >
            Login
          </button>

        </div>
      </header>


      {/* =====================================================
          HERO / SEARCH
      ===================================================== */}

      <main>

        <section style={styles.heroSection}>

          <div style={styles.heroContainer}>

            {/* BADGE */}

            <div style={styles.badge}>
              <span>◎</span>
              KAGGLE DATASET INTELLIGENCE
            </div>


            {/* TITLE */}

            <h1 style={styles.heroTitle}>
              Discover datasets.
              <br />

              <span style={styles.gradientText}>
                Find the data behind the research.
              </span>
            </h1>


            {/* DESCRIPTION */}

            <p style={styles.heroDescription}>
              Search Kaggle datasets by topic, technology,
              domain or keyword. Explore dataset metadata
              and identify data that can support your
              research, experiments and machine learning
              projects.
            </p>


            {/* =================================================
                SEARCH BOX
            ================================================= */}

            <form
              onSubmit={handleSearch}
              style={styles.searchBox}
            >

              <div style={styles.searchIcon}>
                ⌕
              </div>

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search datasets, topics, technologies..."
                style={styles.searchInput}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.searchButton,
                  opacity: loading ? 0.65 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading ? "Searching..." : "Search Kaggle"}
              </button>

            </form>


            {/* =================================================
                SEARCH OPTIONS
            ================================================= */}

            <div style={styles.filtersContainer}>

              {/* CATEGORY */}

              <div style={styles.filterGroup}>

                <label style={styles.filterLabel}>
                  CATEGORY
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  style={styles.select}
                >
                  {categories.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

              </div>


              {/* SORT */}

              <div style={styles.filterGroup}>

                <label style={styles.filterLabel}>
                  SORT RESULTS
                </label>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                  style={styles.select}
                >
                  <option value="hottest">
                    Hottest
                  </option>

                  <option value="votes">
                    Most Voted
                  </option>

                  <option value="updated">
                    Recently Updated
                  </option>

                  <option value="active">
                    Most Active
                  </option>

                  <option value="published">
                    Recently Published
                  </option>
                </select>

              </div>


              {/* RESULT LIMIT */}

              <div style={styles.filterGroup}>

                <label style={styles.filterLabel}>
                  RESULTS
                </label>

                <select
                  value={resultLimit}
                  onChange={(event) =>
                    setResultLimit(event.target.value)
                  }
                  style={styles.select}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>

              </div>

            </div>


            {/* =================================================
                SUGGESTIONS
            ================================================= */}

            <div style={styles.suggestionArea}>

              <span style={styles.tryText}>
                Try:
              </span>

              {suggestions.map((item) => (

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


            {/* ERROR */}

            {error && (
              <div style={styles.errorBox}>
                <span>!</span>
                {error}
              </div>
            )}

          </div>

        </section>


        {/* =====================================================
            SEARCH INFORMATION
        ===================================================== */}

        {!searched && (
          <section style={styles.infoSection}>

            <div style={styles.contentContainer}>

              <div style={styles.sectionHeader}>

                <div style={styles.sectionEyebrow}>
                  DATASET DISCOVERY
                </div>

                <h2 style={styles.sectionTitle}>
                  What can you discover?
                </h2>

                <p style={styles.sectionDescription}>
                  Search Kaggle and inspect the characteristics
                  of datasets before using them in your research
                  or machine learning workflow.
                </p>

              </div>


              <div style={styles.featureGrid}>

                <FeatureCard
                  icon="◎"
                  title="Dataset Metadata"
                  text="Explore dataset owners, identifiers, size, files, votes and other available metadata."
                />

                <FeatureCard
                  icon="⌕"
                  title="Topic Discovery"
                  text="Search using research topics, technologies, domains, programming languages or keywords."
                />

                <FeatureCard
                  icon="↗"
                  title="Dataset Access"
                  text="Open the original Kaggle dataset and inspect its complete contents."
                />

                <FeatureCard
                  icon="⇄"
                  title="Research Data"
                  text="Identify datasets that can support experiments, analysis and machine learning projects."
                />

              </div>

            </div>

          </section>
        )}


        {/* =====================================================
            RESULTS
        ===================================================== */}

        {searched && (

          <section style={styles.resultsSection}>

            <div style={styles.contentContainer}>

              {/* RESULTS HEADER */}

              <div style={styles.resultsHeader}>

                <div>

                  <div style={styles.sectionEyebrow}>
                    KAGGLE RESULTS
                  </div>

                  <h2 style={styles.resultsTitle}>
                    Dataset results
                  </h2>

                  <p style={styles.resultsSubtitle}>
                    Search:
                    {" "}
                    <span style={styles.queryHighlight}>
                      "{query}"
                    </span>
                  </p>

                </div>

                <div style={styles.resultCount}>
                  {loading
                    ? "Searching..."
                    : `${datasets.length} results`}
                </div>

              </div>


              {/* RESULTS */}

              {loading ? (

                <div style={styles.emptyState}>

                  <div style={styles.emptyIcon}>
                    ◎
                  </div>

                  <h3 style={styles.emptyTitle}>
                    Searching Kaggle
                  </h3>

                  <p style={styles.emptyText}>
                    Finding datasets related to your research topic...
                  </p>

                </div>

              ) : datasets.length === 0 ? (

                <div style={styles.emptyState}>

                  <div style={styles.emptyIcon}>
                    ⌕
                  </div>

                  <h3 style={styles.emptyTitle}>
                    No datasets found
                  </h3>

                  <p style={styles.emptyText}>
                    Try a broader topic, different keyword
                    or another category.
                  </p>

                </div>

              ) : (

                <div style={styles.datasetGrid}>

                  {datasets.map((dataset, index) => (

                    <DatasetCard
                      key={
                        dataset.dataset_id ||
                        dataset.id ||
                        index
                      }
                      dataset={dataset}
                      onOpen={handleDatasetOpen}
                      onCopy={handleCopyLink}
                    />

                  ))}

                </div>

              )}

            </div>

          </section>

        )}


        {/* =====================================================
            DATA COLLECTION EXPLANATION
        ===================================================== */}

        <section style={styles.collectionSection}>

          <div style={styles.contentContainer}>

            <div style={styles.collectionCard}>

              <div style={styles.collectionIcon}>
                ⇄
              </div>

              <div style={{ flex: 1 }}>

                <div style={styles.sectionEyebrow}>
                  RESEARCHIQ DATA PIPELINE
                </div>

                <h2 style={styles.collectionTitle}>
                  Every search can become useful research data.
                </h2>

                <p style={styles.collectionText}>
                  Kaggle search activity and dataset metadata
                  can be structured into records for ResearchIQ's
                  data-analysis pipeline. These records can later
                  be cleaned, standardized and fused with data
                  collected from other research APIs.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}


/* ============================================================
   DATASET CARD
============================================================ */

function DatasetCard({
  dataset,
  onOpen,
  onCopy,
}) {

  return (

    <div style={styles.datasetCard}>

      {/* HEADER */}

      <div style={styles.datasetHeader}>

        <div style={styles.datasetIcon}>
          ◎
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={styles.datasetSource}>
            KAGGLE DATASET
          </div>

          <h3 style={styles.datasetTitle}>
            {dataset.title ||
              dataset.name ||
              "Untitled Dataset"}
          </h3>

        </div>

      </div>


      {/* DESCRIPTION */}

      {dataset.description && (

        <p style={styles.datasetDescription}>
          {dataset.description}
        </p>

      )}


      {/* OWNER */}

      <div style={styles.ownerRow}>

        <span style={styles.metadataLabel}>
          OWNER
        </span>

        <span style={styles.metadataValue}>
          {dataset.owner ||
            dataset.creator ||
            "Unknown"}
        </span>

      </div>


      {/* METADATA */}

      <div style={styles.metadataGrid}>

        <MetadataItem
          label="DATASET ID"
          value={
            dataset.dataset_id ||
            dataset.id ||
            "—"
          }
        />

        <MetadataItem
          label="SIZE"
          value={
            dataset.size ||
            "—"
          }
        />

        <MetadataItem
          label="FILES"
          value={
            dataset.file_count ??
            "—"
          }
        />

        <MetadataItem
          label="VOTES"
          value={
            dataset.vote_count ??
            dataset.votes ??
            "—"
          }
        />

        <MetadataItem
          label="DOWNLOADS"
          value={
            dataset.download_count ??
            dataset.downloads ??
            "—"
          }
        />

        <MetadataItem
          label="USABILITY"
          value={
            dataset.usability ??
            "—"
          }
        />

      </div>


      {/* DATES */}

      <div style={styles.dateRow}>

        <div>

          <span style={styles.dateLabel}>
            CREATED
          </span>

          <span style={styles.dateValue}>
            {dataset.created_date ||
              "—"}
          </span>

        </div>

        <div>

          <span style={styles.dateLabel}>
            UPDATED
          </span>

          <span style={styles.dateValue}>
            {dataset.updated_date ||
              "—"}
          </span>

        </div>

      </div>


      {/* ACTIONS */}

      <div style={styles.datasetActions}>

        <button
          type="button"
          onClick={() => onOpen(dataset)}
          style={styles.openButton}
        >
          Open Dataset ↗
        </button>

        <button
          type="button"
          onClick={() =>
            onCopy(dataset.url || "")
          }
          style={styles.copyButton}
        >
          Copy Link
        </button>

      </div>

    </div>

  );
}


/* ============================================================
   METADATA ITEM
============================================================ */

function MetadataItem({
  label,
  value,
}) {

  return (

    <div style={styles.metadataItem}>

      <div style={styles.metadataLabel}>
        {label}
      </div>

      <div style={styles.metadataValue}>
        {String(value)}
      </div>

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
    margin: "0 auto 34px",
    color: "#94A3B8",
    fontSize: "15px",
    lineHeight: 1.8,
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    padding: "7px",
    borderRadius: "13px",
    background:
      "rgba(15,23,42,0.72)",
    border:
      "1px solid rgba(96,165,250,0.16)",
    boxShadow:
      "0 0 40px rgba(59,130,246,0.05)",
  },

  searchIcon: {
    width: "42px",
    color: "#60A5FA",
    fontSize: "23px",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#E2E8F0",
    fontSize: "14px",
    padding: "13px 5px",
  },

  searchButton: {
    border: "1px solid rgba(96,165,250,0.2)",
    borderRadius: "8px",
    padding: "11px 18px",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.17), rgba(167,139,250,0.14))",
    color: "#BFDBFE",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  filtersContainer: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "14px",
  },

  filterGroup: {
    textAlign: "left",
  },

  filterLabel: {
    display: "block",
    color: "#475569",
    fontSize: "9px",
    letterSpacing: "1.2px",
    fontWeight: 700,
    marginBottom: "6px",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 10px",
    borderRadius: "7px",
    border:
      "1px solid rgba(148,163,184,0.1)",
    background: "#0B1020",
    color: "#94A3B8",
    outline: "none",
    fontSize: "11px",
  },

  suggestionArea: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "17px",
  },

  tryText: {
    color: "#475569",
    fontSize: "11px",
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

  infoSection: {
    padding: "20px 20px 80px",
  },

  contentContainer: {
    maxWidth: "1120px",
    margin: "0 auto",
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

  resultsSection: {
    padding: "25px 20px 80px",
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "22px",
  },

  resultsTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#F8FAFC",
    fontSize: "28px",
    margin: "0 0 5px",
  },

  resultsSubtitle: {
    color: "#64748B",
    fontSize: "12px",
    margin: 0,
  },

  queryHighlight: {
    color: "#93C5FD",
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

  datasetGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },

  datasetCard: {
    padding: "21px",
    borderRadius: "12px",
    border:
      "1px solid rgba(148,163,184,0.08)",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.7), rgba(7,11,20,0.8))",
  },

  datasetHeader: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },

  datasetIcon: {
    width: "40px",
    height: "40px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background:
      "rgba(167,139,250,0.07)",
    border:
      "1px solid rgba(167,139,250,0.13)",
    color: "#A78BFA",
    fontSize: "18px",
  },

  datasetSource: {
    color: "#60A5FA",
    fontSize: "9px",
    letterSpacing: "1.2px",
    fontWeight: 700,
    marginBottom: "5px",
  },

  datasetTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "16px",
    lineHeight: 1.4,
    margin: 0,
  },

  datasetDescription: {
    color: "#64748B",
    fontSize: "12px",
    lineHeight: 1.65,
    margin: "15px 0",
  },

  ownerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding:
      "10px 0",
    borderTop:
      "1px solid rgba(148,163,184,0.06)",
    borderBottom:
      "1px solid rgba(148,163,184,0.06)",
  },

  metadataLabel: {
    color: "#475569",
    fontSize: "8px",
    letterSpacing: "1px",
    fontWeight: 700,
  },

  metadataValue: {
    color: "#94A3B8",
    fontSize: "10px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  metadataGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "14px",
  },

  metadataItem: {
    padding: "9px",
    borderRadius: "7px",
    background:
      "rgba(148,163,184,0.025)",
  },

  dateRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginTop: "13px",
  },

  dateLabel: {
    display: "block",
    color: "#475569",
    fontSize: "8px",
    letterSpacing: "1px",
    marginBottom: "4px",
  },

  dateValue: {
    color: "#64748B",
    fontSize: "10px",
  },

  datasetActions: {
    display: "flex",
    gap: "8px",
    marginTop: "17px",
  },

  openButton: {
    flex: 1,
    padding: "9px 12px",
    borderRadius: "7px",
    border:
      "1px solid rgba(96,165,250,0.15)",
    background:
      "rgba(96,165,250,0.07)",
    color: "#93C5FD",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  copyButton: {
    padding: "9px 12px",
    borderRadius: "7px",
    border:
      "1px solid rgba(148,163,184,0.1)",
    background:
      "rgba(148,163,184,0.03)",
    color: "#64748B",
    fontSize: "10px",
    cursor: "pointer",
  },

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

  collectionSection: {
    padding: "10px 20px 80px",
  },

  collectionCard: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
    padding: "25px",
    borderRadius: "13px",
    border:
      "1px solid rgba(96,165,250,0.1)",
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.045), rgba(167,139,250,0.035))",
  },

  collectionIcon: {
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

  collectionTitle: {
    fontFamily:
      "'Space Grotesk', sans-serif",
    color: "#E2E8F0",
    fontSize: "19px",
    margin: "0 0 8px",
  },

  collectionText: {
    color: "#64748B",
    fontSize: "12px",
    lineHeight: 1.7,
    maxWidth: "800px",
    margin: 0,
  },

};


export default KaggleDatasetPage;