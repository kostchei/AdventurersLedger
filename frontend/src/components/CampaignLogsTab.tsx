import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pb';
import type { CampaignLog } from '../types';
import type { CampaignLogRecord } from '../types/pocketbase';

interface CampaignLogsTabProps {
  campaignId: string;
  userId?: string;
}

const mapLogRecord = (record: CampaignLogRecord): CampaignLog => ({
  id: record.id,
  campaignId: record.campaign,
  createdBy: record.created_by,
  activityText: record.activity_text,
  happenedOn: record.happened_on,
  createdAt: record.created,
  updatedAt: record.updated,
});

const toDateInputValue = (value: Date): string => {
  const y = value.getFullYear();
  const m = `${value.getMonth() + 1}`.padStart(2, '0');
  const d = `${value.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CampaignLogsTab({ campaignId, userId }: CampaignLogsTabProps) {
  const [happenedOn, setHappenedOn] = useState(toDateInputValue(new Date()));
  const [activityText, setActivityText] = useState('');
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, error } = useQuery<CampaignLog[]>({
    queryKey: ['campaign', campaignId, 'logs'],
    queryFn: async () => {
      const records = await pb.collection('campaign_logs').getFullList<CampaignLogRecord>({
        filter: `campaign = "${campaignId}"`,
        sort: 'happened_on,created',
      });
      return records.map(mapLogRecord);
    },
    enabled: Boolean(campaignId),
  });

  const createLogMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Authentication required');
      const text = activityText.trim();
      if (!text) throw new Error('Activity text is required');

      await pb.collection('campaign_logs').create({
        campaign: campaignId,
        created_by: userId,
        happened_on: happenedOn,
        activity_text: text,
      });
    },
    onSuccess: () => {
      setActivityText('');
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, 'logs'] });
    },
  });

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => a.happenedOn.localeCompare(b.happenedOn) || a.createdAt.localeCompare(b.createdAt)),
    [logs]
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createLogMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <section className="adnd-box rounded-xl p-4 border border-[#7a4f24]/50">
        <h3 className="text-xs font-black adnd-ink-light uppercase tracking-[0.2em] mb-3">Add Campaign Log Entry</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label htmlFor="log-date" className="block text-[10px] adnd-muted-light font-bold uppercase tracking-widest mb-1">Date of Activity</label>
            <input
              id="log-date"
              type="date"
              value={happenedOn}
              onChange={(event) => setHappenedOn(event.target.value)}
              required
              className="w-full rounded-lg border border-[#7a4f24]/60 bg-[#1b1109]/60 text-[#f3e5c5] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="log-text" className="block text-[10px] adnd-muted-light font-bold uppercase tracking-widest mb-1">Activity Details</label>
            <textarea
              id="log-text"
              value={activityText}
              onChange={(event) => setActivityText(event.target.value)}
              required
              rows={4}
              placeholder="Describe what happened in the campaign..."
              className="w-full rounded-lg border border-[#7a4f24]/60 bg-[#1b1109]/60 text-[#f3e5c5] px-3 py-2 text-sm resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={createLogMutation.isPending}
            className="btn btn-primary hover:bg-[#4b311a] disabled:opacity-60"
          >
            {createLogMutation.isPending ? 'Recording...' : 'Record Activity'}
          </button>

          {createLogMutation.isError && (
            <p className="text-xs text-red-300">{createLogMutation.error instanceof Error ? createLogMutation.error.message : 'Failed to save log entry.'}</p>
          )}
        </form>
      </section>

      <section className="adnd-box rounded-xl p-4 border border-[#7a4f24]/50">
        <h3 className="text-xs font-black adnd-ink-light uppercase tracking-[0.2em] mb-3">Campaign Activity Timeline</h3>
        {isLoading ? (
          <p className="text-xs adnd-muted-light">Loading logs...</p>
        ) : error ? (
          <p className="text-xs text-red-300">Failed to load campaign logs.</p>
        ) : sortedLogs.length === 0 ? (
          <p className="text-xs adnd-muted-light">No logs yet for this campaign.</p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 adnd-scrollbar">
            {sortedLogs.map((log) => (
              <article key={log.id} className="rounded-lg border border-[#7a4f24]/50 bg-[#1b1109]/40 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest adnd-muted-light mb-1">{new Date(log.happenedOn).toLocaleDateString()}</p>
                <p className="text-sm text-[#f3e5c5] whitespace-pre-wrap">{log.activityText}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
