import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Clock, Bookmark, ArrowRight, Building2, Star, Archive } from "lucide-react";
import { Link } from "react-router-dom";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    department: string;
    city: string;
    state: string;
    type: string;
    posted?: string;
    applicants?: number;
    description: string;
    workload: string;
  };
  isTalentBank?: boolean;
}

const JobCard = ({ job, isTalentBank = false }: JobCardProps) => {
  const getDepartmentColor = (department: string) => {
    const colors = {
      'Técnico': 'from-blue-500 to-blue-600',
      'Administrativo': 'from-green-500 to-green-600',
      'Operacional': 'from-orange-500 to-orange-600',
      'Engenharia': 'from-purple-500 to-purple-600',
      'Comercial': 'from-pink-500 to-pink-600',
      'Recursos Humanos': 'from-teal-500 to-teal-600',
      'Financeiro': 'from-yellow-500 to-yellow-600',
      'Tecnologia': 'from-indigo-500 to-indigo-600',
      'Gerência': 'from-red-500 to-red-600',
    };
    return colors[department as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getDepartmentIcon = (department: string) => {
    const icons = {
      'Técnico': '⚙️',
      'Administrativo': '📋',
      'Operacional': '🔧',
      'Engenharia': '🏗️',
      'Comercial': '💼',
      'Recursos Humanos': '👥',
      'Financeiro': '💰',
      'Tecnologia': '💻',
      'Gerência': '👔',
    };
    return icons[department as keyof typeof icons] || '📌';
  };

  if (isTalentBank) {
    return (
      <div className="group relative flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-cgb-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-md">
            <Archive className="w-12 h-12 text-cgb-primary" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <Link to={`/vaga/${job.id}`}>
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-cgb-primary transition-colors mb-2">
              {job.title}
            </h3>
          </Link>
          <p className="text-gray-600 mb-4">
            Não encontrou uma vaga com seu perfil? Deixe seu currículo conosco para futuras oportunidades!
          </p>
          <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{job.applicants ?? 0} talentos no banco</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>Sempre aberto</span>
            </div>
          </div>
          <Link to={`/candidatar/${job.id}`}>
            <Button
              size="lg"
              className="bg-cgb-primary hover:bg-cgb-primary-dark text-white transition-colors shadow-md hover:shadow-lg"
            >
              Cadastre Seu Currículo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }


  return (
    <Card className="group relative bg-white hover:bg-gray-50 border border-gray-200 hover:border-cgb-primary/20 rounded-xl hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Category indicator */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getDepartmentColor(job.department)}`}></div>


      <CardContent className="p-6">
        {/* Job Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link to={`/vaga/${job.id}`} className="block group-hover:text-cgb-primary transition-colors">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                {job.title}
              </h3>
            </Link>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <img
                  src="/CGB.png"
                  alt="CGB Energia"
                  className="h-4 w-4 object-contain"
                />
                <span>CGB Energia</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{job.city}, {job.state}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>há {job.posted || 'N/A'}</span>
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-4">
          <p className="text-gray-600 text-sm line-clamp-2">
            {job.description}
          </p>
        </div>

        {/* Job Details */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 text-xs">
            {job.department}
          </Badge>
          <Badge variant="outline" className="border-gray-300 text-gray-600 px-3 py-1 text-xs">
            {job.type}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{job.workload}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>{job.applicants ?? 0} candidatos</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Vaga ativa</span>
          </div>

          <div className="flex gap-3">
            <Link to={`/vaga/${job.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:border-cgb-primary hover:text-cgb-primary transition-colors"
              >
                Ver detalhes
              </Button>
            </Link>

            <Link to={`/candidatar/${job.id}`}>
              <Button
                size="sm"
                className="bg-cgb-primary hover:bg-cgb-primary-dark text-white transition-colors"
              >
                Candidatar-se
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
