import { useEffect, useRef, useState } from "react";
import { FileCheck2, FileUp, UploadCloud } from "lucide-react";
import {
  adminDeliveryRequest,
  deliveryCoursePath,
  type DeliveryCourse,
  type DeliveryResource,
} from "../api/adminDelivery.http";
import {
  adminLessonMediaPath,
  inspectAdminLessonMedia,
  type AdminMediaAsset,
} from "../api/adminMedia.http";

type MediaType = "video" | "document";
type DocumentDeliveryMode =
  | "view_only"
  | "download_allowed"
  | "watermarked_view"
  | "watermarked_download";
type UploadState =
  | "idle"
  | "preparing"
  | "uploading"
  | "uploaded"
  | "verifying"
  | "verified"
  | "publishing"
  | "published"
  | "failed";
type FailedStage = "upload" | "verify" | "publish" | undefined;

interface MediaAsset {
  readonly id: string;
  readonly status: string;
}
interface SignedUpload {
  readonly url: string;
  readonly expiresAt: string;
}
interface MediaPutAuthorization {
  readonly asset: MediaAsset;
  readonly upload: SignedUpload;
  readonly requiredHeaders: Readonly<Record<string, string>>;
}
interface MultipartStart {
  readonly upload: { readonly id: string };
  readonly thresholdBytes: number;
}
interface MultipartPartAuthorization {
  readonly signed: SignedUpload;
}
interface PendingAssetCommand {
  readonly signature: string;
  readonly key: string;
}

const MEBIBYTE = 1024 * 1024;

function createRequestKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "media-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

function getMediaType(resource: DeliveryResource): MediaType | undefined {
  if (
    resource.resourceKind === "video" ||
    resource.resourceKind === "document"
  ) {
    return resource.resourceKind;
  }
  return undefined;
}

function getFilePolicy(
  type: MediaType,
): Readonly<{ contentType: string; accept: string }> {
  if (type === "video") {
    return { contentType: "video/mp4", accept: "video/mp4,.mp4" };
  }
  return { contentType: "application/pdf", accept: "application/pdf,.pdf" };
}

function getAssetPriority(status: AdminMediaAsset["status"]): number {
  const priorities: Record<AdminMediaAsset["status"], number> = {
    published: 6,
    verified: 5,
    uploaded: 4,
    pending_upload: 3,
    failed: 2,
    withdrawn: 1,
  };
  return priorities[status];
}

function uploadSignedPut(
  signed: SignedUpload,
  headers: Readonly<Record<string, string>>,
  file: File,
  onProgress: (percentage: number) => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", signed.url);
    Object.entries(headers).forEach(([name, value]) =>
      request.setRequestHeader(name, value),
    );
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else {
        reject(
          new Error(
            "The storage provider rejected the upload. Retry or replace the file.",
          ),
        );
      }
    };
    request.onerror = () =>
      reject(
        new Error(
          "The direct storage upload could not be reached. Retry the upload.",
        ),
      );
    request.onabort = () =>
      reject(new Error("The direct storage upload was interrupted."));
    request.send(file);
  });
}

