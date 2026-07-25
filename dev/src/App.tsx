import { CaseSection } from "@/components/CaseSection";
import { cases } from "@/cases";

export const App = () => (
  <div className="flex flex-col gap-16 p-10">
    {cases.map((c, i) => (
      <div key={i}>
        <h1 id="case-index" className="font-mono text-xs opacity-50 mb-1">
          Case: {i}
        </h1>
        <CaseSection {...c} />
      </div>
    ))}
  </div>
);
