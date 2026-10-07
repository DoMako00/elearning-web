import { useEffect, useState } from "react";
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
import { AdminSideDrawer } from "../components/AdminSideDrawer";

export function AdminLessonMediaManagement({ course, lessonId, resource, onChanged }: Readonly<{
  course: DeliveryCourse;
  lessonId: string;
  resource: DeliveryResource;
  onChanged: () => void;
}>) {
  const [assets, setAssets] = useState<readonly AdminMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<AdminMediaAsset>();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestKey, setRequestKey] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    void inspectAdminLessonMedia(course, lessonId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setAssets(result.assets.filter((asset) => asset.resourceId === resource.id));
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(cause instanceof Error ? cause.message : "Media details could not be loaded.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [course.brandId, course.id, lessonId, resource.id, resource.version, revision]);

  async function withdraw() {
    if (!selected || saving || !reason.trim()) return;
    setSaving(true);
    setError("");
    try {
      await adminDeliveryRequest(
        adminLessonMediaPath(course, lessonId) + "/" + encodeURIComponent(selected.id) + "/withdraw",
        { method: "POST", key: requestKey },
      );
      // The persisted media state controls delivery; update the visible resource afterwards.
      await adminDeliveryRequest(
        deliveryCoursePath(course.brandId, course.id) + "/resources/" + encodeURIComponent(resource.id),
        { method: "PATCH", key: requestKey + ":resource", body: {
          status: "draft", reason: reason.trim(), expectedVersion: resource.version,
        } },
      );
      setSelected(undefined);
      setRevision((value) => value + 1);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Media could not be withdrawn.");
      setRevision((value) => value + 1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-media-management">
      {loading && <span role="status">Loading saved media…</span>}
      {loadError && <span role="alert">{loadError}</span>}
      {!selected && error && <span role="alert">{error}</span>}
      {!loading && !loadError && assets.length === 0 && (
        <span>No saved media asset is linked to this resource.</span>
      )}
      {assets.map((asset) => (
        <div className="admin-media-management__asset" key={asset.id}>
          <span>{asset.contentType} · {asset.status.replaceAll("_", " ")}</span>
          {asset.documentDeliveryMode && <span>Document policy: {asset.documentDeliveryMode.replaceAll("_", " ")}</span>}
          <span>Watermark: {asset.watermarkRequired ? "Required" : "Not required"}</span>
          {asset.status === "published" && (
            <button type="button" onClick={() => {
              setSelected(asset);
              setReason("");
              setError("");
              setRequestKey(crypto.randomUUID());
            }}>Withdraw media</button>
          )}
        </div>
      ))}
      <AdminSideDrawer open={Boolean(selected)} eyebrow="Media management" title="Withdraw media"
        dismissible={!saving} onClose={() => setSelected(undefined)}>
        <p>Withdraw {selected?.title}? New protected delivery requests will be denied. Previously issued links may remain usable until they expire.</p>
        <p>The stored file and audit history will be preserved.</p>
        <label>Reason for withdrawal
          <textarea value={reason} maxLength={1000} disabled={saving}
            onChange={(event) => setReason(event.target.value)} />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="button" disabled={saving || !reason.trim()} onClick={() => void withdraw()}>
          {saving ? "Withdrawing…" : "Confirm withdrawal"}
        </button>
      </AdminSideDrawer>
    </div>
  );
}
