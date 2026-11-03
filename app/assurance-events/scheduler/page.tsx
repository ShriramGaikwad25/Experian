import SchedulerManager from "@/components/scheduler/SchedulerManager";

// Assurance Events → Scheduler: the same scheduler as Settings → Gateway →
// Scheduler, on the backend's kfscheduler API,
// authenticated with the access token (lib/assurance-auth.ts) like all Assurance Events pages.
export default function AssuranceSchedulerPage() {
  return (
    <div className="h-full">
      <SchedulerManager useAccessToken />
    </div>
  );
}
