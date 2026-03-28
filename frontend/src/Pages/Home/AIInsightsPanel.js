import React, { useEffect, useMemo, useState } from "react";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SavingsIcon from "@mui/icons-material/Savings";
import { aiInsightsAPI } from "../../utils/ApiRequest";
import httpClient from "../../utils/httpClient";

const AIInsightsPanel = ({ transactions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insightsData, setInsightsData] = useState({
    spending_insights: "",
    budget_suggestions: [],
    category_warnings: [],
    saving_tips: [],
  });

  const hasTransactions = useMemo(() => Array.isArray(transactions) && transactions.length > 0, [transactions]);

  useEffect(() => {
    if (!hasTransactions) {
      setInsightsData({
        spending_insights: "",
        budget_suggestions: [],
        category_warnings: [],
        saving_tips: [],
      });
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await httpClient.post(aiInsightsAPI, { transactions });
        if (cancelled) {
          return;
        }

        setInsightsData({
          spending_insights: data?.spending_insights || data?.insights || "",
          budget_suggestions: Array.isArray(data?.budget_suggestions) ? data.budget_suggestions : [],
          category_warnings: Array.isArray(data?.category_warnings) ? data.category_warnings : [],
          saving_tips: Array.isArray(data?.saving_tips) ? data.saving_tips : Array.isArray(data?.suggestions) ? data.suggestions : [],
        });
      } catch {
        if (!cancelled) {
          setError("Unable to load AI insights right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchInsights();
    return () => {
      cancelled = true;
    };
  }, [hasTransactions, transactions]);

  if (!hasTransactions) {
    return null;
  }

  return (
    <div className="ai-insights-panel mt-4">
      <h4 className="text-white mb-3">AI Insights</h4>
      {loading ? <p className="text-white">Loading insights...</p> : null}
      {error ? <p className="text-warning">{error}</p> : null}

      {!loading && !error ? (
        <div className="ai-insights-grid">
          <div className="ai-insight-card">
            <div className="ai-insight-title">
              <PsychologyAltIcon className="ai-icon info" />
              <span>Spending Insights</span>
            </div>
            <p className="mb-0">
              {insightsData.spending_insights || "No spending insights available yet."}
            </p>
          </div>

          <div className="ai-insight-card">
            <div className="ai-insight-title">
              <AccountBalanceWalletIcon className="ai-icon budget" />
              <span>Budget Suggestions</span>
            </div>
            <ul className="ai-list">
              {insightsData.budget_suggestions.length > 0 ? (
                insightsData.budget_suggestions.map((item, idx) => <li key={`budget-${idx}`}>{item}</li>)
              ) : (
                <li>No budget suggestions available.</li>
              )}
            </ul>
          </div>

          <div className="ai-insight-card">
            <div className="ai-insight-title">
              <WarningAmberIcon className="ai-icon warning" />
              <span>Category Warnings</span>
            </div>
            <ul className="ai-list">
              {insightsData.category_warnings.length > 0 ? (
                insightsData.category_warnings.map((item, idx) => <li key={`warn-${idx}`}>{item}</li>)
              ) : (
                <li>No category warnings available.</li>
              )}
            </ul>
          </div>

          <div className="ai-insight-card">
            <div className="ai-insight-title">
              <SavingsIcon className="ai-icon savings" />
              <span>Savings Tips</span>
            </div>
            <ul className="ai-list">
              {insightsData.saving_tips.length > 0 ? (
                insightsData.saving_tips.map((item, idx) => <li key={`save-${idx}`}>{item}</li>)
              ) : (
                <li>No savings tips available.</li>
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AIInsightsPanel;
