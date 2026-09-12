import React, { useState } from "react";
import {
  InstructorHeroBanner,
  InstructorStatsBar,
  InstructorAboutCard,
  WeeklyScheduleCard,
  MedicalSpecialtiesCard,
  CoursesTaughtList,
  StudentReviewsCarousel,
  AchievementsCard,
  ResearchPublicationsCard,
  ContactAvailabilityCard,
  BookMeetingModal,
  EditProfileModal,
} from "./components";
import { DR_AHMED_HASSAN_PROFILE } from "./data/instructorMockData";
import type { InstructorProfile as InstructorProfileType } from "../../types/instructor";
import { useToast } from "../../hooks/useToast";
import { ToastNotification } from "../../components/ui/ToastNotification";

interface InstructorProfileProps {
  initialProfile?: InstructorProfileType;
  isSelf?: boolean;
}

export const InstructorProfile: React.FC<InstructorProfileProps> = ({
  initialProfile = DR_AHMED_HASSAN_PROFILE,
  isSelf = true,
}) => {
  const [profile, setProfile] = useState<InstructorProfileType>(initialProfile);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const { toastMessage, showToast } = useToast();

  const handleUpdateProfile = (updated: Partial<InstructorProfileType>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    showToast("Instructor profile updated successfully!");
  };

  const handleConfirmBooking = (booking: {
    day: string;
    time: string;
    type: string;
  }) => {
    showToast(`Appointment requested for ${booking.day} at ${booking.time} (${booking.type})`);
  };

  return (

    <div className="ip-root w-full font-sans
      h-auto flex flex-col gap-3
      lg:h-full lg:overflow-hidden
    ">
      {/* Toast notifications */}
      <ToastNotification message={toastMessage} />

      {/* 1. Hero Banner — always shrink-0 so it never stretches */}
      <div className="shrink-0">
        <InstructorHeroBanner
          instructor={profile}
          onEditClick={() => setIsEditModalOpen(true)}
          isSelf={isSelf}
        />
      </div>

      {/* 2. Key Metrics Stats Bar — always shrink-0 */}
      <div className="shrink-0">
        <InstructorStatsBar stats={profile.stats} />
      </div>


      <div className="ip-grid
        grid gap-3
        grid-cols-1
        md:grid-cols-2
        lg:grid-cols-3
        h-auto
        lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:items-stretch
      ">
        {/* Column 1: About & Weekly Schedule */}
        <div className="ip-col
          flex flex-col gap-3
          h-auto overflow-visible
          lg:h-full lg:min-h-0 lg:overflow-y-auto
        ">
          {/* About card: grows to fill available space */}
          <InstructorAboutCard
            instructor={profile}
            onEditClick={isSelf ? () => setIsEditModalOpen(true) : undefined}
          />
          {/* Schedule: takes its natural height, shrinks gracefully */}
          <WeeklyScheduleCard
            schedule={profile.schedule}
            onViewScheduleClick={() => setIsBookModalOpen(true)}
          />
        </div>

        {/* Column 2: Specialties, Courses & Reviews */}
        <div className="ip-col
          flex flex-col gap-3
          h-auto overflow-visible
          lg:h-full lg:min-h-0 lg:overflow-y-auto
        ">
          <MedicalSpecialtiesCard
            specialties={profile.specialties}
            onEditClick={isSelf ? () => setIsEditModalOpen(true) : undefined}
          />
          <CoursesTaughtList courses={profile.coursesTaught} />
          <StudentReviewsCarousel reviews={profile.reviews} />
        </div>

        {/* Column 3: Achievements, Research & Contact */}
        <div className="ip-col
          flex flex-col gap-3
          h-auto overflow-visible
          md:col-span-2 lg:col-span-1
          lg:h-full lg:min-h-0 lg:overflow-y-auto
        ">
          <AchievementsCard achievements={profile.achievements} />
          <ResearchPublicationsCard publications={profile.publications} />
          <ContactAvailabilityCard
            instructor={profile}
            onBookMeetingClick={() => setIsBookModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <BookMeetingModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        instructor={profile}
        onConfirmBooking={handleConfirmBooking}
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        instructor={profile}
        onSave={handleUpdateProfile}
      />
    </div>
  );
};

export default InstructorProfile;
