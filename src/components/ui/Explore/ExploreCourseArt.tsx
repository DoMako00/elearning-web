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
  accentColor: string;
}

const ART_CONFIG: Record<MedicalArtType, MedicalArtConfig> = {
  anatomy: {
    image: anatomyImg,
    imagePosition: "50% 28%",
    accentColor: "#22c55e",
  },
  histology: {
    image: histologyImg,
    imagePosition: "center",
    accentColor: "#8b5cf6",
  },
  physiology: {
    image: physiologyImg,
    imagePosition: "center",
    accentColor: "#ef4444",
  },
  biochemistry: {
    image: biochemistryImg,
    imagePosition: "center",
    accentColor: "#f59e0b",
  },
  neuroscience: {
    image: dashAnatomyImg,
    imagePosition: "center top",
    accentColor: "#06b6d4",
  },
  pharmacology: {
    image: dashPhysiologyImg,
    imagePosition: "center",
    accentColor: "#10b981",
  },
  pathology: {
    image: dashHistologyImg,
    imagePosition: "center",
    accentColor: "#f43f5e",
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
        alt=""
        className="explore-card-art__img"
        style={{ objectPosition: config.imagePosition }}
        loading="lazy"
        decoding="async"
      />
      <div
        className="explore-card-art__overlay"
        style={{ "--art-accent": config.accentColor } as React.CSSProperties}
      />
    </div>
  );
}
