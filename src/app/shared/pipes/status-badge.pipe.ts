import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusBadge',
})
export class StatusBadgePipe implements PipeTransform {
  transform(status: string): string {
    switch (status) {
      case 'completed':
        return 'badge-completed';
      case 'processing':
        return 'badge-processing';
      case 'failed':
        return 'badge-failed';
      default:
        return 'badge-pending';
    }
  }
}
