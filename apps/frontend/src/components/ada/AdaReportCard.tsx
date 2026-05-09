"use client";

/**
 * AdaReportCard — inline chat card rendered by the agent via
 * `useFrontendTool({ name: "renderAdaReport", ... })`.
 *
 * Displays a titled section of the report with ADA's dark-theme styling.
 */

interface AdaReportCardProps {
  title: string;
  content: string;
}

export function AdaReportCard({ title, content }: AdaReportCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1A2024, #0E1113)",
        borderRadius: "16px",
        padding: "20px",
        margin: "8px 0",
        border: "1px solid rgba(63, 68, 72, 0.5)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        maxWidth: "100%",
      }}
    >
      <h3
        style={{
          color: "#0CB5E9",
          fontSize: "1.1rem",
          fontWeight: 600,
          margin: "0 0 12px 0",
          borderBottom: "1px solid rgba(63, 68, 72, 0.4)",
          paddingBottom: "8px",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          color: "#FFFFFF",
          fontSize: "0.9rem",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
