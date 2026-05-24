import {Component, Input} from '@angular/core';
import {DashboardTask} from '../dashboard-list-item.component';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';

@Component({
  selector: 'f-expanded-list-item',
  templateUrl: './expanded-list-item.component.html',
  styleUrls: ['./expanded-list-item.component.scss'],
})
export class DashboardExpandedListItemComponent {
  @Input() task: DashboardTask;

  constructor(private fileDownloader: FileDownloaderService) {}

  downloadTaskSheet() {
    this.fileDownloader.downloadFile(
      this.task.taskDef.getTaskPDFUrl(true),
      `${this.task.unitCode}-${this.task.abbreviation}-TaskSheet.pdf`
    );
  }

  downloadResources() {
    this.fileDownloader.downloadFile(
      this.task.taskDef.getTaskResourcesUrl(true),
      `${this.task.unitCode}-${this.task.abbreviation}-TaskResources.zip`
    );
  }
}
