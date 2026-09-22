import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  HttpRequest,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {TaskComment} from 'src/app/api/models/doubtfire-model';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {EmojiService} from 'src/app/common/services/emoji.service';
import {TaskCommentService} from '../task-comment.service';
import {TestAttemptService} from '../test-attempt.service';
import {UserService} from '../user.service';

describe('TaskCommentService discussion comments', () => {
  let taskCommentService: TaskCommentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskCommentService,
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: EmojiService, useValue: {}},
        {provide: UserService, useValue: {cache: {getOrCreate: () => ({})}}},
        {provide: FileDownloaderService, useValue: {downloadFile: vi.fn()}},
        {provide: TestAttemptService, useValue: {cache: {getOrCreate: () => ({})}}},
      ],
    });

    taskCommentService = TestBed.inject(TaskCommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads attachment guidance from the authenticated API policy endpoint', () => {
    let received: unknown;
    taskCommentService.attachmentPolicy().subscribe((policy) => {
      received = policy;
    });
    const request = httpMock.expectOne('http://localhost:3000/api/task_comments/upload_policy');
    expect(request.request.method).toBe('GET');
    const policy = {
      version: 1,
      max_bytes_exclusive: 30_000_000,
      max_selection_count: 5,
      categories: [],
    };
    request.flush(policy);
    expect(received).toEqual(policy);
  });

  it('uses the authenticated downloader and forces attachment disposition for generic files', () => {
    taskCommentService.downloadAttachment({
      id: 1,
      attachmentFileName: 'results.xlsx',
      attachmentUrl:
        'http://localhost:3000/api/projects/1/task_def_id/2/comments/1?as_attachment=false',
    } as TaskComment);
    expect(TestBed.inject(FileDownloaderService).downloadFile).toHaveBeenCalledWith(
      'http://localhost:3000/api/projects/1/task_def_id/2/comments/1?as_attachment=true',
      'results.xlsx',
    );
  });

  it('posts a discussion reply without expecting an entity response', () => {
    const replyAudio = new Blob(['reply audio'], {type: 'audio/webm'});
    const comment = {
      id: 69,
      project: {id: 1},
      task: {definition: {id: 2}},
    } as TaskComment;
    let completed = false;

    taskCommentService.postDiscussionReply(comment, replyAudio).subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne((request: HttpRequest<FormData>): boolean => {
      expect(request.url).toEqual(
        'http://localhost:3000/api/projects/1/task_def_id/2/comments/69/discussion_comment/reply',
      );
      expect(request.method).toBe('POST');
      expect(request.body instanceof FormData).toBe(true);
      const attachment = request.body.get('attachment') as Blob;
      expect(attachment instanceof Blob).toBe(true);
      expect(attachment.size).toBe(replyAudio.size);
      expect(attachment.type).toBe(replyAudio.type);
      return true;
    });

    req.flush(null);

    expect(completed).toBe(true);
  });
});
