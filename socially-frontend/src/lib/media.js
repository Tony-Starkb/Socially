export function isVideoMedia(url) {
  return typeof url === "string" && /\.mp4(?:$|[?#])/i.test(url);
}

export function getPostMediaUrls(post) {
  const mediaUrls = Array.isArray(post?.media_urls)
    ? post.media_urls.filter((url) => typeof url === "string" && url.length > 0)
    : [];

  if (mediaUrls.length > 0) return mediaUrls;
  return typeof post?.image_url === "string" && post.image_url ? [post.image_url] : [];
}