import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileIcon'
})
export class FileIconPipe implements PipeTransform {
  transform(fileType: string): string {
    switch (fileType) {
      case 'pdf': return '📕';
      case 'md': return '📘';
      default: return '📄';
    }
  }
}
