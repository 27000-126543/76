import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function formatDateTime(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatTime(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).format('HH:mm:ss');
}

export function fromNow(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).fromNow();
}
