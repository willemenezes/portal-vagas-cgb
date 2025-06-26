import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useJobById } from "@/hooks/useJobs";
import { Loader2 } from "lucide-react";

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading, error } = useJobById(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cgb-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cgb-blue" />
            <span className="ml-2 text-cgb-blue">Carregando vaga...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-cgb-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-red-600">Vaga não encontrada.</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Voltar às vagas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cgb-cream">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar às vagas
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl text-cgb-blue mb-2">
                      {job.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-cgb-wine/10 text-cgb-wine border-cgb-wine/20">
                        {job.department}
                      </Badge>
                      <Badge variant="outline">
                        {job.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center text-cgb-gray-dark">
                    <MapPin className="w-4 h-4 mr-2 text-cgb-blue" />
                    {job.city}, {job.state}
                  </div>
                  <div className="flex items-center text-cgb-gray-dark">
                    <Clock className="w-4 h-4 mr-2 text-cgb-blue" />
                    {job.workload}
                  </div>
                  <div className="flex items-center text-cgb-gray-dark">
                    <Briefcase className="w-4 h-4 mr-2 text-cgb-blue" />
                    {job.type}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-cgb-blue mb-3">Descrição da Vaga</h3>
                    <p className="text-cgb-gray-dark leading-relaxed">{job.description}</p>
                  </div>

                  {job.requirements && job.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-cgb-blue mb-3">Requisitos</h3>
                      <ul className="list-disc list-inside space-y-2 text-cgb-gray-dark">
                        {job.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.benefits && job.benefits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-cgb-blue mb-3">Benefícios</h3>
                      <ul className="list-disc list-inside space-y-2 text-cgb-gray-dark">
                        {job.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-cgb-blue">Candidatar-se</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-cgb-gray-dark">
                  Interessado nesta vaga? Clique no botão abaixo para se candidatar.
                </p>
                <button
                  style={{ width: "100%", background: "#6a0b27", color: "#fff", padding: "16px", borderRadius: "8px", border: "none", fontWeight: "bold", fontSize: "18px", marginTop: "12px", cursor: "pointer" }}
                  onClick={() => navigate(`/candidatar/${job.id}`)}
                >
                  Candidatar-se
                </button>
                <div className="text-center">
                  <span className="text-xs text-cgb-gray">
                    Vaga publicada em {new Date(job.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
