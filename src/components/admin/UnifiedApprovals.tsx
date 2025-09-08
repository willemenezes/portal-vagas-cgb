import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, Briefcase } from "lucide-react";
import JobRequestApproval from "./JobRequestApproval";
import JobApprovalsWrapper from "./JobApprovalsWrapper";
import ApprovedJobRequests from "./ApprovedJobRequests";
import useJobRequests from "@/hooks/useJobRequests";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile } from "@/hooks/useRH";

export default function UnifiedApprovals() {
    const { user } = useAuth();
    const { data: rhProfile } = useRHProfile(user?.id);
    const { stats: jobRequestStats } = useJobRequests();
    const [activeTab, setActiveTab] = useState("job-requests");

    // Se for solicitador, só mostra solicitações de vagas
    if (rhProfile?.role === 'solicitador') {
        return <JobRequestApproval />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Central de Aprovações</h2>
                    <p className="text-gray-600">Gerencie solicitações de criação e aprovações de vagas</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${(rhProfile?.role === 'admin' || rhProfile?.is_admin) ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <TabsTrigger value="job-requests" className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Solicitações de Criação
                        {jobRequestStats?.pendentes > 0 && (
                            <Badge variant="destructive" className="ml-1">
                                {jobRequestStats.pendentes}
                            </Badge>
                        )}
                    </TabsTrigger>
                    {(rhProfile?.role === 'admin' || rhProfile?.is_admin) && (
                        <TabsTrigger value="approved-requests" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Aprovadas para Criar
                            {jobRequestStats?.aprovados > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {jobRequestStats.aprovados}
                                </Badge>
                            )}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="job-approvals" className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Aprovações de Publicação
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="job-requests" className="space-y-4">
                    <JobRequestApproval />
                </TabsContent>

                {(rhProfile?.role === 'admin' || rhProfile?.is_admin) && (
                    <TabsContent value="approved-requests" className="space-y-4">
                        <ApprovedJobRequests rhProfile={rhProfile} />
                    </TabsContent>
                )}

                <TabsContent value="job-approvals" className="space-y-4">
                    <JobApprovalsWrapper />
                </TabsContent>
            </Tabs>
        </div>
    );
} 