import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";

function StudyComparison() {
  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  // Research topic starts EMPTY and is completely independent
  // from other pages/localStorage.
  const [topic, setTopic] = useState("");

  const [paper1, setPaper1] = useState(null);

  const [paper2, setPaper2] = useState(null);

  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // FILE INPUT REFERENCES
  // ============================================================

  const paper1FileInputRef = useRef(null);
  const paper2FileInputRef = useRef(null);

  // ============================================================
  // API
  // ============================================================

  const COMPARISON_API_URL =
    "http://127.0.0.1:5000/api/elsevier/compare";

  // ============================================================
  // NORMALIZE AUTHORS
  // ============================================================

  const normalizeAuthors = (authors) => {
    if (!authors) {
      return [];
    }

    if (Array.isArray(authors)) {
      return authors
        .map((author) => {
          if (typeof author === "string") {
            return author;
          }

          if (author && typeof author === "object") {
            return (
              author.name ||
              author.full_name ||
              author.author_name ||
              `${author.given_name || ""} ${
                author.surname || ""
              }`.trim()
            );
          }

          return "";
        })
        .filter(Boolean);
    }

    if (typeof authors === "string") {
      return authors
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean);
    }

    return [];
  };

  // ============================================================
  // NORMALIZE PAPER
  // ============================================================

  const normalizePaper = (paper) => {
    if (!paper) {
      return null;
    }

    return {
      title: paper.title || "",
      authors: normalizeAuthors(paper.authors),
      publication_name:
        paper.publication_name ||
        paper.publicationName ||
        paper.journal ||
        "",
      publication_date:
        paper.publication_date ||
        paper.publicationDate ||
        paper.date ||
        "",
      abstract: paper.abstract || "",
      doi: paper.doi || "",
      eid: paper.eid || "",
      cited_by_count:
        Number(paper.cited_by_count) || 0,
    };
  };

  // ============================================================
  // HANDLE TOPIC
  // ============================================================

  const handleTopicChange = (event) => {
    setTopic(event.target.value);
    setError("");
    setComparison(null);
  };

  // ============================================================
  // COMPARE PAPERS
  // ============================================================

  const handleCompare = async () => {
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
      setError(
        "Please enter the research topic before comparing the papers."
      );
      return;
    }

    if (!paper1 || !paper2) {
      setError(
        "Please provide both research papers before starting the comparison."
      );
      return;
    }

    setLoading(true);
    setError("");
    setComparison(null);

    try {
      const normalizedPaper1 = normalizePaper(paper1);
      const normalizedPaper2 = normalizePaper(paper2);

      // ========================================================
      // RAG COMPARISON
      //
      // Backend expects JSON:
      // {
      //   topic,
      //   paper_1,
      //   paper_2
      // }
      //
      // Do NOT send multipart/form-data.
      // ========================================================

      const response = await fetch(
        COMPARISON_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            topic: trimmedTopic,
            paper_1: normalizedPaper1,
            paper_2: normalizedPaper2,
          }),
        }
      );

      // ========================================================
      // SAFE RESPONSE PARSING
      // ========================================================

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (
        contentType.includes("application/json")
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          text ||
            `Comparison service returned HTTP ${response.status}.`
        );
      }

      // ========================================================
      // BACKEND ERROR
      // ========================================================

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Comparison request failed with HTTP ${response.status}.`
        );
      }

      if (data?.success === false) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Unable to compare the selected research papers."
        );
      }

      // ========================================================
      // EXTRACT RESULT
      //
      // Authoritative backend response:
      // {
      //   success,
      //   topic,
      //   paper_1,
      //   paper_2,
      //   comparison,
      //   rag
      // }
      // ========================================================

      const comparisonResult =
        data?.comparison || null;

      if (
        !comparisonResult ||
        typeof comparisonResult !== "object"
      ) {
        throw new Error(
          "The comparison service returned an invalid comparison result."
        );
      }

      setComparison(comparisonResult);

      // ========================================================
      // SCROLL TO RESULTS
      // ========================================================

      setTimeout(() => {
        document
          .querySelector(
            ".comparison-results-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 120);
    } catch (err) {
      console.error(
        "PAPER COMPARISON ERROR:",
        err
      );

      setComparison(null);

      setError(
        err?.message ||
          "Could not connect to the comparison service."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FILE UPLOAD
  // ============================================================

  const handleFileUpload = (file, number) => {
    if (!file) {
      return;
    }

    setError("");
    setComparison(null);

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const fileExtension = file.name
      .split(".")
      .pop()
      .toLowerCase();

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
    ];

    const isAllowed =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    if (!isAllowed) {
      setError(
        "Please upload a PDF, DOC, or DOCX research paper."
      );

      if (number === 1) {
        if (paper1FileInputRef.current) {
          paper1FileInputRef.current.value = "";
        }
      } else {
        if (paper2FileInputRef.current) {
          paper2FileInputRef.current.value = "";
        }
      }

      return;
    }

    const uploadedPaper = {
      title: file.name,
      authors: [],
      publication_name:
        "Uploaded Research Paper",
      publication_date: "",
      abstract: "",
      doi: "",
      eid: "",
      cited_by_count: 0,
      file,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    };

    if (number === 1) {
      setPaper1(uploadedPaper);
    } else {
      setPaper2(uploadedPaper);
    }
  };

  // ============================================================
  // FILE EXPLORER
  // ============================================================

  const openFileExplorer = (number) => {
    if (number === 1) {
      paper1FileInputRef.current?.click();
    } else {
      paper2FileInputRef.current?.click();
    }
  };

  // ============================================================
  // REMOVE PAPER
  // ============================================================

  const removePaper = (number) => {
    if (number === 1) {
      setPaper1(null);

      if (paper1FileInputRef.current) {
        paper1FileInputRef.current.value = "";
      }
    } else {
      setPaper2(null);

      if (paper2FileInputRef.current) {
        paper2FileInputRef.current.value = "";
      }
    }

    setComparison(null);
    setError("");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="comparison-page">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Commissioner:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #05070d;
        }

        button,
        input {
          font: inherit;
        }

        .comparison-page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow-x: hidden;

          background:
            radial-gradient(
              circle at 12% 10%,
              rgba(0, 217, 255, 0.075),
              transparent 28%
            ),
            radial-gradient(
              circle at 88% 17%,
              rgba(103, 80, 255, 0.085),
              transparent 30%
            ),
            radial-gradient(
              circle at 50% 72%,
              rgba(168, 85, 247, 0.045),
              transparent 34%
            ),
            #05070d;

          color: #f4f7ff;
          font-family: "Commissioner", sans-serif;
        }

        .comparison-page::before {
          content: "";

          position: fixed;
          inset: 0;

          pointer-events: none;
          z-index: 0;

          background-image:
            linear-gradient(
              rgba(255,255,255,0.012) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.012) 1px,
              transparent 1px
            );

          background-size: 56px 56px;

          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 88%
          );
        }

        /* ======================================================
           NAVBAR
        ====================================================== */

        .comparison-navbar {
          position: sticky;
          top: 0;
          z-index: 100;

          width: 100%;

          border-bottom: 1px solid
            rgba(255,255,255,0.065);

          background:
            rgba(5,7,13,0.78);

          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .comparison-navbar-inner {
          width: min(
            1240px,
            calc(100% - 64px)
          );

          min-height: 72px;

          margin: 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .comparison-brand {
          display: flex;
          align-items: center;
          gap: 11px;

          cursor: pointer;
          user-select: none;
        }

        .comparison-brand-mark {
          width: 32px;
          height: 32px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid
            rgba(0,217,255,0.35);

          border-radius: 9px;

          background:
            linear-gradient(
              145deg,
              rgba(0,217,255,0.10),
              rgba(103,80,255,0.08)
            );

          color: #9eeeff;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 16px;
          font-weight: 600;

          box-shadow:
            0 0 24px
              rgba(0,217,255,0.07);
        }

        .comparison-brand-name {
          color: #f4f7ff;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 17px;
          font-weight: 600;

          letter-spacing: -0.3px;
        }

        .comparison-brand-name span {
          color: #72e8ff;
        }

        .comparison-nav-right {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .comparison-nav-button {
          appearance: none;

          border: 1px solid
            rgba(255,255,255,0.09);

          border-radius: 9px;

          background:
            rgba(255,255,255,0.025);

          color: #aeb7ca;

          padding: 9px 14px;

          font-size: 11px;
          font-weight: 500;

          cursor: pointer;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .comparison-nav-button:hover {
          border-color:
            rgba(0,217,255,0.32);

          background:
            rgba(0,217,255,0.045);

          color: #eafaff;

          transform: translateY(-1px);
        }

        /* ======================================================
           MAIN CONTAINER
        ====================================================== */

        .comparison-main {
          position: relative;
          z-index: 1;
        }

        .comparison-container {
          width: min(
            1120px,
            calc(100% - 64px)
          );

          margin: 0 auto;
        }

        /* ======================================================
           HERO
        ====================================================== */

        .comparison-hero {
          padding:
            105px 0 65px;

          text-align: center;
        }

        .comparison-hero-inner {
          max-width: 850px;
          margin: 0 auto;
        }

        .comparison-eyebrow {
          width: fit-content;

          margin: 0 auto 22px;

          padding: 7px 12px;

          border: 1px solid
            rgba(0,217,255,0.20);

          border-radius: 999px;

          background:
            rgba(0,217,255,0.035);

          color: #76dff4;

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 2px;

          text-transform: uppercase;
        }

        .comparison-hero-title {
          margin: 0;

          color: #f7f9ff;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size:
            clamp(48px, 7vw, 82px);

          font-weight: 600;

          line-height: 0.98;

          letter-spacing: -3.8px;
        }

        .comparison-hero-title span {
          background:
            linear-gradient(
              100deg,
              #62e8ff 5%,
              #7098ff 48%,
              #b276ff 95%
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;
        }

        .comparison-hero-description {
          max-width: 610px;

          margin: 25px auto 0;

          color: #7e899d;

          font-size: 13px;

          line-height: 1.75;
        }

        /* ======================================================
           WORKSPACE
        ====================================================== */

        .comparison-workspace {
          padding: 20px 0 105px;
        }

        /* ======================================================
           TOPIC
        ====================================================== */

        .comparison-topic-wrapper {
          max-width: 850px;
          margin: 0 auto 42px;
        }

        .comparison-input-label {
          display: block;

          margin-bottom: 10px;

          color: #687388;

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 1.8px;

          text-transform: uppercase;
        }

        .comparison-topic-input-wrap {
          position: relative;
        }

        .comparison-topic-icon {
          position: absolute;

          left: 19px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #61dff5;

          font-size: 17px;

          pointer-events: none;
        }

        .comparison-topic-input {
          width: 100%;

          min-height: 62px;

          padding:
            0 20px 0 49px;

          border: 1px solid
            rgba(255,255,255,0.095);

          border-radius: 14px;

          outline: none;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.045),
              rgba(255,255,255,0.018)
            );

          color: #eef5ff;

          font-size: 13px;

          box-shadow:
            inset 0 1px 0
              rgba(255,255,255,0.025),
            0 20px 60px
              rgba(0,0,0,0.14);

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .comparison-topic-input::placeholder {
          color: #596477;
        }

        .comparison-topic-input:focus {
          border-color:
            rgba(0,217,255,0.38);

          box-shadow:
            0 0 0 3px
              rgba(0,217,255,0.035),
            0 22px 65px
              rgba(0,0,0,0.18);
        }

        /* ======================================================
           PAPER UPLOAD GRID
        ====================================================== */

        .comparison-upload-heading {
          display: flex;
          align-items: center;
          gap: 13px;

          margin-bottom: 17px;

          color: #677287;

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 1.9px;

          text-transform: uppercase;
        }

        .comparison-upload-heading::before {
          content: "";

          width: 25px;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              #52e4ff,
              #728cff
            );

          opacity: 0.8;
        }

        .comparison-upload-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            55px
            minmax(0, 1fr);

          align-items: stretch;

          gap: 15px;
        }

        .comparison-upload-card {
          position: relative;

          min-height: 305px;

          padding: 25px;

          border: 1px solid
            rgba(255,255,255,0.085);

          border-radius: 17px;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.045),
              rgba(255,255,255,0.014)
            );

          overflow: hidden;

          transition:
            border-color 0.25s ease,
            transform 0.25s ease,
            background 0.25s ease;
        }

        .comparison-upload-card::before {
          content: "";

          position: absolute;

          left: 0;
          top: 0;

          width: 100%;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              rgba(0,217,255,0.7),
              rgba(103,80,255,0.4),
              transparent
            );

          opacity: 0.7;
        }

        .comparison-upload-card:hover {
          border-color:
            rgba(0,217,255,0.20);

          background:
            linear-gradient(
              145deg,
              rgba(0,217,255,0.035),
              rgba(255,255,255,0.016)
            );

          transform: translateY(-2px);
        }

        .comparison-upload-card.has-paper {
          border-color:
            rgba(0,217,255,0.22);
        }

        .comparison-paper-index {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 42px;
        }

        .comparison-paper-index-number {
          color: #6fe5fa;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 10px;
          font-weight: 700;

          letter-spacing: 1.7px;
        }

        .comparison-paper-status {
          padding: 5px 8px;

          border: 1px solid
            rgba(255,255,255,0.07);

          border-radius: 999px;

          color: #606b7f;

          font-size: 7px;
          font-weight: 700;

          letter-spacing: 1.1px;
        }

        .comparison-paper-status.ready {
          border-color:
            rgba(0,217,255,0.18);

          background:
            rgba(0,217,255,0.035);

          color: #65d9ee;
        }

        .comparison-upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;

          text-align: center;
        }

        .comparison-upload-icon {
          width: 54px;
          height: 54px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 18px;

          border: 1px solid
            rgba(0,217,255,0.20);

          border-radius: 14px;

          background:
            rgba(0,217,255,0.035);

          color: #67def3;

          font-size: 23px;

          cursor: pointer;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .comparison-upload-icon:hover {
          border-color:
            rgba(0,217,255,0.55);

          background:
            rgba(0,217,255,0.08);

          box-shadow:
            0 0 28px
              rgba(0,217,255,0.09);
        }

        .comparison-upload-title {
          max-width: 390px;

          margin: 0;

          color: #dfe6f4;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 18px;
          font-weight: 500;

          line-height: 1.35;

          overflow-wrap: anywhere;
        }

        .comparison-upload-description {
          max-width: 330px;

          margin: 9px auto 0;

          color: #606b7e;

          font-size: 10px;

          line-height: 1.65;
        }

        .comparison-upload-file {
          margin-top: 16px;

          padding: 7px 10px;

          border: 1px solid
            rgba(0,217,255,0.13);

          border-radius: 7px;

          background:
            rgba(0,217,255,0.025);

          color: #7891a4;

          font-size: 9px;

          max-width: 100%;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .comparison-remove-paper {
          margin-top: 14px;

          appearance: none;

          border: none;

          background: transparent;

          color: #5f697c;

          font-size: 9px;
          font-weight: 600;

          cursor: pointer;

          transition: color 0.2s ease;
        }

        .comparison-remove-paper:hover {
          color: #f08abb;
        }

        .comparison-file-input {
          display: none;
        }

        /* ======================================================
           VS
        ====================================================== */

        .comparison-vs {
          display: flex;

          align-items: center;
          justify-content: center;
        }

        .comparison-vs-line {
          position: absolute;

          width: 1px;

          height: 100%;

          background:
            linear-gradient(
              to bottom,
              transparent,
              rgba(255,255,255,0.08),
              transparent
            );
        }

        .comparison-vs-badge {
          position: relative;

          width: 42px;
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid
            rgba(125,105,255,0.28);

          border-radius: 50%;

          background: #070a12;

          color: #a89bff;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 1px;

          box-shadow:
            0 0 28px
              rgba(103,80,255,0.08);
        }

        /* ======================================================
           COMPARE ACTION
        ====================================================== */

        .comparison-action {
          display: flex;
          flex-direction: column;
          align-items: center;

          margin-top: 34px;
        }

        .comparison-button {
          appearance: none;

          min-width: 205px;

          padding: 13px 23px;

          border: 1px solid
            rgba(76,220,247,0.52);

          border-radius: 10px;

          background:
            linear-gradient(
              100deg,
              rgba(0,217,255,0.09),
              rgba(103,80,255,0.09)
            );

          color: #a9f1ff;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 10px;
          font-weight: 600;

          letter-spacing: 0.8px;

          cursor: pointer;

          box-shadow:
            0 12px 35px
              rgba(0,0,0,0.18);

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .comparison-button:hover:not(:disabled) {
          border-color:
            rgba(0,217,255,0.78);

          background:
            linear-gradient(
              100deg,
              rgba(0,217,255,0.14),
              rgba(103,80,255,0.14)
            );

          box-shadow:
            0 15px 42px
              rgba(0,217,255,0.08);

          transform: translateY(-2px);
        }

        .comparison-button:disabled {
          opacity: 0.45;
          cursor: wait;
        }

        .comparison-action-note {
          margin: 11px 0 0;

          color: #505b6e;

          font-size: 9px;

          text-align: center;
        }

        .comparison-error {
          max-width: 700px;

          margin: 24px auto 0;

          padding: 12px 15px;

          border: 1px solid
            rgba(242,61,155,0.24);

          border-radius: 9px;

          background:
            rgba(242,61,155,0.035);

          color: #e889b6;

          font-size: 10px;

          line-height: 1.6;

          text-align: center;
        }

        /* ======================================================
           RESULTS
        ====================================================== */

        .comparison-results-section {
          position: relative;

          padding:
            82px 0 105px;

          border-top: 1px solid
            rgba(255,255,255,0.055);

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(103,80,255,0.06),
              transparent 36%
            ),
            rgba(255,255,255,0.008);
        }

        .comparison-results-header {
          text-align: center;

          max-width: 800px;

          margin: 0 auto 48px;
        }

        .comparison-results-eyebrow {
          margin-bottom: 14px;

          color: #6c7589;

          font-size: 8px;
          font-weight: 700;

          letter-spacing: 2px;

          text-transform: uppercase;
        }

        .comparison-results-title {
          margin: 0;

          color: #f4f7ff;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size:
            clamp(31px, 4vw, 48px);

          font-weight: 600;

          line-height: 1.05;

          letter-spacing: -1.8px;
        }

        .comparison-results-title span {
          background:
            linear-gradient(
              100deg,
              #64e7ff,
              #a783ff
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;
        }

        .comparison-topic-display {
          margin-top: 14px;

          color: #687489;

          font-size: 10px;

          line-height: 1.6;
        }

        /* ======================================================
           BEST MATCH
        ====================================================== */

        .comparison-best-match {
          position: relative;

          max-width: 850px;

          margin: 0 auto 43px;

          padding: 31px 34px;

          border: 1px solid
            rgba(0,217,255,0.14);

          border-radius: 17px;

          background:
            linear-gradient(
              135deg,
              rgba(0,217,255,0.035),
              rgba(103,80,255,0.035),
              rgba(255,255,255,0.012)
            );

          box-shadow:
            0 30px 80px
              rgba(0,0,0,0.20);

          overflow: hidden;
        }

        .comparison-best-match::before {
          content: "";

          position: absolute;

          left: 0;
          top: 0;

          width: 100%;
          height: 2px;

          background:
            linear-gradient(
              90deg,
              #4de5ff,
              #657dff,
              #a77aff
            );
        }

        .comparison-best-match-grid {
          display: grid;

          grid-template-columns:
            1fr
            auto;

          align-items: center;

          gap: 35px;
        }

        .comparison-best-label {
          margin-bottom: 10px;

          color: #5fe1f5;

          font-size: 8px;
          font-weight: 700;

          letter-spacing: 2px;

          text-transform: uppercase;
        }

        .comparison-best-paper {
          margin: 0;

          color: #f4f7ff;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size:
            clamp(25px, 4vw, 39px);

          font-weight: 600;

          line-height: 1.1;

          letter-spacing: -1px;

          overflow-wrap: anywhere;
        }

        .comparison-best-reason {
          max-width: 620px;

          margin: 10px 0 0;

          color: #778398;

          font-size: 10px;

          line-height: 1.65;
        }

        /* ======================================================
           COMPARISON POINTS
        ====================================================== */

        .comparison-points {
          max-width: 850px;

          margin: 0 auto;

          border-top: 1px solid
            rgba(255,255,255,0.075);
        }

        .comparison-point {
          display: grid;

          grid-template-columns:
            185px
            minmax(0, 1fr);

          min-height: 92px;

          border-bottom: 1px solid
            rgba(255,255,255,0.075);

          transition:
            background 0.2s ease;
        }

        .comparison-point:hover {
          background:
            rgba(255,255,255,0.012);
        }

        .comparison-point-label {
          padding: 25px 20px 25px 0;

          color: #687489;

          font-size: 8px;

          font-weight: 700;

          letter-spacing: 1.6px;

          text-transform: uppercase;
        }

        .comparison-point-content {
          display: flex;

          flex-direction: column;

          justify-content: center;

          gap: 5px;

          padding:
            19px 0 19px 25px;

          border-left: 1px solid
            rgba(255,255,255,0.055);

          min-width: 0;
        }

        .comparison-point-value {
          color: #68e4f7;

          font-family:
            "Space Grotesk",
            sans-serif;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 0.5px;

          text-transform: uppercase;
        }

        .comparison-point-description {
          margin: 0;

          color: #8b95a8;

          font-size: 11px;

          line-height: 1.65;

          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        /* ======================================================
           FALLBACK RESULT
        ====================================================== */

        .comparison-extra-results {
          max-width: 850px;

          margin: 36px auto 0;
        }

        .comparison-extra-heading {
          margin-bottom: 13px;

          color: #566174;

          font-size: 8px;

          font-weight: 700;

          letter-spacing: 1.7px;

          text-transform: uppercase;
        }

        .comparison-extra-box {
          margin-bottom: 12px;

          padding: 20px;

          border: 1px solid
            rgba(255,255,255,0.065);

          border-radius: 12px;

          background:
            rgba(255,255,255,0.015);

          color: #858fa2;

          font-size: 10px;

          line-height: 1.75;

          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        /* ======================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 850px) {

          .comparison-upload-grid {
            grid-template-columns: 1fr;
          }

          .comparison-vs {
            min-height: 46px;
          }

          .comparison-vs-line {
            width: 100%;
            height: 1px;
          }

          .comparison-best-match-grid {
            grid-template-columns: 1fr;
            gap: 25px;
          }

          .comparison-point {
            grid-template-columns: 1fr;
          }

          .comparison-point-label {
            padding:
              20px 0 7px;
          }

          .comparison-point-content {
            padding:
              0 0 20px;

            border-left: none;
          }
        }

        @media (max-width: 650px) {

          .comparison-navbar-inner,
          .comparison-container {
            width:
              min(
                calc(100% - 34px),
                1120px
              );
          }

          .comparison-navbar-inner {
            min-height: 64px;
          }

          .comparison-brand-name {
            font-size: 15px;
          }

          .comparison-nav-button {
            padding:
              8px 10px;

            font-size: 9px;
          }

          .comparison-hero {
            padding:
              75px 0 48px;
          }

          .comparison-hero-title {
            font-size: 49px;
            letter-spacing: -2.6px;
          }

          .comparison-hero-description {
            font-size: 11px;
          }

          .comparison-topic-wrapper {
            margin-bottom: 32px;
          }

          .comparison-topic-input {
            min-height: 56px;
          }

          .comparison-upload-card {
            min-height: 270px;
            padding: 21px;
          }

          .comparison-paper-index {
            margin-bottom: 31px;
          }

          .comparison-best-match {
            padding: 25px 22px;
          }

          .comparison-best-paper {
            font-size: 28px;
          }

          .comparison-results-section {
            padding:
              65px 0 80px;
          }

        }
      `}</style>

      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header className="comparison-navbar">

        <div className="comparison-navbar-inner">

          <div
            className="comparison-brand"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            <div className="comparison-brand-mark">
              R
            </div>

            <div className="comparison-brand-name">
              Research<span>IQ</span>
            </div>

          </div>

          <div className="comparison-nav-right">

            <button
              type="button"
              className="comparison-nav-button"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>

          </div>

        </div>

      </header>

      <main className="comparison-main">

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="comparison-hero">

          <div className="comparison-container">

            <div className="comparison-hero-inner">

              <div className="comparison-eyebrow">
                PAPER INTELLIGENCE
              </div>

              <h1 className="comparison-hero-title">
                Compare research
                <br />
                <span>papers intelligently.</span>
              </h1>

              <p className="comparison-hero-description">
                Compare two research papers against your
                research topic and identify the study that
                provides the stronger academic fit.
              </p>

            </div>

          </div>

        </section>

        {/* ====================================================
            WORKSPACE
        ==================================================== */}

        <section className="comparison-workspace">

          <div className="comparison-container">

            {/* ==================================================
                TOPIC INPUT
            ================================================== */}

            <div className="comparison-topic-wrapper">

              <label
                className="comparison-input-label"
                htmlFor="research-topic"
              >
                Research Topic
              </label>

              <div className="comparison-topic-input-wrap">

                <span className="comparison-topic-icon">
                  ⌕
                </span>

                <input
                  id="research-topic"
                  type="text"
                  className="comparison-topic-input"
                  value={topic}
                  onChange={handleTopicChange}
                  placeholder="Enter the research topic you want to investigate..."
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      paper1 &&
                      paper2 &&
                      !loading
                    ) {
                      handleCompare();
                    }
                  }}
                />

              </div>

            </div>

            {/* ==================================================
                PAPER UPLOADS
            ================================================== */}

            <div className="comparison-upload-heading">
              Research Papers
            </div>

            <div className="comparison-upload-grid">

              {/* PAPER 01 */}

              <PaperUploadCard
                number="01"
                paper={paper1}
                onUpload={() => openFileExplorer(1)}
                onRemove={() => removePaper(1)}
                fileInputRef={paper1FileInputRef}
                onFileChange={(event) =>
                  handleFileUpload(
                    event.target.files?.[0],
                    1
                  )
                }
              />

              {/* VS */}

              <div className="comparison-vs">

                <div className="comparison-vs-line" />

                <div className="comparison-vs-badge">
                  VS
                </div>

              </div>

              {/* PAPER 02 */}

              <PaperUploadCard
                number="02"
                paper={paper2}
                onUpload={() => openFileExplorer(2)}
                onRemove={() => removePaper(2)}
                fileInputRef={paper2FileInputRef}
                onFileChange={(event) =>
                  handleFileUpload(
                    event.target.files?.[0],
                    2
                  )
                }
              />

            </div>

            {/* ==================================================
                ACTION
            ================================================== */}

            <div className="comparison-action">

              <button
                type="button"
                className="comparison-button"
                onClick={handleCompare}
                disabled={
                  loading ||
                  !topic.trim() ||
                  !paper1 ||
                  !paper2
                }
              >
                {loading
                  ? "ANALYZING PAPERS..."
                  : "COMPARE PAPERS →"}
              </button>

              <p className="comparison-action-note">
                {loading
                  ? "RAG is analyzing both studies against your research topic."
                  : "Both papers will be evaluated for relevance, methodology, research gap, depth and overall fit."}
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div
                className="comparison-error"
                role="alert"
              >
                {error}
              </div>
            )}

          </div>

        </section>

        {/* ====================================================
            RESULTS
        ==================================================== */}

        {comparison && (

          <ComparisonResults
            comparison={comparison}
            topic={topic}
          />

        )}

      </main>

    </div>
  );
}


