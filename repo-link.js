/* Source-code links
   Works out the GitHub repository from the GitHub Pages address, so no username is hard-coded:
     https://<user>.github.io/<repo>/...  ->  https://github.com/<user>/<repo>
   Hosting somewhere else (e.g. Vercel)? Put the repo URL in REPO_URL below.
   Links marked with data-repo-path="<folder>" point to that folder in the repo;
   if no repo is known (e.g. when opened locally), those links are removed instead of being broken. */
(function () {
  const REPO_URL = "https://github.com/Peershah624372/Datheon-Full-Stack-Web-Development-Internship";

  let repo = REPO_URL;
  const pages = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
  if (!repo && pages) {
    const first = location.pathname.split("/").filter(Boolean)[0] || "";
    const isProjectSite = first && !first.includes(".") && !/^Task\d/i.test(first);
    repo = `https://github.com/${pages[1]}/${isProjectSite ? first : pages[1] + ".github.io"}`;
  }
  window.REPO_URL = repo.replace(/\/+$/, "");

  function apply() {
    document.querySelectorAll("[data-repo-path]").forEach((a) => {
      if (!window.REPO_URL) return a.remove();
      const path = a.dataset.repoPath;
      a.href = path ? `${window.REPO_URL}/tree/main/${path}` : window.REPO_URL;
    });
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", apply) : apply();
})();
