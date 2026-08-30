import {beforeEach, describe, expect, it} from 'vitest';
import {ACCEPTED_TYPES, FileUploaderComponent} from './file-uploader.component';

// validateFiles used to test the filename with `name.endsWith(ext)` against the
// bare extension, so any name whose tail happened to spell an accepted extension
// (figure.eps -> ends with 'ps') passed. The fix compares against `.${ext}`.
describe('FileUploaderComponent validateFiles', () => {
  let component: FileUploaderComponent;

  const makeZone = (fileName: string, extensions: readonly string[]) => ({
    name: 'zone',
    model: [{name: fileName} as File],
    accept: '',
    accepts: [...extensions],
    rejects: [],
    display: {name: '', icon: '', type: '', error: false},
  });

  const runWith = (zone: ReturnType<typeof makeZone>) => {
    component.shownUploadZones = [zone];
    component.uploadZones = [zone];
    component.validateFiles();
  };

  beforeEach(() => {
    component = new FileUploaderComponent({} as never, {} as never);
    // refreshShownUploadZones rebuilds view state we do not need here.
    (component as unknown as {refreshShownUploadZones: () => void}).refreshShownUploadZones =
      () => {};
  });

  it('rejects a file whose name only ends with a bare accepted extension', () => {
    const zone = makeZone('figure.eps', ACCEPTED_TYPES.document.extensions);
    runWith(zone);
    expect(zone.model).toBeNull();
    expect(zone.display.error).toBe(true);
  });

  it('rejects a file with no dotted extension at all', () => {
    const zone = makeZone('catjpg', ACCEPTED_TYPES.image.extensions);
    runWith(zone);
    expect(zone.model).toBeNull();
  });

  it('accepts a file with a real accepted extension', () => {
    const zone = makeZone('report.pdf', ACCEPTED_TYPES.document.extensions);
    runWith(zone);
    expect(zone.model).not.toBeNull();
    expect(zone.model.length).toBe(1);
    expect(zone.display.error).toBe(false);
  });

  it('accepts a multi-part extension in the zip zone', () => {
    const zone = makeZone('archive.tar.gz', ACCEPTED_TYPES.zip.extensions);
    runWith(zone);
    expect(zone.model).not.toBeNull();
    expect(zone.model.length).toBe(1);
  });
});
