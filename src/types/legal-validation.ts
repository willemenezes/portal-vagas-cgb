// Tipos para validação jurídica de candidatos

export interface WorkHistory {
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
}

export interface CandidateLegalData {
    id?: string;
    candidate_id: string;

    // Dados Pessoais
    full_name: string;
    birth_date: string;
    rg: string;
    cpf: string;
    mother_name: string;
    father_name?: string;
    birth_city: string;
    birth_state: string;

    // Histórico Profissional
    work_history: WorkHistory[];

    // Informações Adicionais
    is_former_employee: boolean;
    former_employee_details?: string;
    is_pcd: boolean;
    pcd_details?: string;
    desired_position: string;
    responsible_name?: string;
    cnh?: string; // Campo CNH adicionado

    // Controle e Auditoria
    collected_by?: string;
    collected_at?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    review_status?: 'pending' | 'approved' | 'rejected' | 'request_changes';
    review_notes?: string;

    // Metadados
    created_at?: string;
    updated_at?: string;
}

export interface LegalDataFormValues extends Omit<CandidateLegalData, 'id' | 'candidate_id' | 'collected_by' | 'collected_at' | 'reviewed_by' | 'reviewed_at' | 'review_status' | 'review_notes' | 'created_at' | 'updated_at'> { } 