/* ============================================================
   PAPER UPLOAD CARD
============================================================ */

function PaperUploadCard({
  number,
  paper,
  onUpload,
  onRemove,
  fileInputRef,
  onFileChange,
}) {

  const isUploaded = Boolean(paper?.file);

  return (
    <article
      className={`comparison-upload-card ${
        paper ? "has-paper" : ""
      }`}
    >

      <div className="comparison-paper-index">

        <span className="comparison-paper-index-number">
          PAPER {number}
        </span>

        <span
          className={`comparison-paper-status ${
            paper ? "ready" : ""
          }`}
        >
          {paper ? "READY" : "EMPTY"}
        </span>

      </div>

      <input
        ref={fileInputRef}
        className="comparison-file-input"
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onFileChange}
      />

      <div className="comparison-upload-content">

        <button
          type="button"
          className="comparison-upload-icon"
          onClick={onUpload}
          aria-label={`Upload research paper ${number}`}
        >
          {paper ? "✓" : "+"}
        </button>

        {paper ? (

          <>
            <h2 className="comparison-upload-title">
              {paper.title ||
                paper.file_name ||
                "Research paper"}
            </h2>

            <p className="comparison-upload-description">
              {isUploaded
                ? "Document ready for RAG comparison."
                : "Research paper selected from your results."}
            </p>

            {isUploaded && (
              <div className="comparison-upload-file">
                {paper.file_name ||
                  paper.file?.name}
              </div>
            )}

            <button
              type="button"
              className="comparison-remove-paper"
              onClick={onRemove}
            >
              Remove paper
            </button>
          </>

        ) : (

          <>
            <h2 className="comparison-upload-title">
              Upload Paper {number}
            </h2>

            <p className="comparison-upload-description">
              Add the research document you want
              ResearchIQ to analyze.
              <br />
              PDF, DOC, or DOCX supported.
            </p>
          </>

        )}

      </div>

    </article>
  );
}


