"use client";

import { useEffect, useState } from "react";
import {
  CopilotChatConfigurationProvider,
  CopilotSidebar,
  useAgent,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { ThreadsDrawer } from "@/components/threads-drawer";
import drawerStyles from "@/components/threads-drawer/threads-drawer.module.css";
import { ToolFallbackCard } from "@/components/copilot/ToolFallbackCard";
import { Starfield } from "@/components/ada/Starfield";
import { AdaReportCard } from "@/components/ada/AdaReportCard";

/* ─────────────────────────────────────────────────────────────────────
   AdaCanvas — the main ADA interface with CopilotKit sidebar.
   Replaces the generic lead-triage canvas with ADA's dark-theme UI.
   ───────────────────────────────────────────────────────────────────── */

function AdaCanvas() {
  const { agent } = useAgent();
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // ── Chat suggestions (before first message) ───────────────────────
  useConfigureSuggestions({
    available: "before-first-message",
    suggestions: [
      {
        title: "¿Qué es ADA?",
        message: "Explícame qué es ADA y cómo puede ayudarme.",
      },
      {
        title: "Inversión extranjera",
        message:
          "¿Qué oportunidades hay para inversión extranjera en el sector tecnológico de México?",
      },
      {
        title: "Exportaciones",
        message:
          "¿Cuáles son los principales productos mexicanos que se exportan a Europa?",
      },
      {
        title: "Estrategia de internacionalización",
        message:
          "Ayúdame a diseñar una estrategia para expandir mi empresa mexicana al extranjero.",
      },
    ],
  });

  // ── Frontend tool: render a report card inline in chat ─────────
  useFrontendTool({
    name: "renderAdaReport",
    description:
      "Render a styled ADA report card inline in the chat. Use this to present structured sections of analysis, data, or recommendations. Always provide a title and HTML content.",
    parameters: z.object({
      title: z.string(),
      content: z.string(),
    }),
    render: ({ args }) => (
      <AdaReportCard title={args.title ?? ""} content={args.content ?? ""} />
    ),
  });

  // ── Catch-all tool renderer ───────────────────────────────────────
  useDefaultRenderTool({
    render: ({ name, status, result, parameters }) => (
      <ToolFallbackCard
        name={name}
        status={status}
        result={result}
        parameters={parameters}
      />
    ),
  });

  // ── Panel content ─────────────────────────────────────────────────
  const panels: Record<string, { title: string; content: string }> = {
    info: {
      title: "Información General",
      content: `
        <div>
          <p>¡Hola! Soy <strong>ADA</strong>, un agente creado por el <strong>Centro de Investigación y Docencia Económicas (CIDE)</strong>.
          Estoy aquí para apoyarte en el fortalecimiento de tus estrategias de comercio internacional y atracción de inversión en México.</p>
          <h3>¿En qué puedo ayudarte?</h3>
          <ul>
            <li><strong>Atracción de Inversión Extranjera Directa (IED):</strong> Identifica oportunidades para invertir en sectores estratégicos de México.</li>
            <li><strong>Promoción de Exportaciones Mexicanas:</strong> Encuentra mercados internacionales ideales para tus productos.</li>
            <li><strong>Internacionalización de Empresas:</strong> Diseña estrategias para expandir tu empresa mexicana al extranjero.</li>
            <li><strong>Fortalecimiento de la Imagen de México:</strong> Apoya proyectos que impulsen la presencia global del país.</li>
          </ul>
          <h3>Fuentes de información</h3>
          <p>Cuento con acceso a <strong>DataMéxico</strong> y otras bases de datos institucionales que me permiten ofrecerte reportes detallados sobre empresas, sectores y contactos relevantes.</p>
        </div>
      `,
    },
    video: {
      title: "Video Recomendado",
      content: `
        <div>
          <p>Descubre cómo ADA te puede ayudar.</p>
          <div style="position:relative;width:100%;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin-top:16px;">
            <iframe src="https://www.youtube.com/embed/2UqUVBM10Fk?si=kfLWFQk-tez4hkp5" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>
          </div>
        </div>
      `,
    },
  };

  return (
    <>
      <Starfield />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          padding: "2rem",
          paddingBottom: "4rem",
        }}
      >
        {/* Logo */}
        <img
          src="/logoADA.png"
          alt="ADA IA Logo"
          className="ada-logo"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid var(--palm-link)",
            marginBottom: "1rem",
          }}
        />

        {/* Title */}
        <h1 className="ada-title">ADA</h1>
        <p className="ada-subtitle">
          Tu Asesora en Comercio Internacional e Inversión
        </p>

        {/* Cards */}
        <div className="ada-cards-container">
          <div
            className="ada-card"
            onClick={() => setActivePanel("info")}
          >
            <div className="ada-card-icon">🎇</div>
            <h3>Conoce ADA</h3>
            <p>Datos esenciales sobre ADA IA</p>
            <div className="ada-card-indicator" />
          </div>

          <div
            className="ada-card"
            onClick={() => setActivePanel("video")}
          >
            <div className="ada-card-icon">▶️</div>
            <h3>Video Adicional</h3>
            <p>Mira un video corto sobre la experiencia</p>
            <div className="ada-card-indicator" />
          </div>
        </div>
      </main>

      {/* Slide-in panel */}
      <div className={`ada-panel ${activePanel ? "active" : ""}`}>
        {activePanel && panels[activePanel] && (
          <>
            <div className="ada-panel-header">
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
                {panels[activePanel].title}
              </h2>
              <button
                className="ada-panel-close"
                onClick={() => setActivePanel(null)}
              >
                ×
              </button>
            </div>
            <div
              className="ada-panel-content"
              dangerouslySetInnerHTML={{
                __html: panels[activePanel].content,
              }}
            />
          </>
        )}
      </div>

      {/* CopilotKit sidebar */}
      <CopilotSidebar
        defaultOpen
        width={400}
        input={{ disclaimer: () => null, className: "pb-6" }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Page shell — threads drawer + CopilotChat config
   ───────────────────────────────────────────────────────────────────── */


function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

function HomePage() {
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  return (
    <div className={drawerStyles.layout}>
      <ThreadsDrawer
        agentId="default"
        threadId={threadId}
        onThreadChange={setThreadId}
      />
      <div className={drawerStyles.mainPanel}>
        <CopilotChatConfigurationProvider agentId="default" threadId={threadId}>
          <AdaCanvas />
        </CopilotChatConfigurationProvider>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ClientOnly>
      <HomePage />
    </ClientOnly>
  );
}
