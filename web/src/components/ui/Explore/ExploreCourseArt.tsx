import anatomyImg from "../../../Assets/course-library/human-anatomy.webp";
import histologyImg from "../../../Assets/course-library/histology-basics.webp";
import physiologyImg from "../../../Assets/course-library/medical-physiology.webp";
import biochemistryImg from "../../../Assets/course-library/biochemistry-essentials.webp";
import dashAnatomyImg from "../../../Assets/dashboard/human-anatomy.webp";
import dashHistologyImg from "../../../Assets/dashboard/histology-basics.webp";
import dashPhysiologyImg from "../../../Assets/dashboard/medical-physiology.webp";
// import dashBiochemistryImg from "../../../Assets/dashboard/biochemistry-essentials.webp";

type MedicalArtType =
  | "anatomy"
  | "histology"
  | "physiology"
  | "biochemistry"
  | "neuroscience"
  | "pharmacology"
  | "pathology";

interface CourseArtProps {
  artType: MedicalArtType;
}

interface MedicalArtConfig {
  image: string;
  imagePosition: string;
  label: string;
  accentColor: string;
  tag: string;
}

const ART_CONFIG: Record<MedicalArtType, MedicalArtConfig> = {
  anatomy: {
    image: anatomyImg,
    imagePosition: "50% 28%",
    label: "Human Anatomy illustration",
    accentColor: "#22c55e",
    tag: "ANATOMY",
  },
  histology: {
    image: histologyImg,
    imagePosition: "center",
    label: "Histology microscope illustration",
    accentColor: "#8b5cf6",
    tag: "HISTOLOGY",
  },
  physiology: {
    image: physiologyImg,
    imagePosition: "center",
    label: "Medical Physiology illustration",
    accentColor: "#ef4444",
    tag: "PHYSIOLOGY",
  },
  biochemistry: {
    image: biochemistryImg,
    imagePosition: "center",
    label: "Biochemistry molecules illustration",
    accentColor: "#f59e0b",
    tag: "BIOCHEMISTRY",
  },
  neuroscience: {
    image: dashAnatomyImg,
    imagePosition: "center top",
    label: "Neuroscience brain illustration",
    accentColor: "#06b6d4",
    tag: "NEURO",
  },
  pharmacology: {
    image: dashPhysiologyImg,
    imagePosition: "center",
    label: "Clinical Pharmacology illustration",
    accentColor: "#10b981",
    tag: "PHARMA",
  },
  pathology: {
    image: dashHistologyImg,
    imagePosition: "center",
    label: "General Pathology illustration",
    accentColor: "#f43f5e",
    tag: "PATHOLOGY",
  },
};

export function ExploreCourseArt({ artType }: CourseArtProps) {
  const config = ART_CONFIG[artType];

  return (
    <div
      className={`explore-card-art explore-card-art--medical explore-card-art--${artType}`}
      aria-hidden="true"
    >
      <img
        src={config.image}
        alt={config.label}
        className="explore-card-art__img"
        style={{ objectPosition: config.imagePosition }}
        loading="lazy"
        decoding="async"
      />
      <div
        className="explore-card-art__overlay"
        style={{ "--art-accent": config.accentColor } as React.CSSProperties}
      />
      <span
        className="explore-card-art__tag"
        style={{ background: config.accentColor }}
      >
        {config.tag}
      </span>
    </div>
  );
}