/* ============================================================
   COMPARISON RESULTS
============================================================ */

function ComparisonResults({
  comparison,
  topic,
}) {

  const bestMatch =
    getBestMatch(comparison);

  const bestMatchReason =
    getBestMatchReason(comparison);

  const points =
    getComparisonPoints(comparison);

  const extraResults =
    getExtraResults(comparison);

  return (

    <section className="comparison-results-section">

      <div className="comparison-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="comparison-results-header">

          <div className="comparison-results-eyebrow">
            COMPARISON RESULT
          </div>

          <h2 className="comparison-results-title">
            Find the paper with the
            <br />
            <span>stronger research fit.</span>
          </h2>

          {topic && (
            <p className="comparison-topic-display">
              Evaluated against: "{topic}"
            </p>
          )}

        </div>

        {/* ====================================================
            BEST MATCH
        ==================================================== */}

        <div className="comparison-best-match">

          <div className="comparison-best-match-grid">

            <div>

              <div className="comparison-best-label">
                BEST MATCH
              </div>

              <h3 className="comparison-best-paper">
                {bestMatch}
              </h3>

              {bestMatchReason && (

                <p className="comparison-best-reason">
                  {bestMatchReason}
                </p>

              )}

            </div>

          </div>

        </div>

        {/* ====================================================
            COMPARISON POINTS
        ==================================================== */}

        <div className="comparison-points">

          {points.map(
            (point, index) => (

              <ComparisonPoint
                key={`${point.label}-${index}`}
                label={point.label}
                value={point.value}
                description={
                  point.description
                }
              />

            )
          )}

        </div>

        {/* ====================================================
            OPTIONAL EXTRA BACKEND INFORMATION
        ==================================================== */}

        {extraResults.length > 0 && (

          <div className="comparison-extra-results">

            <div className="comparison-extra-heading">
              Additional Analysis
            </div>

            {extraResults.map(
              (item, index) => (

                <div
                  className="comparison-extra-box"
                  key={index}
                >
                  <strong>
                    {item.label}
                  </strong>

                  <br />

                  {item.value}

                </div>

              )
            )}

          </div>

        )}

      </div>

    </section>

  );
}


