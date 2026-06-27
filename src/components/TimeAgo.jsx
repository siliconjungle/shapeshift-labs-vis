import { format, formatDistanceToNowStrict } from 'date-fns';

const RELATIVE_CUTOFF_DAYS = 45;

export const formatFullDate = (date) => format(new Date(date), 'MMM d, yyyy');

export const formatTimeLabel = (date, now = new Date()) => {
  const target = new Date(date);
  const ageMs = Math.abs(now.getTime() - target.getTime());
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays > RELATIVE_CUTOFF_DAYS) {
    return formatFullDate(date);
  }

  return `${formatDistanceToNowStrict(target, {
    addSuffix: false,
    roundingMethod: 'floor',
  })} ago`;
};

export default function TimeAgo({ date, className, label }) {
  const displayLabel = label || formatTimeLabel(date);
  return (
    <time className={className} dateTime={date} title={formatFullDate(date)}>
      {displayLabel}
    </time>
  );
}
