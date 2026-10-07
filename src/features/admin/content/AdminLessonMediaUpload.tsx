import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
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
  | "verifying"
  | "publishing"
  | "published"
  | "failed";
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
async function uploadSignedPut(
  signed: SignedUpload,
  headers: Readonly<Record<string, string>>,
  file: File,
  onProgress: (percentage: number) => void,
): Promise<void> {
  // XHR exposes browser upload progress while sending bytes directly to storage.
  await new Promise<void>((resolve, reject) => {
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
            "The storage provider rejected the upload. Retry or replace the upload.",
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
      reject(
        new Error(
          "The direct storage upload was interrupted. Retry the upload.",
        ),
      );
    request.send(file);
  });
}

export function AdminLessonMediaUpload({
  course,
  lessonId,
  resource,
  publishRequest,
  onPublished,
}: Readonly<{
  course: DeliveryCourse;
  lessonId: string;
  resource: DeliveryResource;
  publishRequest?: number;
  onPublished: () => void;
}>) {
  const mediaType = getMediaType(resource);
  const filePolicy = mediaType ? getFilePolicy(mediaType) : undefined;
  const [file, setFile] = useState<File>();
  const [deliveryMode, setDeliveryMode] =
    useState<DocumentDeliveryMode>("view_only");
  const [watermarkRequired, setWatermarkRequired] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
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
  const lastHandledPublishRequest = useRef(0);

  const pendingAssetCommand = useRef<PendingAssetCommand | undefined>(
    undefined,
  );
  const activeAssetId = useRef<string | undefined>(undefined);
  const activeMultipartId = useRef<string | undefined>(undefined);
  useEffect(() => {
    let current = true;
    setAssetLookupLoading(true);
    setAssetLookupError("");
    void inspectAdminLessonMedia(course, lessonId)
      .then(({ assets }) => {
        if (!current) return;
        setExistingAsset(
          assets.find(
            (asset) =>
              asset.resourceId === resource.id &&
              (asset.status === "uploaded" ||
                asset.status === "verified" ||
                asset.status === "published"),
          ),
        );
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

  function selectFile(nextFile: File | undefined): void {
    if (!nextFile) return;
    setFile(nextFile);
    setError("");
    setAccessStatus("");
    setProgress(0);
    setState("idle");
    setRetryAllowed(true);
    activeAssetId.current = undefined;
    activeMultipartId.current = undefined;
    pendingAssetCommand.current = undefined;
  }
  const publishExistingAsset = useCallback(async () => {
    if (!existingAsset || busy.current) return;
    busy.current = true;
    setIsBusyState(true);
    setError("");
    setState("publishing");
    try {
      const assetPath =
        adminLessonMediaPath(course, lessonId) +
        "/" +
        encodeURIComponent(existingAsset.id);
      if (existingAsset.status === "uploaded") {
        setState("verifying");
        await adminDeliveryRequest(assetPath + "/verify", {
          method: "POST",
          key: createRequestKey(),
        });
      }
      if (existingAsset.status !== "published") {
        setState("publishing");
        await adminDeliveryRequest(assetPath + "/publish", {
          method: "POST",
          key: createRequestKey(),
        });
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
      onPublished();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The saved media could not be published to this lesson.",
      );
      setState("failed");
    } finally {
      busy.current = false;
      setIsBusyState(false);
    }
  }, [
    course,
    existingAsset,
    lessonId,
    onPublished,
    resource.id,
    resource.version,
  ]);
  useEffect(() => {
    if (
      !publishRequest ||
      publishRequest <= lastHandledPublishRequest.current ||
      assetLookupLoading
    ) {
      return;
    }
    if (assetLookupError) {
      setError(
        "Saved media status could not be loaded. Retry the media check before publishing.",
      );
      return;
    }
    if (!existingAsset) {
      setError(
        "No uploaded media is linked to this resource yet. Choose the file below, then upload and verify it.",
      );
      return;
    }
    lastHandledPublishRequest.current = publishRequest;
    void publishExistingAsset();
  }, [
    assetLookupError,
    assetLookupLoading,
    existingAsset,
    publishExistingAsset,
    publishRequest,
  ]);
  if (!mediaType || !filePolicy) {
    return <span>Binary upload is not used for this resource type.</span>;
  }
  const uploadMediaType = mediaType;
  const uploadFilePolicy = filePolicy;
  const stateLabels: Record<UploadState, string> = {
    idle: "Choose a file",
    preparing: "Preparing upload…",
    uploading: "Uploading… " + progress + "%",
    verifying: "Verifying object metadata…",
    publishing: "Publishing verified media…",
    published: "Published",
    failed: "Upload failed",
  };
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
          : "Upload access verified, but storage is still configured for acceptance objects. Switch the backend media namespace before uploading real content.",
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
  async function upload() {
    if (!file || busy.current || state === "published" || !retryAllowed) return;
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
          "Storage is configured for acceptance objects. Switch the backend to its production media namespace before uploading real course content.",
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
      setState("verifying");
      await adminDeliveryRequest(assetPath + "/verify", {
        method: "POST",
        key: createRequestKey(),
      });
      setState("publishing");
      await adminDeliveryRequest(assetPath + "/publish", {
        method: "POST",
        key: createRequestKey(),
      });
      await adminDeliveryRequest(
        deliveryCoursePath(course.brandId, course.id) +
          "/resources/" +
          encodeURIComponent(resource.id),
        {
          method: "PATCH",
          key: createRequestKey(),
          body: {
            status: "published",
            reason: "Publish lesson resource after media verification.",
            expectedVersion: resource.version,
          },
        },
      );
      setState("published");
      activeAssetId.current = undefined;
      pendingAssetCommand.current = undefined;
      onPublished();
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
              " The backend state is uncertain; reload the course before retrying.",
      );
      setRetryAllowed(mayRetry);
      setState("failed");
    } finally {
      busy.current = false;
      setIsBusyState(false);
    }
  }

  const fileLabel =
    uploadMediaType === "video" ? "MP4 video" : "PDF document";
  const existingAssetAction =
    existingAsset?.status === "uploaded"
      ? "Verify and publish " + fileLabel.toLowerCase()
      : "Publish " + fileLabel.toLowerCase();
  return (
    <div
      className="admin-media-upload"
      aria-busy={isBusyState || assetLookupLoading}
    >
      <div className="admin-media-upload__actions">
        <button
          type="button"
          disabled={isBusyState}
          onClick={() => void checkUploadAccess()}
        >
          Check upload access
        </button>
        {existingAsset && state !== "published" && (
          <button
            className="admin-media-upload__publish-existing"
            type="button"
            disabled={isBusyState || assetLookupLoading}
            onClick={() => void publishExistingAsset()}
          >
            {existingAssetAction}
          </button>
        )}
      </div>
      {assetLookupLoading && (
        <span className="admin-media-upload__status" role="status">
          Checking for a saved upload…
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
            Retry media check
          </button>
        </div>
      )}
      {!assetLookupLoading && !assetLookupError && !existingAsset && (
        <span className="admin-media-upload__status">
          No saved upload is linked to this resource yet. Choose a file below to
          upload and publish it.
        </span>
      )}
      {state !== "published" && (
        <label
          className={
            `admin-media-upload__dropzone${isDragOver ? " is-dragging" : ""}`
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
          <strong>
            {file
              ? file.name
              : `Drop ${fileLabel} here or choose a file`}
          </strong>
          <small>
            {file
              ? `${(file.size / MEBIBYTE).toFixed(1)} MB · verification is required before publishing`
              : `${fileLabel} · verified before student delivery`}
          </small>
          <input
            type="file"
            accept={uploadFilePolicy.accept}
            aria-label={`Choose ${fileLabel}`}
            disabled={isBusyState || Boolean(activeAssetId.current)}
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
        </label>
      )}
      {uploadMediaType === "document" && state !== "published" && (
        <div className="admin-media-upload__options">
          <label>
            PDF delivery policy
            <select
              value={deliveryMode}
              disabled={isBusyState || Boolean(activeAssetId.current)}
              onChange={(event) =>
                setDeliveryMode(event.target.value as DocumentDeliveryMode)
              }
            >
              <option value="view_only">View only</option>
              <option value="download_allowed">Download allowed</option>
              <option value="watermarked_view">Watermarked view</option>
              <option value="watermarked_download">Watermarked download</option>
            </select>
          </label>
          <label className="admin-media-upload__watermark">
            <input
              type="checkbox"
              checked={watermarkRequired}
              disabled={isBusyState || Boolean(activeAssetId.current)}
              onChange={(event) => setWatermarkRequired(event.target.checked)}
            />
            Watermark required
          </label>
        </div>
      )}
      {uploadMediaType === "video" && state !== "published" && (
        <label className="admin-media-upload__watermark">
          <input
            type="checkbox"
            checked={watermarkRequired}
            disabled={isBusyState || Boolean(activeAssetId.current)}
            onChange={(event) => setWatermarkRequired(event.target.checked)}
          />
          Watermark required
        </label>
      )}
      {state === "uploading" && (
        <progress aria-label="Media upload progress" max={100} value={progress}>
          {progress}%
        </progress>
      )}
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
      {state !== "published" && (
        <div className="admin-media-upload__footer">
          {!error && (
            <span className="admin-media-upload__status" role="status">
              {stateLabels[state]}
            </span>
          )}
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
            {state === "failed"
              ? retryAllowed
                ? "Retry upload"
                : "Reload course before retrying"
              : `Upload, verify and publish ${uploadMediaType}`}
          </button>
        </div>
      )}
    </div>
  );
}
