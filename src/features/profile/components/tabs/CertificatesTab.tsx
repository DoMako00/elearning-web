import React from "react";
import { Download, ExternalLink, Award, ShieldCheck } from "lucide-react";
import { useToast } from "../../../../hooks/useToast";
import { ToastNotification } from "../../../../components/ui/ToastNotification";
import type { CertificateItem } from "../../types/profile.types";

interface CertificatesTabProps {
  certificates: CertificateItem[];
}

export const CertificatesTab: React.FC<CertificatesTabProps> = ({
  certificates,
}) => {
  const { toastMessage, showToast } = useToast();

  const handleDownload = (cert: CertificateItem) => {
    showToast(`Downloading PDF certificate for "${cert.courseTitle}"...`);
  };

  const handleVerify = (cert: CertificateItem) => {
    showToast(`Opening verification link: ${cert.credentialId}`);
    window.open(cert.verifyUrl, "_blank");
  };

  return (
    <div className="space-y-6 pt-6">
      <ToastNotification message={toastMessage} />
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <div className="flex items-start gap-3.5">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
            <Award className="size-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Verified Medical & Clinical Certificates
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              These credentials are cryptographically verifiable and backed by our clinical education accreditation.
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-3.5 py-1.5 rounded-xl self-start sm:self-auto shadow-2xs">
          {certificates.length} Issued Credentials
        </div>
      </div>

      {/* Certificates Gallery Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {certificates.map((cert) => (
          <article
            key={cert.id}
            className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 group"
          >
            <div>
              {/* Header preview / simulated certificate thumbnail with emerald certificate ribbon */}
              <div className="relative h-40 bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-900 p-5 flex flex-col justify-between text-white overflow-hidden">
                <div
                  className="absolute inset-0 opacity-15 bg-repeat select-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #fff 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200 tracking-wider uppercase">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span>GreenLearn Certified</span>
                  </div>
                  <span className="rounded-md bg-emerald-700/60 px-2 py-0.5 text-[10px] font-bold text-emerald-100 border border-emerald-500/30">
                    {cert.grade}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-sm font-bold leading-snug line-clamp-2 text-white">
                    {cert.courseTitle}
                  </h3>
                  <p className="text-[11px] text-emerald-200/80 mt-1 truncate">
                    Instructor: {cert.instructorName}
                  </p>
                </div>
              </div>

              {/* Certificate metadata */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Issued Date</span>
                  <span className="font-semibold text-gray-700">{cert.issueDate}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Credential ID</span>
                  <span className="font-mono text-[11px] font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    {cert.credentialId}
                  </span>
                </div>

                {/* Skills Learned */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Skills Acquired
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions: PDF download and Credential link */}
            <div className="p-5 pt-0 border-t border-gray-100 grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleDownload(cert)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Download className="size-3.5 text-gray-500" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleVerify(cert)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <ExternalLink className="size-3.5 text-white/90" />
                <span>Verify Credential</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