/* ============================================================
   COMPARISON POINT
============================================================ */

function ComparisonPoint({
  label,
  value,
  description,
}) {

  return (

    <div className="comparison-point">

      <div className="comparison-point-label">
        {label}
      </div>

      <div className="comparison-point-content">

        {value && (
          <div className="comparison-point-value">
            {value}
          </div>
        )}

        {description && (
          <p className="comparison-point-description">
            {description}
          </p>
        )}

      </div>

    </div>

  );
}


/* ============================================================
   BEST MATCH
============================================================ */

function getBestMatch(comparison) {

  const value =
    comparison?.which_paper_is_more_suitable ||
    "";

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return cleanPaperName(value);
  }

  return "NEITHER PAPER";
}


/* ============================================================
   BEST MATCH REASON
============================================================ */

function getBestMatchReason(comparison) {

  const value =
    comparison?.reason ||
    "";

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value;
  }

  return "";
}


/* ============================================================
   FIVE COMPARISON POINTS
============================================================ */

function getComparisonPoints(
  comparison
) {

  return [
    createComparisonPoint(
      "OVERVIEW",
      comparison?.overview
    ),

    createComparisonPoint(
      "RESEARCH PROBLEM",
      comparison?.research_problem
    ),

    createComparisonPoint(
      "METHODOLOGY",
      comparison?.methodology
    ),

    createComparisonPoint(
      "FINDINGS",
      comparison?.findings
    ),

    createComparisonPoint(
      "RESEARCH RELEVANCE",
      comparison?.research_relevance
    ),
  ];
}


