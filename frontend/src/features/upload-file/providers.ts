import { UploadFileApi } from "./api/upload-file.api";
import { UploadService } from "./model/upload-file.service";

export const uploadProviders = [UploadFileApi, UploadService];
