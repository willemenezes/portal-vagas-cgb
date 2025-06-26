
import Header from "@/components/Header";
import ResumeUpload from "@/components/ResumeUpload";

const ResumeSubmission = () => {
  return (
    <div className="min-h-screen bg-cgb-cream">
      <Header />
      <div className="py-12">
        <ResumeUpload />
      </div>
    </div>
  );
};

export default ResumeSubmission;
