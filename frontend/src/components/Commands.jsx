import { useEffect, useState } from "react";
import axios from "axios";
import { Terminal, Crown } from "lucide-react";
import { SectionHeader } from "@/components/Features";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Commands() {
  const [cmds, setCmds] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/commands`)
      .then((r) => setCmds(r.data.commands || []))
      .catch(() => setCmds([]));
  }, []);

  return (
    <section
      id="commands"
      data-testid="commands-section"
      className="relative py-24 sm:py-32 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <SectionHeader
          overline="Commands"
          title="A tight, readable surface."
          body="Five commands. Zero clutter. Everything else is handled automatically."
        />

        <div
          data-testid="commands-list"
          className="mt-14 authix-card overflow-hidden divide-y divide-white/5"
        >
          <div className="px-6 py-3 bg-[#0B0B0E] flex items-center gap-2 border-b border-white/5">
            <Terminal size={14} className="text-[#00E5FF]" />
            <span className="mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              authix / commands
            </span>
          </div>
          {cmds.map((c) => (
            <div
              key={c.name}
              data-testid={`command-${c.name.replace(/[^\w]+/g, "-")}`}
              className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3 sm:w-56 shrink-0">
                <code className="mono text-sm font-bold text-[#00E5FF]">{c.name}</code>
                {c.premium && (
                  <span className="mono text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border border-[#00D2FF]/40 text-[#00E5FF] bg-[#00D2FF]/5 inline-flex items-center gap-1">
                    <Crown size={10} /> Premium
                  </span>
                )}
              </div>
              <div className="mono text-sm text-zinc-400 leading-relaxed">
                {c.description}
              </div>
            </div>
          ))}
          {cmds.length === 0 && (
            <div className="px-6 py-10 text-center mono text-sm text-zinc-500">
              Loading commands…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