/* ============================================================
   CREATE COMPARISON POINT
============================================================ */

function createComparisonPoint(
  label,
  value
) {

  const normalized =
    normalizeComparisonValue(value);

  return {
    label,
    value:
      normalized?.value ||
      "ANALYZED",
    description:
      normalized?.description ||
      "",
  };
}


/* ============================================================
   NORMALIZE COMPARISON VALUE
============================================================ */

function normalizeComparisonValue(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // STRING
  // ----------------------------------------------------------

  if (typeof value === "string") {

    return {
      value: "",
      description: value,
    };

  }

  // ----------------------------------------------------------
  // NUMBER
  // ----------------------------------------------------------

  if (typeof value === "number") {

    return {
      value: String(value),
      description: "",
    };

  }

  // ----------------------------------------------------------
  // ARRAY
  // ----------------------------------------------------------

  if (Array.isArray(value)) {

    const text =
      value
        .map((item) =>
          typeof item === "object"
            ? objectToReadableText(
                item
              )
            : String(item)
        )
        .filter(Boolean)
        .join("\n");

    return {
      value: "",
      description: text,
    };

  }

  // ----------------------------------------------------------
  // OBJECT
  // ----------------------------------------------------------

  if (
    typeof value === "object"
  ) {

    const rating =
      value.rating ||
      value.level ||
      value.score ||
      value.assessment ||
      value.status ||
      value.strength ||
      "";

    const description =
      value.description ||
      value.reason ||
      value.explanation ||
      value.summary ||
      value.details ||
      "";

    return {
      value:
        rating
          ? String(rating)
          : "",

      description:
        description
          ? String(description)
          : objectToReadableText(
              value
            ),
    };

  }

  return {
    value: "",
    description: String(value),
  };
}


