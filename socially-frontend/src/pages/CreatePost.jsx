import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadMedia, createPost } from "../api/posts";
import styles from "./CreatePost.module.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
// Client-side only — the backend doesn't enforce a size limit, this
// just avoids someone accidentally trying to upload a huge file.
const MAX_BYTES = 10 * 1024 * 1024;
const CAPTION_LIMIT = 2200;

export default function CreatePost({ asModal, onCreated }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | uploading | creating
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function close() {
    if (stage !== "idle") return; // don't let a submit-in-flight get abandoned
    if (asModal) navigate(-1);
    else navigate("/");
  }

  useEffect(() => {
    if (!asModal) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asModal, stage]);

  function acceptFile(candidate) {
    setFileError(null);
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setFileError("Only JPEG, PNG, WebP, or HEIC images are supported right now.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setFileError("That image is larger than 10MB — try a smaller file.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
  }

  function handleInputChange(event) {
    const candidate = event.target.files?.[0];
    if (candidate) acceptFile(candidate);
    event.target.value = ""; // allow re-selecting the same file later
  }

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragActive(false);
    const candidate = event.dataTransfer.files?.[0];
    if (candidate) acceptFile(candidate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  }

  async function handleShare() {
    setFormError(null);
    if (!file) {
      setFormError("Choose a photo to share.");
      return;
    }
    const trimmedCaption = caption.trim();
    if (!trimmedCaption) {
      setFormError("Write a caption before sharing.");
      return;
    }

    try {
      setStage("uploading");
      const uploaded = await uploadMedia(file);
      setStage("creating");
      const post = await createPost({ caption: trimmedCaption, image_url: uploaded.image_url });
      onCreated?.(post);
      // A new post never appears in your own home feed — the feed only
      // shows people you follow — so there's nothing to refresh there.
      // This just returns to wherever "Create" was opened from.
      navigate(asModal ? -1 : "/", asModal ? undefined : { replace: true });
    } catch (err) {
      setFormError(err.message || "Something went wrong sharing your post.");
      setStage("idle");
    }
  }

  const busy = stage !== "idle";
  const shareLabel = stage === "uploading" ? "Uploading…" : stage === "creating" ? "Sharing…" : "Share";

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerSpacer} />
          <h2 className={styles.title}>Create New Post</h2>
          <button className={styles.closeButton} onClick={close} disabled={busy} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={styles.content}>
          <div
            className={`${styles.uploadZone} ${dragActive ? styles.uploadZoneActive : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className={styles.hiddenInput}
              onChange={handleInputChange}
            />

            {previewUrl ? (
              <div className={styles.previewWrap}>
                <img src={previewUrl} alt="Selected" className={styles.previewImage} />
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  disabled={busy}
                  aria-label="Remove photo"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ) : (
              <>
                <span className={`material-symbols-outlined ${styles.uploadIcon}`}>
                  add_photo_alternate
                </span>
                <p className={styles.uploadText}>Drag photo here or click to upload</p>
              </>
            )}
          </div>

          <div className={styles.form}>
            <div className={styles.authorRow}>
              {user?.avatar_url ? (
                <img className={styles.avatarImg} src={user.avatar_url} alt="" />
              ) : (
                <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
              )}
              <span className={styles.authorName}>{user?.username}</span>
            </div>

            <div className={styles.captionWrap}>
              <textarea
                className={styles.caption}
                placeholder="Write a caption…"
                maxLength={CAPTION_LIMIT}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={busy}
              />
              <span className={styles.captionCount}>
                {caption.length} / {CAPTION_LIMIT}
              </span>
            </div>

            <div className={styles.locationWrap}>
              <span className={`material-symbols-outlined ${styles.locationIcon}`}>location_on</span>
              <input
                className={styles.locationInput}
                type="text"
                placeholder="Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={busy}
              />
            </div>
            {location && (
              <p className={styles.locationNotice}>
                Location isn't saved yet — the backend doesn't support it on posts.
              </p>
            )}

            {(fileError || formError) && (
              <p className={styles.error}>{fileError || formError}</p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={close} disabled={busy}>
            Cancel
          </button>
          <button
            className={styles.shareButton}
            onClick={handleShare}
            disabled={busy || !file || !caption.trim()}
          >
            {shareLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
