let deferredPrompt;

const popup = document.getElementById("installPopup");
const installBtn = document.getElementById("installBtn");
const closeBtn = document.getElementById("closeInstall");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();

  deferredPrompt = event;

  // Show popup after 2 seconds
  setTimeout(() => {
    popup.classList.add("show");
  }, 2000);
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const result = await deferredPrompt.userChoice;

  console.log("Install result:", result.outcome);

  deferredPrompt = null;
  popup.classList.remove("show");
});

closeBtn.addEventListener("click", () => {
  popup.classList.remove("show");
});

window.addEventListener("appinstalled", () => {
  popup.classList.remove("show");
  console.log("App installed successfully!");
});
