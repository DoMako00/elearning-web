import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopAppBar } from "../TopAppBar";
import { DocsOnlyBanner } from "../shared/DocsOnlyBanner";
import { Compass, ArrowLeft, Users, Calendar } from "lucide-react";

export const MobileLearningPathStubScreen: React.FC = () => {
  const navigate = useNavigate();
  const { slug: _slug } = useParams<{ slug?: string }>();

  const title = "Master Human Anatomy";
  const weeks = 12;

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
      <TopAppBar
        variant="detail"
        title={title}
        backLabel="Explore"
        onBack={() => navigate("/explore")}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
        <DocsOnlyBanner variant="full" />

        {/* Path Header Summary */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-200/40">
              EDITOR'S PICK
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold tracking-wider uppercase">
              {weeks}-WEEK PATH
            </span>
          </div>

          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {title}
          </h1>

          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Build a complete understanding of the human body — from skeletal structure to organ systems — with curated medical reading modules, anatomical atlases, and clinical study documents.
          </p>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              12 Weeks Guided
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              18.7k learners enrolled
            </span>
          </div>
        </div>

        {/* Placeholder Coming Soon notice */}
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Learning Path Modules</h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Module milestones, progressive document reading schedule, and certificate track will appear here.
          </p>
          <span className="mt-4 inline-block px-3.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            Coming soon
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/explore")}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>
      </div>
    </div>
  );
};
