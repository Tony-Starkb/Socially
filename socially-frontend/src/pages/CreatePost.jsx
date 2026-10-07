import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadMedia, createPost } from "../api/posts";
import styles from "./CreatePost.module.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "video/mp4"];
// Client-side only — the backend doesn't enforce a size limit, this
// just avoids someone accidentally trying to upload a huge file.
const MAX_BYTES = 10 * 1024 * 1024;
const CAPTION_LIMIT = 2200;

export default function CreatePost({ asModal, onCreated }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mediaItems, setMediaItems] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | uploading | creating
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef(new Set());

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

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

  function addFiles(candidates) {
    if (candidates.length === 0) return;
    setFileError(null);
    const unsupported = candidates.find((candidate) => !ACCEPTED_TYPES.includes(candidate.type));
    if (unsupported) {
      setFileError("Only JPEG, PNG, WebP, HEIC, or MP4 files are supported.");
      return;
    }
    const oversized = candidates.find((candidate) => candidate.size > MAX_BYTES);
    if (oversized) {
      setFileError("Each file must be 10MB or smaller.");
      return;
    }

    const additions = candidates.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return { file, previewUrl };
    });
    setMediaItems((current) => [...current, ...additions]);
  }

  function handleInputChange(event) {
    addFiles(Array.from(event.target.files || []));
    event.target.value = ""; // allow re-selecting the same file later
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    addFiles(Array.from(event.dataTransfer.files || []));
  }

  function removeFile(previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current.delete(previewUrl);
    setMediaItems((current) => current.filter((item) => item.previewUrl !== previewUrl));
  }

  async function handleShare() {
    setFormError(null);
    if (mediaItems.length === 0) {
      setFormError("Choose a photo or video to share.");
      return;
    }
    const trimmedCaption = caption.trim();
    if (!trimmedCaption) {
      setFormError("Write a caption before sharing.");
      return;
    }

    try {
      setStage("uploading");
      const mediaUrls = await Promise.all(
        mediaItems.map(async ({ file }) => {
          const uploaded = await uploadMedia(file);

          const candidates = [
            uploaded,
            uploaded?.data,
            uploaded?.result,
            uploaded?.file,
            uploaded?.media,
            ...(Array.isArray(uploaded?.media) ? uploaded.media : []),
            uploaded?.image,
          ];

          let url = null;
          for (const candidate of candidates) {
            if (typeof candidate === "string") {
              url = candidate.trim();
              break;
            }
            url = candidate?.url
              ?? candidate?.image_url
              ?? candidate?.media_url
              ?? candidate?.secure_url
              ?? candidate?.public_url
              ?? candidate?.href;
            if (url) break;
          }

          if (!url) throw new Error(`Upload succeeded but no media URL was returned for ${file.name}.`);
          return url;
        })
      );
      setStage("creating");
      const post = await createPost({ caption: trimmedCaption, media_urls: mediaUrls });
      onCreated?.(post);
      // A new post never appears in your own home feed — the feed only
      // shows people you follow — so there's nothing to refresh there.
      // This just returns to wherever "Create" was opened from.
      navigate(asModal ? -1 : "/", asModal ? undefined : { replace: true });
    } catch (err) {
      const message = err?.status === 422
        ? "The uploaded file was rejected by the server. Check the file type and size, then try again."
        : typeof err?.message === "string"
          ? err.message
          : "Something went wrong sharing your post.";

      setFormError(message);
      setStage("idle");
    }
  }

  const busy = stage !== "idle";
  const shareLabel = stage === "uploading" ? "Uploading media…" : stage === "creating" ? "Sharing…" : "Share";

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
            onClick={() => mediaItems.length === 0 && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              className={styles.hiddenInput}
              onChange={handleInputChange}
            />

            {mediaItems.length > 0 ? (
              <>
                <div className={styles.previewList}>
                  {mediaItems.map(({ file, previewUrl }) => (
                    <div className={styles.mediaPreviewItem} key={previewUrl}>
                      <div className={styles.previewWrap}>
                        {file.type === "video/mp4" ? (
                          <video src={previewUrl} className={styles.previewImage} controls playsInline />
                        ) : (
                          <img src={previewUrl} alt={file.name} className={styles.previewImage} />
                        )}
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeFile(previewUrl);
                          }}
                          disabled={busy}
                          aria-label={`Remove ${file.name}`}
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                      <span className={styles.mediaName}>{file.name}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.addMediaButton}
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={busy}
                >
                  <span className="material-symbols-outlined">add</span>
                  Add media
                </button>
              </>
            ) : (
              <>
                <span className={`material-symbols-outlined ${styles.uploadIcon}`}>
                  add_photo_alternate
                </span>
                <p className={styles.uploadText}>Drag a photo or video here, or click to upload</p>
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
            disabled={busy || mediaItems.length === 0 || !caption.trim()}
          >
            {shareLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
