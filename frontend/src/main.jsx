
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";

import ComparePapers from "./pages/ComparePapers";
import ResearchQuestionsExplorer from "./pages/ResearchQuestionsExplorer";
import KaggleDatasetPage from "./pages/KaggleDatasetPage";
import ResearchPaperGenerator from "./pages/ResearchPaperGenerator";
import ResearchProjectAdvisor from "./pages/ResearchProjectAdvisor";
import DSAADashboard from "./pages/DSAADashboard";
import DataExplorer from "./pages/DataExplorer";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* HOMEPAGE */}
        <Route path="/" element={<App />} />

        {/* RESEARCH TOOLS */}
        <Route
          path="/kaggle-dataset"
          element={<KaggleDatasetPage />}
        />

        <Route
          path="/compare-papers"
          element={<ComparePapers />}
        />

        <Route
          path="/research-questions"
          element={<ResearchQuestionsExplorer />}
        />

        <Route
          path="/research-paper-generator"
          element={<ResearchPaperGenerator />}
        />

        <Route
          path="/research-project-advisor"
          element={<ResearchProjectAdvisor />}
        />

        {/* DSAA DASHBOARD */}
        <Route
          path="/dsaa-dashboard"
          element={<DSAADashboard />}
        />

        {/* DSAA DATA EXPLORER */}
        <Route
          path="/dsaa-data-explorer"
          element={<DataExplorer />}
        />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
