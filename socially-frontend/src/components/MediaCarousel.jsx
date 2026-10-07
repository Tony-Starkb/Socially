import { useState } from "react";
import { isVideoMedia } from "../lib/media";
import styles from "./MediaCarousel.module.css";

export default function MediaCarousel({ mediaUrls, alt, variant = "feed" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = mediaUrls.length;
  const activeUrl = mediaUrls[Math.min(activeIndex, count - 1)];

  function move(event, offset) {
    event.stopPropagation();
    setActiveIndex((index) => (index + offset + count) % count);
  }

  function select(event, index) {
    event.stopPropagation();
    setActiveIndex(index);
  }

  if (count === 0) return null;

  return (
    <div className={`${styles.gallery} ${variant === "detail" ? styles.detail : styles.feed}`}>
      {isVideoMedia(activeUrl) ? (
        <video
          key={activeUrl}
          className={styles.media}
          src={activeUrl}
          controls={variant === "detail"}
          muted={variant !== "detail"}
          loop={variant !== "detail"}
          autoPlay={variant !== "detail"}
          playsInline
          preload="metadata"
        />
      ) : (
        <img key={activeUrl} className={styles.media} src={activeUrl} alt={alt} />
      )}

      {count > 1 && (
        <>
          <span className={styles.counter}>{activeIndex + 1} / {count}</span>
          <button
            type="button"
            className={`${styles.arrow} ${styles.previous}`}
            onClick={(event) => move(event, -1)}
            aria-label="Previous media"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={(event) => move(event, 1)}
            aria-label="Next media"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <div className={styles.indicators} aria-label="Select media">
            {mediaUrls.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                className={`${styles.indicator} ${index === activeIndex ? styles.indicatorActive : ""}`}
                onClick={(event) => select(event, index)}
                aria-label={`Show media ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}