/* ============================================================
   OBJECT TO READABLE TEXT
============================================================ */

function objectToReadableText(
  object
) {

  if (
    !object ||
    typeof object !== "object"
  ) {
    return String(object || "");
  }

  return Object.entries(object)
    .filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== ""
    )
    .map(
      ([key, value]) =>
        `${formatKey(key)}: ${
          Array.isArray(value)
            ? value
                .map((item) =>
                  typeof item === "object"
                    ? objectToReadableText(
                        item
                      )
                    : String(item)
                )
                .join(", ")
            : typeof value ===
                "object"
              ? objectToReadableText(
                  value
                )
              : String(value)
        }`
    )
    .join(" · ");
}


/* ============================================================
   EXTRA RESULTS
============================================================ */

function getExtraResults(
  comparison
) {

  const includedKeys = [
    "strengths",
    "limitations",
    "similarities",
    "differences",
    "overall_assessment",
  ];

  const results = [];

  includedKeys.forEach(
    (key) => {

      const value =
        comparison?.[key];

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return;
      }

      const normalized =
        normalizeComparisonValue(
          value
        );

      if (
        !normalized?.description &&
        !normalized?.value
      ) {
        return;
      }

      results.push({
        label: formatKey(key),
        value:
          normalized.description ||
          normalized.value,
      });

    }
  );

  return results;
}


/* ============================================================
   CLEAN PAPER NAME
============================================================ */

function cleanPaperName(
  value
) {

  const text =
    String(value).trim();

  if (
    /paper\s*1|paper\s*01/i.test(
      text
    )
  ) {
    return "PAPER 01";
  }

  if (
    /paper\s*2|paper\s*02/i.test(
      text
    )
  ) {
    return "PAPER 02";
  }

  if (
    /neither/i.test(text)
  ) {
    return "NEITHER PAPER";
  }

  return text;
}


/* ============================================================
   FORMAT KEY
============================================================ */

function formatKey(key) {

  return String(key)
    .replace(
      /_/g,
      " "
    )
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}


export default StudyComparison;
