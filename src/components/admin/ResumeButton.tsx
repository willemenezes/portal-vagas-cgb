import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useResumeByEmail } from "@/hooks/useCandidates";

interface ResumeButtonProps {
  candidate: {
    resume_file_url?: string | null;
    email: string;
    name?: string;
  };
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  iconType?: "file" | "download";
  className?: string;
  children?: React.ReactNode;
}

export const ResumeButton = ({ 
  candidate, 
  variant = "outline", 
  size = "sm",
  showIcon = true,
  iconType = "file",
  className = "",
  children
}: ResumeButtonProps) => {
  // Buscar currículo por email se não tiver URL direta
  const { data: resumeFromBank } = useResumeByEmail(candidate.email);
  
  // Determinar qual URL usar
  const resumeUrl = candidate.resume_file_url || resumeFromBank?.resume_file_url;
  const isDisabled = !resumeUrl;
  
  const Icon = iconType === "download" ? Download : FileText;
  
  if (isDisabled) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        {showIcon && <Icon className="w-4 h-4 mr-2" />}
        {children || "Sem CV"}
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} asChild className={className}>
      <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
        {showIcon && <Icon className="w-4 h-4 mr-2" />}
        {children || "Ver"}
      </a>
    </Button>
  );
};

export default ResumeButton;