export function AdminLessonMediaUpload({
  course,
  lessonId,
  resource,
  onStatusChanged,
  onPublished,
}: Readonly<{
  course: DeliveryCourse;
  lessonId: string;
  resource: DeliveryResource;
  onStatusChanged: (status: "uploaded" | "verified") => void;
  onPublished: () => void;
}>) {
  const mediaType = getMediaType(resource);
  const filePolicy = mediaType ? getFilePolicy(mediaType) : undefined;
  const [file, setFile] = useState<File>();
  const [deliveryMode, setDeliveryMode] =
    useState<DocumentDeliveryMode>("view_only");
  const [watermarkRequired, setWatermarkRequired] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [failedStage, setFailedStage] = useState<FailedStage>();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [accessStatus, setAccessStatus] = useState("");
  const [isBusyState, setIsBusyState] = useState(false);
  const [retryAllowed, setRetryAllowed] = useState(true);
  const [existingAsset, setExistingAsset] = useState<AdminMediaAsset>();
  const [assetLookupLoading, setAssetLookupLoading] = useState(true);
  const [assetLookupError, setAssetLookupError] = useState("");
  const [assetLookupRevision, setAssetLookupRevision] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const busy = useRef(false);
  const pendingAssetCommand = useRef<PendingAssetCommand | undefined>(undefined);
  const activeAssetId = useRef<string | undefined>(undefined);
  const activeMultipartId = useRef<string | undefined>(undefined);

  useEffect(() => {
    let current = true;
    setAssetLookupLoading(true);
    setAssetLookupError("");
    void inspectAdminLessonMedia(course, lessonId)
      .then(({ assets }) => {
        if (!current) return;
        const linkedAssets = assets
          .filter(
            (asset) =>
              asset.resourceId === resource.id &&
              asset.status !== "withdrawn",
          )
          .sort(
            (left, right) =>
              getAssetPriority(right.status) - getAssetPriority(left.status),
          );
        const asset = linkedAssets[0];
        setExistingAsset(asset);
        if (!asset) {
          if (!activeAssetId.current) setState("idle");
          return;
        }
        activeAssetId.current = asset.id;
        if (asset.status === "published") setState("published");
        else if (asset.status === "verified") setState("verified");
        else if (
          asset.status === "uploaded" ||
          (asset.status === "pending_upload" && asset.objectSize !== null)
        ) {
          setState("uploaded");
        } else if (asset.status === "pending_upload") {
          setState("idle");
        } else if (asset.status === "failed") {
          setState("failed");
        }
      })
      .catch((cause: unknown) => {
        if (!current) return;
        setExistingAsset(undefined);
        setAssetLookupError(
          cause instanceof Error
            ? cause.message
            : "Saved media status could not be loaded.",
        );
      })
      .finally(() => {
        if (current) setAssetLookupLoading(false);
      });
    return () => {
      current = false;
    };
  }, [course, lessonId, resource.id, assetLookupRevision]);

  if (!mediaType || !filePolicy) {
    return <span>Binary upload is not used for this resource type.</span>;
  }

  const uploadMediaType = mediaType;
  const uploadFilePolicy = filePolicy;
  const fileLabel =
    uploadMediaType === "video" ? "MP4 video" : "PDF document";
  const assetStatus = existingAsset?.status;
  const hasUploadedAsset =
    state === "uploaded" ||
    (assetStatus === "pending_upload" && existingAsset?.objectSize !== null) ||
    assetStatus === "uploaded";
  const hasVerifiedAsset =
    state === "verified" ||
    assetStatus === "verified" ||
    assetStatus === "published";
  const assetPublished =
    state === "published" || assetStatus === "published";
  const publicationComplete =
    assetPublished && resource.status === "published";
  const canFinalizePublishedAsset =
    assetStatus === "published" && resource.status !== "published";

  function selectFile(nextFile: File | undefined): void {
    if (!nextFile) return;
    setFile(nextFile);
    setError("");
    setAccessStatus("");
    setProgress(0);
    setState("idle");
    setFailedStage(undefined);
    setRetryAllowed(true);
    const reusableAsset =
      existingAsset?.status === "pending_upload" ? existingAsset : undefined;
    setExistingAsset(reusableAsset);
    activeAssetId.current = reusableAsset?.id;
    activeMultipartId.current = undefined;
    pendingAssetCommand.current = undefined;
  }

  async function uploadMultipartParts(
    assetPath: string,
    multipartId: string,
  ): Promise<void> {
    if (!file) throw new Error("Choose a file before uploading.");
    const partSize = Math.max(5 * MEBIBYTE, Math.ceil(file.size / 10_000));
    const partCount = Math.ceil(file.size / partSize);
    const uploadedParts: { partNumber: number; etag: string }[] = [];
    let uploadedBytes = 0;
    setState("uploading");
    for (let index = 0; index < partCount; index += 1) {
      const partNumber = index + 1;
      const startByte = index * partSize;
      const endByte = Math.min(startByte + partSize, file.size);
      const partAuthorization =
        await adminDeliveryRequest<MultipartPartAuthorization>(
          assetPath +
            "/multipart/" +
            encodeURIComponent(multipartId) +
            "/part/" +
            partNumber,
          { method: "POST", key: createRequestKey() },
        );
      let response: Response;
      try {
        response = await fetch(partAuthorization.signed.url, {
          method: "PUT",
          body: file.slice(startByte, endByte),
        });
      } catch {
        throw new Error(
          "A direct multipart upload could not be reached. Retry or abort it.",
        );
      }
      if (!response.ok) {
        throw new Error("The storage provider rejected an upload part.");
      }
      const etag = response.headers.get("ETag");
      if (!etag) {
        throw new Error(
          "The upload response did not expose its ETag. Check the bucket CORS policy.",
        );
      }
      uploadedParts.push({ partNumber, etag });
      uploadedBytes += endByte - startByte;
      setProgress(Math.round((uploadedBytes / file.size) * 100));
    }
    await adminDeliveryRequest(
      assetPath + "/multipart/" + encodeURIComponent(multipartId) + "/complete",
      {
        method: "POST",
        key: createRequestKey(),
        body: { parts: uploadedParts },
      },
    );
    activeMultipartId.current = undefined;
  }

  async function checkUploadAccess(): Promise<void> {
    if (busy.current) return;
    busy.current = true;
    setIsBusyState(true);
    setError("");
    setAccessStatus("");
    try {
      const { uploadPolicy } = await inspectAdminLessonMedia(course, lessonId);
      setAccessStatus(
        uploadPolicy.namespace === "production"
          ? "Upload access verified. No file was uploaded by this check."
          : "Upload access verified, but storage is configured for acceptance objects.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not check upload access.",
      );
    } finally {
      busy.current = false;
      setIsBusyState(false);
    }
  }

  async function upload(): Promise<void> {
    if (!file || busy.current || !retryAllowed) return;
    if (file.type !== uploadFilePolicy.contentType) {
      setError(
        uploadMediaType === "video"
          ? "Choose an MP4 video file."
          : "Choose a PDF document.",
      );
      return;
    }
    busy.current = true;
    setIsBusyState(true);
    setError("");
    setFailedStage(undefined);
    setProgress(0);
    setState("preparing");
    const mediaPath = adminLessonMediaPath(course, lessonId);
    let uploadMayHaveCompleted = false;
    const assetSignature = JSON.stringify({
      resourceId: resource.id,
      fileName: file.name,
      fileSize: file.size,
      lastModified: file.lastModified,
      contentType: uploadFilePolicy.contentType,
      deliveryMode,
      watermarkRequired,
    });
    try {
      const { uploadPolicy } = await inspectAdminLessonMedia(course, lessonId);
      if (uploadPolicy.namespace !== "production") {
        throw new Error(
          "Storage is configured for acceptance objects. Switch the backend to its production media namespace before uploading real content.",
        );
      }
      if (
        uploadPolicy.maxUploadBytes !== null &&
        file.size > uploadPolicy.maxUploadBytes
      ) {
        throw new Error(
          "This file exceeds the backend's configured upload size limit.",
        );
      }
      let assetId = activeAssetId.current;
      if (!assetId) {
        if (pendingAssetCommand.current?.signature !== assetSignature) {
          pendingAssetCommand.current = {
            signature: assetSignature,
            key: createRequestKey(),
          };
        }
        const created = await adminDeliveryRequest<{
          readonly asset: MediaAsset;
        }>(mediaPath, {
          method: "POST",
          key: pendingAssetCommand.current.key,
          body: {
            assetType: uploadMediaType,
            title: resource.title,
            contentType: uploadFilePolicy.contentType,
            expectedSize: file.size,
            resourceId: resource.id,
            ...(uploadMediaType === "document"
              ? { documentDeliveryMode: deliveryMode }
              : {}),
            watermarkRequired,
          },
        });
        assetId = created.asset.id;
        activeAssetId.current = assetId;
      }
      const assetPath = mediaPath + "/" + encodeURIComponent(assetId);
      if (file.size < uploadPolicy.multipartThresholdBytes) {
        const authorization = await adminDeliveryRequest<MediaPutAuthorization>(
          assetPath + "/upload",
          { method: "POST", key: createRequestKey() },
        );
        setState("uploading");
        await uploadSignedPut(
          authorization.upload,
          authorization.requiredHeaders,
          file,
          setProgress,
        );
        setProgress(100);
        uploadMayHaveCompleted = true;
      } else {
        const multipart = await adminDeliveryRequest<MultipartStart>(
          assetPath + "/multipart",
          { method: "POST", key: createRequestKey() },
        );
        activeMultipartId.current = multipart.upload.id;
        await uploadMultipartParts(assetPath, multipart.upload.id);
        uploadMayHaveCompleted = true;
      }
      setState("uploaded");
      onStatusChanged("uploaded");
      setFile(undefined);
      pendingAssetCommand.current = undefined;
    } catch (cause) {
      let mayRetry = !uploadMayHaveCompleted;
      if (activeMultipartId.current && activeAssetId.current) {
        const assetPath =
          mediaPath + "/" + encodeURIComponent(activeAssetId.current);
        try {
          await adminDeliveryRequest<void>(
            assetPath +
              "/multipart/" +
              encodeURIComponent(activeMultipartId.current) +
              "/abort",
            { method: "POST", key: createRequestKey() },
          );
        } catch {
          mayRetry = false;
        }
        activeMultipartId.current = undefined;
      }
      const message =
        cause instanceof Error
          ? cause.message
          : "The media upload could not be completed.";
      setError(
        mayRetry
          ? message
          : message +
              " The backend state is uncertain; reload the media status before retrying.",
      );
      setRetryAllowed(mayRetry);
      setFailedStage("upload");
      setState("failed");
    } finally {
      busy.current = false;
      setIsBusyState(false);
    }
  }

  async function verifyAsset(): Promise<void> {
    const assetId = existingAsset?.id ?? activeAssetId.current;
    if (!assetId || busy.current) return;
    busy.current = true;
    setIsBusyState(true);
    setError("");
    setFailedStage(undefined);
    setState("verifying");
    try {
      await adminDeliveryRequest(
        adminLessonMediaPath(course, lessonId) +
          "/" +
          encodeURIComponent(assetId) +
          "/verify",
        { method: "POST", key: createRequestKey() },
      );
      setState("verified");
      onStatusChanged("verified");
      setAssetLookupRevision((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The uploaded file could not be verified.",
      );
      setFailedStage("verify");
      setState("failed");
    } finally {
      busy.current = false;
      setIsBusyState(false);
    }
  }

  async function publishAsset(): Promise<void> {
    const assetId = existingAsset?.id ?? activeAssetId.current;
    if (
      !assetId ||
      busy.current ||
      (!hasVerifiedAsset && !canFinalizePublishedAsset)
    ) {
      return;
    }
    busy.current = true;
    setIsBusyState(true);
    setError("");
    setFailedStage(undefined);
    setState("publishing");
    try {
      if (existingAsset?.status !== "published") {
        await adminDeliveryRequest(
          adminLessonMediaPath(course, lessonId) +
            "/" +
            encodeURIComponent(assetId) +
            "/publish",
          { method: "POST", key: createRequestKey() },
        );
      }
      await adminDeliveryRequest(
        deliveryCoursePath(course.brandId, course.id) +
          "/resources/" +
          encodeURIComponent(resource.id),
        {
          method: "PATCH",
          key: createRequestKey(),
          body: {
            status: "published",
            reason: "Publish lesson resource for its verified media asset.",
            expectedVersion: resource.version,
          },
        },
      );
      setState("published");
      activeAssetId.current = undefined;
      onPublished();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The verified media could not be published.",
      );
      setFailedStage("publish");
      setState("failed");
    } finally {
      busy.current = false;
      setIsBusyState(false);
    }
  }

  const mediaStatusLabel =
    state === "preparing"
      ? "Preparing upload"
      : state === "uploading"
        ? `Uploading ${progress}%`
        : state === "verifying"
          ? "Verifying"
          : state === "publishing"
            ? "Publishing"
            : state === "failed"
              ? failedStage === "verify"
                ? "Verification failed"
                : failedStage === "publish"
                  ? "Publish failed"
                  : "Upload failed"
              : assetStatus === "pending_upload"
                ? "Awaiting file"
                : assetStatus === "uploaded" || state === "uploaded"
                  ? "Uploaded"
                  : assetStatus === "verified" || state === "verified"
                    ? "Verified"
                    : assetStatus === "published" || state === "published"
                      ? "Published"
                      : "No file";

  const uploadStep =
    hasUploadedAsset || hasVerifiedAsset || assetPublished
      ? "complete"
      : state === "preparing" || state === "uploading"
        ? "current"
        : failedStage === "upload"
          ? "error"
          : "pending";
  const verifyStep =
    hasVerifiedAsset || assetPublished
      ? "complete"
      : state === "verifying"
        ? "current"
        : failedStage === "verify"
          ? "error"
          : "pending";
  const publishStep =
    publicationComplete
      ? "complete"
      : state === "publishing"
        ? "current"
        : failedStage === "publish"
          ? "error"
          : "pending";

  return (
    <div
      className="admin-media-upload"
      aria-busy={isBusyState || assetLookupLoading}
    >
      <section className="admin-media-upload__summary">
        <span className="admin-media-upload__summary-icon" aria-hidden="true">
          {hasVerifiedAsset ? <FileCheck2 /> : <FileUp />}
        </span>
        <div>
          <strong>{resource.title}</strong>
          <small>
            {fileLabel} � Content status: {resource.status}
          </small>
        </div>
        <span className="admin-media-upload__media-state">
          Media: {mediaStatusLabel}
        </span>
      </section>

      <div className="admin-media-upload__actions">
        <button
          type="button"
          disabled={isBusyState}
          onClick={() => void checkUploadAccess()}
        >
          Check upload access
        </button>
        <button
          type="button"
          disabled={isBusyState || assetLookupLoading}
          onClick={() => setAssetLookupRevision((value) => value + 1)}
        >
          Refresh status
        </button>
      </div>

      {assetLookupLoading && (
        <span className="admin-media-upload__status" role="status">
          Checking saved media&
        </span>
      )}
      {assetLookupError && (
        <div className="admin-media-upload__lookup-error">
          <span role="alert">
            Saved media could not be checked: {assetLookupError}
          </span>
          <button
            type="button"
            disabled={isBusyState}
            onClick={() => setAssetLookupRevision((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {!hasUploadedAsset && !hasVerifiedAsset && !assetPublished && (
        <label
          className={
            "admin-media-upload__dropzone" +
            (isDragOver ? " is-dragging" : "") +
            (file ? " has-file" : "")
          }
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            selectFile(event.dataTransfer.files.item(0) ?? undefined);
          }}
        >
          <UploadCloud aria-hidden="true" />
          <strong>{file ? file.name : `Choose or drop ${fileLabel}`}</strong>
          <small>
            {file
              ? `${(file.size / MEBIBYTE).toFixed(1)} MB � Ready to upload`
              : `${fileLabel} � upload, verification, and publication are separate`}
          </small>
          <input
            type="file"
            accept={uploadFilePolicy.accept}
            aria-label={`Choose ${fileLabel}`}
            disabled={isBusyState}
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
        </label>
      )}

      {uploadMediaType === "document" &&
        !hasUploadedAsset &&
        !hasVerifiedAsset &&
        !assetPublished && (
          <div className="admin-media-upload__options">
            <label>
              PDF delivery policy
              <select
                value={deliveryMode}
                disabled={isBusyState}
                onChange={(event) =>
                  setDeliveryMode(event.target.value as DocumentDeliveryMode)
                }
              >
                <option value="view_only">View only</option>
                <option value="download_allowed">Download allowed</option>
                <option value="watermarked_view">Watermarked view</option>
                <option value="watermarked_download">
                  Watermarked download
                </option>
              </select>
            </label>
          </div>
        )}

      {!hasUploadedAsset && !hasVerifiedAsset && !assetPublished && (
        <label className="admin-media-upload__watermark">
          <input
            type="checkbox"
            checked={watermarkRequired}
            disabled={isBusyState}
            onChange={(event) => setWatermarkRequired(event.target.checked)}
          />
          Require dynamic watermark
        </label>
      )}

      {state === "uploading" && (
        <progress aria-label="Media upload progress" max={100} value={progress}>
          {progress}%
        </progress>
      )}

      <section
        className="admin-media-upload__lifecycle"
        aria-label="Media lifecycle status"
      >
        <h4>Media status</h4>
        <ol>
          <li data-state={uploadStep}>
            <span>File upload</span>
            <strong>
              {uploadStep === "complete"
                ? "Complete"
                : uploadStep === "current"
                  ? `${progress}%`
                  : uploadStep === "error"
                    ? "Failed"
                    : "Not uploaded"}
            </strong>
          </li>
          <li data-state={verifyStep}>
            <span>Verification</span>
            <strong>
              {verifyStep === "complete"
                ? "Complete"
                : verifyStep === "current"
                  ? "In progress"
                  : verifyStep === "error"
                    ? "Failed"
                    : "Pending"}
            </strong>
          </li>
          <li data-state={publishStep}>
            <span>Publication</span>
            <strong>
              {publishStep === "complete"
                ? "Published"
                : publishStep === "current"
                  ? "In progress"
                  : publishStep === "error"
                    ? "Failed"
                    : "Not published"}
            </strong>
          </li>
        </ol>
      </section>

      {accessStatus && (
        <span className="admin-media-upload__status" role="status">
          {accessStatus}
        </span>
      )}
      {error && (
        <span className="admin-media-upload__error" role="alert">
          {error}
        </span>
      )}

      <div className="admin-media-upload__footer">
        <span className="admin-media-upload__status" role="status">
          {!file && !hasUploadedAsset && !hasVerifiedAsset && !assetPublished
            ? "Choose a file to begin."
            : file && state !== "uploading" && state !== "preparing"
              ? "The selected file is ready to upload."
              : hasUploadedAsset && !hasVerifiedAsset
                ? "Verify the uploaded file before publishing."
                : hasVerifiedAsset && !publicationComplete
                  ? "Verification complete. Media is ready to publish."
                  : publicationComplete
                    ? "Media is published."
                    : "Complete the current media step."}
        </span>

        {(state === "idle" ||
          state === "preparing" ||
          state === "uploading" ||
          (state === "failed" && failedStage === "upload")) &&
          !hasUploadedAsset &&
          !hasVerifiedAsset &&
          !assetPublished && (
            <button
              className="admin-media-upload__start"
              type="button"
              disabled={
                !file ||
                isBusyState ||
                !retryAllowed ||
                assetLookupLoading ||
                Boolean(assetLookupError)
              }
              onClick={() => void upload()}
            >
              {state === "uploading"
                ? `Uploading& ${progress}%`
                : failedStage === "upload"
                  ? "Retry upload"
                  : "Upload media"}
            </button>
          )}

        {(hasUploadedAsset ||
          (state === "failed" && failedStage === "verify")) &&
          !hasVerifiedAsset && (
            <button
              className="admin-media-upload__start"
              type="button"
              disabled={isBusyState || assetLookupLoading}
              onClick={() => void verifyAsset()}
            >
              {state === "verifying"
                ? "Verifying&"
                : failedStage === "verify"
                  ? "Retry verification"
                  : "Verify file"}
            </button>
          )}

        {(hasVerifiedAsset ||
          canFinalizePublishedAsset ||
          (state === "failed" && failedStage === "publish")) &&
          !publicationComplete && (
            <button
              className="admin-media-upload__start"
              type="button"
              disabled={
                isBusyState ||
                assetLookupLoading ||
                (!hasVerifiedAsset && !canFinalizePublishedAsset)
              }
              onClick={() => void publishAsset()}
            >
              {state === "publishing"
                ? "Publishing&"
                : failedStage === "publish"
                  ? "Retry publication"
                  : canFinalizePublishedAsset
                    ? "Complete publication"
                    : "Publish media"}
            </button>
          )}
      </div>
    </div>
  );
}
