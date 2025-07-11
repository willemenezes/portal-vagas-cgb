import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Briefcase } from "lucide-react";
import ApprovalManagement from "./ApprovalManagement";
import JobRequestApproval from "./JobRequestApproval";
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
                    <p className="text-gray-600">Gerencie aprovações de candidatos e solicitações de vagas</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="job-requests" className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Solicitações de Vagas
                        {jobRequestStats?.pendentes > 0 && (
                            <Badge variant="destructive" className="ml-1">
                                {jobRequestStats.pendentes}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Candidatos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="job-requests" className="space-y-4">
                    <JobRequestApproval />
                </TabsContent>

                <TabsContent value="candidates" className="space-y-4">
                    <ApprovalManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
} 