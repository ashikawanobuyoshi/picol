/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/* prettier-ignore */

import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/storage';
import { FirebaseUtil } from './FirebaseUtil';
import { AuthenticationService } from '../services/AuthenticationService';

/**
 * Create Uploader.
 */
export class UploaderFactory {
  public static storage: any;

  public static async create(
    params: AuthenticationService.postAuthenticationServiceRcmsApi1FirebaseTokenRequest,
  ): Promise<Uploader> {
    this.storage = await FirebaseUtil.getStorage();
    return new FirebaseStorageUploader(this.storage as firebase.storage.Storage);
  }
}

/**
 * Uploader using firebase storage.
 */
class UploaderBase {
  /** the path of the directory where to the uploading target. */
  private _dirPath = `/files/temp`; // default
  public set dirPath(dirPath: string) {
    this._dirPath = dirPath;
  }

  public getMetas(file: File, index: number) {
    const fileName = this.generateUniqueIdentifier(file, index);
    const dirPath = this._dirPath;
    const path = `${dirPath}/${fileName}`.slice(1);
    return {
      fileName,
      dirPath,
      path,
      contentType: file.type,
    };
  }

  private generateUniqueIdentifier(file: File, index: number) {
    let relativePath =
      (file as any).relativePath || (file as any).webkitRelativePath || (file as any).fileName || (file as any).name;
    let time = new Date().getTime();
    return `${time}_${relativePath.replace(/[^0-9a-zA-Z_-]/gim, '')}_${index}`;
  }
}

/**
 * Uploader using firebase storage.
 */
class FirebaseStorageUploader extends UploaderBase implements Uploader {
  constructor(private firebaseStorage: firebase.storage.Storage) {
    super();
  }

  public async upload(file: File, index: number = 0) {
    try {
      const meta = this.getMetas(file, index);
      const ref = this.firebaseStorage.ref(meta.dirPath);
      const snapshot = await ref.child(`/${meta.fileName}`).put(file, {
        contentType: meta.contentType,
      });
      const url = await snapshot.ref.getDownloadURL();

      return {
        url,
        file_id: meta.path,
        ...meta,
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

export interface Uploader {
  upload: (file: File, index?: number) => Promise<UploaderMeta>;
}
export interface UploaderMeta {
  url: string;
  fileName: string;
  dirPath: string;
  path: string;
  contentType: string;
  /**
   * file_id string value for identifying this uploaded file,
   * considered to be used for uploading as `file_id` with posting topic.
   */
  file_id: string;
}
