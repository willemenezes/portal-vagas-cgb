import { useAuth } from '@/hooks/useAuth';
import { useRHProfile } from '@/hooks/useRH';
import { usePendingJobs } from '@/hooks/useJobs';
import { Loader2 } from 'lucide-react';
import PendingJobApprovals from './PendingJobApprovals';

const JobApprovalsWrapper = () => {
    const { user } = useAuth();
    const { data: rhProfile, isLoading: isProfileLoading } = useRHProfile(user?.id);
    const { data: pendingJobs, isLoading: isLoadingJobs } = usePendingJobs(rhProfile);

    const isLoading = isLoadingJobs || isProfileLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-cgb-primary" />
                <span className="ml-2 text-gray-600">Carregando aprovações de vagas...</span>
            </div>
        );
    }

    return (
        <div>
            <PendingJobApprovals pendingJobs={pendingJobs || []} isLoading={isLoading} />
        </div>
    );
};

export default JobApprovalsWrapper;


