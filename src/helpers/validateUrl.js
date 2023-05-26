export default function validateUrl(url) {
  const urlTestCases = {
    youtubeSingular: /^(?=.*youtube)(?!.*\blist\b).*$/i,
    youtubePlaylist: /^(?=.*youtube).*\bplaylist\?list=([^&#]+)/i,
    soundcloudSingular: /^(?=.*soundcloud)(?!.*\/sets\/).*$/i,
    soundcloudPlaylist: /^(?=.*soundcloud).*\/sets\/.*$/i,
  };

  const match = Object.keys(urlTestCases).filter((key) => urlTestCases[key].test(url));
  return match[0]
}
