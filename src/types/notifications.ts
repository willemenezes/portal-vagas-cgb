// Tipos para sistema de notificações por email

export interface NotificationRecipient {
  email: string;
  name: string;
  role: string;
}

export interface NotificationData {
  // Dados da vaga/solicitação
  jobTitle?: string;
  department?: string;
  city?: string;
  state?: string;
  requestId?: string;
  jobId?: string;
  
  // Dados do candidato
  candidateName?: string;
  candidateEmail?: string;
  candidateId?: string;
  
  // Dados do remetente
  senderName?: string;
  senderRole?: string;
  
  // Dados adicionais
  notes?: string;
  status?: string;
  actionDate?: string;
}

export type NotificationType = 
  // Fluxo de vagas
  | 'new_job_request'           // Coordenador → Gerente
  | 'job_request_approved'      // Gerente → RH + Coordenador
  | 'job_request_rejected'      // Gerente → Coordenador
  | 'job_published'             // RH → Coordenador + Gerente
  
  // Fluxo de candidatos
  | 'candidate_legal_validation' // Candidato → Jurídico
  | 'legal_validation_approved' // Jurídico → RH
  | 'legal_validation_rejected' // Jurídico → RH
  | 'candidate_status_change'   // Mudanças importantes no processo
  
  // Notificações gerais
  | 'candidate_hired'           // Candidato contratado
  | 'candidate_rejected';       // Candidato reprovado

export interface NotificationTemplate {
  subject: string;
  html: string;
  priority: 'low' | 'normal' | 'high';
}

export interface NotificationRequest {
  type: NotificationType;
  recipients: NotificationRecipient[];
  data: NotificationData;
  template?: Partial<NotificationTemplate>;
}
