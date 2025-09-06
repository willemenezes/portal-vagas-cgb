import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock } from 'lucide-react';

const ApprovalManagement = () => {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Aprovação de Candidatos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <UserCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Sistema de Aprovação de Candidatos
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Esta seção será utilizada para aprovar candidatos que se candidataram às vagas publicadas.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <Badge variant="secondary" className="mb-2">Em Desenvolvimento</Badge>
                                <p className="text-sm text-blue-700">
                                    Aprovação automática por critérios
                                </p>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg">
                                <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <Badge variant="secondary" className="mb-2">Em Desenvolvimento</Badge>
                                <p className="text-sm text-green-700">
                                    Análise de currículos
                                </p>
                            </div>

                            <div className="p-4 bg-purple-50 rounded-lg">
                                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                <Badge variant="secondary" className="mb-2">Em Desenvolvimento</Badge>
                                <p className="text-sm text-purple-700">
                                    Processo seletivo
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ApprovalManagement; 